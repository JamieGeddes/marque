# Marque — A Virtual Motor Gallery

A first-person 3D car showroom for the browser. Choose a themed hall from the
lobby, walk among the cars, circle each one at eye level, and read its story
at the pedestal beside it. Mark favourites (♥ in a car's details) to build
your own hall — My Showroom — persisted in the browser's local storage.

Or enter the **Concours d'Elegance**: the whole collection arranged outdoors
on the lawns and driveway of an English country house under a clear sky. The
cars stream in by proximity as you walk, so only the part of the grounds
around you is ever loaded. Same controls; **L** (or the pause screen) returns
to the lobby.

Built with React 19, TypeScript, Vite, three.js via @react-three/fiber and
@react-three/drei.

## Run

```sh
npm install
npm run dev      # development server
npm run build    # typecheck + production build into dist/
```

Desktop is the primary target: **WASD** to walk, **mouse** to look,
**E or click** at a pedestal for details, **Esc** to pause.

## Adding a car to the collection

1. Download a freely-licensed model (CC0 / CC-BY / CC-BY-SA) — see
   `ATTRIBUTIONS.md` for the current sources. Save the raw files and the
   license text under `assets-src/<car-id>/`.
2. Normalize + compress it (meters, grounded, meshopt + webp):

   ```sh
   scripts/optimize-models.sh assets-src/<car-id>/scene.gltf <car-id> <real-length-m>
   ```

3. Add one `CarDefinition` entry in `src/data/cars.ts` (collider footprint,
   story, spec sheet, attribution) and a row to `ATTRIBUTIONS.md`. If the
   model's nose ends up facing the wrong way, re-run the script with a
   `rotate-y-degrees` value (the `[CarModel]` dev log prints dimensions).
4. Assign the car to a hall in `src/data/halls.ts` (or create a new hall —
   one entry with id, title, tagline and carIds). Placement inside a hall is
   computed automatically; rooms grow with the collection.

## Licensing

Code is yours to do with as you like. Third-party assets (car models, HDRI,
fonts) carry their own free licenses — see `ATTRIBUTIONS.md`. Models of real
cars: the digital asset license does not cover manufacturer trademarks or
vehicle design rights, which matters only if this is commercialised.
