# Kits STEAM · Dislumbra

Página de evidencia y guía de los kits STEAM (Centros de Interés CP 2026):
qué trae cada caja, cómo se arma cada proyecto, cómo se simula y cómo se
comprueba que funciona. Está pensada para personas no técnicas
(comerciales, docentes, rectores) y para estudiantes de grados 6–9.

**Prioridad actual:** avanzar el portal, el simulador integrado y las guías
pedagógicas con los componentes previstos en el informe de compras. El
10 de noviembre no es una fecha límite rígida: la experiencia virtual puede
usarse mientras se completa la compra y se verifican los componentes físicos.

## Experiencia disponible: Tablero de Convivencia

En `/software-aplicaciones/tablero-convivencia/`:

- Montaje por pasos, inspección de piezas y código con la configuración elegida.
- Pulsadores utilizables con mouse, pantalla táctil o teclado; monitor serie,
  luz, sonido opcional, reinicio y modo demostración.
- LED de ánodo/cátodo común y módulo buzzer activo de tres pines con
  activación alta/baja. El cable común y el programa cambian juntos.
- Tres experimentos para **predecir, probar, observar y explicar**; respuestas
  descargables como texto y guía imprimible con pasos de montaje.
- Orientaciones docentes, tiempos sugeridos, vocabulario y criterios de logro.

Las respuestas se mantienen solo en la página abierta: no se envían ni se
guardan al recargar. El botón de descarga permite conservarlas.

La simulación es un **modelo de comportamiento**, no un emulador de C++ ni
un cálculo eléctrico. La variante del RGB, el orden de pines y la polaridad
de activación del módulo deben comprobarse en el kit recibido. El prototipo
no ofrece anonimato: su color y monitor revelan el tipo de reporte.

## Estructura

```text
data/boxes/*.json        ← FUENTE ÚNICA: inventario y proyectos por caja
schema/*.schema.json    ← contratos de cajas y lecciones (JSON Schema)
scripts/validate-data.mjs← valida contratos, referencias, pines y variantes antes del build
src/lib/boxes.ts         ← única capa de acceso a datos del sitio
src/pages/               ← inicio, caja y proyecto (rutas estáticas)
src/components/          ← resistor, barra de avance, etiqueta de estado
src/sim/                 ← simulador paso a paso (geometría, piezas, Arduino virtual, reproductor)
src/sim/firmware/*.ts    ← lógica de cada proyecto portada del sketch real
data/lessons/*.json      ← montaje, controles, experimentos y guía docente de cada proyecto
data/parts.json          ← qué es, cómo se conecta y cómo se cuida cada tipo de pieza
firmware/<proyecto>/     ← sketch real que se carga en la placa (y que muestra la página)
tools/inventario/        ← Python (uv): valida y genera el Excel físico
tools/faltantes_build.py ← genera el Excel de faltantes y compra del lunes
tools/informe/           ← Python (uv): informe PDF de faltantes (LaTeX)
data/compras/faltantes.json ← contrato del informe: por qué, specs, tiendas, precio
reports/informe-faltantes/  ← plantilla LaTeX, ilustraciones TikZ, fuentes Barlow, fotos/
exports/                 ← Excel de separación, Excel de faltantes y
                           precios_reales.csv (generados)
```

## Uso

Requiere Node.js **22.18 o posterior** (validación y pruebas ejecutan los
módulos TypeScript directamente).

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # valida datos + genera dist/
npm run check        # tipos de TypeScript y componentes Astro
npm test             # parámetros, polaridades, conteos, cancelación y referencias
npx playwright install chromium  # una vez para las pruebas de navegador
npm run test:browser  # compila y prueba escritorio + móvil (también modo oscuro)

arduino-cli core install arduino:avr
arduino-cli compile --fqbn arduino:avr:uno --warnings all firmware/c06-p1-tablero
# Alternativa con el core y avr-gcc instalados manualmente:
ARDUINO_CORE=/ruta/ArduinoCore-avr scripts/compile-firmware.sh firmware/c06-p1-tablero

cd tools/inventario
uv run pytest        # pruebas de reglas y de contrato
uv run inventario    # genera exports/Separacion_por_caja.xlsx
uv run python ../faltantes_build.py   # genera exports/Faltantes_BOM_Kits_STEAM.xlsx
```

Informe PDF de faltantes (requiere XeLaTeX y latexmk):

```sh
cd tools/informe
uv run pytest        # contrato de datos y lógica de totales
uv run informe       # genera exports/Informe_Faltantes_Kits_STEAM.pdf
```

Para poner la foto real de un ítem se guarda como
`reports/informe-faltantes/fotos/<id>.jpg` (por ejemplo `e01.jpg`) y se
vuelve a generar: la ficha usa la foto en lugar de la ilustración.

El script de faltantes usa el entorno de `tools/inventario` (ya trae
`openpyxl`). Lee los precios de `exports/precios_reales.csv`. Una fila de
la compra que se resuelve sin comprar se agrega al conjunto `RESUELTO`
del script: desaparece de la hoja, pero los demás ítems conservan su
número (#N), al que se refieren las cajas y las otras hojas.

Para cambiar el contenido de una caja se edita **solo** su JSON. El sitio
y el Excel se regeneran desde ahí, así la página y la caja física nunca
dicen cosas distintas.

## Añadir una experiencia pedagógica

Usa `data/lessons/c06-p1.json` como referencia. El contrato está en
`schema/lesson.schema.json` y los tipos compartidos en `src/sim/lesson.ts`.

1. Crea el sketch en `firmware/<proyecto>/` y su modelo de comportamiento
   en `src/sim/firmware/`; registra la carga en `src/sim/player.ts`.
2. Describe piezas, cables y pasos. Usa nombres `PIN_*` del sketch en `bind`
   y en extremos como `uno.PIN_BIEN`, en lugar de duplicar números de pin.
3. Declara los controles booleanos, las condiciones `when` de los cables y
   `polarity` de las salidas. El lector acepta constantes literales,
   referencias a constantes anteriores y ternarios simples; rechaza
   expresiones que no comprende, sin ejecutar código del sketch.
4. Completa `pedagogy`: pregunta, objetivos, actividades, evidencias,
   vocabulario y orientación docente. `LearningGuide.astro` genera la guía
   y el registro sin código específico del proyecto.
5. Ejecuta validación, pruebas y revisión en navegador. Comprueba coherencia
   con `uses` del inventario y con las etiquetas del componente físico.

Los cambios de configuración reinician los contadores. Volver a un paso de
montaje detiene el programa; llegar al último paso no lo inicia automáticamente.
La validación revisa todas las combinaciones de controles, las referencias
del montaje, cantidades de piezas y rangos de líneas del código. No prueba
continuidad eléctrica ni equivalencia completa entre C++ y el modelo.

Para las pruebas del navegador, `TEST_PORT` cambia el puerto local de prueba;
`TEST_BASE_URL` apunta a una vista previa ya iniciada. Las capturas y trazas
se guardan en `test-results/` y no se versionan.

## Laboratorio educativo 3D

Desde **Laboratorio 3D** en la navegación se accede a `/laboratorio/`: una mesa
de exploración con dos experiencias originales, anatomía de la UNO y señal
digital/LED. El visor permite girar, acercar, inspeccionar piezas y expandir el
modelo; el reproductor permite pausar, avanzar por pasos, buscar un instante,
cambiar la velocidad y repetir. La guía funciona sin WebGL ni JavaScript.

Three.js se carga al activar el visor, no en las páginas de inventario. El
laboratorio conserva la identidad visual del portal y no sustituye las lecciones
SVG, el firmware ni las instrucciones de montaje físico. No compila Arduino ni
simula corriente eléctrica.

La arquitectura `SimulationSceneRegistry` permite registrar nuevas experiencias
sin cambiar el visor ni la interfaz. Contratos, extensión, procedencia de la
referencia y comprobaciones: [guía del laboratorio](docs/laboratory.md).

## Decisiones técnicas

| Decisión | Por qué |
|---|---|
| Una caja por categoría, proyectos en serie | Acordado con Dislumbra: cada caja debe bastar para todos sus proyectos, uno tras otro. Por eso la regla de inventario es el **máximo** que pide un proyecto, no la suma (`rules.required_qty`). |
| JSON + JSON Schema como contrato | Lo consumen dos lenguajes (Astro y Python). Un esquema neutro evita duplicar el contrato en zod y Pydantic. |
| Astro estático | Páginas rápidas, sin servidor, que funcionan con mala conexión (contexto rural). Vercel lo construye sin configuración. |
| Simulador propio en SVG, no Wokwi embebido | Las lecciones de proyecto explican el montaje paso a paso y luego ejecutan su modelo de comportamiento. Se conserva esta opción liviana; el laboratorio 3D independiente explora conceptos, sin sustituir las guías de montaje. |
| La lección se describe por agujeros ("e20") | El mismo dato sirve para dibujar, para el texto de cada paso y para que el estudiante replique el montaje físico exactamente igual. |
| Parámetros leídos del sketch | Las opciones se aplican antes de resolver AVISO_MS, COLOR_MS y BRILLO. Los pines, el dibujo y el código visible usan la misma configuración; la lógica portada sigue requiriendo pruebas de correspondencia. |
| Simulación en Wokwi enlazada (proyectos aún sin lección) | Los proyectos de Arduino ya se validaron en Wokwi (agosto 2026). Energía solar y seguidor de línea no se pueden simular en Wokwi: llevan simulador propio. |
| Excel generado, no editado | Evita que el inventario físico y la página se desincronicen. |
| Panel de C03 de 20 W (RTM020M), no de 80 W | Ya estaba en Dislumbra. Con el controlador PWM el panel trabaja al voltaje de la batería y entrega su corriente: ~1 A ≈ 0,14C, carga sana para la batería de 7 Ah. Uno de 80 W daría ~4,5 A (0,6C) y la calentaría. Repone ~45–55 Wh por día de sol y cabe en la caja. Ahorro: $120.960. |
| Informe en LaTeX generado desde JSON | El contenido vive en `data/compras/faltantes.json` (validado con Pydantic) y la presentación en `plantilla.tex.j2`. Cambiar un precio no toca LaTeX, y cambiar el diseño no toca datos. Los ítems citan proyectos como `"C09-P3"` y el generador toma los nombres de `data/boxes`, así no se repiten. |
| Jinja con `\VAR{}` y `\BLOCK{}` | Los delimitadores por defecto (`{{ }}`, `{% %}`) chocan con las llaves de LaTeX. Con estos, la plantilla sigue siendo LaTeX legible. |
| Electrónica "conectar y usar" | Criterio del 9-nov: módulos con pines o borneras, pocas conexiones y nada que soldar, para que estudiantes de grados 6–9 entiendan cada pieza. Por eso se cambiaron el conversor de nivel por una sonda BME280 de 5 V, el transistor por un módulo buzzer, el XL4016 + puerto USB por un reductor USB fijo de 5 V (además es más seguro: no se desajusta) y se quitó la toma de 12 V (el controlador ya trae salida de carga). |
| Fotos reales de tienda en el informe | El informe va al cliente como una cotización. Cada ficha usa la foto de la tienda donde se consultó el precio (`fotos/<id>.png`); la ilustración TikZ queda solo como respaldo si falta la foto. |
| Ilustraciones TikZ + QR, fotos opcionales | Desde el entorno de desarrollo no se pueden descargar fotos de las tiendas. Las ilustraciones comparten estilo, el QR lleva a la foto real, y una foto en `fotos/<id>.jpg` reemplaza la ilustración sin tocar código. |
| XeLaTeX con Barlow | Misma tipografía que la página web (identidad visual). Las fuentes van en el repo (licencia OFL) para que compile igual en cualquier equipo. |
| Numeración fija en la compra del lunes | Las cajas y las hojas citan los ítems como "Compra lunes #N". Quitar una fila con `RESUELTO` no renumera las demás. |
| Identidad visual por código de colores | Cada caja se reconoce por un resistor cuyas bandas son su número de categoría (C06 = negro, azul). |
| Portal como experiencia educativa | Este repo es el principal; EHS-Dislumbra queda como archivo histórico. La fecha original del 10-nov no bloquea el desarrollo: el avance se centra en simulación y material pedagógico reutilizable. |

## Variables de entorno

| Variable | Local | Vercel |
|---|---|---|
| `PUBLIC_SITE_URL` | vacío | `https://<proyecto>.vercel.app` (opcional) |
| `KITS_DATA_DIR` | `data/boxes` (por defecto) | no aplica |
| `KITS_SCHEMA` | `schema/box.schema.json` | no aplica |
| `KITS_INVENTORY_OUT` | `exports/Separacion_por_caja.xlsx` | no aplica |
| `KITS_FALTANTES` | `data/compras/faltantes.json` | no aplica |
| `KITS_INFORME_OUT` | `exports/Informe_Faltantes_Kits_STEAM.pdf` | no aplica |

Ver `.env.example`. No hay credenciales en el proyecto.

## Despliegue en Vercel

1. vercel.com/new → importar `Jhonatand26/kits-steam-dislumbra`.
2. Framework: Astro (detectado). Build: `npm run build`. Salida: `dist`.
3. Cada push a `main` publica una versión nueva.

## Troubleshooting (errores reales encontrados)

| Error | Causa | Solución |
|---|---|---|
| Wokwi no devuelve el código por su API pública | El proyecto se sirve con React Server Components; `/api/projects/<id>` solo trae metadatos | Leer los archivos desde la página del proyecto con la sesión abierta |
| `diagram.json` vacío al extraer de Wokwi | Las referencias `$NN` del payload RSC van pegadas sin salto de línea | Buscar cada referencia `NN:T<long>,` por clave, no por línea |
| Didácticas Electrónicas no responde a peticiones automáticas | Protección del sitio | Consultar con navegador o por teléfono |
| Las fuentes se ven distintas en vista previa local sin internet | Google Fonts no carga | Es solo local; en Vercel cargan Barlow y Barlow Condensed |
| `arduino-cli` no se instala en el contenedor | downloads.arduino.cc está bloqueado por la red | `apt install gcc-avr avr-libc` + clonar `arduino/ArduinoCore-avr` desde GitHub y usar `scripts/compile-firmware.sh` |
| El LED RGB del simulador no cambiaba de color | Una regla CSS con `fill` pisa el atributo `fill` del SVG | Cambiar el color con `element.style.fill` |
| El monitor serie mostraba todo duplicado | `start()` saltaba al último paso y ese paso volvía a llamar `start()` | Inicio solo por acción explícita, solicitud cancelable y generación de ejecución para invalidar esperas antiguas |
| Cambiar MODO_DEMO no recalculaba los tiempos del sketch | El lector anterior solo reconocía literales y la fábrica repetía constantes | Resolver ternarios después de aplicar las opciones, con pruebas de tiempos y brillo |
| Un clic o toque breve no generaba un reporte | El navegador podía entregar presión y liberación entre dos lecturas del modelo | Conservar al menos 32 ms de entrada y cancelar liberaciones de ejecuciones anteriores; probado con clic y toque reales del navegador |
| El título de la portada salía sin espacios entre palabras | El nodo TikZ justificaba el texto de 40 pt en un ancho fijo | `\raggedright` dentro del nodo y `\spaceskip` explícito |
| `Missing character: ↔` en el log de XeLaTeX | Barlow no tiene la flecha doble | Escribir "3,3 V – 5 V" en los datos; en ilustraciones usar `$\leftrightarrow$` (fuente matemática) |
| URLs larguísimas desbordaban el anexo | `\url` no corta en cualquier carácter | Paquete `xurl` |
| No se pudieron leer precios de MercadoLibre ni descargar imágenes | MercadoLibre bloquea lectores automáticos (`robots`) y la red del entorno solo permite GitHub y registros de paquetes | Precios de tiendas con página consultable; Barlow vía npm (`@expo-google-fonts/barlow`) |
| No se podían bajar fotos desde el entorno de desarrollo | La red del entorno solo permite GitHub y los registros de paquetes | Se abrió cada tienda en el navegador del computador de Jhonatan y se capturaron las fotos en una cuadrícula; luego se recortaron con Pillow |
| `fetch` de imágenes fallaba con `TypeError: Failed to fetch` | La CDN de la tienda (p. ej. jumpseller de Zamux) no envía cabeceras CORS para otros orígenes | Abrir la CDN como página y hacer `fetch` desde su mismo origen, o mostrar la imagen con `<img>` (no necesita CORS) y capturarla |
| Las descargas del navegador quedaban como `.org.chromium.Chromium.*` y desaparecían | El navegador bloquea las descargas automáticas múltiples y las cancela al navegar | No depender de descargas: capturas de pantalla |
| `faltantes_build.py` fallaba con `FileNotFoundError` en un clon nuevo | Rutas absolutas fijas a la carpeta de trabajo donde se escribió el script | Rutas relativas al repo con `Path(__file__).resolve().parent.parent / "exports"` |

## Deuda técnica conocida

- `tools/faltantes_build.py` (Excel de la compra del lunes) y
  `data/compras/faltantes.json` (informe PDF) repiten precios y tiendas.
  Desde el 9-nov el Excel quedó desactualizado (no tiene los cambios de
  "conectar y usar"): la referencia de compra es el PDF.
  El siguiente paso es que el script del Excel lea el JSON, para que
  haya una sola fuente de precios.
- Replicar la estructura pedagógica del Tablero en los siguientes proyectos.
  C05-P3 y C01-P2 aún necesitan su lección nativa, sketch y modelo de comportamiento.
- El script del Excel enlaza filas con precios por número de fila
  (`_map`); con la fuente única desaparece.
