# Marque — A Virtual Motor Gallery

A first-person 3D car showroom for the browser. Walk among a small collection
of icons, circle each car at eye level, and read its story at the pedestal
beside it.

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

3. Add one `CarDefinition` entry in `src/data/cars.ts` (placement, collider
   footprint, pedestal position, story, spec sheet, attribution) and a row to
   `ATTRIBUTIONS.md`. Set `model.rotationY` after checking the facing
   direction in the dev console (`[CarModel]` logs each model's dimensions).

## Licensing

Code is yours to do with as you like. Third-party assets (car models, HDRI,
fonts) carry their own free licenses — see `ATTRIBUTIONS.md`. Models of real
cars: the digital asset license does not cover manufacturer trademarks or
vehicle design rights, which matters only if this is commercialised.
