import { useEffect, useRef } from 'react'
import type { SpotLight } from 'three'
import { ContactShadows } from '@react-three/drei'
import type { CarDefinition } from '../types'
import type { ExhibitSlot } from './layout'
import { CarModel } from './CarModel'
import { Pedestal } from './Pedestal'
import { carCapsule, circleCollider, registerCollider } from './collision'

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

export function CarExhibit({ car, slot }: { car: CarDefinition; slot: ExhibitSlot }) {
  const { carPosition, carRotationY, pedestalPosition } = slot

  useEffect(() => {
    const unregisterCar = registerCollider(
      carCapsule(
        carPosition[0],
        carPosition[2],
        carRotationY,
        car.collider.length,
        car.collider.width,
      ),
    )
    const unregisterPedestal = registerCollider(
      circleCollider(pedestalPosition[0], pedestalPosition[2], 0.55),
    )
    return () => {
      unregisterCar()
      unregisterPedestal()
    }
  }, [car, carPosition, carRotationY, pedestalPosition])

  return (
    <group>
      <group position={carPosition} rotation-y={carRotationY} scale={car.model.scale}>
        <CarModel path={car.model.path} />
      </group>
      <CarSpot target={carPosition} />
      <ContactShadows
        position={[carPosition[0], 0.012, carPosition[2]]}
        scale={car.collider.length + 2}
        far={1.4}
        opacity={0.72}
        blur={2.2}
        resolution={512}
        frames={1}
        color="#000000"
      />
      <Pedestal car={car} slot={slot} />
    </group>
  )
}
