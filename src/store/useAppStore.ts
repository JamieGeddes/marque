import { create } from 'zustand'
import { isTouchDevice } from '../hooks/useIsTouchDevice'
import { cars } from '../data/cars'

export type Phase = 'loading' | 'lobby' | 'walking' | 'paused' | 'modal'
export type Quality = 'high' | 'low'

const FAVOURITES_KEY = 'marque:favourites'

function loadFavourites(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(FAVOURITES_KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    // Drop ids of cars that no longer exist in the registry.
    return raw.filter((id): id is string => typeof id === 'string' && cars.some((c) => c.id === id))
  } catch {
    return []
  }
}

function saveFavourites(favourites: string[]) {
  try {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites))
  } catch {
    // Storage may be unavailable (private mode); favourites stay in-memory.
  }
}

interface AppState {
  phase: Phase
  currentHallId: string | null
  selectedCarId: string | null
  aimedCarId: string | null
  quality: Quality
  favourites: string[]
  setPhase: (phase: Phase) => void
  setCurrentHallId: (id: string | null) => void
  setSelectedCarId: (id: string | null) => void
  setAimedCarId: (id: string | null) => void
  setQuality: (quality: Quality) => void
  toggleFavourite: (carId: string) => void
}

export const useAppStore = create<AppState>()((set) => ({
  phase: 'loading',
  currentHallId: null,
  selectedCarId: null,
  aimedCarId: null,
  quality: isTouchDevice ? 'low' : 'high',
  favourites: loadFavourites(),
  setPhase: (phase) => set({ phase }),
  setCurrentHallId: (currentHallId) => set({ currentHallId }),
  setSelectedCarId: (selectedCarId) => set({ selectedCarId }),
  setAimedCarId: (aimedCarId) => set({ aimedCarId }),
  setQuality: (quality) => set({ quality }),
  toggleFavourite: (carId) =>
    set((state) => {
      const favourites = state.favourites.includes(carId)
        ? state.favourites.filter((id) => id !== carId)
        : [...state.favourites, carId]
      saveFavourites(favourites)
      return { favourites }
    }),
}))

if (import.meta.env.DEV) {
  // Lets tooling (and headless tests, where pointer lock is unavailable)
  // drive the app phase from the console.
  ;(window as unknown as Record<string, unknown>).__appStore = useAppStore
}
