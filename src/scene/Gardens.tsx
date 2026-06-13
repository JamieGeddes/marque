import { useMemo } from 'react'
import { concoursLayout } from './concoursLayout'

/**
 * Rich garden dressing: an avenue of trees lining the approach, perimeter
 * clumps, neat hedge borders along the outer lawn edges, a central fountain
 * on the carriage circle, and planters flanking the portico. All built from
 * primitives (muted greens/stone) and bounded by the shadow frustum, so the
 * cost stays modest. Purely decorative — no colliders (the room rect bounds
 * the player and hedges sit at the perimeter).
 */
const FOLIAGE = '#46552f'
const FOLIAGE_2 = '#3c4a29'
const TRUNK = '#4a3b2c'
const HEDGE = '#3f4d2a'
const STONE = '#cabba0'
const WATER = '#5a7d86'

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 3, 7]} />
        <meshStandardMaterial color={TRUNK} roughness={1} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <icosahedronGeometry args={[1.9, 1]} />
        <meshStandardMaterial color={FOLIAGE} roughness={1} flatShading />
      </mesh>
      <mesh position={[0.6, 4.5, 0.3]} castShadow>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color={FOLIAGE_2} roughness={1} flatShading />
      </mesh>
    </group>
  )
}

export function Gardens() {
  const { driveway, bounds } = concoursLayout
  const [, cz] = driveway.circle

  const trees = useMemo(() => {
    const list: { position: [number, number, number]; scale: number }[] = []
    // avenue lining the approach drive, paired either side
    for (let z = cz + 6; z <= bounds.depth / 2 - 6; z += 11) {
      const s = 0.9 + ((z * 7) % 5) / 12 // deterministic slight variation
      list.push({ position: [-9, 0, z], scale: s })
      list.push({ position: [9, 0, z], scale: 1.05 - ((z * 3) % 4) / 14 })
    }
    // perimeter clumps framing the gardens
    const px = bounds.width / 2 - 6
    for (let z = -20; z <= bounds.depth / 2 - 8; z += 16) {
      list.push({ position: [-px, 0, z], scale: 1.2 })
      list.push({ position: [px, 0, z], scale: 1.15 })
    }
    return list
  }, [cz, bounds.width, bounds.depth])

  return (
    <group>
      {trees.map((t, i) => (
        <Tree key={i} position={t.position} scale={t.scale} />
      ))}

      {/* hedge borders along the outer lawn edges */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 30, 0.6, 18]} receiveShadow castShadow>
          <boxGeometry args={[1.4, 1.2, 90]} />
          <meshStandardMaterial color={HEDGE} roughness={1} flatShading />
        </mesh>
      ))}

      {/* central fountain on the carriage circle */}
      <group position={[0, 0, cz]}>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3, 3.2, 0.7, 32]} />
          <meshStandardMaterial color={STONE} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[2.7, 2.7, 0.12, 32]} />
          <meshStandardMaterial color={WATER} roughness={0.2} metalness={0.1} envMapIntensity={1.4} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.45, 1.6, 16]} />
          <meshStandardMaterial color={STONE} roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.0, 0]} castShadow>
          <cylinderGeometry args={[1.1, 0.5, 0.35, 24]} />
          <meshStandardMaterial color={STONE} roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.08, 24]} />
          <meshStandardMaterial color={WATER} roughness={0.2} metalness={0.1} />
        </mesh>
      </group>

      {/* planters flanking the portico */}
      {[-6, 6].map((x) => (
        <group key={x} position={[x, 0, -60]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[1.2, 0.8, 1.2]} />
            <meshStandardMaterial color={STONE} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.1, 0]} castShadow>
            <icosahedronGeometry args={[0.75, 1]} />
            <meshStandardMaterial color={FOLIAGE} roughness={1} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}
