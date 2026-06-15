import { KeyboardControls } from '@react-three/drei'
import { Showroom } from './scene/Showroom'
import { IntroOverlay } from './ui/IntroOverlay'
import { Hud } from './ui/Hud'
import { CarInfoModal } from './ui/CarInfoModal'
import { MobileControls } from './ui/MobileControls'
import { keyMap } from './lib/keyboard'

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
