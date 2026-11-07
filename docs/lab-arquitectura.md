# Laboratorio 3D · Entrega 1: evidencia y arquitectura

Estado: propuesta para revisión (rama `feat/lab-3d`). Contratos en
`src/lab/core/contracts.ts`.

## 1. Evidencia extraída de la referencia

Se estudió el comportamiento de learn-arduino-red.vercel.app (bundles
`main`, `stage`, `kit`, `thumbs`, `index.css`). Es ingeniería inversa de
ideas y arquitectura: **no se copia código, geometría ni estilos**. Todo
se reescribe desde cero en nuestro stack.

| Aspecto | Qué hace la referencia | Qué tomamos |
|---|---|---|
| Definición de lecciones | 16 objetos declarativos: `id`, `heading`, `lede`, `features`, `pinout`, `example` (explicación por línea), `specs`, `params` (controles `range`/`toggle` atados a una pieza), `code`, `callouts` anclados a puntos 3D, y `sim` (clave de simulación) | El HUD 100 % dirigido por datos. Nuestro equivalente: `InteractiveSceneConfig` |
| Simulación | **No interpreta C++**. Una fábrica `sim(nombre, ctx)` devuelve `{update(t), stop()}` escrita a mano por lección; el resaltado de código es una línea de tiempo `[fragmento, línea, ms]` | Mejoramos: cada proyecto ya tiene su programa portado (`SimulationModule`) que corre sobre un Arduino virtual; el resaltado sale de los pasos y de la ejecución, no de un guion aparte |
| Arranque | Simula "Compilando… / Subiendo…" con parpadeo de los LED TX/RX antes de correr | Sí, es pedagógico y barato |
| Render | `requestAnimationFrame` con bandera *dirty*: solo dibuja cuando algo cambió; sombras recalculadas a demanda | Sí: clave para portátiles y celulares de colegio |
| Animación | Gestor de *tweens* propio con *easing* y un factor de velocidad (movimiento reducido → casi instantáneo) | Sí, sin GSAP (una dependencia menos) |
| Cámara | Rig propio, no OrbitControls: estado `{target, azimut, elevación, zoom}`, cámara ortográfica, inercia al soltar, límites del target en XZ, WASD/flechas para paneo, Q/E para rotar, rueda con zoom al cursor, pinza táctil | Sí, mismo modelo de estado; `flyTo(view)` interpolado para hotspots y pasos |
| Selección | `Raycaster` limitado a la capa 0 (sombras y decoración en otras capas). La pieza bajo el cursor cambia su emisivo (guarda el original y lo restaura) | Sí, más atenuar las piezas no enfocadas en cada paso (ya existe en 2D) |
| Interacción directa | Manejadores *grab* por pieza (arrastrar perillas, oprimir botones) que capturan el puntero | Sí: `PartInstance.grab` |
| LED | Lente con emisivo + halo con opacidad + tono interpolado | Sí |
| Estilo | `MeshToonMaterial` + contorno de tinta; geometría procedural (sin modelos GLTF); `InstancedMesh` para agujeros y pines; miniaturas renderizadas fuera de pantalla a PNG | Sí a procedural + instancias. El estilo visual será el nuestro |
| HUD | Barra lateral, lienzo, barra de vista, llamadas con líneas guía proyectadas cada cuadro, etiquetas, lectura de valores, minimapa, inspector con pestañas, vista esquemática, consola redimensionable, tarjeta de código con Ejecutar, tira de lecciones. Los eventos sobre el HUD no mueven la cámara | Misma ergonomía, componentes propios |
| Sin WebGL | Muestra "Vista 3D no disponible" | Nosotros caemos a la **vista 2D** ya construida: el colegio nunca se queda sin simulación |

## 2. Principios

1. **Una sola capa de comunicación.** HUD y motor 3D nunca se llaman
   entre sí: ambos leen y escriben un `LabStore` (estado observable). Solo
   `LabApp.ts` conoce a todos.
2. **Una razón para cambiar por módulo** (tabla de la sección 4).
3. **La escena es datos.** Agregar un proyecto = un archivo en
   `src/lab/scenes/` + su `SimulationModule`. Cero cambios en HUD, cámara
   o motor.
4. **Un montaje, dos vistas.** Piezas por agujero (`bb.e20`): la vista 2D
   (SVG actual) y la 3D leen la misma `assembly`. El estudiante replica en
   la mesa exactamente lo que ve.
5. **El código mostrado es el real.** El sketch se lee de `firmware/` en
   build; los parámetros (MODO_DEMO…) también.

## 3. Flujo

```text
 scenes/c06-p1.ts ──► SceneRegistry ──► LabApp (raíz de composición)
                                          │
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
                 LabStore  ◄──────►  Engine 3D (Three)     HUD (DOM)
             (paso, selección,      Stage · CameraRig      Inspector · Hotspots
              vista, sim, params)   Picker · Highlighter   Pasos · Consola
                     ▲              Part factories         Controles · Vista 2D
                     │                    ▲
                SimRunner ──► Arduino virtual (runtime) ──► PinReader
                (SimulationModule del proyecto)
```

## 4. Estructura de carpetas

```text
src/lab/
  core/                 sin Three ni DOM
    contracts.ts        InteractiveSceneConfig, Hotspot, PartPlacement…
    registry.ts         registro de escenas (import.meta.glob de scenes/)
    store.ts            estado observable + acciones (única comunicación)
    tween.ts            interpolación con easing y velocidad global
  engine/               Three.js, sin DOM de UI
    Stage.ts            renderer, escena, luces, bucle con bandera dirty
    CameraRig.ts        órbita/paneo/zoom, inercia, límites, flyTo()
    Picker.ts           raycast → hover/selección en el store
    Highlighter.ts      emisivo, atenuar no enfocadas, contorno
    materials.ts        materiales generados desde los design tokens
    layout3d.ts         agujero/pin → Vec3 (equivalente 3D de geometry.ts)
  parts/                una fábrica por tipo de pieza (procedural)
    index.ts            registro PartKind → fábrica
    arduino-uno.ts  breadboard.ts  rgb-led.ts  button.ts  buzzer.ts
    resistor.ts  npn.ts  wire.ts  (lcd1602, dht22, servo… al llegar)
  sim/                  se mueve aquí desde src/sim (ya existe)
    runtime.ts          Arduino virtual (Board)
    runner.ts           ciclo setup/loop, arranque "compilar/subir"
    firmware/*.ts       programa de cada proyecto
  hud/                  componentes DOM, solo leen/escriben el store
    LabShell.ts  Inspector.ts  HotspotBar.ts  StepStrip.ts
    ViewSwitch.ts  RunControls.ts  ParamControls.ts  Console.ts  CameraHint.ts
  schematic/            vista 2D actual (SVG), también respaldo sin WebGL
  scenes/               UN archivo por proyecto
    c06-p1.ts
  LabApp.ts             raíz de composición
src/components/Lab.astro   isla que monta <kit-lab scene="C06-P1">
```

| Módulo | Su única razón para cambiar |
|---|---|
| `core/contracts` | Cambia lo que una escena puede declarar |
| `core/store` | Cambia el estado compartido de la interfaz |
| `engine/CameraRig` | Cambia cómo se navega la cámara |
| `engine/Picker` / `Highlighter` | Cambia cómo se selecciona / resalta |
| `parts/<tipo>` | Cambia el aspecto o la interacción de ese tipo de pieza |
| `sim/runtime` | Cambia el comportamiento del Arduino virtual |
| `sim/firmware/<proyecto>` | Cambia el programa de ese proyecto |
| `hud/<componente>` | Cambia ese panel |
| `scenes/<proyecto>` | Cambia el contenido pedagógico de ese proyecto |

## 5. Stack

- Astro 5 estático + TypeScript estricto + CSS con tokens (sin React ni
  Tailwind: el sitio ya está así y no lo necesita).
- `three` (npm, versión fijada). Sin GSAP ni OrbitControls: rig y tweens
  propios, pequeños y probables.
- El JS 3D se carga solo en páginas de proyecto y solo al entrar el
  laboratorio en pantalla.

## 6. Rendimiento y accesibilidad

- `pixelRatio` máx. 1.5, sombras a demanda, instancias para agujeros
  (≈ 800 por protoboard), render solo cuando hay cambios.
- Sin WebGL o con "reducir movimiento": vista 2D y transiciones cortas.
- Todo lo seleccionable en 3D también se puede elegir desde el HUD con
  teclado (píldoras y lista de piezas).

## 7. Riesgo de plazo

Un 3D de calidad cuesta del orden de 1 día de piezas nuevas + medio día
por escena. Para el martes es realista: motor + HUD + C06-P1 en 3D, y los
demás proyectos visibles en la vista 2D con la misma lección, pasando a
3D a medida que se completen sus piezas.
