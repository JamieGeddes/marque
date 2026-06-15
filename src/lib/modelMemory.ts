/**
 * Session-wide registry of resident car GLBs and the disposal that actually
 * frees their GPU memory.
 *
 * Every car is loaded through drei's `useGLTF`, whose cache keeps the parsed
 * scene for the whole session and never disposes it — so geometry + textures
 * stay in VRAM long after a car has left the screen. The streaming/LOD systems
 * only add/remove cars from the scene graph; they free nothing. This module
 * closes that gap: `CarModel` registers each scene as it loads and reports when
 * it is mounted, and the eviction triggers (lobby return, Concours distance,
 * and the bytes-based LRU budget) call `evictModel`/`evictAll`/`enforceBudget`
 * to traverse the scene, dispose its geometries/materials/textures, and drop
 * the cache entry.
 *
 * Plain module state (no React), mirroring `concoursStream.ts`/`hallCache.ts`.
 */
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { unmarkLoaded } from './hallCache'

interface ResidentModel {
  scene: THREE.Object3D
  lastUsed: number
  /** Estimated decoded GPU bytes (textures + geometry), for the LRU budget. */
  bytes: number
}

/** Hard ceiling on resident decoded GPU memory. The LRU trims non-mounted
 *  models once the total exceeds it — a true memory cap, unlike a model count
 *  (per-model size varies ~80x). Generous enough that the Concours hero ring
 *  plus nearby cars stay cached; with KTX2-compressed textures a car is only
 *  ~12-15 MB, so this still holds dozens resident. Tightened on low-RAM devices. */
const deviceMemoryGb = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
const VRAM_BUDGET = Math.min(
  900 * 1024 * 1024,
  deviceMemoryGb ? (deviceMemoryGb * 1024 * 1024 * 1024) / 8 : Infinity,
)

const registry = new Map<string, ResidentModel>()
const mounted = new Set<string>()
let tick = 0

/** Record (or refresh) a loaded GLB scene. Called by CarModel once useGLTF
 *  resolves. Idempotent: a re-load after eviction replaces the stale handle. */
export function registerModel(path: string, scene: THREE.Object3D): void {
  const existing = registry.get(path)
  if (existing) {
    existing.scene = scene
    existing.lastUsed = ++tick
    existing.bytes = estimateBytes(scene)
    return
  }
  registry.set(path, { scene, lastUsed: ++tick, bytes: estimateBytes(scene) })
}

/** Mark a path as currently in the scene tree (and most-recently used). */
export function markMounted(path: string): void {
  mounted.add(path)
  const entry = registry.get(path)
  if (entry) entry.lastUsed = ++tick
}

export function markUnmounted(path: string): void {
  mounted.delete(path)
}

export function isMounted(path: string): boolean {
  return mounted.has(path)
}

interface Resources {
  geometries: Set<THREE.BufferGeometry>
  materials: Set<THREE.Material>
  textures: Set<THREE.Texture>
}

/** Collect the unique GPU resources under a scene. GLBs frequently share one
 *  material/texture across many meshes — the Sets dedupe. Shared by disposal
 *  and the byte estimate. */
function collectResources(scene: THREE.Object3D): Resources {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  scene.traverse((object) => {
    const obj = object as THREE.Mesh
    if (obj.geometry) geometries.add(obj.geometry)
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
    for (const mat of mats) {
      if (!mat) continue
      materials.add(mat)
      for (const value of Object.values(mat as unknown as Record<string, unknown>)) {
        if (value && (value as THREE.Texture).isTexture) textures.add(value as THREE.Texture)
      }
    }
  })
  return { geometries, materials, textures }
}

/** Approximate decoded GPU bytes for a loaded scene. Compressed (KTX2) textures
 *  report their real mip byte sizes; uncompressed ones assume RGBA8 + full mip
 *  chain. A heuristic for the budget, not an exact figure. */
function estimateBytes(scene: THREE.Object3D): number {
  const { geometries, textures } = collectResources(scene)
  let bytes = 0
  for (const tex of textures) {
    const mips = tex.mipmaps as Array<{ data?: ArrayBufferView }> | undefined
    if (Array.isArray(mips) && mips.length) {
      for (const mip of mips) bytes += mip.data?.byteLength ?? 0
    } else {
      const img = tex.image as { width?: number; height?: number } | undefined
      bytes += Math.ceil((img?.width ?? 0) * (img?.height ?? 0) * 4 * (4 / 3))
    }
  }
  for (const geo of geometries) {
    for (const attr of Object.values(geo.attributes)) {
      bytes += (attr as THREE.BufferAttribute).array?.byteLength ?? 0
    }
    bytes += geo.index?.array?.byteLength ?? 0
  }
  return bytes
}

/** Traverse a scene and dispose every unique geometry, material, and texture so
 *  the renderer releases the GPU buffers. `useGLTF.clear` alone does NOT do this
 *  — it only drops the suspense-cache entry. */
function disposeScene(scene: THREE.Object3D): void {
  const { geometries, materials, textures } = collectResources(scene)
  textures.forEach((t) => t.dispose())
  geometries.forEach((g) => g.dispose())
  materials.forEach((m) => m.dispose())
}

/** Free a model's GPU resources and drop it from every cache. No-op if the path
 *  is currently mounted or not resident — safe to over-call. */
export function evictModel(path: string): void {
  if (mounted.has(path)) return
  const entry = registry.get(path)
  if (!entry) return
  disposeScene(entry.scene)
  useGLTF.clear(path)
  registry.delete(path)
  // So a future hall entry treats it as not-yet-loaded (loading screen) rather
  // than trying to lock the pointer on a model that is no longer resident.
  unmarkLoaded([path])
}

/** Evict every non-mounted resident model. Used on return to the lobby, where
 *  nothing is mounted, so memory drops back to baseline. */
export function evictAll(): void {
  for (const path of [...registry.keys()]) evictModel(path)
}

function residentBytes(): number {
  let total = 0
  for (const entry of registry.values()) total += entry.bytes
  return total
}

/** LRU backstop: if resident GPU memory exceeds the budget, evict
 *  least-recently-used, non-mounted models until back under it. */
export function enforceBudget(): void {
  if (residentBytes() <= VRAM_BUDGET) return
  const evictable = [...registry.entries()]
    .filter(([path]) => !mounted.has(path))
    .sort((a, b) => a[1].lastUsed - b[1].lastUsed)
  for (const [path] of evictable) {
    if (residentBytes() <= VRAM_BUDGET) break
    evictModel(path)
  }
}

if (import.meta.env.DEV) {
  // Mirrors the __concoursMounted/__appStore debug hooks: lets the console
  // observe eviction during verification.
  ;(window as unknown as Record<string, unknown>).__modelMemory = () => ({
    resident: registry.size,
    mounted: mounted.size,
    residentMB: Math.round(residentBytes() / 1e6),
    budgetMB: Number.isFinite(VRAM_BUDGET) ? Math.round(VRAM_BUDGET / 1e6) : null,
    paths: [...registry.keys()],
  })
}
