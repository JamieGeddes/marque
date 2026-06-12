import { useEffect } from 'react'
import { ContactShadows } from '@react-three/drei'
import type { CarDefinition } from '../types'
import { CarModel } from './CarModel'
import { Pedestal } from './Pedestal'
import { carCapsule, circleCollider, registerCollider } from './collision'

export function CarExhibit({ car }: { car: CarDefinition }) {
  const { position, rotationY, scale, path } = car.model

  useEffect(() => {
    const unregisterCar = registerCollider(
      carCapsule(position[0], position[2], rotationY, car.collider.length, car.collider.width),
    )
    const unregisterPedestal = registerCollider(
      circleCollider(car.pedestal.position[0], car.pedestal.position[2], 0.55),
    )
    return () => {
      unregisterCar()
      unregisterPedestal()
    }
  }, [car, position, rotationY])

  return (
    <group>
      <group position={position} rotation-y={rotationY} scale={scale}>
        <CarModel path={path} />
      </group>
      <ContactShadows
        position={[position[0], 0.012, position[2]]}
        scale={car.collider.length + 2}
        far={1.4}
        opacity={0.72}
        blur={2.2}
        resolution={512}
        frames={1}
        color="#000000"
      />
      <Pedestal car={car} />
    </group>
  )
}
