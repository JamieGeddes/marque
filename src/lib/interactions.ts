import { useAppStore } from '../store/useAppStore'
import { playerControls } from './playerControls'
import { getHallCars } from '../data/halls'
import { allLoaded } from './hallCache'

/**
 * Lobby card click. If the hall's models are already in memory we can lock
 * the pointer right away (the click is a fresh user gesture). Otherwise we
 * show the hall-loading screen — mounting the hall suspends on its models —
 * and the user enters with a second click once ready (pointer lock demands
 * a recent gesture, which an async load completion is not).
 */
export function requestEnterHall(hallId: string) {
  const { favourites, setCurrentHallId, setPhase } = useAppStore.getState()
  const hallCars = getHallCars(hallId, favourites)
  setCurrentHallId(hallId)
  if (allLoaded(hallCars.map((car) => car.model.path))) {
    playerControls.lock()
  } else {
    setPhase('hall-loading')
  }
}

export function exitToLobby() {
  const { setPhase, setCurrentHallId, setSelectedCarId } = useAppStore.getState()
  setCurrentHallId(null)
  setSelectedCarId(null)
  // Phase changes first so a pending unlock isn't read as a pause.
  setPhase('lobby')
  playerControls.unlock()
}

export function openAimedCar() {
  const { phase, aimedCarId, setSelectedCarId, setPhase } = useAppStore.getState()
  if (phase !== 'walking' || !aimedCarId) return
  setSelectedCarId(aimedCarId)
  // Phase must change before unlock so onUnlock doesn't treat it as a pause.
  setPhase('modal')
  playerControls.unlock()
}
