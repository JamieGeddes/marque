// Dev-only: render one car model and compute its dominant body colour.
// Driven by scripts/render-sample-colors.mjs via ?model=<id>. Sets
// window.__sample = { ok, color } when finished.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const SIZE = 320
const BG = { r: 255, g: 0, b: 255 } // magenta chroma key

function fail(error) {
  window.__sample = { ok: false, error: String(error) }
}

function saturation(r, g, b) {
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  return mx === 0 ? 0 : (mx - mn) / mx
}

/** Dominant paint colour from the rendered pixels: drop the magenta background,
 *  near-black shadow and the brightest specular highlights, then pick the colour
 *  cluster scored by count * (0.3 + saturation) so a vivid paint region beats a
 *  marginally larger neutral one while silver/black/white still resolve. */
function dominantColor(data) {
  const buckets = new Map()
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (r > 220 && b > 220 && g < 70) continue // background
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    if (lum < 18) continue // shadow / tyre / deep crevice
    if (lum > 245 && saturation(r, g, b) < 0.08) continue // blown specular highlight
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
    let e = buckets.get(key)
    if (!e) {
      e = { r: 0, g: 0, b: 0, n: 0 }
      buckets.set(key, e)
    }
    e.r += r
    e.g += g
    e.b += b
    e.n++
  }
  if (!buckets.size) return null
  let best = null
  let bestScore = -1
  for (const e of buckets.values()) {
    const r = e.r / e.n
    const g = e.g / e.n
    const b = e.b / e.n
    const score = e.n * (0.3 + 1.2 * saturation(r, g, b))
    if (score > bestScore) {
      bestScore = score
      best = e
    }
  }
  const r = Math.round(best.r / best.n)
  const g = Math.round(best.g / best.n)
  const b = Math.round(best.b / best.n)
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

async function main() {
  const id = new URLSearchParams(location.search).get('model')
  if (!id) return fail('no model')

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setSize(SIZE, SIZE)
  renderer.setClearColor(0xff00ff, 1)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  document.body.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  // Match the app's lighting so the sampled colour matches what the user sees.
  const pmrem = new THREE.PMREMGenerator(renderer)
  const hdr = await new RGBELoader().loadAsync('/hdri/syferfontein_1d_clear_1k.hdr')
  scene.environment = pmrem.fromEquirectangular(hdr).texture
  scene.environmentIntensity = 0.75
  hdr.dispose()
  scene.add(new THREE.HemisphereLight(0xbcd6ff, 0x4a5a32, 0.38))
  scene.add(new THREE.AmbientLight(0xfff4e2, 0.1))
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.4)
  sun.position.set(6, 10, 8)
  scene.add(sun)

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  const gltf = await loader.loadAsync(`/models/${id}.glb`)
  scene.add(gltf.scene)

  // Frame the car from a flattering front 3/4, slightly above.
  const box = new THREE.Box3().setFromObject(gltf.scene)
  const center = box.getCenter(new THREE.Vector3())
  const radius = box.getSize(new THREE.Vector3()).length() / 2
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000)
  const dir = new THREE.Vector3(0.85, 0.5, 1).normalize()
  const dist = (radius / Math.sin((camera.fov * Math.PI) / 180 / 2)) * 1.05
  camera.position.copy(center).addScaledVector(dir, dist)
  camera.lookAt(center)

  renderer.render(scene, camera)

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  ctx.drawImage(renderer.domElement, 0, 0)
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE)

  const color = dominantColor(data)
  window.__sample = color ? { ok: true, color } : { ok: false, error: 'no car pixels' }
}

main().catch(fail)
