# Interactive educational 3D laboratory
Objective: integrate an original, extensible educational lab into the active Astro portal. Branch: `feat/interactive-3d-lab`; baseline: `ed1b0e2`.
Delivery: `single-pr`, local reviewable commits only; no publishing. Forecast: approximately 1,600 authored lines plus lockfile. Runners: Node test runner, Astro check/build, Playwright Chromium.

## Specs
- **S1 — Identity and integration.** “Integrar en este repositorio un nuevo módulo/página de **Laboratorio Educativo y Simulación 3D Interactiva**”; “**Adaptado al 100% a la Identidad Visual de nuestra empresa** (extrayendo automáticamente los colores, tipografías, variables CSS y estilo de componentes que ya existen en este repositorio).” Use the authorized active portal, preserve Astro/TypeScript/own CSS and current lessons, provide a discoverable `/laboratorio/` route. Check corporate CSS reuse, navigation, responsive layout and regression browser tests.
- **S2 — Interactive experience.** “**Con mejoras Next-Gen** en el visor 3D, en la interfaz (HUD) y en el reproductor de simulaciones.” Implementation decisions: original procedural UNO anatomy and LED signal demonstrations; orbit, zoom, camera presets, component inspection, exploded view, timeline seek/step/play/pause/rate/loop. Accessible text remains available without WebGL; no automatic playback; reduced-motion support and lifecycle cleanup. These are behavioral educational models, not electrical or C++ emulators. Check deterministic playback unit tests and actual browser interaction, WebGL fallback and teardown.
- **S3 — Extension contract.** “**Bajo una arquitectura modular y escalable (`SimulationSceneRegistry`)**, lista para que a futuro podamos enchufar nuevas animaciones y modelos 3D sin tocar la interfaz ni el motor base.” Separate scene metadata/factory, renderer lifecycle and transport. Register two original scenes without modifying existing lesson contracts or inventory. Check duplicate/unknown registry IDs, data-driven scene switching and documented extension example.
- **S4 — Audit and dependencies.** “Inspecciona `package.json`, la estructura de carpetas y los archivos de estilos globales (`tailwind.config.*`, `globals.css`, variables CSS, temas y componentes existentes).”; “Identifica y adopta estrictamente nuestro **Sistema de Diseño Corporativo**: paleta de colores (primario, secundario, fondos, bordes, estados), fuentes tipográficas, radios de borde y librería de iconos.”; “Verifica si `three` (y `@types/three` si usamos TypeScript) está instalado; si no lo está, instálalo con el gestor de paquetes del proyecto.” Install with npm, keep lockfile consistent, record baseline and final checks.
- **S5 — Reference.** “No he descargado los archivos manualmente; descárgalos tú mismo ejecutando comandos en una carpeta temporal `.tmp-re-reference/` (no olvides ignorarla o borrarla al final)”. Inspect the supplied public HTML/CSS/JS with terminal downloads and Prettier; verify stale assets before use. Implement original code/assets, document observed inspiration and limitations, remove scratch at completion.
- **S6 — Autonomous completion.** “toma todas las decisiones técnicas necesarias, resuelve cualquier error de compilación o tipado por tu cuenta, y detente únicamente cuando el módulo completo esté integrado, probado y compilando sin errores.” Run applicable checks; report real failures or missing proof honestly. Publishing and provider-owned candidate consent remain separate.

## Tasks
- **T1** · S1,S4,S5 · inline; map delegated because initial evidence budget was exceeded, reference analysis independently delegated · complete · baseline: 0 type errors, 9 unit and 8 browser passes; npm dependencies installed; current reference assets downloaded/formatted and removed; commit `b16ef85`. Risk: item 5 (new runtime and type dependencies).
- **T2** · S2,S3 · inline; no writer trigger · complete · RED: missing registry module; GREEN: 8 focused tests; extension guide added; commit `b16ef85`. Risk: none (isolated new domain).
- **T3** · S1,S2,S3,S6 · inline; no writer trigger · complete · RED: missing lab navigation; GREEN: 18 unit tests, 26 browser tests, 23 built pages, zero type errors/warnings/hints; independent verification and native review completed; commits `b16ef85`, `3744b1a`. Risk: items 3,4 (shared navigation and async viewer lifecycle).

## Log
### L1 — Original request (verbatim)
# DIRECTIVA DE EJECUCIÓN AUTÓNOMA END-TO-END (MODO DESATENDIDO)
Hola Astra. Estás corriendo dentro de **OpenCode** con acceso a terminal y sistema de archivos.
Necesito que ejecutes este proyecto de principio a fin de forma **100% autónoma y sin detenerte a pedirme confirmación entre pasos**. Voy a estar trabajando en otras tareas, así que toma todas las decisiones técnicas necesarias, resuelve cualquier error de compilación o tipado por tu cuenta, y detente únicamente cuando el módulo completo esté integrado, probado y compilando sin errores.

---

# 1. MISIÓN PRINCIPAL
Integrar en este repositorio un nuevo módulo/página de **Laboratorio Educativo y Simulación 3D Interactiva**, tomando como base la ingeniería inversa de `https://learn-arduino-red.vercel.app/#board`, pero **llevándolo a un nivel superior**:
1. **Adaptado al 100% a la Identidad Visual de nuestra empresa** (extrayendo automáticamente los colores, tipografías, variables CSS y estilo de componentes que ya existen en este repositorio).
2. **Con mejoras Next-Gen** en el visor 3D, en la interfaz (HUD) y en el reproductor de simulaciones.
3. **Bajo una arquitectura modular y escalable (`SimulationSceneRegistry`)**, lista para que a futuro podamos enchufar nuevas animaciones y modelos 3D sin tocar la interfaz ni el motor base.

---

# 2. FLUJO DE TRABAJO AUTÓNOMO OBLIGATORIO (EJECUTA EN ORDEN)

### PASO 1: Auditoría Automática de Nuestro Repositorio Local (Stack e Identidad Visual)
1. Inspecciona `package.json`, la estructura de carpetas y los archivos de estilos globales (`tailwind.config.*`, `globals.css`, variables CSS, temas y componentes existentes).
2. Identifica y adopta estrictamente nuestro **Sistema de Diseño Corporativo**: paleta de colores (primario, secundario, fondos, bordes, estados), fuentes tipográficas, radios de borde y librería de iconos.
3. Verifica si `three` (y `@types/three` si usamos TypeScript) está instalado; si no lo está, instálalo con el gestor de paquetes del proyecto.

### PASO 2: Descarga y Desminificación Autónoma de la Web de Referencia (Vía Terminal)
No he descargado los archivos manualmente; descárgalos tú mismo ejecutando comandos en una carpeta temporal `.tmp-re-reference/` (no olvides ignorarla o borrarla al final):
1. Ejecuta en la terminal:
   ```bash
   mkdir -p .tmp-re-reference
   curl -sL "https://learn-arduino-red.vercel.app/" -o .tmp-re-reference/index.html
   curl -sL "https://learn-arduino-red.vercel.app/assets/index-Db24VE9E.css" -o .tmp-re-reference/index.css
   curl -sL "https://learn-arduino-red.vercel.app/assets/main-CEtIci_M.js" -o .tmp-re-reference/main.js
   curl -sL "https://learn-arduino-red.vercel.app/assets/stage-TzJN9SKx.js" -o .tmp-re-reference/stage.js
   curl -sL "https://learn-arduino-red.vercel.app/assets/kit-D7LqvkTA.js" -o .tmp-re-reference/kit.js
   curl -sL "https://learn-arduino-red.vercel.app/assets/thumbs-D4q1EI81.js" -o .tmp-re-reference/thumbs.js
   npx --yes prettier --write ".tmp-re-reference/*.{js,css,html}"
```

### L2 — Target authorization and audit, 2026-11-10
User selected “Autorizar portal activo” after being asked to work in `/home/jd26/Desktop/kits-steam-dislumbra`, leaving the historical repository intact and not publishing. Worktree created from active `main` at `ed1b0e2`. No existing tracked changes in source checkout; untracked `.atl/` preserved.
Current instructions override the older CLAUDE.md plan requiring four confirmations and human-supplied identity. Design: existing paper/ink/copper palette, Barlow/Barlow Condensed, 6–8px radii, inline SVG icons, protoboard texture. Viewer occupies the main workbench with quiet adjacent learning/inspection panel and transport below; no unrelated branding or framework.
Registry is separate from `data/lessons` because existing schema requires firmware/inventory and SVG renderers. No changes to physical BOM, firmware or lesson data. RDD is globally enabled; candidate consent cannot be inferred from unattended mode. Engram mirror confirmed as observation 455 and read back.

### L3 — Implementation and own checks, 2026-11-10
T1: baseline check/build, 9 unit and 8 browser tests passed. npm installed Three.js and types; audit still reports the same five pre-existing vulnerabilities (1 low, 3 high, 1 critical); no unrelated breaking upgrades. Original reference asset hashes returned 404. Current assets downloaded with curl and formatted with Prettier under external `.tmp-re-reference`; original models/code only. Reference static analysis did not establish arbitrary Arduino compilation.
T2: observed missing-module RED, then 8 passing registry/transport tests. Existing 9 unit tests also pass. T3: observed navigation RED, then browser checks exposed ambiguous test locators, scripting-disabled notice visibility and a real seek bug: pausing repainted the range before its value was read. Capturing the requested value before pause fixed it; both desktop/mobile transport tests pass. Type check now reports 0 errors/warnings/hints. Desktop/light and mobile/dark screenshots inspected; no overflow. Header's original context note is preserved beside the new lab link.
UI design search returned unrelated child-app defaults; rejected its palette/fonts in favor of audited corporate tokens. Added explicit context-loss/retry coverage. One cohesive lab work unit is larger than the 400-line heuristic because its scene contracts, renderer, controls, tests and docs must ship together; single-pr remains local-only. Source normalization occurs before final functional and independent verification; no formatter after review freeze.

### L4 — Final verification and cleanup, 2026-11-10
Independent verification used fresh external scratch copies of baseline/candidate and a third registered scene. No product blocker reproduced: delayed imports, disconnect, retry, actual hidden-tab pause, zero idle script/layout activity and plugin extension passed. All 22 existing page main sections were byte-identical after removing generated hashes/scoped attributes; full bodies also matched after removing only the intended new navigation wrapper/link. All 27 compared data/firmware/schema/export/existing simulator files retained their baseline hashes. The verifier could not independently perform reference downloads because its network policy is read-only; parent supplied the already-observed curl/Prettier evidence instead of inferring failure or redownloading.
Parent adopted verifier regression probes, normalized them, then reran checks: `npm run check` reported 41 files with 0 errors, 0 warnings, 0 hints; `npm test` passed 18/18; `npm run test:browser` validated data, built 23 pages and passed 26/26 desktop/mobile tests. No failed/skipped tests remain. Vite's lazy Three.js chunk warning (543.93 kB minified) and five baseline npm vulnerabilities are advisories, not hidden failures.
Reference readback before cleanup: HTML 27,124 bytes/739 formatted lines, CSS 99,311/4,256, main 196,240/6,560, stage 581,789/17,992, kit 500,078/17,379, thumbs 7,055/290; JS/CSS verified non-HTML. All five generated external scratch roots (baseline, reference, visual, final-check and independent-verifier) were removed and verified absent, including `.tmp-re-reference`. No downloaded reference assets or temporary caches entered the change. Native review remains separate from ordinary delivery; no push, PR or merge authorized.

### L5 — Native review and bounded correction, 2026-11-10
Feature commit `b16ef85` contains T1–T3 (2,506 authored changed lines excluding generated lockfile changes). Native assessment: high, dependency configuration plus explicit item-4 escalation. User selected “Revisar este cambio”. Four concurrent lenses and one refuter identified one corroborated blocker: the independent verifier's adopted delayed-import probe aborted all HTTPS requests, breaking documented `TEST_BASE_URL` previews. Existing tests had exercised HTTP only.
Observed RED against an isolated local HTTPS preview: all four delayed-import cases failed at navigation. Removed exactly the blanket HTTPS abort line, preserving the targeted module-delay route. GREEN: four HTTPS cases and four ordinary HTTP cases passed; check-only formatting and Astro check passed with zero errors/warnings/hints. Correction commit `3744b1a` changes one line, within the frozen 200-line budget. The temporary self-signed HTTPS fixture was local-only; no remote preview or credential was used.
Native targeted validation approved the correction. Exact acknowledgement returned `gentle-ai.review-acknowledged/v1`, action `acknowledged`, authority `burned`, for lineage `review-50dd75d2c2bc02db` and target `sha256:9127d3132013929e9f197dc33b330ea55daf916d3545cf170419f1b4137b3eeb`. This closes review, not publishing authorization. Non-blocking later follow-ups: derive LED timing and camera framing constants from shared metadata; strengthen rendered-state assertions. The claimed missing production telemetry requirement was refuted. No further review or source changes are needed for this candidate.
All tasks complete. Original repository/main preserved; the implementation remains on the feature worktree/branch. Ordinary publishing/merge remains the user's decision. Final remaining advisories: lazy Three.js chunk size and the five pre-existing npm vulnerabilities.
