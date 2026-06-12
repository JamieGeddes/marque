export const isTouchDevice =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches &&
  'ontouchstart' in window

export function useIsTouchDevice() {
  return isTouchDevice
}
