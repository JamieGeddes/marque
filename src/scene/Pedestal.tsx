import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { CarDefinition } from '../types'
import type { ExhibitSlot } from './layout'
import { useAppStore } from '../store/useAppStore'
import { registerInteractive } from './interactiveRegistry'
import { assetUrl } from '../lib/assetUrl'

const PLAQUE_FONT = assetUrl('fonts/CormorantGaramond-SemiBold.ttf')
const LABEL_FONT = assetUrl('fonts/Archivo-Regular.ttf')
const BRASS = '#b9a779'

export function Pedestal({ car, slot }: { car: CarDefinition; slot: ExhibitSlot }) {
  const hitMesh = useRef<THREE.Mesh>(null)
  const plaqueMaterial = useRef<THREE.MeshStandardMaterial>(null)

  useEffect(() => {
    if (!hitMesh.current) return
    return registerInteractive(car.id, hitMesh.current)
  }, [car.id])

  useFrame((_, delta) => {
    const material = plaqueMaterial.current
    if (!material) return
    const aimed = useAppStore.getState().aimedCarId === car.id
    const target = aimed ? 0.28 : 0.04
    material.emissiveIntensity = THREE.MathUtils.damp(
      material.emissiveIntensity,
      target,
      10,
      delta,
    )
  })

  return (
    <group position={slot.pedestalPosition} rotation-y={slot.pedestalRotationY}>
      {/* column */}
      <mesh position={[0, 0.525, 0]}>
        <boxGeometry args={[0.34, 1.05, 0.34]} />
        <meshStandardMaterial color="#2c2c31" metalness={0.6} roughness={0.45} />
      </mesh>
      {/* brass collar under the plaque */}
      <mesh position={[0, 1.045, 0]}>
        <boxGeometry args={[0.36, 0.012, 0.36]} />
        <meshStandardMaterial color="#8f7d54" metalness={1} roughness={0.3} />
      </mesh>

      {/* tilted plaque */}
      <group position={[0, 1.1, 0.02]} rotation-x={-Math.PI * 0.13}>
        <mesh>
          <boxGeometry args={[0.46, 0.025, 0.34]} />
          <meshStandardMaterial
            ref={plaqueMaterial}
            color="#cfc8b9"
            metalness={0.05}
            roughness={0.8}
            emissive={BRASS}
            emissiveIntensity={0.05}
          />
        </mesh>
        <Text
          font={PLAQUE_FONT}
          position={[0, 0.014, -0.055]}
          rotation-x={-Math.PI / 2}
          fontSize={0.055}
          letterSpacing={0.06}
          color="#1c1a14"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.42}
          textAlign="center"
        >
          {car.name}
        </Text>
        <Text
          font={LABEL_FONT}
          position={[0, 0.014, 0.06]}
          rotation-x={-Math.PI / 2}
          fontSize={0.028}
          letterSpacing={0.35}
          color="#6e6244"
          anchorX="center"
          anchorY="middle"
        >
          {`${car.year}  ·  DETAILS`}
        </Text>
      </group>

      {/* generous invisible hit target for the center-screen raycast */}
      <mesh ref={hitMesh} position={[0, 0.8, 0]} visible={false}>
        <boxGeometry args={[0.9, 1.7, 0.9]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  )
}
