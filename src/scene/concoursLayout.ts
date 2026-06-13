/**
 * Deterministic placement for the Concours d'Elegance grounds.
 *
 * Convention (matches the halls' "spawn looking down -Z"): the house sits at
 * the far -Z end facing +Z; the carriage-circle and its hero ring sit just in
 * front of it; the player spawns on the driveway facing the house, with the
 * lawn "classes" (the 13 halls) fanning out into the gardens toward +Z.
 *
 * Every car in `cars` is placed exactly once: ~11 marque icons on the
 * driveway ring, the rest grouped by their hall onto flanking lawns.
 */
import type { CarDefinition } from '../types'
import { cars, getCar } from '../data/cars'
import { halls } from '../data/halls'

export interface ConcoursSlot {
  car: CarDefinition
  position: [number, number, number]
  rotationY: number
  area: 'driveway' | 'lawn'
  placard: { position: [number, number, number]; rotationY: number }
}

export interface ClassSign {
  title: string
  position: [number, number, number]
  rotationY: number
}

export interface ConcoursLayout {
  spawn: { x: number; z: number; yaw: number }
  house: { position: [number, number, number]; size: [number, number, number] }
  bounds: { width: number; depth: number }
  driveway: { circle: [number, number]; circleRadius: number; laneHalfWidth: number; approachZ: number }
  slots: ConcoursSlot[]
  signs: ClassSign[]
}

// Marque icons pulled to the carriage circle. At most ~2 per hall so no lawn
// class is emptied (Legends keeps the F40; Raging Bulls keeps the Gallardo).
const HERO_IDS = [
  'ferrari-250-gto',
  'mercedes-300sl',
  'porsche-959',
  'porsche-carrera-gt',
  'ferrari-laferrari',
  'lamborghini-aventador',
  'mercedes-slr-mclaren',
  'honda-nsx-r',
  'lexus-lfa',
  'mazda-787b',
  'bmw-m1',
]

const HOUSE_Z = -69
const HOUSE_SIZE: [number, number, number] = [42, 13, 14] // w, h, d → front face at z = -62
const CIRCLE: [number, number] = [0, -48]
const CIRCLE_RADIUS = 16
const RING_RADIUS = 11.5
const SPAWN_Z = -30
const LANE_HALF = 5
const BOUNDS = { width: 86, depth: 158 } // z ∈ ±79, x ∈ ±43

// Lawn class bands marching from just past the circle out into the gardens.
const BAND0_Z = -14
const BAND_DZ = 13
const LAWN_INNER_X = 15
const LAWN_COL_DX = 6.5
const LAWN_ROW_DZ = 5.5

function faceFrom(x: number, z: number, tx: number, tz: number): number {
  // rotationY whose forward (sin, cos) points from (x,z) toward (tx,tz).
  return Math.atan2(tx - x, tz - z)
}

export function computeConcoursLayout(): ConcoursLayout {
  const slots: ConcoursSlot[] = []
  const signs: ClassSign[] = []
  const heroSet = new Set(HERO_IDS)

  // —— Driveway: hero ring around the carriage circle, all facing the centre.
  const heroCars = HERO_IDS.map(getCar).filter((c): c is CarDefinition => !!c)
  heroCars.forEach((car, i) => {
    const a = (i / heroCars.length) * Math.PI * 2
    const x = CIRCLE[0] + Math.sin(a) * RING_RADIUS
    const z = CIRCLE[1] + Math.cos(a) * RING_RADIUS
    const rotationY = faceFrom(x, z, CIRCLE[0], CIRCLE[1])
    // Placard on the outer side of the ring, facing outward toward visitors.
    const outX = Math.sin(a)
    const outZ = Math.cos(a)
    const pad = car.collider.width / 2 + 0.7
    slots.push({
      car,
      position: [x, 0, z],
      rotationY,
      area: 'driveway',
      placard: {
        position: [x + outX * pad, 0, z + outZ * pad],
        rotationY: Math.atan2(outX, outZ),
      },
    })
  })

  // —— Lawns: one class (hall) per bay, alternating sides, marching toward +Z.
  halls.forEach((hall, ci) => {
    const lawnCars = hall.carIds
      .filter((id) => !heroSet.has(id))
      .map(getCar)
      .filter((c): c is CarDefinition => !!c)
    if (!lawnCars.length) return

    const side = ci % 2 === 0 ? -1 : 1
    const band = Math.floor(ci / 2)
    const bandZ = BAND0_Z + band * BAND_DZ
    const rowCount = Math.ceil(lawnCars.length / 2)

    lawnCars.forEach((car, j) => {
      const col = j % 2
      const row = Math.floor(j / 2)
      const x = side * (LAWN_INNER_X + col * LAWN_COL_DX)
      const z = bandZ + (row - (rowCount - 1) / 2) * LAWN_ROW_DZ
      // Angle three-quarter toward the central path and slightly up-garden.
      const rotationY = faceFrom(x, z, 0, z + 7)
      const pad = car.collider.width / 2 + 0.7
      slots.push({
        car,
        position: [x, 0, z],
        rotationY,
        area: 'lawn',
        placard: {
          // toward the central path (inner edge of the car)
          position: [x - side * pad, 0, z + 1.1],
          rotationY: side === -1 ? Math.PI * 0.5 : -Math.PI * 0.5,
        },
      })
    })

    signs.push({
      title: hall.title,
      position: [side * (LAWN_INNER_X - 3.5), 0, bandZ - rowCount * 1.3 - 2],
      rotationY: side === -1 ? Math.PI * 0.5 : -Math.PI * 0.5,
    })
  })

  if (import.meta.env.DEV) {
    const placed = slots.map((s) => s.car.id)
    const set = new Set(placed)
    if (set.size !== placed.length) console.warn('[concours] a car is placed more than once')
    for (const c of cars) if (!set.has(c.id)) console.warn('[concours] car not placed:', c.id)
  }

  return {
    spawn: { x: 0, z: SPAWN_Z, yaw: 0 },
    house: { position: [0, 0, HOUSE_Z], size: HOUSE_SIZE },
    bounds: BOUNDS,
    driveway: { circle: CIRCLE, circleRadius: CIRCLE_RADIUS, laneHalfWidth: LANE_HALF, approachZ: BOUNDS.depth / 2 },
    slots,
    signs,
  }
}

/** Computed once — deterministic, no randomness. */
export const concoursLayout = computeConcoursLayout()

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__concoursLayout = concoursLayout
}

/** The driveway hero cars — the spawn cluster gated before entry. */
export function concoursInitialPaths(): string[] {
  return concoursLayout.slots
    .filter((s) => s.area === 'driveway')
    .map((s) => s.car.model.path)
}

export function concoursInitialIds(): string[] {
  return concoursLayout.slots.filter((s) => s.area === 'driveway').map((s) => s.car.id)
}
