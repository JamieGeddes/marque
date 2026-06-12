import { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { useAppStore } from '../store/useAppStore'
import { playerControls } from '../lib/playerControls'
import { exitToLobby } from '../lib/interactions'
import { useIsTouchDevice } from '../hooks/useIsTouchDevice'
import { halls, MY_SHOWROOM_ID, getHallTitle } from '../data/halls'
import { getCar } from '../data/cars'

function enterHall(hallId: string) {
  useAppStore.getState().setCurrentHallId(hallId)
  playerControls.lock()
}

function Masthead({ compact }: { compact?: boolean }) {
  return (
    <header className={`masthead${compact ? ' masthead--lobby' : ''}`}>
      <div className="masthead__rule rise" style={{ animationDelay: '0.1s' }} />
      <p className="masthead__kicker rise" style={{ animationDelay: '0.25s' }}>
        Est. MMXXVI
      </p>
      <h1 className="masthead__title rise" style={{ animationDelay: '0.4s' }}>
        MARQUE
      </h1>
      <p className="masthead__sub rise" style={{ animationDelay: '0.6s' }}>
        A Virtual Motor Gallery
      </p>
    </header>
  )
}

function HallCard({
  ordinal,
  title,
  tagline,
  carNames,
  onEnter,
  delay,
}: {
  ordinal: string
  title: string
  tagline: string
  carNames: string[]
  onEnter: () => void
  delay: number
}) {
  return (
    <button
      type="button"
      className="hall-card rise"
      style={{ animationDelay: `${delay}s` }}
      onClick={onEnter}
    >
      <span className="hall-card__ordinal">Hall {ordinal}</span>
      <span className="hall-card__title">{title}</span>
      <span className="hall-card__tagline">{tagline}</span>
      <span className="hall-card__cars">
        {carNames.length} {carNames.length === 1 ? 'car' : 'cars'} — {carNames.join(' · ')}
      </span>
      <span className="hall-card__enter">Enter →</span>
    </button>
  )
}

function Lobby() {
  const isTouch = useIsTouchDevice()
  const favourites = useAppStore((s) => s.favourites)
  const favouriteNames = favourites
    .map((id) => getCar(id)?.name)
    .filter((name): name is string => !!name)

  return (
    <div className="overlay overlay--solid overlay--lobby">
      <Masthead compact />
      <p className="lobby__label rise" style={{ animationDelay: '0.5s' }}>
        Select a hall
      </p>
      <div className="lobby__grid">
        {halls.map((hall, i) => (
          <HallCard
            key={hall.id}
            ordinal={hall.ordinal}
            title={hall.title}
            tagline={hall.tagline}
            carNames={hall.carIds.map((id) => getCar(id)?.name ?? id)}
            onEnter={() => enterHall(hall.id)}
            delay={0.55 + i * 0.12}
          />
        ))}
        {favourites.length > 0 ? (
          <HallCard
            ordinal="♥"
            title="My Showroom"
            tagline="Your private collection"
            carNames={favouriteNames}
            onEnter={() => enterHall(MY_SHOWROOM_ID)}
            delay={0.55 + halls.length * 0.12}
          />
        ) : (
          <div
            className="hall-card hall-card--locked rise"
            style={{ animationDelay: `${0.55 + halls.length * 0.12}s` }}
          >
            <span className="hall-card__ordinal">♥</span>
            <span className="hall-card__title">My Showroom</span>
            <span className="hall-card__tagline">Your private collection</span>
            <span className="hall-card__cars">
              No cars yet — mark favourites ♥ in any car’s details
            </span>
          </div>
        )}
      </div>
      <div className="hints hints--lobby rise" style={{ animationDelay: '0.9s' }}>
        {isTouch ? (
          <>
            <span>
              <kbd>Left thumb</kbd> Walk
            </span>
            <span>
              <kbd>Right thumb</kbd> Look
            </span>
            <span>
              <kbd>Tap</kbd> View details
            </span>
          </>
        ) : (
          <>
            <span>
              <kbd>W A S D</kbd> Walk
            </span>
            <span>
              <kbd>Mouse</kbd> Look
            </span>
            <span>
              <kbd>E</kbd> View details
            </span>
            <span>
              <kbd>Esc</kbd> Pause
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export function IntroOverlay() {
  const isTouch = useIsTouchDevice()
  const phase = useAppStore((s) => s.phase)
  const setPhase = useAppStore((s) => s.setPhase)
  const currentHallId = useAppStore((s) => s.currentHallId)
  const { active, progress, loaded } = useProgress()

  useEffect(() => {
    if (phase !== 'loading') return
    if (!active && loaded > 0) {
      setPhase('lobby')
      return
    }
    // If every asset was cached the loading manager may never go active.
    const fallback = setTimeout(() => {
      if (!useProgress.getState().active) setPhase('lobby')
    }, 2500)
    return () => clearTimeout(fallback)
  }, [phase, active, loaded, setPhase])

  if (phase === 'walking' || phase === 'modal') return null

  if (phase === 'paused') {
    return (
      <div className="overlay overlay--scrim">
        <p className="paused__title rise">Paused</p>
        <p className="paused__hint rise" style={{ animationDelay: '0.1s' }}>
          {getHallTitle(currentHallId)}
        </p>
        <div className="paused__actions rise" style={{ animationDelay: '0.2s' }}>
          <button type="button" className="button" onClick={() => playerControls.lock()}>
            {isTouch ? 'Continue' : 'Continue walking'}
          </button>
          <button type="button" className="button button--ghost" onClick={exitToLobby}>
            Return to lobby
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'lobby') return <Lobby />

  return (
    <div className="overlay overlay--solid">
      <Masthead />
      <div className="intro__footer">
        <div className="progress rise" style={{ animationDelay: '0.8s' }}>
          <div className="progress__track">
            <div className="progress__fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress__label">Preparing the collection — {Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  )
}
