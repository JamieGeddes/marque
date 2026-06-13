/**
 * Shared, asset-free building blocks for the distant-car proxies.
 *
 * One low-poly car silhouette, authored in a UNIT FOOTPRINT (x,z in [-0.5, 0.5],
 * y from the ground up), so a per-instance matrix can scale x by the car's
 * width, z by its length, and y by a fixed factor to get roughly correct
 * proportions. The long axis is local +Z to match the GLBs (front facing +Z)
 * and the way ConcoursCarSlot applies rotation-y.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { CarDefinition } from '../types'
import { PROXY_COLORS } from '../data/proxyColors'

/** Vertical scale applied to the unit-footprint geometry (≈ overall height). */
export const PROXY_Y_SCALE = 1

function buildGeometry(): THREE.BufferGeometry {
  // Lower skirt — rounds the base of the silhouette.
  const skirt = new THREE.BoxGeometry(0.9, 0.16, 0.96)
  skirt.translate(0, 0.1, 0)

  // Main body slab spanning the full footprint.
  const body = new THREE.BoxGeometry(0.98, 0.3, 1)
  body.translate(0, 0.31, 0)

  // Cabin / greenhouse — smaller and pushed rearward (toward -Z) so the
  // profile reads as a car rather than a brick.
  const cabin = new THREE.BoxGeometry(0.6, 0.28, 0.46)
  cabin.translate(0, 0.6, -0.06)

  const merged = mergeGeometries([skirt, body, cabin], false)
  merged.computeVertexNormals()
  return merged
}

/** Singleton geometry/material shared by every proxy instance. */
export const PROXY_GEOMETRY: THREE.BufferGeometry = buildGeometry()
export const PROXY_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xffffff, // instanceColor multiplies the per-car tint over white
  roughness: 0.7,
  metalness: 0.1,
})

// Muted, period-appropriate concours palette (silvers, slate, sage, taupe).
const PALETTE = [
  '#7d8a99',
  '#8a8276',
  '#6f7a6b',
  '#94908a',
  '#5f6b78',
  '#9a8d7a',
  '#777d86',
  '#86796f',
]

function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Per-car proxy tint. Precedence: an explicit `model.proxyColor` override, then
 * the colour baked from rendering the model (scripts/render-sample-colors.mjs),
 * then a stable neutral derived from the id (palette pick + small lightness
 * nudge) for anything unsampled.
 */
export function proxyColorFor(car: CarDefinition): THREE.Color {
  if (car.model.proxyColor) return new THREE.Color(car.model.proxyColor)
  const baked = PROXY_COLORS[car.id]
  if (baked) return new THREE.Color(baked)
  const h = hashId(car.id)
  const base = new THREE.Color(PALETTE[h % PALETTE.length])
  // Nudge lightness by +/- up to ~12% for variety within the palette.
  const hsl = { h: 0, s: 0, l: 0 }
  base.getHSL(hsl)
  const delta = (((h >>> 8) % 25) - 12) / 100
  base.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + delta, 0.2, 0.75))
  return base
}
