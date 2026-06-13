import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

/** Seconds for the Concours stream-in dissolve. Shared with the proxy field so
 *  the silhouette fades out over the same window the model fades in. */
export const MODEL_FADE_SECONDS = 0.5

interface MatState {
  mat: THREE.Material & { opacity: number; transparent: boolean; depthWrite: boolean }
  opacity: number
  transparent: boolean
  depthWrite: boolean
}

export function CarModel({
  path,
  castShadow = false,
  fadeIn = false,
}: {
  path: string
  castShadow?: boolean
  fadeIn?: boolean
}) {
  const { scene } = useGLTF(path, true, true)
  const fade = useRef(0)
  const matStates = useRef<MatState[]>([])

  useEffect(() => {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = castShadow
        object.receiveShadow = false
      }
    })
    if (import.meta.env.DEV) {
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      // Sanity check: a car should be ~4-5m long, grounded near y=0.
      console.info(
        `[CarModel] ${path} — size ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)} m, minY ${box.min.y.toFixed(3)}`,
      )
    }
  }, [scene, path, castShadow])

  // Stream-in dissolve: ramp every material's opacity from 0 to its original,
  // preserving each material's own transparency (so glass stays glass).
  useEffect(() => {
    if (!fadeIn) return
    // Capture each UNIQUE material once. GLBs frequently share one material
    // across many meshes; visiting it twice would record its already-zeroed
    // opacity as the "original" and restore it to invisible. Dedupe first.
    const seen = new Map<THREE.Material, MatState>()
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const mats = Array.isArray(object.material) ? object.material : [object.material]
      for (const m of mats) {
        if (!m || seen.has(m)) continue
        const mat = m as MatState['mat']
        seen.set(m, {
          mat,
          opacity: mat.opacity,
          transparent: mat.transparent,
          depthWrite: mat.depthWrite,
        })
      }
    })
    const states = [...seen.values()]
    for (const s of states) {
      // Leave depthWrite alone — disabling it makes a multi-part body render
      // its interior through the shell mid-fade ("missing parts").
      s.mat.transparent = true
      s.mat.opacity = 0
    }
    matStates.current = states
    fade.current = 0
    return () => {
      // Restore originals on unmount (the GLB scene is shared via drei's cache).
      for (const s of states) {
        s.mat.opacity = s.opacity
        s.mat.transparent = s.transparent
        s.mat.depthWrite = s.depthWrite
      }
    }
  }, [scene, fadeIn])

  useFrame((_, delta) => {
    if (!fadeIn || fade.current >= 1) return
    fade.current = Math.min(1, fade.current + delta / MODEL_FADE_SECONDS)
    const eased = 1 - (1 - fade.current) * (1 - fade.current) // easeOutQuad
    const done = fade.current >= 1
    for (const s of matStates.current) {
      s.mat.opacity = done ? s.opacity : s.opacity * eased
      if (done) s.mat.transparent = s.transparent
    }
  })

  return <primitive object={scene} />
}
