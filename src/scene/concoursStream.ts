/**
 * Out-of-React store of which cars are currently mounted in the Concours
 * scene. The proximity manager writes the set each tick; each car subscribes
 * to ITS OWN id via useIsMounted, so a membership change re-renders only the
 * cars that entered or left — never all 71.
 */
import { useSyncExternalStore } from 'react'

export const MOUNT_RADIUS = 38
export const PRELOAD_RADIUS = 55
export const UNMOUNT_RADIUS = 52
export const HARD_CAP = 24

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
