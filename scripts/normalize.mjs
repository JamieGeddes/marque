/**
 * Normalize a car GLB/GLTF for the showroom:
 *   - uniform scale so the car's horizontal length equals the real car (meters)
 *   - grounded at y = 0, centered on x/z
 *
 * Facing direction is intentionally not baked (can't be detected); set
 * `model.rotationY` in src/data/cars.ts after a visual check.
 *
 * Usage: node scripts/normalize.mjs <input.glb|gltf> <output.glb> <target-length-m> [rotate-y-degrees]
 * rotate-y-degrees bakes a Y rotation first — use for models whose length
 * axis is X instead of Z, or whose front faces the wrong way (e.g. 90, 180).
 */
import { NodeIO, getBounds } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'

const [, , input, output, targetLengthArg, rotateArg] = process.argv
if (!input || !output || !targetLengthArg) {
  console.error('Usage: node scripts/normalize.mjs <input> <output.glb> <target-length-m> [rotate-y-degrees]')
  process.exit(1)
}
const targetLength = Number(targetLengthArg)
const rotateY = ((Number(rotateArg) || 0) * Math.PI) / 180

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const document = await io.read(input)
const scene = document.getRoot().listScenes()[0]

const before = getBounds(scene)
const size = [
  before.max[0] - before.min[0],
  before.max[1] - before.min[1],
  before.max[2] - before.min[2],
]
const horizontalLength = Math.max(size[0], size[2])
const scale = targetLength / horizontalLength

const wrapper = document
  .createNode('showroom-normalized')
  .setScale([scale, scale, scale])
  .setRotation([0, Math.sin(rotateY / 2), 0, Math.cos(rotateY / 2)])
for (const child of [...scene.listChildren()]) {
  scene.removeChild(child)
  wrapper.addChild(child)
}
scene.addChild(wrapper)

const scaled = getBounds(scene)
wrapper.setTranslation([
  -(scaled.min[0] + scaled.max[0]) / 2,
  -scaled.min[1],
  -(scaled.min[2] + scaled.max[2]) / 2,
])

const after = getBounds(scene)
console.log(
  `${input}\n  raw size   ${size.map((v) => v.toFixed(2)).join(' x ')}\n  scale      ${scale.toFixed(5)}\n  final size ${(after.max[0] - after.min[0]).toFixed(2)} x ${(after.max[1] - after.min[1]).toFixed(2)} x ${(after.max[2] - after.min[2]).toFixed(2)} m (minY ${after.min[1].toFixed(4)})`,
)

await io.write(output, document)
