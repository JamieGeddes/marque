import { useAppStore } from '../store/useAppStore'
import { playerControls } from './playerControls'

export function openAimedCar() {
  const { phase, aimedCarId, setSelectedCarId, setPhase } = useAppStore.getState()
  if (phase !== 'walking' || !aimedCarId) return
  setSelectedCarId(aimedCarId)
  // Phase must change before unlock so onUnlock doesn't treat it as a pause.
  setPhase('modal')
  playerControls.unlock()
}
