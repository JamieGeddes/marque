import { useEffect, useMemo } from 'react'
import { registerBox } from './collision'
import { stoneTextures, glazingTexture } from './proceduralTextures'

/**
 * A large English country house built from primitives — a symmetrical
 * Georgian/Palladian facade (main block + flanking wings + central portico,
 * low parapet roof) dressed with coursed ashlar stone, a moulded plinth, string
 * course and cornice, chimney stacks, and six-over-six sash windows. Sits at the
 * head of the driveway facing +Z. Registers an AABB so the player can't walk
 * through it. Structured as one component so a sourced CC model could replace
 * the geometry later behind the same seam.
 */
const STONE = '#cabba0'
const STONE_LIGHT = '#d8ccb4'
const STONE_DARK = '#a89a7c'
const GLASS = '#1d2128'
const ROOF = '#3b3c41'
const DOOR = '#272320'
const BRASS = '#b9a779'
const SASH = '#eceae2'

const CZ = -69 // house centre Z

/** Cloned ashlar map+bump at a given tiling (clone shares the image, not the
 *  repeat — same trick as Ground.tsx). Falls back to a flat colour with no doc. */
function useStone(rx: number, ry: number) {
  return useMemo(() => {
    const t = stoneTextures()
    if (!t) return null
    const map = t.map.clone()
    map.repeat.set(rx, ry)
    map.needsUpdate = true
    const bumpMap = t.bump.clone()
    bumpMap.repeat.set(rx, ry)
    bumpMap.needsUpdate = true
    return { map, bumpMap }
  }, [rx, ry])
}

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
  const glaze = useMemo(() => glazingTexture(), [])
  const items = []
  const span = width
  for (let s = 0; s < storeys; s++) {
    for (let i = 0; i < count; i++) {
      const x = -span / 2 + (span / (count - 1)) * i
      const y = y0 + s * storeyH
      items.push(
        <group key={`${s}-${i}`} position={[x, y, z]}>
          {/* stone architrave surround — sits behind, reads as a border. Its
              front face (z=0) stays clear of the glass so they never co-plane. */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[1.28, 2.06, 0.1]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
          </mesh>
          {/* glass, fully in front of the surround (front face z=0.06) */}
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.92, 1.7, 0.04]} />
            <meshStandardMaterial
              color={GLASS}
              roughness={0.08}
              metalness={0.2}
              envMapIntensity={1.5}
            />
          </mesh>
          {/* white sash frame + six-over-six glazing bars: an OPAQUE alpha-cutout
              (alphaTest, no `transparent`) so it writes depth and never flickers
              against the glass; held 0.04 proud of the glass front. */}
          {glaze && (
            <mesh position={[0, 0, 0.1]}>
              <planeGeometry args={[0.94, 1.72]} />
              <meshStandardMaterial map={glaze} color={SASH} roughness={0.6} alphaTest={0.5} />
            </mesh>
          )}
          {/* projecting stone sill */}
          <mesh position={[0, -1.05, 0.14]} castShadow>
            <boxGeometry args={[1.4, 0.13, 0.26]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.8} />
          </mesh>
          {/* lintel + keystone */}
          <mesh position={[0, 1.07, 0.1]} castShadow>
            <boxGeometry args={[1.42, 0.18, 0.18]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.13, 0.13]} castShadow>
            <boxGeometry args={[0.26, 0.32, 0.16]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.8} />
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

  const bodyStone = useStone(4, 2.5)
  const wingStone = useStone(1.6, 1.6)

  return (
    <group position={[0, 0, CZ]}>
      {/* main block */}
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[28, 12, 13]} />
        <meshStandardMaterial
          color={bodyStone ? '#ffffff' : STONE}
          roughness={0.92}
          bumpScale={0.05}
          {...bodyStone}
        />
      </mesh>
      {/* moulded plinth / base course */}
      <mesh position={[0, 1, 0]} receiveShadow>
        <boxGeometry args={[28.5, 2, 13.5]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.95} {...bodyStone} />
      </mesh>
      {/* string course between the storeys */}
      <mesh position={[0, 5.4, 0]} castShadow>
        <boxGeometry args={[28.4, 0.35, 13.4]} />
        <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
      </mesh>
      {/* projecting cornice under the parapet */}
      <mesh position={[0, 11.7, 0]} castShadow>
        <boxGeometry args={[29, 0.6, 14] } />
        <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
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
      {/* chimney stacks */}
      {[
        [-10, 4],
        [10, 4],
        [-10, -4],
        [10, -4],
      ].map(([cx, cz2]) => (
        <group key={`${cx}-${cz2}`} position={[cx, 13.4, cz2]}>
          <mesh castShadow>
            <boxGeometry args={[1.8, 2.6, 1.6]} />
            <meshStandardMaterial color={STONE} roughness={0.95} {...bodyStone} />
          </mesh>
          <mesh position={[0, 1.45, 0]} castShadow>
            <boxGeometry args={[2.1, 0.4, 1.9]} />
            <meshStandardMaterial color={STONE_LIGHT} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* wings */}
      {[-18, 18].map((x) => (
        <group key={x}>
          <mesh position={[x, 4.5, -0.5]} castShadow receiveShadow>
            <boxGeometry args={[9, 9, 11]} />
            <meshStandardMaterial
              color={wingStone ? '#ffffff' : STONE}
              roughness={0.92}
              bumpScale={0.05}
              {...wingStone}
            />
          </mesh>
          <mesh position={[x, 9.2, -0.5]} castShadow>
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
          <group key={x} position={[x, 0, 1.4]}>
            {/* column shaft */}
            <mesh position={[0, 3.7, 0]} castShadow>
              <cylinderGeometry args={[0.4, 0.44, 6.8, 20]} />
              <meshStandardMaterial color={STONE_LIGHT} roughness={0.8} />
            </mesh>
            {/* base + capital */}
            <mesh position={[0, 0.25, 0]} castShadow>
              <cylinderGeometry args={[0.56, 0.6, 0.5, 20]} />
              <meshStandardMaterial color={STONE_LIGHT} roughness={0.82} />
            </mesh>
            <mesh position={[0, 7.2, 0]} castShadow>
              <boxGeometry args={[1.1, 0.4, 1.1]} />
              <meshStandardMaterial color={STONE_LIGHT} roughness={0.82} />
            </mesh>
          </group>
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
          <mesh key={i} position={[0, 0.15 + i * 0.18, 3.0 - i * 0.5]} receiveShadow castShadow>
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
