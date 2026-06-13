export interface HallDefinition {
  id: string
  /** Two-digit ordinal shown on the lobby card, e.g. "01". */
  ordinal: string
  title: string
  tagline: string
  carIds: string[]
}

export interface CarSpec {
  label: string
  value: string
}

export interface CarDefinition {
  id: string
  name: string
  manufacturer: string
  year: string
  /** Museum-card copy, one entry per paragraph. */
  description: string[]
  specs: CarSpec[]
  model: {
    /** Path under public/, e.g. /models/porsche-930.glb */
    path: string
    /** 1 when the asset pipeline has normalized the GLB to meters. */
    scale: number
    /** Optional tint for the distant low-poly Concours proxy (CSS color).
     *  Falls back to a deterministic neutral derived from `id`. */
    proxyColor?: string
  }
  /** Real-world footprint in meters; drives the walk-around collider. */
  collider: {
    length: number
    width: number
  }
  attribution: {
    modelTitle: string
    author: string
    authorUrl: string
    sourceUrl: string
    license: string
    licenseUrl: string
  }
}
