# Csaba Huszka — corridor study

An interactive gallery prototype for exploring architecture, color, and navigation before adding project exhibits. A 60-metre skylit hall runs left to right, with four galleries opening on its two sides. Built with Next.js, React Three Fiber, Three.js, Drei, and GSAP. Architecture is procedural; no Blender assets are needed for this study.

```sh
npm install
npm run dev
```

Open the local URL printed by Next.js.

## Deployment

- Repository: https://github.com/followthepattern/huszkacsaba.com
- Production: https://huszkacsaba-com.vercel.app
- Vercel project: https://vercel.com/followthepattern-team/huszkacsaba-com

`vercel.json` selects the Next.js framework. To deploy directly from this checkout, run `npx vercel deploy --prod --scope followthepattern-team --project huszkacsaba-com` after signing in with `npx vercel login`. Local Vercel credentials and environment files are ignored by Git.

- **Guided (1):** scroll down to follow the exhibition route along the hall and into all four galleries, in order. The camera follows a curved path through each room before returning to the hall. Scroll up to retrace. Click a room in the menu or floor plan to walk straight there and continue scrolling from that room’s place on the same route. Click visible floor to glide there; scrolling then rejoins the nearest part of the route. Drag to look. Arrow keys and the progress slider also control the tour.
- **Free walk (2):** WASD or arrow keys to move; drag to look. Hold Shift to move faster. On-screen arrows support touch. The room menu remains available.
- On touchscreens in guided mode, swipe vertically to travel and horizontally to look.
- **R:** reset to the left entrance. **M:** toggle the map. **H:** hide/show the interface. **Escape:** close information and restore the interface.

`src/lib/space.ts` defines rooms, collision volumes, destinations, the curved exhibition route, room stops, doorway anchors, and pathfinding. `Architecture.tsx` renders the geometry. `Navigation.tsx` manages the camera and shared navigation. `Museum.tsx` provides the interface.

This is a spatial prototype with sample drawings and CV content; project exhibits, audio, and persisted preferences are still to come. Reduced motion follows the OS preference. Daylight is fixed. Geometry can be replaced with an optimized Blender GLB later.

Checks: `npm test`, `npm run typecheck`, and `npm run build`.

## Visual direction

Space Grotesk provides technical display and interface typography; IBM Plex Mono handles navigation details and small labels. The interface uses deep navy (`#132442`), slate (`#65748b`), cobalt (`#2458e8`), and cool white. Localized unframed pigment paintings add ultramarine, violet, coral, magenta, orange, and yellow while leaving most wall surfaces white.

`src/components/PigmentWalls.tsx` defines the wall-paint placements. All patches share the transparent `public/textures/pigment-study.webp` texture. Asset provenance and the complete ImageGen prompt are in `public/textures/README.md`.

## Drawing room and visitors

`src/content/drawings.ts` defines the three framed sample graphite studies; provenance and prompts are in `public/drawings/README.md`. These are AI-generated examples awaiting the owner's original artwork.

`Visitors.tsx` loads the optimized GLB converted from the user-supplied FBX and shares its geometry across three stationary red visitors. The source proportions are preserved, with a 2.3 m base height and flat shading; the source's forward lean is corrected into a straight standing pose while keeping the feet grounded. Placement and scale live in `VISITORS` in `src/lib/space.ts`; collision volumes account for the imported mesh's dimensions and rotation. The 215 KB asset has about 12,000 triangles. `scripts/prepare-visitor-model.mjs` reproduces the conversion; provenance, processing details, and exact metrics are in `public/models/README.md` and `public/models/gallery-visitor.json`.

## CV / About room

The final gallery is the CV room. Its back wall presents FOLLOWTHEPATTERN and the current CEO/founder role; the side walls show experience, a technical profile, and education. Clicking the wall text or the room's **Read CV** control opens a keyboard-accessible reader. Contact links live in this room, not in the global header.

The CV content lives in `src/content/profile.ts`, transcribed and summarized from the page supplied by the user: https://www.followthepattern.net/hcsaba-godev (read 2026-10-24). Dates labelled Present are preserved as listed; Nu Education has no invented start date. `CVRoom.tsx` draws typography directly into shared wall textures; `CVDialog.tsx` renders the same content as readable HTML. The floor plan initially folds away in this room for readability and restores its prior state when leaving.
