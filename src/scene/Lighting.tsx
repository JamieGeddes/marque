import { Environment } from '@react-three/drei'
import { assetUrl } from '../lib/assetUrl'

/** Hall-independent light base; per-car spotlights live in CarExhibit. */
export function Lighting() {
  return (
    <>
      <Environment files={assetUrl('hdri/studio_small_09_1k.hdr')} environmentIntensity={0.65} />
      <hemisphereLight intensity={0.7} color="#46443f" groundColor="#1c1c1a" />
      <ambientLight intensity={0.26} color="#e8e4dc" />
    </>
  )
}
