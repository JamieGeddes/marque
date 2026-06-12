/**
 * Minimal 2D (XZ-plane) collision for a walking camera: clamp to the room
 * rectangle, then push out of capsule colliders (cars) and circles
 * (pedestals — a circle is a zero-length capsule).
 */
export interface Collider {
  ax: number
  az: number
  bx: number
  bz: number
  radius: number
}

export const ROOM = {
  width: 28,
  depth: 18,
  height: 5,
  /** How close the camera may get to a wall. */
  wallMargin: 0.5,
  /** Where the player enters the hall (facing -z, down the walkway). */
  spawnZ: 7.4,
}

/** Called by the active hall before the player frame runs (layout effect). */
export function setRoomDims(width: number, depth: number, spawnZ: number) {
  ROOM.width = width
  ROOM.depth = depth
  ROOM.spawnZ = spawnZ
}

const colliders = new Set<Collider>()

export function registerCollider(collider: Collider): () => void {
  colliders.add(collider)
  return () => colliders.delete(collider)
}

/** Capsule along a car's length axis. rotationY = 0 means the car faces +Z. */
export function carCapsule(
  cx: number,
  cz: number,
  rotationY: number,
  length: number,
  width: number,
  margin = 0.35,
): Collider {
  const radius = width / 2 + margin
  const half = Math.max(length / 2 - width / 2, 0)
  const dx = Math.sin(rotationY) * half
  const dz = Math.cos(rotationY) * half
  return { ax: cx - dx, az: cz - dz, bx: cx + dx, bz: cz + dz, radius }
}

export function circleCollider(cx: number, cz: number, radius: number): Collider {
  return { ax: cx, az: cz, bx: cx, bz: cz, radius }
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/** Returns the nearest valid position to (x, z). Sliding along surfaces falls out naturally. */
export function resolvePosition(x: number, z: number): [number, number] {
  const hw = ROOM.width / 2 - ROOM.wallMargin
  const hd = ROOM.depth / 2 - ROOM.wallMargin
  let px = clamp(x, -hw, hw)
  let pz = clamp(z, -hd, hd)

  for (const c of colliders) {
    const abx = c.bx - c.ax
    const abz = c.bz - c.az
    const len2 = abx * abx + abz * abz
    let t = len2 === 0 ? 0 : ((px - c.ax) * abx + (pz - c.az) * abz) / len2
    t = clamp(t, 0, 1)
    const nx = c.ax + abx * t
    const nz = c.az + abz * t
    let dx = px - nx
    let dz = pz - nz
    const d2 = dx * dx + dz * dz
    if (d2 < c.radius * c.radius) {
      if (d2 === 0) {
        dx = 1
        dz = 0
      }
      const d = Math.sqrt(d2) || 1
      px = nx + (dx / d) * c.radius
      pz = nz + (dz / d) * c.radius
    }
  }
  return [px, pz]
}
