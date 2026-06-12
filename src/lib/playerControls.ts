/**
 * Imperative bridge between the DOM overlay (outside the Canvas) and the
 * PointerLockControls instance living inside it. Player.tsx assigns the
 * real implementations on mount.
 */
export const playerControls = {
  lock: () => {},
  unlock: () => {},
}
