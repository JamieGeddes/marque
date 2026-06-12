import { useAppStore } from '../store/useAppStore'
import { getCar } from '../data/cars'
import { openAimedCar } from '../lib/interactions'
import { useIsTouchDevice } from '../hooks/useIsTouchDevice'

export function Hud() {
  const isTouch = useIsTouchDevice()
  const phase = useAppStore((s) => s.phase)
  const aimedCarId = useAppStore((s) => s.aimedCarId)
  const setPhase = useAppStore((s) => s.setPhase)
  if (phase !== 'walking') return null

  const aimedCar = getCar(aimedCarId)

  return (
    <div className="hud">
      <div className={`crosshair${aimedCar ? ' crosshair--aimed' : ''}`}>
        <div className="crosshair__dot" />
        <div className="crosshair__ring" />
      </div>
      {aimedCar &&
        (isTouch ? (
          <button type="button" className="hud__hint hud__cta" onClick={openAimedCar}>
            <span className="hud__hint-name">{aimedCar.name}</span>
            <span className="hud__hint-action">Tap to view details</span>
          </button>
        ) : (
          <div className="hud__hint">
            <p className="hud__hint-name">{aimedCar.name}</p>
            <p className="hud__hint-action">Click or press E to view details</p>
          </div>
        ))}
      {isTouch && (
        <button
          type="button"
          className="hud__pause"
          aria-label="Pause"
          onClick={() => setPhase('paused')}
        >
          ❚❚
        </button>
      )}
    </div>
  )
}
