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
    position: [number, number, number]
    rotationY: number
    /** 1 when the asset pipeline has normalized the GLB to meters. */
    scale: number
  }
  /** Real-world footprint in meters; drives the walk-around collider. */
  collider: {
    length: number
    width: number
  }
  pedestal: {
    position: [number, number, number]
    rotationY: number
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
