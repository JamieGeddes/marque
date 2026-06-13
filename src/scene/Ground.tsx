import { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { assetUrl } from '../lib/assetUrl'
import { concoursLayout } from './concoursLayout'

/**
 * The grounds: a large grass plane with a gravel carriage-circle and a
 * central approach drive running through the gardens, all tiled CC0 textures.
 */
function tune(tex: THREE.Texture, repeat: number, repeatY = repeat) {
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeatY)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

export function Ground() {
  const { driveway, bounds } = concoursLayout
  const [cx, cz] = driveway.circle
  const approachZ0 = cz
  const approachZ1 = bounds.depth / 2
  const approachLen = approachZ1 - approachZ0
  const approachMidZ = (approachZ0 + approachZ1) / 2

  const grass = useTexture(assetUrl('textures/grass_diff_1k.jpg'))
  const gravel = useTexture(assetUrl('textures/gravel_diff_1k.jpg'))

  // Independent wrapping per surface (clone shares the image, not the repeat).
  const grassMap = useMemo(() => tune(grass.clone(), 110), [grass])
  const circleMap = useMemo(() => tune(gravel.clone(), 9), [gravel])
  const driveMap = useMemo(
    () => tune(gravel.clone(), 3, Math.round(approachLen / 3)),
    [gravel, approachLen],
  )

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial map={grassMap} color="#8fa46a" roughness={1} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[cx, 0.012, cz]} receiveShadow>
        <circleGeometry args={[driveway.circleRadius, 48]} />
        <meshStandardMaterial map={circleMap} color="#c9bda0" roughness={1} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.011, approachMidZ]} receiveShadow>
        <planeGeometry args={[driveway.laneHalfWidth * 2, approachLen]} />
        <meshStandardMaterial map={driveMap} color="#c9bda0" roughness={1} />
      </mesh>
    </group>
  )
}
