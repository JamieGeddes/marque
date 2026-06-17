/**
 * Decode a GLB's textures from WebP to PNG.
 *
 * The KTX-Software `ktx` encoder (used by `gltf-transform uastc`/`etc1s`) cannot
 * read image/webp, and our existing public/models GLBs ship WebP textures. This
 * losslessly re-wraps them as PNG so the KTX2 passes can consume them. Geometry
 * is left untouched (meshopt is re-applied by the final pass in the caller).
 *
 *   Usage: node scripts/webp-to-png.mjs <input.glb> <output.glb>
 */
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'
import { textureCompress } from '@gltf-transform/functions'
import sharp from 'sharp'

const [, , input, output] = process.argv
if (!input || !output) {
  console.error('usage: node scripts/webp-to-png.mjs <input.glb> <output.glb>')
  process.exit(1)
}

await MeshoptDecoder.ready
await MeshoptEncoder.ready
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })

const doc = await io.read(input)
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'png' }))
await io.write(output, doc)
