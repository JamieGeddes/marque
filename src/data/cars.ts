import { useGLTF } from '@react-three/drei'
import type { CarDefinition } from '../types'

/**
 * The exhibit registry. Adding a car to the showroom:
 *   1. Run its GLB through scripts/optimize-models.sh (normalizes to meters,
 *      grounded at y=0, centered, front facing +Z) into public/models/.
 *   2. Add one entry here (and its credit to ATTRIBUTIONS.md).
 */
export const cars: CarDefinition[] = [
  {
    id: 'porsche-930',
    name: 'Porsche 911 Turbo',
    manufacturer: 'Porsche',
    year: '1975',
    description: [
      'The 930 was Porsche’s answer to a simple question with dangerous implications: what happens when you give the 911 the turbocharging technology proven on the 917/30 Can-Am car? The result was the fastest production car Germany had ever built — and a machine whose abrupt turbo lag and rear-biased weight earned it the nickname “the Widowmaker”.',
      'Beneath the flared arches and the unmistakable whale tail sat a 3.0-litre flat-six breathing through a single KKK turbocharger. Driven well, it devastated far more exotic machinery; driven carelessly, it taught lessons no driving school could. That edge is precisely why the 930 remains one of the most coveted 911s ever made.',
    ],
    specs: [
      { label: 'Engine', value: '3.0-litre turbocharged flat-six' },
      { label: 'Power', value: '260 PS (191 kW) @ 5,500 rpm' },
      { label: 'Torque', value: '343 Nm @ 4,000 rpm' },
      { label: '0–100 km/h', value: '5.5 seconds' },
      { label: 'Top speed', value: '250 km/h' },
      { label: 'Kerb weight', value: '1,140 kg' },
      { label: 'Gearbox', value: '4-speed manual' },
      { label: 'Production', value: '1975–1977 (3.0-litre)' },
    ],
    model: {
      path: '/models/porsche-930.glb',
      position: [-7, 0, -3.4],
      rotationY: 0.5,
      scale: 1,
    },
    collider: { length: 4.3, width: 1.78 },
    pedestal: { position: [-4.2, 0, -1.6], rotationY: 1.2 },
    attribution: {
      modelTitle: 'Porsche 911 (930) Turbo 1975',
      author: 'Lexyc16',
      authorUrl: 'https://sketchfab.com/Lexyc16',
      sourceUrl:
        'https://sketchfab.com/3d-models/porsche-911-930-turbo-1975-de1ffd344c41481892511f7fd332c136',
      license: 'CC Attribution 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
  },
  {
    id: 'mercedes-300sl',
    name: 'Mercedes-Benz 300 SL',
    manufacturer: 'Mercedes-Benz',
    year: '1954',
    description: [
      'When the 300 SL “Gullwing” appeared at the 1954 New York Auto Show, it was the fastest production car in the world — and arguably the most beautiful. Its signature roof-hinged doors were not a flourish but a necessity: the racing-derived spaceframe chassis ran so deep along the sills that conventional doors were impossible.',
      'It was also the first production car with direct fuel injection, lifting its 3.0-litre straight-six to 215 horsepower — nearly double the output of the carburetted racer it descended from. With the long final drive fitted, a Gullwing would run to 260 km/h, a figure that remained scarcely believable for a road car throughout the 1950s.',
    ],
    specs: [
      { label: 'Engine', value: '3.0-litre fuel-injected straight-six' },
      { label: 'Power', value: '215 PS (158 kW) @ 5,800 rpm' },
      { label: 'Torque', value: '275 Nm @ 4,600 rpm' },
      { label: '0–100 km/h', value: 'approx. 9 seconds' },
      { label: 'Top speed', value: 'up to 260 km/h' },
      { label: 'Kerb weight', value: '1,295 kg' },
      { label: 'Gearbox', value: '4-speed manual' },
      { label: 'Production', value: '1954–1957, 1,400 coupés' },
    ],
    model: {
      path: '/models/mercedes-300sl.glb',
      position: [7, 0, -3.4],
      rotationY: -0.5,
      scale: 1,
    },
    collider: { length: 4.52, width: 1.79 },
    pedestal: { position: [4.2, 0, -1.6], rotationY: -1.2 },
    attribution: {
      modelTitle: 'Mercedes-Benz 300sl Gullwing | www.vecarz.com',
      author: 'heynic',
      authorUrl: 'https://sketchfab.com/heynic',
      sourceUrl:
        'https://sketchfab.com/3d-models/mercedes-benz-300sl-gullwing-65edd5814c9842bb9c769388d13fa27f',
      license: 'CC Attribution 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
  },
  {
    id: 'ferrari-f40',
    name: 'Ferrari F40',
    manufacturer: 'Ferrari',
    year: '1987',
    description: [
      'Commissioned to mark Ferrari’s fortieth anniversary, the F40 was the last car personally approved by Enzo Ferrari — and it shows. There is no carpet, no sound deadening, no power steering; the doors are pulled shut with a cable. Every gram served the single ambition of being the fastest road car on earth.',
      'Its 2.9-litre twin-turbo V8 produced 478 horsepower in a body of Kevlar, carbon fibre and aluminium weighing scarcely 1,100 kilograms. The F40 was the first production car to pass 320 km/h, and for many it remains the purest expression of what a supercar should be: savage, analogue, and utterly without compromise.',
    ],
    specs: [
      { label: 'Engine', value: '2.9-litre twin-turbocharged V8' },
      { label: 'Power', value: '478 PS (352 kW) @ 7,000 rpm' },
      { label: 'Torque', value: '577 Nm @ 4,000 rpm' },
      { label: '0–100 km/h', value: '4.1 seconds' },
      { label: 'Top speed', value: '324 km/h' },
      { label: 'Dry weight', value: 'approx. 1,100 kg' },
      { label: 'Gearbox', value: '5-speed manual' },
      { label: 'Production', value: '1987–1992, 1,311 built' },
    ],
    model: {
      path: '/models/ferrari-f40.glb',
      position: [-7, 0, 3.6],
      rotationY: 2.5,
      scale: 1,
    },
    collider: { length: 4.36, width: 1.98 },
    pedestal: { position: [-4.2, 0, 1.7], rotationY: 1.95 },
    attribution: {
      modelTitle: 'Ferrari f40',
      author: 'BlackSnow02',
      authorUrl: 'https://sketchfab.com/BlackSnow02',
      sourceUrl:
        'https://sketchfab.com/3d-models/ferrari-f40-52a66c41cfcd4f999fb1b1c49bf24d70',
      license: 'CC Attribution 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
  },
  {
    id: 'bmw-m3-e30',
    name: 'BMW M3',
    manufacturer: 'BMW',
    year: '1986',
    description: [
      'The first M3 exists because the rules said it had to. To race in Group A touring cars, BMW was required to build five thousand road-going examples — so BMW Motorsport reworked the humble E30 3 Series with box-flared arches, a quicker steering rack, and the S14: a high-revving 2.3-litre four-cylinder with a head derived from the M1’s straight-six.',
      'The homologation gamble produced the most successful touring car of all time, with championship titles across Europe and victories at the Nürburgring and Spa 24 Hours. On the road, its balance and immediacy set a benchmark that every fast saloon since has been measured against.',
    ],
    specs: [
      { label: 'Engine', value: '2.3-litre S14 four-cylinder' },
      { label: 'Power', value: '195 PS (143 kW) @ 6,750 rpm' },
      { label: 'Torque', value: '230 Nm @ 4,750 rpm' },
      { label: '0–100 km/h', value: '6.7 seconds' },
      { label: 'Top speed', value: '235 km/h' },
      { label: 'Kerb weight', value: '1,200 kg' },
      { label: 'Gearbox', value: '5-speed manual' },
      { label: 'Production', value: '1986–1991, approx. 17,970 built' },
    ],
    model: {
      path: '/models/bmw-m3-e30.glb',
      position: [7, 0, 3.6],
      rotationY: -2.5,
      scale: 1,
    },
    collider: { length: 4.36, width: 1.68 },
    pedestal: { position: [4.2, 0, 1.7], rotationY: -1.95 },
    attribution: {
      modelTitle: '[FREE] BMW M3 E30',
      author: 'TinoD2',
      authorUrl: 'https://sketchfab.com/TinoD2',
      sourceUrl:
        'https://sketchfab.com/3d-models/free-bmw-m3-e30-ac3c7013434e403e8faff87948caf422',
      license: 'CC Attribution 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
  },
]

export function getCar(id: string | null): CarDefinition | undefined {
  return cars.find((car) => car.id === id)
}

for (const car of cars) {
  useGLTF.preload(car.model.path, true, true)
}
