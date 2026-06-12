import { MeshReflectorMaterial } from '@react-three/drei'
import { useAppStore } from '../store/useAppStore'
import { ROOM } from './collision'

const WALL_COLOR = '#333338'
const FLOOR_COLOR = '#141417'

function Cove({ length }: { length: number }) {
  return (
    <group>
      {/* recessed housing */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[length + 0.3, 0.1, 1.5]} />
        <meshStandardMaterial color="#1b1b1e" roughness={0.9} />
      </mesh>
      {/* emissive panel */}
      <mesh>
        <boxGeometry args={[length, 0.04, 1.2]} />
        <meshStandardMaterial
          color="#fdf6ea"
          emissive="#fdf6ea"
          emissiveIntensity={2.2}
          roughness={1}
        />
      </mesh>
    </group>
  )
}

export function Room({
  width,
  depth,
  coveLength,
}: {
  width: number
  depth: number
  coveLength: number
}) {
  const quality = useAppStore((s) => s.quality)
  const { height } = ROOM

  return (
    <group>
      {/* floor — polished dark concrete */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <MeshReflectorMaterial
          blur={[280, 80]}
          resolution={quality === 'high' ? 1024 : 512}
          mixBlur={1}
          mixStrength={4}
          roughness={0.7}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color={FLOOR_COLOR}
          metalness={0.4}
          mirror={0.5}
        />
      </mesh>

      {/* ceiling */}
      <mesh rotation-x={Math.PI / 2} position={[0, height, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1d1d20" roughness={0.95} />
      </mesh>

      {/* walls (planes face inward) */}
      <mesh position={[0, height / 2, -depth / 2]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2]} rotation-y={Math.PI}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
      </mesh>

      {/* skirting reveal — a hairline brass line where walls meet the floor */}
      {([
        [0, 0.06, -depth / 2 + 0.02, 0, width],
        [0, 0.06, depth / 2 - 0.02, Math.PI, width],
        [-width / 2 + 0.02, 0.06, 0, Math.PI / 2, depth],
        [width / 2 - 0.02, 0.06, 0, -Math.PI / 2, depth],
      ] as const).map(([x, y, z, ry, len], i) => (
        <mesh key={i} position={[x, y, z]} rotation-y={ry}>
          <planeGeometry args={[len, 0.012]} />
          <meshStandardMaterial color="#8f7d54" metalness={1} roughness={0.35} />
        </mesh>
      ))}

      {/* ceiling light coves — one above each exhibit column, running along z */}
      <group position={[-7, height - 0.03, 0]} rotation-y={Math.PI / 2}>
        <Cove length={coveLength} />
      </group>
      <group position={[7, height - 0.03, 0]} rotation-y={Math.PI / 2}>
        <Cove length={coveLength} />
      </group>
    </group>
  )
}
