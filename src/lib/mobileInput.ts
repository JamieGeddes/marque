/**
 * Shared input channel for the touch fallback. MobileControls (DOM) writes,
 * Player (Canvas) reads. Look deltas accumulate between frames; Player
 * consumes and resets them.
 */
export const mobileInput = {
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
}
