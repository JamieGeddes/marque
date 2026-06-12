import { useEffect } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

export function CarModel({ path }: { path: string }) {
  const { scene } = useGLTF(path, true, true)

  useEffect(() => {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = false
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
  }, [scene, path])

  return <primitive object={scene} />
}
