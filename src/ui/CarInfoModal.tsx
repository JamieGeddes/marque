import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getCar } from '../data/cars'

function closeModal() {
  const { setSelectedCarId, setPhase } = useAppStore.getState()
  setSelectedCarId(null)
  // Chrome enforces a cooldown before the pointer can re-lock after an
  // Escape exit, so we land on the paused scrim and let the user click.
  setPhase('paused')
}

export function CarInfoModal() {
  const phase = useAppStore((s) => s.phase)
  const selectedCarId = useAppStore((s) => s.selectedCarId)
  const car = getCar(selectedCarId)
  const open = phase === 'modal' && !!car

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open || !car) return null

  const { attribution } = car

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={car.name}>
      <button type="button" className="modal__close" onClick={closeModal} aria-label="Return to showroom">
        ✕
      </button>
      <div className="modal__inner">
        <p className="modal__kicker rise">{car.manufacturer}</p>
        <h2 className="modal__title rise" style={{ animationDelay: '0.08s' }}>
          {car.name}
        </h2>
        <p className="modal__year rise" style={{ animationDelay: '0.16s' }}>
          {car.year}
        </p>

        <div className="modal__columns rise" style={{ animationDelay: '0.24s' }}>
          <section className="modal__description">
            <p className="modal__section-label">The Story</p>
            {car.description.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </section>
          <section>
            <p className="modal__section-label">Specification</p>
            <ul className="specs">
              {car.specs.map((spec) => (
                <li key={spec.label}>
                  <span className="specs__label">{spec.label}</span>
                  <span className="specs__value">{spec.value}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="modal__footer rise" style={{ animationDelay: '0.32s' }}>
          <p>
            3D model: “{attribution.modelTitle}” by{' '}
            <a href={attribution.authorUrl} target="_blank" rel="noreferrer">
              {attribution.author}
            </a>{' '}
            via{' '}
            <a href={attribution.sourceUrl} target="_blank" rel="noreferrer">
              Sketchfab
            </a>
            , licensed under{' '}
            <a href={attribution.licenseUrl} target="_blank" rel="noreferrer">
              {attribution.license}
            </a>
            . Optimised for real-time display.
          </p>
          <p className="modal__footer-mark">Marque — A Virtual Motor Gallery</p>
        </footer>
      </div>
    </div>
  )
}
