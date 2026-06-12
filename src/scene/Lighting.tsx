import { useEffect, useRef } from 'react'
import type { SpotLight } from 'three'
import { Environment } from '@react-three/drei'
import { cars } from '../data/cars'
import { assetUrl } from '../lib/assetUrl'

function CarSpot({ target }: { target: [number, number, number] }) {
  const light = useRef<SpotLight>(null)

  useEffect(() => {
    const spot = light.current
    if (!spot) return
    spot.target.position.set(target[0], 0, target[2])
    spot.target.updateMatrixWorld()
  }, [target])

  return (
    <spotLight
      ref={light}
      position={[target[0], 4.75, target[2]]}
      angle={0.62}
      penumbra={1}
      intensity={260}
      distance={14}
      decay={2}
      color="#fff3e2"
    />
  )
}

export function Lighting() {
  return (
    <>
      <Environment files={assetUrl('hdri/studio_small_09_1k.hdr')} environmentIntensity={0.65} />
      <hemisphereLight intensity={0.7} color="#46443f" groundColor="#1c1c1a" />
      <ambientLight intensity={0.26} color="#e8e4dc" />
      {cars.map((car) => (
        <CarSpot key={car.id} target={car.model.position} />
      ))}
    </>
  )
}
