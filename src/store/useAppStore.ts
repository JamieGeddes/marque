import { create } from 'zustand'
import { isTouchDevice } from '../hooks/useIsTouchDevice'

export type Phase = 'loading' | 'ready' | 'walking' | 'paused' | 'modal'
export type Quality = 'high' | 'low'

interface AppState {
  phase: Phase
  selectedCarId: string | null
  aimedCarId: string | null
  quality: Quality
  setPhase: (phase: Phase) => void
  setSelectedCarId: (id: string | null) => void
  setAimedCarId: (id: string | null) => void
  setQuality: (quality: Quality) => void
}

export const useAppStore = create<AppState>()((set) => ({
  phase: 'loading',
  selectedCarId: null,
  aimedCarId: null,
  quality: isTouchDevice ? 'low' : 'high',
  setPhase: (phase) => set({ phase }),
  setSelectedCarId: (selectedCarId) => set({ selectedCarId }),
  setAimedCarId: (aimedCarId) => set({ aimedCarId }),
  setQuality: (quality) => set({ quality }),
}))

if (import.meta.env.DEV) {
  // Lets tooling (and headless tests, where pointer lock is unavailable)
  // drive the app phase from the console.
  ;(window as unknown as Record<string, unknown>).__appStore = useAppStore
}
