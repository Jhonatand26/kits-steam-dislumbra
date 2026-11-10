# Contexto para Claude Code

Proyecto: página de evidencia y guía de los kits STEAM de Dislumbra SAS
(secundaria, grados 6–9, Colombia). Jhonatan es el asesor en
electrónica y programación; una pedagoga adapta el material.

## Cómo trabajar con Jhonatan

- Quiere aprender sobre la marcha: explica la lógica de cada cambio, no
  solo entregues código.
- Arquitectura con bajo acoplamiento y alta cohesión. Antes de escribir
  un módulo, pregúntate si tiene una sola razón para cambiar.
- Contratos explícitos como código (JSON Schema, Pydantic, tipos TS).
- Nada de URLs, puertos ni credenciales en el código: variables de
  entorno y `.env.example` actualizado.
- Python solo con `uv`. PEP 8 (79 columnas; 72 en docstrings),
  docstrings en todo, imports en 3 grupos, cero warnings, pytest.
- Pruebas: mockear solo efectos externos; cada prueba con una sola
  razón para fallar.
- El README se actualiza durante el trabajo: decisiones técnicas (el
  porqué) y troubleshooting de errores reales.
- Estética cuidada: que la página se vea "chévere".

## Reglas del proyecto

- `data/boxes/*.json` es la FUENTE ÚNICA de cajas, inventario y
  proyectos. La página (`src/lib/boxes.ts`) y los Excel se generan desde
  ahí. No copies datos a mano en otro lugar.
- Una caja por categoría; sus proyectos se hacen uno tras otro con las
  mismas piezas (la caja lleva el máximo que pide un proyecto, no la
  suma). No se prestan piezas entre cajas.
- Cajas: C01 Guardianes de los ecosistemas · C03 Territorios
  energéticamente resilientes · C05 Robótica y automatización · C06
  Diseño de software y aplicaciones · C09 Biotecnología.
- Componentes "conectar y usar": módulos con pines o borneras, pocas
  conexiones, nada que soldar. Los estudiantes deben entender cada pieza.
- El `sketch.ino` del estudiante es corto (~30 líneas), en español y sin
  abstracciones; la complejidad va en archivos de dominio.
- Público de la página: personas no técnicas y estudiantes. Simulaciones
  dentro del portal, paso a paso (piezas, ensamble, conexiones,
  funcionamiento); no se embebe Wokwi.
- Stack de la página: Astro + TypeScript + CSS propio (no cambiarlo).
  Se publica en Vercel desde este repo.

## Estado al 10-nov-2026

- El 10-nov no es una fecha límite rígida. La prioridad es avanzar el
  portal con simulador integrado y material pedagógico mientras se compran
  los componentes del informe. La recepción física no bloquea las lecciones.
- Informe de faltantes en `exports/Informe_Faltantes_Kits_STEAM.pdf`
  (generado con `cd tools/informe && uv run informe` desde
  `data/compras/faltantes.json`). Es la referencia de compra.
- Cambios de "conectar y usar" ya aplicados a las cajas (9-nov):
  seguidor de línea de 3 sensores TCRT5000 (C05-15, 1 und), sonda
  BME280 3,3–5 V (C01-10), módulo buzzer activo (C06-16), reductor USB
  5 V con bornera (C03-08), bombillo 12 V E10 como carga (C03-07),
  conector DC con bornera (C09-24); se retiró la toma de 12 V.
- Verificado al abrir: puente H L298N (va con 2×18650), el kit trae rueda
  loca, buzzer BS3 activo, LED RGB de ÁNODO común según el proveedor
  (falta probarlo), LCD con backpack I2C ya soldado en las 5.

## Pendientes de la página

1. Tablero: experiencia nativa implementada con módulo activo de tres pines,
   RGB configurable, experimentos, registro descargable y guía docente
   imprimible. Pendiente confirmar pinout y polaridades en componentes reales.
2. Reutilizar `schema/lesson.schema.json`, `src/sim/lesson.ts` y
   `LearningGuide.astro` para nuevas experiencias. El simulador es un modelo
   de comportamiento, no un emulador C++ ni un simulador eléctrico.
3. C05-P3 (seguidor): crear lección nativa y firmware para el módulo de
   tres sensores; actualmente no existe una lección nativa que ajustar.
4. C01-P2 (Microclimas): crear lección nativa y firmware para la sonda BME280.
5. Laboratorio 3D interactivo (Three.js) con arquitectura modular de
   registro de escenas, tomando como referencia funcional
   learn-arduino-red.vercel.app con identidad propia; en 4 entregas, con
   confirmación de Jhonatan entre cada una. La identidad visual la
   entrega él.
6. Deuda: `tools/faltantes_build.py` debe leer `faltantes.json` (hoy
   repite precios y quedó desactualizado).

Más detalle: README (decisiones técnicas, troubleshooting, variables de
entorno).
