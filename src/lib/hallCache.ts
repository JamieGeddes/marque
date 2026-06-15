/**
 * Tracks which model files have completed loading this session, so the
 * lobby knows whether entering a hall can lock the pointer immediately
 * (user gesture intact) or must go through the hall-loading screen first.
 */
const loadedPaths = new Set<string>()

export function markLoaded(paths: string[]) {
  for (const path of paths) loadedPaths.add(path)
}

/** Forget paths whose GLBs have been evicted from memory, so re-entering their
 *  hall goes through the loading screen instead of assuming they're resident. */
export function unmarkLoaded(paths: string[]) {
  for (const path of paths) loadedPaths.delete(path)
}

export function allLoaded(paths: string[]): boolean {
  return paths.every((path) => loadedPaths.has(path))
}
