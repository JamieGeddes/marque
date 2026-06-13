import { useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Sky, Text, useGLTF } from '@react-three/drei'
import { assetUrl } from '../lib/assetUrl'
import { setRoomDims } from './collision'
import {
  concoursLayout,
  concoursInitialIds,
  type ClassSign as ClassSignDef,
} from './concoursLayout'
import {
  getMountedSet,
  setMountedSet,
  seedMounted,
  MOUNT_RADIUS,
  PRELOAD_RADIUS,
  UNMOUNT_RADIUS,
  HARD_CAP,
} from './concoursStream'
import { SunLight, SUN_POSITION } from './SunLight'
import { Ground } from './Ground'
import { CountryHouse } from './CountryHouse'
import { Gardens } from './Gardens'
import { ConcoursCarSlot } from './ConcoursCarSlot'

const SIGN_FONT = assetUrl('fonts/CormorantGaramond-SemiBold.ttf')
const MOUNT_R2 = MOUNT_RADIUS * MOUNT_RADIUS
const PRELOAD_R2 = PRELOAD_RADIUS * PRELOAD_RADIUS
const UNMOUNT_R2 = UNMOUNT_RADIUS * UNMOUNT_RADIUS

/** Proximity streamer: each tick, decide which cars are mounted. Writes the
 *  shared set only when membership actually changes. */
function StreamManager() {
  const camera = useThree((s) => s.camera)
  const acc = useRef(0)
  const lastX = useRef(Infinity)
  const lastZ = useRef(Infinity)
  const preloaded = useRef(new Set<string>())

  useFrame((_, delta) => {
    acc.current += delta
    if (acc.current < 0.2) return
    acc.current = 0
    const px = camera.position.x
    const pz = camera.position.z
    if (lastX.current !== Infinity && Math.hypot(px - lastX.current, pz - lastZ.current) < 1) return
    lastX.current = px
    lastZ.current = pz

    const cur = getMountedSet()
    const next = new Set<string>()
    const dists: { id: string; d2: number }[] = []
    for (const s of concoursLayout.slots) {
      const dx = s.position[0] - px
      const dz = s.position[2] - pz
      const d2 = dx * dx + dz * dz
      if (d2 < PRELOAD_R2 && !preloaded.current.has(s.car.id)) {
        useGLTF.preload(s.car.model.path, true, true)
        preloaded.current.add(s.car.id)
      }
      const wants = cur.has(s.car.id) ? d2 < UNMOUNT_R2 : d2 < MOUNT_R2
      if (wants) {
        next.add(s.car.id)
        dists.push({ id: s.car.id, d2 })
      }
    }
    if (next.size > HARD_CAP) {
      dists.sort((a, b) => a.d2 - b.d2)
      next.clear()
      for (let i = 0; i < HARD_CAP; i++) next.add(dists[i].id)
    }
    let changed = next.size !== cur.size
    if (!changed) for (const id of next) if (!cur.has(id)) { changed = true; break }
    if (changed) setMountedSet(next)
  })

  return null
}

function ClassSign({ sign }: { sign: ClassSignDef }) {
  return (
    <group position={sign.position} rotation-y={sign.rotationY}>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.08, 1.5, 0.08]} />
        <meshStandardMaterial color="#2a2a26" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[2.4, 0.5, 0.06]} />
        <meshStandardMaterial color="#1f2420" roughness={0.7} />
      </mesh>
      <Text
        font={SIGN_FONT}
        position={[0, 1.5, 0.05]}
        fontSize={0.2}
        letterSpacing={0.04}
        color="#d8cdb4"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.2}
        textAlign="center"
      >
        {sign.title}
      </Text>
    </group>
  )
}

export function ConcoursGrounds() {
  // Set the walkable bounds + spawn pose before Player's spawn effect runs,
  // and seed the hero ring so it mounts (and gates entry) immediately.
  useLayoutEffect(() => {
    const { bounds, spawn } = concoursLayout
    setRoomDims(bounds.width, bounds.depth, spawn.z, spawn.x, spawn.yaw)
    seedMounted(concoursInitialIds())
  }, [])

  return (
    <group>
      <Sky
        sunPosition={[SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z]}
        turbidity={2.2}
        rayleigh={0.9}
        mieCoefficient={0.004}
        mieDirectionalG={0.85}
      />
      <Environment files={assetUrl('hdri/syferfontein_1d_clear_1k.hdr')} environmentIntensity={0.75} />
      <hemisphereLight intensity={0.38} color="#bcd6ff" groundColor="#4a5a32" />
      <ambientLight intensity={0.1} color="#fff4e2" />
      <fog attach="fog" args={['#cdd8e0', 130, 320]} />

      <SunLight />
      <Ground />
      <CountryHouse />
      <Gardens />

      {concoursLayout.signs.map((sign, i) => (
        <ClassSign key={i} sign={sign} />
      ))}
      {concoursLayout.slots.map((slot) => (
        <ConcoursCarSlot key={slot.car.id} slot={slot} />
      ))}

      <StreamManager />
    </group>
  )
}
