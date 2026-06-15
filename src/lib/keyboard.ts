import type { KeyboardControlsEntry } from '@react-three/drei'

export const keyMap: KeyboardControlsEntry[] = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
]

// Drei's KeyboardControls tracks held keys from window keydown/keyup events.
// If a movement key is still held when we leave walking mode (e.g. Esc to pause),
// its keyup can be missed, leaving the key "stuck" so movement resumes on return.
// Dispatching synthetic keyups clears drei's state for every mapped key — its own
// window keyup handler matches keyMap[key] || keyMap[code], and our `keys` are codes.
export function resetMovementKeys() {
  for (const entry of keyMap) {
    for (const code of entry.keys) {
      window.dispatchEvent(new KeyboardEvent('keyup', { code }))
    }
  }
}
