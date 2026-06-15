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
 * LRU backstop) call `evictModel`/`evictAll`/`enforceBudget` to traverse the
 * scene, dispose its geometries/materials/textures, and drop the cache entry.
 *
 * Plain module state (no React), mirroring `concoursStream.ts`/`hallCache.ts`.
 */
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { unmarkLoaded } from './hallCache'

interface ResidentModel {
  scene: THREE.Object3D
  lastUsed: number
}

/** Max GLBs kept resident at once. Comfortably above Concours' HARD_CAP (42)
 *  so recently-left cars stay cached for instant re-mount; the LRU only trims
 *  the tail beyond this in dense areas. Count-based to start — easily swapped
 *  for an estimated-bytes budget later. */
const MAX_RESIDENT_MODELS = 52

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
    return
  }
  registry.set(path, { scene, lastUsed: ++tick })
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

/** Traverse a scene and dispose every unique geometry, material, and texture so
 *  the renderer releases the GPU buffers. `useGLTF.clear` alone does NOT do this
 *  — it only drops the suspense-cache entry. */
function disposeScene(scene: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()

  scene.traverse((object) => {
    const obj = object as THREE.Mesh
    if (obj.geometry) geometries.add(obj.geometry)
    // GLBs frequently share one material across many meshes — the Sets dedupe.
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
    for (const mat of mats) {
      if (!mat) continue
      materials.add(mat)
      for (const value of Object.values(mat as unknown as Record<string, unknown>)) {
        if (value && (value as THREE.Texture).isTexture) textures.add(value as THREE.Texture)
      }
    }
  })

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

/** LRU backstop: if we exceed the budget, evict least-recently-used,
 *  non-mounted models until back under it. */
export function enforceBudget(): void {
  if (registry.size <= MAX_RESIDENT_MODELS) return
  const evictable = [...registry.entries()]
    .filter(([path]) => !mounted.has(path))
    .sort((a, b) => a[1].lastUsed - b[1].lastUsed)
  for (const [path] of evictable) {
    if (registry.size <= MAX_RESIDENT_MODELS) break
    evictModel(path)
  }
}

if (import.meta.env.DEV) {
  // Mirrors the __concoursMounted/__appStore debug hooks: lets the console
  // observe eviction during verification.
  ;(window as unknown as Record<string, unknown>).__modelMemory = () => ({
    resident: registry.size,
    mounted: mounted.size,
    budget: MAX_RESIDENT_MODELS,
    paths: [...registry.keys()],
  })
}
