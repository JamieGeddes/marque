/**
 * Computes exhibit placement for a hall: cars in two columns (x = ±7) with
 * a central walkway, rows spaced along z, room depth growing with the
 * collection. Reproduces the original four-car arrangement for count = 4.
 */
export interface ExhibitSlot {
  carPosition: [number, number, number]
  carRotationY: number
  pedestalPosition: [number, number, number]
  pedestalRotationY: number
}

export interface HallLayout {
  width: number
  depth: number
  spawnZ: number
  /** Length of each ceiling light cove (one per column, running along z). */
  coveLength: number
  slots: ExhibitSlot[]
}

const COLUMN_X = 7
const PEDESTAL_X = 4.2
const ROW_SPACING = 7.2

export function computeHallLayout(carCount: number): HallLayout {
  const rows = Math.max(1, Math.ceil(carCount / 2))
  const depth = Math.max(18, rows * ROW_SPACING + 10.8)
  const width = 28
  const spawnZ = depth / 2 - 1.6

  const slots: ExhibitSlot[] = []
  for (let i = 0; i < carCount; i++) {
    const row = Math.floor(i / 2)
    const left = i % 2 === 0
    const x = left ? -COLUMN_X : COLUMN_X
    const z = (row - (rows - 1) / 2) * ROW_SPACING
    // Angle the car three-quarter-on toward the walkway; rear rows face back
    // up the hall so visitors are always greeted by a nose, not a tail.
    const magnitude = z < -0.1 ? 0.5 : z > 0.1 ? 2.5 : 1.1
    const carRotationY = left ? magnitude : -magnitude

    const px = left ? -PEDESTAL_X : PEDESTAL_X
    const pz = z + (z > 0.1 ? -1.9 : 1.8)
    const pedestalRotationY = Math.atan2(-px, -pz)

    slots.push({
      carPosition: [x, 0, z],
      carRotationY,
      pedestalPosition: [px, 0, pz],
      pedestalRotationY,
    })
  }

  return { width, depth, spawnZ, coveLength: Math.max(6, depth - 9), slots }
}
