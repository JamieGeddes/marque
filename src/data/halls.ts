import type { CarDefinition, HallDefinition } from '../types'
import { cars, getCar } from './cars'

/**
 * Themed halls shown in the lobby. A car may appear in exactly one themed
 * hall here and additionally in My Showroom when favourited — placement
 * inside a hall is computed per hall (see scene/layout.ts), never stored
 * on the car.
 */
export const halls: HallDefinition[] = [
  {
    id: 'modern-classics',
    ordinal: '01',
    title: 'Modern Classics',
    tagline: 'Driver’s machines that defined their decades',
    carIds: ['porsche-930', 'bmw-m3-e30', 'lotus-esprit-v8'],
  },
  {
    id: 'legends',
    ordinal: '02',
    title: 'Legends',
    tagline: 'The cars history refuses to forget',
    carIds: ['ferrari-250-gto', 'mercedes-300sl', 'ferrari-f40', 'porsche-959'],
  },
  {
    id: 'lotus',
    ordinal: '03',
    title: 'The Lotus Collection',
    tagline: 'Simplify, then add lightness',
    carIds: [
      'lotus-elise-sprint',
      'lotus-exige-s-2006',
      'lotus-exige-360-cup',
      'lotus-evora-gt430',
      'lotus-3-eleven',
      'lotus-emira',
    ],
  },
  {
    id: 'porsche-motorsport',
    ordinal: '04',
    title: 'Weissach Express',
    tagline: 'Porsche’s GT department, unleashed on the road',
    carIds: ['porsche-gt3-992', 'porsche-gt3-rs-992', 'porsche-911-dakar', 'porsche-carrera-gt'],
  },
  {
    id: 'maranello-halos',
    ordinal: '05',
    title: 'Maranello Halos',
    tagline: 'Forty years of Ferrari’s ultimate machines',
    carIds: [
      'ferrari-f50',
      'ferrari-enzo',
      'ferrari-laferrari',
      'ferrari-monza-sp2',
      'ferrari-sf90-xx',
    ],
  },
  {
    id: 'modern-maranello',
    ordinal: '06',
    title: 'Modern Maranello',
    tagline: 'The contemporary face of the Prancing Horse',
    carIds: ['ferrari-599-gto', 'ferrari-488-pista', 'ferrari-f8-tributo', 'ferrari-12cilindri'],
  },
]

/** The favourites hall — its car list is the user's saved collection. */
export const MY_SHOWROOM_ID = 'my-showroom'

export function getHall(id: string | null): HallDefinition | undefined {
  return halls.find((hall) => hall.id === id)
}

export function getHallTitle(id: string | null): string {
  if (id === MY_SHOWROOM_ID) return 'My Showroom'
  return getHall(id)?.title ?? ''
}

/** Resolve the cars on display for a hall (favourites hall included). */
export function getHallCars(hallId: string | null, favourites: string[]): CarDefinition[] {
  if (hallId === MY_SHOWROOM_ID) {
    return favourites.map((id) => getCar(id)).filter((car): car is CarDefinition => !!car)
  }
  const hall = getHall(hallId)
  if (!hall) return []
  return hall.carIds.map((id) => getCar(id)).filter((car): car is CarDefinition => !!car)
}

if (import.meta.env.DEV) {
  // Catch typos: every hall carId must exist, and no car may be in two halls.
  const seen = new Set<string>()
  for (const hall of halls) {
    for (const id of hall.carIds) {
      if (!cars.some((car) => car.id === id)) console.warn(`[halls] unknown car id: ${id}`)
      if (seen.has(id)) console.warn(`[halls] car in multiple halls: ${id}`)
      seen.add(id)
    }
  }
}
