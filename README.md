# Kits STEAM · Dislumbra

Página de evidencia y guía de los kits STEAM (Centros de Interés CP 2026):
qué trae cada caja, cómo se arma cada proyecto, cómo se simula y cómo se
comprueba que funciona. Está pensada para personas no técnicas
(comerciales, docentes, rectores) y para estudiantes de grados 6–9.

## Estructura

```text
data/boxes/*.json        ← FUENTE ÚNICA: inventario y proyectos por caja
schema/box.schema.json   ← contrato de datos (JSON Schema)
scripts/validate-data.mjs← valida los JSON antes de cada build
src/lib/boxes.ts         ← única capa de acceso a datos del sitio
src/pages/               ← inicio, caja y proyecto (rutas estáticas)
src/components/          ← resistor, barra de avance, etiqueta de estado
src/sim/                 ← simulador paso a paso (geometría, piezas, Arduino virtual, reproductor)
src/sim/firmware/*.ts    ← lógica de cada proyecto portada del sketch real
data/lessons/*.json      ← lección de cada proyecto: piezas por agujero, cables y pasos
data/parts.json          ← qué es, cómo se conecta y cómo se cuida cada tipo de pieza
firmware/<proyecto>/     ← sketch real que se carga en la placa (y que muestra la página)
tools/inventario/        ← Python (uv): valida y genera el Excel físico
tools/faltantes_build.py ← genera el Excel de faltantes y compra del lunes
exports/                 ← Excel de separación, Excel de faltantes y
                           precios_reales.csv (generados)
```

## Uso

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # valida datos + genera dist/

ARDUINO_CORE=/ruta/ArduinoCore-avr scripts/compile-firmware.sh firmware/c06-p1-tablero

cd tools/inventario
uv run pytest        # pruebas de reglas y de contrato
uv run inventario    # genera exports/Separacion_por_caja.xlsx
uv run python ../faltantes_build.py   # genera exports/Faltantes_BOM_Kits_STEAM.xlsx
```

El script de faltantes usa el entorno de `tools/inventario` (ya trae
`openpyxl`). Lee los precios de `exports/precios_reales.csv`. Una fila de
la compra que se resuelve sin comprar se agrega al conjunto `RESUELTO`
del script: desaparece de la hoja, pero los demás ítems conservan su
número (#N), al que se refieren las cajas y las otras hojas.

Para cambiar el contenido de una caja se edita **solo** su JSON. El sitio
y el Excel se regeneran desde ahí, así la página y la caja física nunca
dicen cosas distintas.

## Decisiones técnicas

| Decisión | Por qué |
|---|---|
| Una caja por categoría, proyectos en serie | Acordado con Dislumbra: cada caja debe bastar para todos sus proyectos, uno tras otro. Por eso la regla de inventario es el **máximo** que pide un proyecto, no la suma (`rules.required_qty`). |
| JSON + JSON Schema como contrato | Lo consumen dos lenguajes (Astro y Python). Un esquema neutro evita duplicar el contrato en zod y Pydantic. |
| Astro estático | Páginas rápidas, sin servidor, que funcionan con mala conexión (contexto rural). Vercel lo construye sin configuración. |
| Simulador propio en SVG, no Wokwi embebido | La página explica el montaje paso a paso (pieza, agujero exacto, cable, código) y luego lo corre. Es liviano, funciona en celulares y en conexiones lentas, y permite mostrar el programa real resaltado por partes. Un 3D (como los ejemplos de referencia) costaría días por proyecto. |
| La lección se describe por agujeros ("e20") | El mismo dato sirve para dibujar, para el texto de cada paso y para que el estudiante replique el montaje físico exactamente igual. |
| Parámetros leídos del sketch | El simulador lee MODO_DEMO, AVISO_MS, etc. del .ino real: placa y página no se pueden desincronizar en esos valores. |
| Simulación en Wokwi enlazada (proyectos aún sin lección) | Los proyectos de Arduino ya se validaron en Wokwi (agosto 2026). Energía solar y seguidor de línea no se pueden simular en Wokwi: llevan simulador propio. |
| Excel generado, no editado | Evita que el inventario físico y la página se desincronicen. |
| Panel de C03 de 20 W (RTM020M), no de 80 W | Ya estaba en Dislumbra. Con el controlador PWM el panel trabaja al voltaje de la batería y entrega su corriente: ~1 A ≈ 0,14C, carga sana para la batería de 7 Ah. Uno de 80 W daría ~4,5 A (0,6C) y la calentaría. Repone ~45–55 Wh por día de sol y cabe en la caja. Ahorro: $120.960. |
| Numeración fija en la compra del lunes | Las cajas y las hojas citan los ítems como "Compra lunes #N". Quitar una fila con `RESUELTO` no renumera las demás. |
| Identidad visual por código de colores | Cada caja se reconoce por un resistor cuyas bandas son su número de categoría (C06 = negro, azul). |
| Separación de rigor | Se dejó el formato pesado del repo EHS-Dislumbra (LaTeX, actas de 14 pruebas) para cumplir la entrega del 10-nov; cada proyecto conserva código, simulación, piezas, armado, fallos y prueba de funcionamiento. |

## Variables de entorno

| Variable | Local | Vercel |
|---|---|---|
| `PUBLIC_SITE_URL` | vacío | `https://<proyecto>.vercel.app` (opcional) |
| `KITS_DATA_DIR` | `data/boxes` (por defecto) | no aplica |
| `KITS_SCHEMA` | `schema/box.schema.json` | no aplica |
| `KITS_INVENTORY_OUT` | `exports/Separacion_por_caja.xlsx` | no aplica |

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
| El monitor serie mostraba todo duplicado | `start()` saltaba al último paso y ese paso volvía a llamar `start()` | Bandera `starting` que evita la doble ejecución |
| `faltantes_build.py` fallaba con `FileNotFoundError` en un clon nuevo | Rutas absolutas fijas a la carpeta de trabajo donde se escribió el script | Rutas relativas al repo con `Path(__file__).resolve().parent.parent / "exports"` |
