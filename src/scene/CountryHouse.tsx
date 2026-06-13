import { useEffect } from 'react'
import { registerBox } from './collision'

/**
 * A large English country house built from primitives — a symmetrical
 * Georgian/Palladian facade (main block + flanking wings + central portico,
 * low parapet roof). Sits at the head of the driveway facing +Z. Registers an
 * AABB so the player can't walk through it. Structured as one component so a
 * sourced CC model could replace the geometry later behind the same seam.
 */
const STONE = '#cabba0'
const STONE_LIGHT = '#d8ccb4'
const GLASS = '#1d2128'
const ROOF = '#3b3c41'
const DOOR = '#272320'
const BRASS = '#b9a779'

const CZ = -69 // house centre Z

function Windows({
  count,
  width,
  z,
  y0,
  storeys,
  storeyH,
}: {
  count: number
  width: number
  z: number
  y0: number
  storeys: number
  storeyH: number
}) {
  const items = []
  const span = width
  for (let s = 0; s < storeys; s++) {
    for (let i = 0; i < count; i++) {
      const x = -span / 2 + (span / (count - 1)) * i
      const y = y0 + s * storeyH
      items.push(
        <group key={`${s}-${i}`} position={[x, y, z]}>
          {/* stone surround */}
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[1.15, 2.0, 0.12]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
          </mesh>
          {/* glass */}
          <mesh>
            <boxGeometry args={[0.92, 1.7, 0.06]} />
            <meshStandardMaterial
              color={GLASS}
              roughness={0.15}
              metalness={0.1}
              envMapIntensity={1.2}
            />
          </mesh>
        </group>,
      )
    }
  }
  return <>{items}</>
}

export function CountryHouse() {
  useEffect(() => {
    return registerBox({ minX: -22.5, maxX: 22.5, minZ: -76, maxZ: -58.6 })
  }, [])

  return (
    <group position={[0, 0, CZ]}>
      {/* main block */}
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[28, 12, 13]} />
        <meshStandardMaterial color={STONE} roughness={0.9} />
      </mesh>
      {/* parapet */}
      <mesh position={[0, 12.3, 0]}>
        <boxGeometry args={[28.6, 0.8, 13.6]} />
        <meshStandardMaterial color={STONE_LIGHT} roughness={0.9} />
      </mesh>
      {/* shallow roof slab behind the parapet */}
      <mesh position={[0, 12.5, 0]}>
        <boxGeometry args={[27, 0.5, 12]} />
        <meshStandardMaterial color={ROOF} roughness={0.95} />
      </mesh>

      {/* wings */}
      {[-18, 18].map((x) => (
        <group key={x}>
          <mesh position={[x, 4.5, -0.5]} castShadow receiveShadow>
            <boxGeometry args={[9, 9, 11]} />
            <meshStandardMaterial color={STONE} roughness={0.9} />
          </mesh>
          <mesh position={[x, 9.2, -0.5]}>
            <boxGeometry args={[9.4, 0.7, 11.4]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.9} />
          </mesh>
          <Windows count={2} width={5} z={5.2} y0={3} storeys={2} storeyH={3.4} />
          <group position={[x, 0, 0]}>
            <Windows count={2} width={5} z={5.2} y0={2.6} storeys={2} storeyH={3.2} />
          </group>
        </group>
      ))}

      {/* front-facade windows on the main block */}
      <Windows count={6} width={22} z={6.6} y0={3.2} storeys={2} storeyH={4.2} />

      {/* central portico — four columns + pediment + steps */}
      <group position={[0, 0, 6.5]}>
        {[-3.3, -1.1, 1.1, 3.3].map((x) => (
          <mesh key={x} position={[x, 3.6, 1.4]} castShadow>
            <cylinderGeometry args={[0.42, 0.46, 7.2, 16]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.8} />
          </mesh>
        ))}
        {/* entablature */}
        <mesh position={[0, 7.5, 1.4]} castShadow>
          <boxGeometry args={[9.4, 1.1, 1.8]} />
          <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
        </mesh>
        {/* pediment */}
        <mesh position={[0, 8.7, 1.4]} rotation-y={Math.PI / 4}>
          <coneGeometry args={[3.4, 1.8, 4]} />
          <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
        </mesh>
        {/* steps */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.15 + i * 0.18, 3.0 - i * 0.5]} receiveShadow>
            <boxGeometry args={[10 - i * 1.2, 0.2, 1.4]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.9} />
          </mesh>
        ))}
        {/* door */}
        <mesh position={[0, 2.4, 0.9]}>
          <boxGeometry args={[2.2, 4.2, 0.2]} />
          <meshStandardMaterial color={DOOR} roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.4, 1.02]}>
          <boxGeometry args={[2.4, 4.4, 0.08]} />
          <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}
