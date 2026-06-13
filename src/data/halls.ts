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
    carIds: ['porsche-930', 'lotus-esprit-v8', 'audi-ur-quattro'],
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
    carIds: [
      'ferrari-599-gto',
      'ferrari-488-pista',
      'ferrari-f8-tributo',
      'ferrari-296-gts',
      'ferrari-12cilindri',
      'ferrari-849-testarossa',
    ],
  },
  {
    id: 'munich-machines',
    ordinal: '07',
    title: 'Munich Machines',
    tagline: 'Five decades of BMW Motorsport, in one room',
    carIds: [
      'bmw-30-csl',
      'bmw-m1',
      'bmw-m3-e30',
      'bmw-m3-e36',
      'bmw-m3-e46',
      'bmw-m3-csl-e46',
      'bmw-m3-gts-e92',
      'bmw-m4-f82',
      'bmw-m4-g82',
      'bmw-m2-g87',
      'bmw-m5-competition',
      'bmw-i8-roadster',
    ],
  },
  {
    id: 'raging-bulls',
    ordinal: '08',
    title: 'Raging Bulls',
    tagline: 'Sant’Agata’s theatre of V10 and V12',
    carIds: ['lamborghini-gallardo', 'lamborghini-aventador'],
  },
  {
    id: 'born-on-the-grid',
    ordinal: '09',
    title: 'Born on the Grid',
    tagline: 'Racing machinery, with and without number plates',
    carIds: ['bac-mono', 'mercedes-amg-one', 'mercedes-slr-mclaren', 'vw-idr', 'vw-w12-concept'],
  },
  {
    id: 'four-rings',
    ordinal: '10',
    title: 'Four Rings',
    tagline: 'Ingolstadt, from Group B to the last of the V10s',
    carIds: ['audi-sport-quattro', 'audi-r8-gt-2011', 'audi-r8-v10-gt', 'audi-rs6-avant-gt'],
  },
  {
    id: 'suzuka-spirit',
    ordinal: '11',
    title: 'Suzuka Spirit',
    tagline: 'Honda’s high-revving heirs of Soichiro',
    carIds: [
      'honda-s800',
      'honda-crx',
      'honda-civic-type-r-ek9',
      'honda-integra-dc2',
      'honda-integra-dc5',
      'honda-civic-type-r-fk2',
      'honda-civic-type-r-fk8',
      'honda-civic-type-r-fl5',
      'honda-nsx-r',
    ],
  },
  {
    id: 'gazoo-gallery',
    ordinal: '12',
    title: 'Gazoo Gallery',
    tagline: 'Toyota and Lexus, tuned for the faithful',
    carIds: [
      'toyota-ae86',
      'toyota-supra-a80',
      'toyota-gr-supra',
      'toyota-gr-yaris',
      'lexus-lfa',
      'lexus-lfa-nurburgring',
    ],
  },
  {
    id: 'midnight-at-la-sarthe',
    ordinal: '13',
    title: 'Midnight at La Sarthe',
    tagline: 'Endurance prototypes that raced the clock itself',
    carIds: ['mazda-787b', 'audi-r15-tdi', 'audi-r18', 'toyota-ts030', 'peugeot-9x8'],
  },
]

/** The favourites hall — its car list is the user's saved collection. */
export const MY_SHOWROOM_ID = 'my-showroom'

/** The outdoor Concours d'Elegance mode — all cars in one streamed scene. */
export const CONCOURS_ID = 'concours'

export function getHall(id: string | null): HallDefinition | undefined {
  return halls.find((hall) => hall.id === id)
}

export function getHallTitle(id: string | null): string {
  if (id === MY_SHOWROOM_ID) return 'My Showroom'
  if (id === CONCOURS_ID) return "Concours d'Elegance"
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
