import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { cars } from '../data/cars'
import { useAppStore } from '../store/useAppStore'
import { Room } from './Room'
import { Lighting } from './Lighting'
import { Player } from './Player'
import { CarExhibit } from './CarExhibit'
import { InteractionRaycaster } from './InteractionRaycaster'

export function Showroom() {
  const setQuality = useAppStore((s) => s.setQuality)
  const quality = useAppStore((s) => s.quality)

  return (
    <div className="canvas-root">
      <Canvas
        dpr={quality === 'low' ? 1 : [1, 1.75]}
        camera={{ fov: 70, near: 0.1, far: 60, position: [0, 1.65, 7.5] }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0c0c0e']} />
        <PerformanceMonitor onDecline={() => setQuality('low')}>
          <Suspense fallback={null}>
            <Lighting />
            <Room />
            {cars.map((car) => (
              <CarExhibit key={car.id} car={car} />
            ))}
          </Suspense>
          <Player />
          <InteractionRaycaster />
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
