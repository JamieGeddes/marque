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
  // New halo marques promoted from the 2026 expansion (each leaves ≥2 cars on
  // its lawn class): Bugatti, Koenigsegg, a halo Lamborghini and a 90s icon.
  'bugatti-tourbillon',
  'koenigsegg-jesko',
  'lamborghini-countach',
  'jaguar-xj220',
]

const HOUSE_Z = -69
const HOUSE_SIZE: [number, number, number] = [42, 13, 14] // w, h, d → front face at z = -62
// Pulled forward of the house (front steps sit at z ≈ -58.8, collider front at
// -58.6) and the ring tightened so the rear arc never lands cars on the steps:
// back-of-ring car centre = CIRCLE_Z - RING_RADIUS = -55, clear of the portico.
const CIRCLE: [number, number] = [0, -45]
const CIRCLE_RADIUS = 16
const RING_RADIUS = 10
const SPAWN_Z = -30
const LANE_HALF = 5
// Depth sized to contain the full lawn. With the 2026 expansion the classes
// (19 halls, ~87 lawn cars) march further out, so the bound is widened to keep
// the far bands well inside the 400² grass plane. See __concoursLayout in dev
// to read the real max slot z.
const BOUNDS = { width: 86, depth: 300 } // z ∈ ±150, x ∈ ±43

// Lawn class bands marching from just past the circle out into the gardens.
// Cars sit angled ~65-75° toward the central path, so their long axis runs
// roughly across the columns — the column gap is the tight one and gets the
// most room. Bands are placed by a running per-side cursor using each band's
// real depth (+ LAWN_BAND_GAP), so a big class can never overlap its neighbour.
const LAWN_START_Z = -14
const LAWN_INNER_X = 15
const LAWN_COL_DX = 8 // gap between columns (the tight axis)
const LAWN_ROW_DZ = 6 // gap between rows within a class
const LAWN_BAND_GAP = 4.5 // clear aisle between consecutive same-side classes
const LAWN_CAR_HALF_Z = 2.2 // conservative half-depth of a rotated car, for spacing

function faceFrom(x: number, z: number, tx: number, tz: number): number {
  // rotationY whose forward (sin, cos) points from (x,z) toward (tx,tz).
  return Math.atan2(tx - x, tz - z)
}

// Clearance from a car's footprint edge to its placard.
const PLACARD_CLEAR = 0.6

/**
 * Half-extent of a car's (rotated) footprint along the unit direction (dx,dz).
 * A car angled toward the path reaches far further along its length than its
 * width, so a width-only offset buries the placard inside the body — this
 * projects the true oriented box so the placard always clears the car.
 */
function footprintHalfExtent(
  rotationY: number,
  length: number,
  width: number,
  dx: number,
  dz: number,
): number {
  const fx = Math.sin(rotationY)
  const fz = Math.cos(rotationY)
  return (length / 2) * Math.abs(fx * dx + fz * dz) + (width / 2) * Math.abs(fz * dx - fx * dz)
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
    // Placard on the outer side of the ring, facing outward toward visitors —
    // pushed clear of the car's rear, which points outward here.
    const outX = Math.sin(a)
    const outZ = Math.cos(a)
    const pad =
      footprintHalfExtent(rotationY, car.collider.length, car.collider.width, outX, outZ) +
      PLACARD_CLEAR
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
  // A running cursor per side advances by each band's real depth so bands never
  // collide; bigger classes spread into a third column to stay shallow.
  const cursor: Record<number, number> = { [-1]: LAWN_START_Z, [1]: LAWN_START_Z + 7 }
  halls.forEach((hall) => {
    const lawnCars = hall.carIds
      .filter((id) => !heroSet.has(id))
      .map(getCar)
      .filter((c): c is CarDefinition => !!c)
    if (!lawnCars.length) return

    // Place each class on whichever side has advanced less, keeping the two
    // lawns balanced in depth so neither runs past the grounds.
    const side = cursor[-1] <= cursor[1] ? -1 : 1
    const cols = lawnCars.length > 4 ? 3 : 2
    const rowCount = Math.ceil(lawnCars.length / cols)
    const halfDepth = ((rowCount - 1) * LAWN_ROW_DZ) / 2 + LAWN_CAR_HALF_Z
    const bandZ = cursor[side] + halfDepth

    lawnCars.forEach((car, j) => {
      const col = j % cols
      const row = Math.floor(j / cols)
      const x = side * (LAWN_INNER_X + col * LAWN_COL_DX)
      const z = bandZ + (row - (rowCount - 1) / 2) * LAWN_ROW_DZ
      // Angle three-quarter toward the central path and slightly up-garden.
      const rotationY = faceFrom(x, z, 0, z + 7)
      // Placard toward the central path, clear of the car's (angled) footprint.
      const pad =
        footprintHalfExtent(rotationY, car.collider.length, car.collider.width, -side, 0) +
        PLACARD_CLEAR
      slots.push({
        car,
        position: [x, 0, z],
        rotationY,
        area: 'lawn',
        placard: {
          position: [x - side * pad, 0, z],
          rotationY: side === -1 ? Math.PI * 0.5 : -Math.PI * 0.5,
        },
      })
    })

    signs.push({
      title: hall.title,
      position: [side * (LAWN_INNER_X - 3.5), 0, bandZ - halfDepth - 1],
      rotationY: side === -1 ? Math.PI * 0.5 : -Math.PI * 0.5,
    })

    cursor[side] = bandZ + halfDepth + LAWN_BAND_GAP
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
