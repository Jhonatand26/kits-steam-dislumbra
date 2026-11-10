# Extend the educational 3D laboratory

The `/laboratorio/` page is an independent learning workbench. It preserves the
existing SVG project simulator, inventory and firmware contracts. Two original
procedural scenes introduce UNO anatomy and the relationship between a digital
signal and an LED. Neither scene is an electrical simulator or a C++ emulator.

## Try it

1. Run `npm ci` and `npm run dev`, then follow **Laboratorio 3D** in the header.
2. Choose an experience and activate the viewer. Three.js and scene factories
   load on demand, not on inventory pages or before activation.
3. Select a part in the model or through the equivalent component buttons.
   Use camera presets, zoom, arrow keys and Home without requiring dragging.
4. Play, pause, change speed, seek, step between chapters or repeat the sequence.
   Seeking and stepping use the same deterministic state as playback.
5. **Guía sin visor** provides all chapters without WebGL or JavaScript.

Playback never starts automatically. Reduced-motion preferences do not prevent
an explicitly requested educational animation; no automatic orbit or camera
tweens run. Hiding the document, disconnecting the element or losing WebGL
pauses playback. Camera changes render on demand rather than running an idle loop.

## Architecture

| Module                           | Responsibility                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| `src/lab/contracts.ts`           | Typed scene metadata, component descriptions and resource ownership                 |
| `registry.ts`                    | `SimulationSceneRegistry`: validated IDs, durations, ordered chapters and discovery |
| `playback.ts`                    | Clock-free timeline, speed, loop, seek and step semantics                           |
| `scenes/index.ts`                | Composition root: metadata plus lazy factory registration                           |
| `scenes/model.ts`                | Original reusable procedural geometry and GPU resource disposal                     |
| `scenes/uno.ts`, `scenes/led.ts` | Scene-specific geometry and absolute-time state                                     |
| `viewer.ts`                      | Camera, rendering, picking, resize, on-demand frames and renderer cleanup           |
| `element.ts`                     | DOM adapter, transport controls, scene loading and stale-load cancellation          |
| `SimulationLab.astro`            | Server-rendered shell and accessible static learning content                        |

The viewer knows no scene IDs. The UI is populated from registry metadata. Scene
loads carry a generation token: an old import cannot mount after a newer scene
or an element disconnect. A scene owns its geometry, materials and textures;
the viewer owns its renderer, controls, observers, selection helper and grid.

## Add a scene without editing the engine or interface

1. Create `src/lab/scenes/<name>.ts`, exporting a `SceneFactory` from
   `contracts.ts`. Return a root `Group`, a target map, `update` and `dispose`.
2. Add one `.register({...})` entry to `scenes/index.ts` with a unique slug,
   localized title/summary, positive duration, chapters beginning at zero with
   strictly increasing timestamps below the duration, and component descriptions.
3. Set `load: async () => (await import("./<name>.ts")).createScene`.
   Three.js imports belong in the lazily loaded scene, not in metadata.
4. Match each component ID to an `Object3D` in `targets`; put its ID in
   `object.userData.componentId` so picking and accessible buttons agree.
5. Derive all animation state from the absolute `time` argument. Do not accumulate
   frame deltas inside a model: backward seeking must restore exactly that state.
   Respect `exploded` consistently or document why the model does not expand.
6. Dispose every geometry, material and texture in `dispose()`. A future GLTF
   loader must also dispose resources if loading is cancelled; register its
   asynchronous loading behind the existing factory contract.
7. Add tests for the requested behavior and run the checks below.

No new scene should duplicate box inventory or claim verified hardware. Real
project guides still belong in `data/lessons`, with their stronger firmware,
inventory and SVG validation. The lab is intentionally not added to that schema.

## Identity and accessibility

All UI colors come from the existing `global.css` tokens: paper `#eef3f1`, ink
`#17262b`, secondary paper `#e2eae7`, copper `#a8612a`, line `#c4d3ce` and the
existing semantic accents. Dark mode uses the same existing token overrides.
Barlow and Barlow Condensed, 6–8px panel radii and inline SVG follow the portal.
There is no added framework, icon package, remote model dependency or new font.
WebGL materials are initialized from computed CSS tokens and recreated on theme
changes. Component text is available independently of the graphical selection.

## Verification and troubleshooting

```sh
node --test tests/sim/lab.test.ts
npm run check
npm test
npm run test:browser
```

The browser command also validates data and builds the production site. Existing
desktop/mobile lesson tests must keep passing. Browser coverage includes real
WebGL rendering, component inspection, controls, scene replacement, disconnect
cleanup and educational fallback. `TEST_PORT` and `TEST_BASE_URL` are the existing
test configuration; the laboratory adds no environment variables.

| Symptom                                | Action                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Viewer unavailable or context lost     | Continue using the player/text guide, or retry after restoring WebGL/network access. No automatic retry loop runs.    |
| Missing font while offline             | The portal's existing Google Fonts dependency still applies; system fonts remain the fallback.                        |
| Referenced asset downloads return HTML | Reference hashes changed; discover current assets from the public HTML, verify status/type, and inspect as text only. |

The baseline npm audit already reported five vulnerabilities (one low, three
high, one critical) before Three.js was installed. This feature does not silently
apply breaking dependency upgrades. Audit findings remain separate from passing
build and runtime tests.

## Functional reference and provenance

Public reference: <https://learn-arduino-red.vercel.app/#board>, credited by its
HTML to Dilum Sanjaya. Inspected on 2026-11-10. All five supplied hashed asset
URLs returned 404; current HTML led to `index-D__-jKV9.css`, `main-J0C3NXDX.js`,
`stage-SV6NgviM.js`, `kit-Ce9DQFFx.js` and `thumbs-BJRYQS8w.js`. The current assets
were downloaded with curl and formatted with Prettier in external scratch space.

The reference inspired board inspection, educational chapters and synchronized
signals. Its timed compilation/upload presentation dispatches predefined
behaviors; it is not evidence of an arbitrary Arduino compiler. This laboratory
adds deterministic pause/seek/step controls and preserves non-graphical access.
No reference source, model, texture or copy is distributed in this repository.
The reference's visual appearance and accessibility were not browser-audited.
