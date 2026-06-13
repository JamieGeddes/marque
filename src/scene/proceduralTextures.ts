import * as THREE from 'three'

/**
 * Procedural CanvasTextures for the Concours grounds. The scene is built from
 * primitives with no sourced surface maps, so the stone, bark, foliage and
 * Georgian glazing are generated once into <canvas> elements and reused. Each
 * texture is a deterministic singleton (seeded RNG, no flicker between frames);
 * callers clone() it to set their own repeat, exactly as Ground.tsx does.
 */
const hasDoc = typeof document !== 'undefined'

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, ctx: c.getContext('2d') as CanvasRenderingContext2D }
}

function finish(c: HTMLCanvasElement, srgb: boolean): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

/* ——— Ashlar stone: coursed rectangular blocks with recessed mortar ——— */
let _stone: { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } | null = null
export function stoneTextures() {
  if (!hasDoc) return null
  if (_stone) return _stone
  const W = 512
  const H = 512
  const color = makeCanvas(W, H)
  const bump = makeCanvas(W, H)
  const rnd = rng(20240613)

  // base fills
  color.ctx.fillStyle = '#b9aa8c' // mortar tone
  color.ctx.fillRect(0, 0, W, H)
  bump.ctx.fillStyle = '#404040' // mortar sits low
  bump.ctx.fillRect(0, 0, W, H)

  const courseH = 64
  const mortar = 3
  let row = 0
  for (let y = 0; y < H; y += courseH, row++) {
    const blockW = 96
    // alternate the joint offset so verticals never line up across courses
    const offset = row % 2 === 0 ? 0 : -blockW / 2
    for (let x = offset; x < W; x += blockW) {
      const bw = blockW - mortar
      const bh = courseH - mortar
      // per-block warm-stone variation
      const v = 0.82 + rnd() * 0.18
      const r = Math.round(206 * v)
      const g = Math.round(192 * v)
      const b = Math.round(160 * v)
      color.ctx.fillStyle = `rgb(${r},${g},${b})`
      color.ctx.fillRect(x + mortar, y + mortar, bw, bh)
      // block face is raised in the bump map, with a touch of grain
      const bv = 150 + Math.round(rnd() * 50)
      bump.ctx.fillStyle = `rgb(${bv},${bv},${bv})`
      bump.ctx.fillRect(x + mortar, y + mortar, bw, bh)
      // fine speckle so faces are not perfectly flat
      for (let i = 0; i < 26; i++) {
        const sx = x + mortar + rnd() * bw
        const sy = y + mortar + rnd() * bh
        const a = rnd() * 0.12
        color.ctx.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(60,48,32,${a})`
        color.ctx.fillRect(sx, sy, 2, 2)
      }
    }
  }
  _stone = { map: finish(color.c, true), bump: finish(bump.c, false) }
  return _stone
}

/* ——— Tree bark: vertical fibrous grooves ——— */
let _bark: { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } | null = null
export function barkTextures() {
  if (!hasDoc) return null
  if (_bark) return _bark
  const W = 128
  const H = 256
  const color = makeCanvas(W, H)
  const bump = makeCanvas(W, H)
  const rnd = rng(7781)
  color.ctx.fillStyle = '#4a3b2c'
  color.ctx.fillRect(0, 0, W, H)
  bump.ctx.fillStyle = '#808080'
  bump.ctx.fillRect(0, 0, W, H)
  // vertical streaks of varying brown + dark grooves
  for (let x = 0; x < W; x += 1) {
    if (rnd() > 0.45) continue
    const v = 0.7 + rnd() * 0.6
    const r = Math.round(74 * v)
    const g = Math.round(59 * v)
    const b = Math.round(44 * v)
    const w = 1 + Math.floor(rnd() * 3)
    color.ctx.fillStyle = `rgb(${r},${g},${b})`
    color.ctx.fillRect(x, 0, w, H)
    const bv = Math.round(120 * v)
    bump.ctx.fillStyle = `rgb(${bv},${bv},${bv})`
    bump.ctx.fillRect(x, 0, w, H)
  }
  // a few horizontal breaks
  for (let i = 0; i < 40; i++) {
    const y = rnd() * H
    const x = rnd() * W
    color.ctx.fillStyle = `rgba(30,22,14,${0.3 + rnd() * 0.4})`
    color.ctx.fillRect(x, y, 6 + rnd() * 18, 1 + rnd() * 2)
  }
  _bark = { map: finish(color.c, true), bump: finish(bump.c, false) }
  return _bark
}

/* ——— Foliage: mottled leaf clumps to break up the flat icosahedra ——— */
let _foliage: { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } | null = null
export function foliageTextures() {
  if (!hasDoc) return null
  if (_foliage) return _foliage
  const S = 256
  const color = makeCanvas(S, S)
  const bump = makeCanvas(S, S)
  const rnd = rng(33107)
  color.ctx.fillStyle = '#46552f'
  color.ctx.fillRect(0, 0, S, S)
  bump.ctx.fillStyle = '#707070'
  bump.ctx.fillRect(0, 0, S, S)
  // overlapping leaf blobs in a range of greens
  const greens = [
    [70, 88, 47],
    [88, 104, 58],
    [56, 72, 38],
    [102, 118, 66],
    [60, 80, 40],
  ]
  for (let i = 0; i < 1400; i++) {
    const x = rnd() * S
    const y = rnd() * S
    const r = 3 + rnd() * 9
    const [cr, cg, cb] = greens[(rnd() * greens.length) | 0]
    color.ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.5 + rnd() * 0.5})`
    color.ctx.beginPath()
    color.ctx.arc(x, y, r, 0, Math.PI * 2)
    color.ctx.fill()
    const bv = 80 + Math.round(rnd() * 175)
    bump.ctx.fillStyle = `rgba(${bv},${bv},${bv},0.6)`
    bump.ctx.beginPath()
    bump.ctx.arc(x, y, r, 0, Math.PI * 2)
    bump.ctx.fill()
  }
  _foliage = { map: finish(color.c, true), bump: finish(bump.c, false) }
  return _foliage
}

/* ——— Water: a tileable ripple normal map (scrolled at runtime). Built from a
 *  sum of integer-frequency sine waves (so it wraps seamlessly) baked into a
 *  height field, then differentiated into surface normals. ——— */
let _water: THREE.CanvasTexture | null = null
export function waterNormalTexture() {
  if (!hasDoc) return null
  if (_water) return _water
  const S = 256
  const waves = [
    { fx: 2, fy: 1, a: 1.0, ph: 0.3 },
    { fx: 1, fy: 3, a: 0.8, ph: 1.1 },
    { fx: 3, fy: 2, a: 0.65, ph: 2.0 },
    { fx: 4, fy: 5, a: 0.4, ph: 0.7 },
    { fx: 6, fy: 3, a: 0.3, ph: 2.6 },
  ]
  const h = new Float32Array(S * S)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let v = 0
      for (const w of waves) {
        v += w.a * Math.sin(2 * Math.PI * ((w.fx * x) / S + (w.fy * y) / S) + w.ph)
      }
      h[y * S + x] = v
    }
  }
  const strength = 2.2
  const { c, ctx } = makeCanvas(S, S)
  const img = ctx.createImageData(S, S)
  const at = (x: number, y: number) => h[((y + S) % S) * S + ((x + S) % S)]
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const hx = (at(x + 1, y) - at(x - 1, y)) * strength
      const hy = (at(x, y + 1) - at(x, y - 1)) * strength
      // normal = normalize(-d/dx, -d/dy, 1), packed into RGB
      const inv = 1 / Math.sqrt(hx * hx + hy * hy + 1)
      const i = (y * S + x) * 4
      img.data[i] = Math.round(((-hx * inv) * 0.5 + 0.5) * 255)
      img.data[i + 1] = Math.round(((-hy * inv) * 0.5 + 0.5) * 255)
      img.data[i + 2] = Math.round((inv * 0.5 + 0.5) * 255)
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  _water = finish(c, false) // normal data is linear, not colour
  return _water
}

/* ——— Georgian glazing: white frame + 6-over-6 glazing bars on alpha ——— */
let _glazing: THREE.CanvasTexture | null = null
export function glazingTexture() {
  if (!hasDoc) return null
  if (_glazing) return _glazing
  const W = 128
  const H = 236 // ~ aspect of the 0.92 x 1.7 glass
  const { c, ctx } = makeCanvas(W, H)
  ctx.clearRect(0, 0, W, H) // panes stay transparent
  ctx.fillStyle = '#eceae2' // painted-wood white
  const frame = 11
  const bar = 6
  // outer frame
  ctx.fillRect(0, 0, W, frame)
  ctx.fillRect(0, H - frame, W, frame)
  ctx.fillRect(0, 0, frame, H)
  ctx.fillRect(W - frame, 0, frame, H)
  // central meeting rail (thicker — where the two sashes overlap)
  ctx.fillRect(0, H / 2 - bar, W, bar * 2)
  // vertical glazing bar (2 columns of panes)
  ctx.fillRect(W / 2 - bar / 2, 0, bar, H)
  // horizontal glazing bars: 3 panes per sash
  for (const cy of [H / 4, (3 * H) / 4]) {
    for (const dy of [-1, 1]) {
      ctx.fillRect(0, cy + (dy * H) / 12 - bar / 2, W, bar)
    }
  }
  const t = finish(c, true)
  t.wrapS = THREE.ClampToEdgeWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  _glazing = t
  return _glazing
}
