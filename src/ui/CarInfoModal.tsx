import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getCar } from '../data/cars'
import { playerControls } from '../lib/playerControls'

function FavouriteButton({ carId }: { carId: string }) {
  const favourites = useAppStore((s) => s.favourites)
  const toggleFavourite = useAppStore((s) => s.toggleFavourite)
  const isFavourite = favourites.includes(carId)

  return (
    <button
      type="button"
      className={`modal__fav${isFavourite ? ' modal__fav--active' : ''}`}
      onClick={() => toggleFavourite(carId)}
      aria-pressed={isFavourite}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d="M12 21s-7.5-4.9-10-9.5C.4 8.5 2 4.5 5.7 4.1 8 3.8 9.9 5 12 7.4 14.1 5 16 3.8 18.3 4.1 22 4.5 23.6 8.5 22 11.5 19.5 16.1 12 21 12 21z"
          fill={isFavourite ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      {isFavourite ? 'In My Showroom' : 'Add to My Showroom'}
    </button>
  )
}

function closeModal() {
  // The modal released the pointer *programmatically* when it opened (not via
  // an Escape exit), so there's no relock cooldown — go straight back to
  // walking. The close is always a user gesture (✕ click or Escape keydown),
  // which satisfies requestPointerLock; onLock then sets phase to 'walking'.
  useAppStore.getState().setSelectedCarId(null)
  playerControls.lock()
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
        <div className="modal__meta rise" style={{ animationDelay: '0.16s' }}>
          <p className="modal__year">{car.year}</p>
          <FavouriteButton carId={car.id} />
        </div>

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
