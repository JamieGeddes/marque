import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, useKeyboardControls } from '@react-three/drei'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import { useAppStore } from '../store/useAppStore'
import { playerControls } from '../lib/playerControls'
import { mobileInput } from '../lib/mobileInput'
import { useIsTouchDevice } from '../hooks/useIsTouchDevice'
import { resolvePosition, ROOM } from './collision'

const EYE_HEIGHT = 1.65
const WALK_SPEED = 3
const DAMPING = 9
const TOUCH_LOOK_SPEED = 0.0045
const MAX_PITCH = 1.25

const UP = new THREE.Vector3(0, 1, 0)
const tmpForward = new THREE.Vector3()
const tmpRight = new THREE.Vector3()
const tmpTarget = new THREE.Vector3()

export function Player() {
  const isTouch = useIsTouchDevice()
  const controls = useRef<PointerLockControlsImpl>(null)
  const velocity = useRef(new THREE.Vector3())
  const [, getKeys] = useKeyboardControls()
  const camera = useThree((state) => state.camera)
  const currentHallId = useAppStore((s) => s.currentHallId)

  // Place the player at the hall entrance whenever a hall is (re)entered.
  // ActiveHall's layout effect has already set ROOM.spawnZ by the time this runs.
  useEffect(() => {
    if (!currentHallId) return
    camera.position.set(0, EYE_HEIGHT, ROOM.spawnZ)
    camera.rotation.set(0, 0, 0, 'YXZ')
  }, [currentHallId, camera])

  useEffect(() => {
    if (isTouch) {
      // No pointer lock on touch devices — "lock" just starts the walk.
      playerControls.lock = () => useAppStore.getState().setPhase('walking')
      playerControls.unlock = () => {}
      camera.rotation.order = 'YXZ'
    } else {
      playerControls.lock = () => controls.current?.lock()
      playerControls.unlock = () => controls.current?.unlock()
    }
    return () => {
      playerControls.lock = () => {}
      playerControls.unlock = () => {}
    }
  }, [isTouch, camera])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    // Headless test hook: pointer lock is unavailable there, so allow
    // placing the camera directly. __teleport(x, z, yawRadians, pitch?)
    ;(window as unknown as Record<string, unknown>).__teleport = (
      x: number,
      z: number,
      yaw: number,
      pitch = 0,
    ) => {
      camera.position.set(x, EYE_HEIGHT, z)
      camera.rotation.set(pitch, yaw, 0, 'YXZ')
    }
    ;(window as unknown as Record<string, unknown>).__cameraPos = () => [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ]
  }, [camera])

  useFrame((_, delta) => {
    if (useAppStore.getState().phase !== 'walking') {
      velocity.current.set(0, 0, 0)
      return
    }

    if (isTouch && (mobileInput.lookX !== 0 || mobileInput.lookY !== 0)) {
      camera.rotation.y -= mobileInput.lookX * TOUCH_LOOK_SPEED
      camera.rotation.x = THREE.MathUtils.clamp(
        camera.rotation.x - mobileInput.lookY * TOUCH_LOOK_SPEED,
        -MAX_PITCH,
        MAX_PITCH,
      )
      mobileInput.lookX = 0
      mobileInput.lookY = 0
    }

    const { forward, back, left, right } = getKeys()
    const moveZ = Number(forward) - Number(back) + (isTouch ? mobileInput.moveY : 0)
    const moveX = Number(right) - Number(left) + (isTouch ? mobileInput.moveX : 0)

    camera.getWorldDirection(tmpForward)
    tmpForward.y = 0
    tmpForward.normalize()
    tmpRight.crossVectors(tmpForward, UP)

    tmpTarget
      .set(0, 0, 0)
      .addScaledVector(tmpForward, moveZ)
      .addScaledVector(tmpRight, moveX)
    if (tmpTarget.lengthSq() > 1) tmpTarget.normalize()
    tmpTarget.multiplyScalar(WALK_SPEED)

    const v = velocity.current
    const k = 1 - Math.exp(-DAMPING * delta)
    v.lerp(tmpTarget, k)

    const [nx, nz] = resolvePosition(
      camera.position.x + v.x * delta,
      camera.position.z + v.z * delta,
    )
    camera.position.set(nx, EYE_HEIGHT, nz)
  })

  if (isTouch) return null

  return (
    <PointerLockControls
      ref={controls}
      // Without a selector, drei attaches a click-to-lock handler on
      // `document`, which re-locks the pointer on any UI click (e.g. the
      // pause screen's "Return to lobby"). A selector that matches nothing
      // keeps locking fully under playerControls.lock()'s control.
      selector="#pointer-lock-none"
      onLock={() => useAppStore.getState().setPhase('walking')}
      onUnlock={() => {
        const { phase, setPhase } = useAppStore.getState()
        if (phase === 'walking') setPhase('paused')
      }}
    />
  )
}
