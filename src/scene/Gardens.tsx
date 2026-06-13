import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { concoursLayout } from './concoursLayout'
import { circleCollider, registerCollider } from './collision'
import { barkTextures, foliageTextures, waterNormalTexture } from './proceduralTextures'

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
const STONE_LIGHT = '#d8ccb4'

// Layered crown: several overlapping clumps so the canopy reads as foliage
// rather than two bare blobs. Tints alternate and the topmost catches the sun.
// c = flat-shaded fallback colour; t = light tint multiplier when the baked
// foliage texture is present (greens live in the texture, so tint stays light).
const CLUMPS: { p: [number, number, number]; r: number; c: string; t: string }[] = [
  { p: [0, 3.5, 0], r: 1.9, c: FOLIAGE, t: '#cdd6b6' },
  { p: [0.95, 4.1, 0.45], r: 1.35, c: FOLIAGE_2, t: '#b6c29c' },
  { p: [-0.85, 3.9, -0.55], r: 1.3, c: FOLIAGE, t: '#c2cda8' },
  { p: [0.4, 2.9, 0.8], r: 1.15, c: FOLIAGE_2, t: '#aab896' },
  { p: [-0.5, 3.1, -0.7], r: 1.1, c: FOLIAGE, t: '#bcc8a0' },
  { p: [0.3, 4.9, -0.2], r: 1.0, c: '#5d6e3a', t: '#dde4c4' },
]

function Tree({
  position,
  scale = 1,
  seed = 0,
}: {
  position: [number, number, number]
  scale?: number
  seed?: number
}) {
  const bark = useMemo(() => barkTextures(), [])
  const leaf = useMemo(() => foliageTextures(), [])
  // a little rotational variety so the deterministic crowns aren't clones
  const spin = (seed * 1.37) % (Math.PI * 2)
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.32, 3.2, 9]} />
        <meshStandardMaterial
          color={bark ? '#ffffff' : TRUNK}
          roughness={1}
          bumpScale={0.06}
          {...(bark ? { map: bark.map, bumpMap: bark.bump } : {})}
        />
      </mesh>
      <group rotation-y={spin}>
        {CLUMPS.map((cl, i) => (
          <mesh key={i} position={cl.p} castShadow>
            <icosahedronGeometry args={[cl.r, 1]} />
            <meshStandardMaterial
              color={leaf ? cl.t : cl.c}
              roughness={1}
              flatShading
              bumpScale={0.4}
              {...(leaf ? { map: leaf.map, bumpMap: leaf.bump } : {})}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
/**
 * A reflective water surface that sits recessed inside a fountain basin. The
 * ripple normal map is cloned per surface and slowly scrolled each frame so the
 * water shimmers and reads as live rather than a painted disc.
 */
function FountainWater({
  y,
  radius,
  repeat,
  speed = 1,
}: {
  y: number
  radius: number
  repeat: number
  speed?: number
}) {
  const tex = useMemo(() => {
    const base = waterNormalTexture()
    if (!base) return null
    const t = base.clone()
    t.repeat.set(repeat, repeat)
    t.needsUpdate = true
    return t
  }, [repeat])

  useFrame((_, dt) => {
    if (!tex) return
    // scroll x and y at different rates so the ripples drift rather than slide
    tex.offset.x = (tex.offset.x + dt * 0.05 * speed) % 1
    tex.offset.y = (tex.offset.y + dt * 0.033 * speed) % 1
  })

  return (
    <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2} receiveShadow>
      <circleGeometry args={[radius, 56]} />
      <meshStandardMaterial
        color="#1c5866"
        roughness={0.32}
        metalness={0.0}
        envMapIntensity={0.55}
        transparent
        opacity={0.94}
        {...(tex ? { normalMap: tex, normalScale: new THREE.Vector2(1.2, 1.2) } : {})}
      />
    </mesh>
  )
}

export function Gardens() {
  const { driveway, bounds } = concoursLayout
  const [cx, cz] = driveway.circle

  // Keep the player out of the fountain basin (outer radius ≈ 3.55) — the cars
  // and house collide, so the fountain should too.
  useEffect(() => registerCollider(circleCollider(cx, cz, 3.7)), [cx, cz])

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

  const leaf = useMemo(() => foliageTextures(), [])
  const hedgeMap = useMemo(() => {
    if (!leaf) return null
    const map = leaf.map.clone()
    map.repeat.set(20, 0.6)
    map.needsUpdate = true
    return map
  }, [leaf])

  return (
    <group>
      {trees.map((t, i) => (
        <Tree key={i} position={t.position} scale={t.scale} seed={i} />
      ))}

      {/* hedge borders along the outer lawn edges */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 30, 0.6, 18]} receiveShadow castShadow>
          <boxGeometry args={[1.4, 1.2, 90]} />
          <meshStandardMaterial
            color={hedgeMap ? '#9aa775' : HEDGE}
            roughness={1}
            flatShading
            {...(hedgeMap ? { map: hedgeMap } : {})}
          />
        </mesh>
      ))}

      {/* central fountain on the carriage circle. NB the water surfaces sit
          ABOVE each solid basin's top cap — a pool placed below a solid cap is
          hidden by it — with the coping rim raised above the waterline so the
          basin still reads as containing the water. */}
      <group position={[0, 0, cz]}>
        {/* basin body */}
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3.3, 3.55, 0.7, 40]} />
          <meshStandardMaterial color={STONE} roughness={0.9} />
        </mesh>
        {/* dark pool bottom on the basin cap — shows through the water for depth */}
        <mesh position={[0, 0.72, 0]} receiveShadow>
          <cylinderGeometry args={[3.2, 3.2, 0.04, 40]} />
          <meshStandardMaterial color="#223230" roughness={0.5} />
        </mesh>
        {/* water surface, just above the pool bottom */}
        <FountainWater y={0.76} radius={3.18} repeat={3} />
        {/* coping rim — rises above the waterline so the pool looks contained */}
        <mesh position={[0, 0.76, 0]} rotation-x={Math.PI / 2} castShadow>
          <torusGeometry args={[3.22, 0.22, 16, 48]} />
          <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
        </mesh>

        {/* central pedestal rising out of the water */}
        <mesh position={[0, 1.3, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.45, 1.7, 16]} />
          <meshStandardMaterial color={STONE} roughness={0.9} />
        </mesh>
        {/* upper bowl + its own pool of water */}
        <mesh position={[0, 2.1, 0]} castShadow>
          <cylinderGeometry args={[1.1, 0.5, 0.35, 24]} />
          <meshStandardMaterial color={STONE} roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.32, 0]} receiveShadow>
          <cylinderGeometry args={[1.0, 1.0, 0.03, 24]} />
          <meshStandardMaterial color="#223230" roughness={0.5} />
        </mesh>
        <FountainWater y={2.35} radius={0.98} repeat={1} speed={1.5} />
        <mesh position={[0, 2.35, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[1.02, 0.08, 12, 28]} />
          <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
        </mesh>
        {/* finial spout at the very top */}
        <mesh position={[0, 2.7, 0]} castShadow>
          <sphereGeometry args={[0.14, 16, 12]} />
          <meshStandardMaterial color={STONE_LIGHT} roughness={0.8} />
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
