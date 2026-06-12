import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useAppStore } from '../store/useAppStore'
import { openAimedCar } from '../lib/interactions'
import { getInteractiveTargets } from './interactiveRegistry'

const REACH = 3.4
const CENTER = new THREE.Vector2(0, 0)

export function InteractionRaycaster() {
  const camera = useThree((state) => state.camera)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  useFrame(() => {
    const { phase, aimedCarId, setAimedCarId } = useAppStore.getState()
    if (phase !== 'walking') {
      if (aimedCarId) setAimedCarId(null)
      return
    }
    raycaster.setFromCamera(CENTER, camera)
    raycaster.far = REACH
    const hit = raycaster.intersectObjects(getInteractiveTargets(), false)[0]
    const id = hit ? (hit.object.userData.carId as string) : null
    if (id !== aimedCarId) setAimedCarId(id)
  })

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0) openAimedCar()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyE') openAimedCar()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return null
}
