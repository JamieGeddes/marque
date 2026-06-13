import { Suspense, useEffect } from 'react'
import type { ConcoursSlot } from './concoursLayout'
import { CarModel } from './CarModel'
import { ConcoursPlacard } from './ConcoursPlacard'
import { useIsMounted } from './concoursStream'
import { carCapsule, registerCollider } from './collision'
import { markLoaded } from '../lib/hallCache'

/** Marks the car loaded once its model resolves (sibling inside the per-car
 *  Suspense, so its effect only runs after the GLB is ready). Drives the
 *  Concours entry gate. */
function LoadedTicker({ path }: { path: string }) {
  useEffect(() => {
    markLoaded([path])
  }, [path])
  return null
}

/**
 * Always-mounted per-car presence: the walk-around collider and the
 * interactive hit target (a generous invisible box around the car, so simply
 * aiming at the car raises the prompt) plus the lawn placard. The heavy GLB
 * is mounted only when the proximity manager says the player is near, inside
 * its OWN Suspense so a car streaming in never blanks the rest of the scene.
 */
export function ConcoursCarSlot({ slot }: { slot: ConcoursSlot }) {
  const car = slot.car
  const [x, , z] = slot.position
  const mounted = useIsMounted(car.id)

  useEffect(() => {
    return registerCollider(
      carCapsule(x, z, slot.rotationY, car.collider.length, car.collider.width),
    )
  }, [x, z, slot.rotationY, car.collider.length, car.collider.width])

  return (
    <group>
      <group position={slot.position} rotation-y={slot.rotationY}>
        {mounted && (
          <Suspense fallback={null}>
            <CarModel path={car.model.path} castShadow fadeIn />
            <LoadedTicker path={car.model.path} />
          </Suspense>
        )}
      </group>
      <ConcoursPlacard car={car} position={slot.placard.position} rotationY={slot.placard.rotationY} />
    </group>
  )
}
