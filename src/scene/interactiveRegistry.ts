import type { Object3D } from 'three'

/**
 * Pedestal hit-meshes registered for the center-screen raycast.
 * Kept outside React/zustand: read every frame, never rendered.
 */
const targets = new Map<string, Object3D>()
let cache: Object3D[] | null = null

export function registerInteractive(carId: string, object: Object3D): () => void {
  object.userData.carId = carId
  targets.set(carId, object)
  cache = null
  return () => {
    targets.delete(carId)
    cache = null
  }
}

export function getInteractiveTargets(): Object3D[] {
  cache ??= [...targets.values()]
  return cache
}

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__interactiveCount = () => targets.size
}
