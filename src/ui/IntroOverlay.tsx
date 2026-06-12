import { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { useAppStore } from '../store/useAppStore'
import { playerControls } from '../lib/playerControls'
import { useIsTouchDevice } from '../hooks/useIsTouchDevice'

function Masthead() {
  return (
    <header className="masthead">
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

export function IntroOverlay() {
  const isTouch = useIsTouchDevice()
  const phase = useAppStore((s) => s.phase)
  const setPhase = useAppStore((s) => s.setPhase)
  const { active, progress, loaded } = useProgress()

  useEffect(() => {
    if (phase !== 'loading') return
    if (!active && loaded > 0) {
      setPhase('ready')
      return
    }
    // If every asset was cached the loading manager may never go active.
    const fallback = setTimeout(() => {
      if (!useProgress.getState().active) setPhase('ready')
    }, 2500)
    return () => clearTimeout(fallback)
  }, [phase, active, loaded, setPhase])

  if (phase === 'walking' || phase === 'modal') return null

  if (phase === 'paused') {
    return (
      <div className="overlay overlay--scrim" onClick={() => playerControls.lock()}>
        <p className="paused__title rise">Paused</p>
        <p className="paused__hint rise" style={{ animationDelay: '0.15s' }}>
          {isTouch ? 'Tap to continue' : 'Click to continue'}
        </p>
      </div>
    )
  }

  return (
    <div className="overlay overlay--solid">
      <Masthead />
      <div className="intro__footer">
        {phase === 'loading' ? (
          <div className="progress rise" style={{ animationDelay: '0.8s' }}>
            <div className="progress__track">
              <div className="progress__fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="progress__label">Preparing the collection — {Math.round(progress)}%</p>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="button rise"
              onClick={() => playerControls.lock()}
            >
              Enter the Showroom
            </button>
            <div className="hints rise" style={{ animationDelay: '0.2s' }}>
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
          </>
        )}
      </div>
    </div>
  )
}
