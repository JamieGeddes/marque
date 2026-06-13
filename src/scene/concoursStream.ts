/**
 * Out-of-React store of which cars are currently mounted in the Concours
 * scene. The proximity manager writes the set each tick; each car subscribes
 * to ITS OWN id via useIsMounted, so a membership change re-renders only the
 * cars that entered or left — never all 71.
 */
import { useSyncExternalStore } from 'react'

// View distance for full models. A car mounts its GLB within MOUNT_RADIUS and
// stays mounted out to UNMOUNT_RADIUS (hysteresis prevents flicker at the edge);
// beyond that it is a proxy. PRELOAD_RADIUS must stay the largest so the GLB is
// already cached before it mounts. HARD_CAP bounds how many full models render
// at once — in dense lawn areas the nearest N fill up first, so it, not the
// radius, is the practical limiter on how far real models reach. Raising these
// trades GPU/CPU/memory for a deeper field of real cars.
export const MOUNT_RADIUS = 62
export const PRELOAD_RADIUS = 84
export const UNMOUNT_RADIUS = 76
export const HARD_CAP = 42

let mounted = new Set<string>()
const listeners = new Set<() => void>()

export function getMountedSet(): Set<string> {
  return mounted
}

export function setMountedSet(next: Set<string>): void {
  mounted = next
  listeners.forEach((l) => l())
}

/** Seed the initial mounted set (the hero ring) before the first frame. */
export function seedMounted(ids: string[]): void {
  setMountedSet(new Set(ids))
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** Subscribe to any membership change (fires on every setMountedSet/seedMounted).
 *  Used by the proxy field, which needs the whole set rather than one id. */
export function subscribeMounted(cb: () => void): () => void {
  return subscribe(cb)
}

export function useIsMounted(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => mounted.has(id),
    () => false,
  )
}

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__concoursMounted = () => [...mounted]
}
