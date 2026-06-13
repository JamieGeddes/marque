import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { CarDefinition } from '../types'
import { useAppStore } from '../store/useAppStore'
import { registerInteractive } from './interactiveRegistry'
import { assetUrl } from '../lib/assetUrl'

const NAME_FONT = assetUrl('fonts/CormorantGaramond-SemiBold.ttf')
const LABEL_FONT = assetUrl('fonts/Archivo-Regular.ttf')
const BRASS = '#b9a779'

/**
 * A low concours lawn placard (angled board on legs) beside each car. Purely
 * visual + the aim-glow; the interactive hit target lives on the car itself
 * (ConcoursCarSlot), so simply looking at a car raises the prompt.
 */
export function ConcoursPlacard({
  car,
  position,
  rotationY,
}: {
  car: CarDefinition
  position: [number, number, number]
  rotationY: number
}) {
  const board = useRef<THREE.MeshStandardMaterial>(null)
  const hit = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!hit.current) return
    return registerInteractive(car.id, hit.current)
  }, [car.id])

  useFrame((_, delta) => {
    const m = board.current
    if (!m) return
    const aimed = useAppStore.getState().aimedCarId === car.id
    m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, aimed ? 0.3 : 0.04, 10, delta)
  })

  return (
    <group position={position} rotation-y={rotationY}>
      {/* generous invisible aim target around the placard (double-sided so it
          still registers when the visitor steps in close) */}
      <mesh ref={hit} position={[0, 1, 0]} visible={false}>
        <boxGeometry args={[1.1, 2.2, 1.1]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>
      {/* legs */}
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.34, 0]} rotation-x={0.12}>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
          <meshStandardMaterial color="#23231f" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* angled board */}
      <group position={[0, 0.72, 0]} rotation-x={-Math.PI * 0.28}>
        <mesh>
          <boxGeometry args={[0.74, 0.42, 0.03]} />
          <meshStandardMaterial
            ref={board}
            color="#efe9da"
            roughness={0.8}
            metalness={0.02}
            emissive={BRASS}
            emissiveIntensity={0.04}
          />
        </mesh>
        <Text
          font={NAME_FONT}
          position={[0, 0.07, 0.02]}
          fontSize={0.066}
          letterSpacing={0.02}
          color="#1c1a14"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.66}
          textAlign="center"
        >
          {car.name}
        </Text>
        <Text
          font={LABEL_FONT}
          position={[0, -0.12, 0.02]}
          fontSize={0.03}
          letterSpacing={0.3}
          color="#6e6244"
          anchorX="center"
          anchorY="middle"
        >
          {`${car.year}  ·  DETAILS`}
        </Text>
      </group>
    </group>
  )
}
