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
tools/inventario/        ← Python (uv): valida y genera el Excel físico
exports/                 ← Excel de separación por caja (generado)
```

## Uso

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # valida datos + genera dist/

cd tools/inventario
uv run pytest        # pruebas de reglas y de contrato
uv run inventario    # genera exports/Separacion_por_caja.xlsx
```

Para cambiar el contenido de una caja se edita **solo** su JSON. El sitio
y el Excel se regeneran desde ahí, así la página y la caja física nunca
dicen cosas distintas.

## Decisiones técnicas

| Decisión | Por qué |
|---|---|
| Una caja por categoría, proyectos en serie | Acordado con Dislumbra: cada caja debe bastar para todos sus proyectos, uno tras otro. Por eso la regla de inventario es el **máximo** que pide un proyecto, no la suma (`rules.required_qty`). |
| JSON + JSON Schema como contrato | Lo consumen dos lenguajes (Astro y Python). Un esquema neutro evita duplicar el contrato en zod y Pydantic. |
| Astro estático | Páginas rápidas, sin servidor, que funcionan con mala conexión (contexto rural). Vercel lo construye sin configuración. |
| Simulación en Wokwi enlazada | Los proyectos de Arduino ya se validaron en Wokwi (agosto 2026). Energía solar y seguidor de línea no se pueden simular en Wokwi: llevan simulador propio. |
| Excel generado, no editado | Evita que el inventario físico y la página se desincronicen. |
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
