import { KeyboardControls, type KeyboardControlsEntry } from '@react-three/drei'
import { Showroom } from './scene/Showroom'
import { IntroOverlay } from './ui/IntroOverlay'
import { Hud } from './ui/Hud'
import { CarInfoModal } from './ui/CarInfoModal'
import { MobileControls } from './ui/MobileControls'

const keyMap: KeyboardControlsEntry[] = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
]

export default function App() {
  return (
    <>
      <KeyboardControls map={keyMap}>
        <Showroom />
      </KeyboardControls>
      <Hud />
      <MobileControls />
      <CarInfoModal />
      <IntroOverlay />
    </>
  )
}
