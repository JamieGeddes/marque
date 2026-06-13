import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { concoursLayout } from './concoursLayout'
import { getMountedSet, subscribeMounted } from './concoursStream'
import {
  PROXY_GEOMETRY,
  PROXY_MATERIAL,
  PROXY_Y_SCALE,
  proxyColorFor,
} from './concoursProxyGeometry'
import { MODEL_FADE_SECONDS } from './CarModel'

/** easeOut so the silhouette lingers near full size, then drops away quickly —
 *  overlapping the model's fade-in for a clean dissolve rather than a pop. */
function scaleCurve(vis: number): number {
  const inv = 1 - vis
  return 1 - inv * inv
}

/**
 * Distant low-poly stand-ins for every car NOT currently mounted as a full GLB.
 *
 * A single InstancedMesh (one draw call for all ~71 slots) mirrors the inverse
 * of the concoursStream `mounted` set. When a car mounts, its silhouette scales
 * away over MODEL_FADE_SECONDS while the real model fades in over the same
 * window — a cross-dissolve instead of a hard swap. Each proxy is tinted from
 * the real model's sampled colour (falling back to a neutral palette) so the
 * dissolve resolves to roughly the right hue even for brightly coloured cars.
 */
export function ConcoursProxyField() {
  const ctrl = useMemo(() => {
    const slots = concoursLayout.slots
    const n = slots.length
    const mesh = new THREE.InstancedMesh(PROXY_GEOMETRY, PROXY_MATERIAL, n)
    mesh.castShadow = false
    mesh.receiveShadow = false
    mesh.frustumCulled = false // one object spanning the whole lawn

    const positions: THREE.Vector3[] = new Array(n)
    const quats: THREE.Quaternion[] = new Array(n)
    const baseScales: THREE.Vector3[] = new Array(n)
    const yAxis = new THREE.Vector3(0, 1, 0)

    // vis: current visibility — 1 = full silhouette, 0 = hidden (model mounted).
    const vis = new Float32Array(n).fill(1)
    const target = new Float32Array(n).fill(1)

    const scratchMatrix = new THREE.Matrix4()
    const scratchScale = new THREE.Vector3()

    slots.forEach((slot, i) => {
      positions[i] = new THREE.Vector3(slot.position[0], 0, slot.position[2])
      quats[i] = new THREE.Quaternion().setFromAxisAngle(yAxis, slot.rotationY)
      baseScales[i] = new THREE.Vector3(
        slot.car.collider.width,
        PROXY_Y_SCALE,
        slot.car.collider.length,
      )
    })

    const writeMatrix = (i: number) => {
      scratchScale.copy(baseScales[i]).multiplyScalar(scaleCurve(vis[i]))
      scratchMatrix.compose(positions[i], quats[i], scratchScale)
      mesh.setMatrixAt(i, scratchMatrix)
    }

    const writeColors = () => {
      slots.forEach((slot, i) => mesh.setColorAt(i, proxyColorFor(slot.car)))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }

    const setTargetsFrom = (set: Set<string>) => {
      slots.forEach((slot, i) => {
        target[i] = set.has(slot.car.id) ? 0 : 1
      })
    }

    const tick = (delta: number) => {
      const step = delta / MODEL_FADE_SECONDS
      let changed = false
      for (let i = 0; i < n; i++) {
        if (vis[i] === target[i]) continue
        vis[i] =
          vis[i] < target[i]
            ? Math.min(target[i], vis[i] + step)
            : Math.max(target[i], vis[i] - step)
        writeMatrix(i)
        changed = true
      }
      if (changed) mesh.instanceMatrix.needsUpdate = true
    }

    // Snap to the current mounted set (no fade for the initial hero ring).
    const seed = getMountedSet()
    slots.forEach((slot, i) => {
      const t = seed.has(slot.car.id) ? 0 : 1
      target[i] = t
      vis[i] = t
      writeMatrix(i)
    })
    mesh.instanceMatrix.needsUpdate = true
    writeColors()

    return { mesh, setTargetsFrom, tick }
  }, [])

  useLayoutEffect(() => {
    ctrl.setTargetsFrom(getMountedSet())
    const offMounted = subscribeMounted(() => ctrl.setTargetsFrom(getMountedSet()))
    return () => {
      offMounted()
      ctrl.mesh.dispose() // shared PROXY_GEOMETRY / PROXY_MATERIAL are NOT disposed
    }
  }, [ctrl])

  useFrame((_, delta) => ctrl.tick(delta))

  return <primitive object={ctrl.mesh} />
}
