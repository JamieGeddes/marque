/**
 * Shared KTX2 transcoder for every GLB load. Car textures are GPU-compressed
 * (KTX2/Basis) so they stay compressed in VRAM instead of decoding to full
 * RGBA — the single biggest lever on resident memory.
 *
 * The Basis transcoder is served from public/basis/. `detectSupport` must run
 * once with the live renderer (to pick the device's native compressed format)
 * before the first KTX2 texture is parsed — wired via the Canvas `onCreated`.
 */
import { KTX2Loader, type GLTFLoader } from 'three-stdlib'
import type { WebGLRenderer } from 'three'
import { assetUrl } from './assetUrl'

const ktx2Loader = new KTX2Loader().setTranscoderPath(assetUrl('basis/'))

let detected = false

export function setupKTX2(renderer: WebGLRenderer): void {
  if (detected) return
  ktx2Loader.detectSupport(renderer)
  detected = true
}

/** Pass as useGLTF's 4th arg (`extendLoader`) so the GLTFLoader can decode the
 *  KTX2 textures embedded in the GLBs. Not part of the suspense-cache key, so it
 *  composes with useGLTF.clear and the eviction layer unchanged. */
export function extendKTX2(loader: GLTFLoader): void {
  loader.setKTX2Loader(ktx2Loader)
}
