import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { getHallCars, CONCOURS_ID } from '../data/halls'
import { useAppStore } from '../store/useAppStore'
import { markLoaded, allLoaded } from '../lib/hallCache'
import { concoursInitialPaths } from './concoursLayout'
import { setRoomDims } from './collision'
import { computeHallLayout } from './layout'
import { Room } from './Room'
import { Lighting } from './Lighting'
import { Player } from './Player'
import { CarExhibit } from './CarExhibit'
import { ConcoursGrounds } from './ConcoursGrounds'
import { InteractionRaycaster } from './InteractionRaycaster'

/**
 * Lives inside the same Suspense boundary as the exhibits, so this effect
 * only commits once every model in the active hall has finished loading.
 */
function HallReadyNotifier() {
  const hallId = useAppStore((s) => s.currentHallId)
  const favourites = useAppStore((s) => s.favourites)

  useEffect(() => {
    if (!hallId) return
    markLoaded(getHallCars(hallId, favourites).map((car) => car.model.path))
    const { phase, setPhase } = useAppStore.getState()
    if (phase === 'hall-loading') setPhase('hall-ready')
  }, [hallId, favourites])

  return null
}

function ActiveHall() {
  const hallId = useAppStore((s) => s.currentHallId)
  const favourites = useAppStore((s) => s.favourites)

  const hallCars = useMemo(() => getHallCars(hallId, favourites), [hallId, favourites])
  const layout = useMemo(() => computeHallLayout(hallCars.length), [hallCars.length])

  // Must land before Player's spawn effect reads ROOM.spawnZ.
  useLayoutEffect(() => {
    setRoomDims(layout.width, layout.depth, layout.spawnZ)
  }, [layout])

  return (
    <>
      <Room width={layout.width} depth={layout.depth} coveLength={layout.coveLength} />
      {hallCars.map((car, i) => (
        <CarExhibit key={`${hallId}:${car.id}`} car={car} slot={layout.slots[i]} />
      ))}
    </>
  )
}

/**
 * Concours streams cars in per-car (no single Suspense boundary), so it can't
 * use HallReadyNotifier. Instead, poll until the hero ring's models have all
 * resolved (each marks itself loaded), then leave the loading gate. A deadline
 * guarantees we never get stuck on it.
 */
function ConcoursReadyNotifier() {
  const heroPaths = useRef<string[]>(concoursInitialPaths())
  const deadline = useRef(0)

  useFrame(() => {
    if (deadline.current === 0) deadline.current = performance.now() + 15000
    const { phase, setPhase } = useAppStore.getState()
    if (phase !== 'hall-loading') return
    if (allLoaded(heroPaths.current) || performance.now() > deadline.current) {
      setPhase('hall-ready')
    }
  })

  return null
}

export function Showroom() {
  const setQuality = useAppStore((s) => s.setQuality)
  const quality = useAppStore((s) => s.quality)
  const currentHallId = useAppStore((s) => s.currentHallId)
  const isConcours = currentHallId === CONCOURS_ID

  return (
    <div className="canvas-root">
      <Canvas
        shadows
        dpr={quality === 'low' ? 1 : [1, 1.75]}
        camera={{ fov: 70, near: 0.1, far: 600, position: [0, 1.65, 7.4] }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0c0c0e']} />
        <PerformanceMonitor onDecline={() => setQuality('low')}>
          <Suspense fallback={null}>
            {isConcours ? (
              <ConcoursGrounds />
            ) : (
              <>
                <Lighting />
                <ActiveHall />
                <HallReadyNotifier />
              </>
            )}
          </Suspense>
          <Player />
          <InteractionRaycaster />
          {isConcours && <ConcoursReadyNotifier />}
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
