import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useAppStore } from '../store/useAppStore'
import { useIsTouchDevice } from '../hooks/useIsTouchDevice'

/** Sun direction (toward the sky from the scene) — shared with drei <Sky>.
 *  Mid-afternoon elevation for longer, more flattering shadows than noon. */
export const SUN_DIR = new THREE.Vector3(-0.5, 0.6, 0.42).normalize()
export const SUN_POSITION = SUN_DIR.clone().multiplyScalar(1000)

const OFFSET = SUN_DIR.clone().multiplyScalar(95)
const SHADOW_HALF = 26 // ortho half-extent → 52 m coverage (> MOUNT_RADIUS 38)

/**
 * One directional sun whose shadow camera follows the player, so only the
 * ~52 m around the camera is shadow-mapped — bounding shadow cost regardless
 * of how many cars have streamed in. The light target is a real scene object
 * (required for the light to aim) and position + target are snapped to the
 * shadow-map texel grid each frame to stop the edges shimmering as it moves.
 */
export function SunLight() {
  const light = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const camera = useThree((s) => s.camera)
  const quality = useAppStore((s) => s.quality)
  const isTouch = useIsTouchDevice()

  // Shadows on for desktop, off for touch — tied to the device, not the
  // dynamic quality tier, so a PerformanceMonitor dip doesn't drop them.
  const shadows = !isTouch
  const mapSize = quality === 'high' ? 2048 : 1024
  const texel = (SHADOW_HALF * 2) / mapSize

  // Configure the shadow camera imperatively: setting shadow-camera-* via JSX
  // props doesn't call updateProjectionMatrix, so the ortho frustum would stay
  // at its tiny ±5 default and every caster falls outside it (= no shadows).
  useEffect(() => {
    const l = light.current
    if (!l) return
    const cam = l.shadow.camera as THREE.OrthographicCamera
    cam.left = -SHADOW_HALF
    cam.right = SHADOW_HALF
    cam.top = SHADOW_HALF
    cam.bottom = -SHADOW_HALF
    cam.near = 1
    cam.far = 240
    cam.updateProjectionMatrix()
    l.shadow.mapSize.set(mapSize, mapSize)
    l.shadow.bias = -0.0004
    l.shadow.normalBias = 0.045
    l.shadow.map?.dispose()
    l.shadow.map = null as unknown as THREE.WebGLRenderTarget
  }, [mapSize])

  useFrame(() => {
    const l = light.current
    if (!l) return
    const tx = Math.round(camera.position.x / texel) * texel
    const tz = Math.round(camera.position.z / texel) * texel
    target.position.set(tx, 0, tz)
    target.updateMatrixWorld()
    l.position.set(tx + OFFSET.x, OFFSET.y, tz + OFFSET.z)
  })

  return (
    <>
      <primitive object={target} />
      <directionalLight ref={light} target={target} intensity={2.7} color="#fff4e2" castShadow={shadows} />
    </>
  )
}
