# Contexto: faltantes del BOM y listados de las cajas

Documento de traspaso para continuar en otro chat del proyecto "Kits INTEP – Asesoría Dislumbra". Corte: sábado 7-nov-2026, 13:10 (Cali).

## Situación
- Jhonatan asesora a Dislumbra SAS en la parte electrónica y de programación de kits STEAM para secundaria (grados 6–9, Colombia).
- **Martes 10-nov**: se llevan al cliente las cajas organizadas de forma profesional. Otra persona arma las cajas; Jhonatan da las sugerencias de organización y cuidado de cada componente.
- **Regla acordada:** una caja por categoría. Lo que trae cada caja debe bastar para hacer **todos** sus proyectos **uno tras otro** (secuencial), con las mismas piezas. No se prestan piezas entre cajas. Por eso, de cada pieza la caja lleva el **máximo** que pide un solo proyecto, no la suma.
- Cajas: **C01** Guardianes de los ecosistemas (3 proyectos) · **C03** Territorios energéticamente resilientes (2) · **C05** Robótica y automatización (4) · **C06** Diseño de software y aplicaciones (4) · **C09** Biotecnología (3). Audiovisuales (cat. 7) está fuera del alcance.
- **Compras:** el lunes 9-nov, con poco tiempo, en tiendas físicas de Cali. Todo lo que se compre debe llegar a una caja donde ya esté esperado, justificado e inventariado, con marca de pendiente.
- Ya hay alguien separando las cajas con el Excel de separación.

## Lo que ya está físicamente en la oficina
- **San Nicolás (cot. 908817):**
  - 5 Arduino UNO con cable y 5 cajas plásticas para UNO.
  - 5 LCD 1602 **sin I2C**.
  - 2 DHT22, 2 BMP180, 6 buzzers BS3 5–15 V y 6 LDR.
  - LED de 5 mm: 100 amarillos y 100 rojos. Los 100 verdes llegaron de **3 mm**.
  - 380 resistencias (19 valores × 20).
  - 150 paquetes de jumpers ×10 (H-H, M-H, M-M).
  - Para la caja de energía: batería 12 V 7 Ah, controlador solar PWM 30 A con 2 USB, inversor Truper de 120 W y multímetro UT33C+.
- **Didácticas Electrónicas I+D (S202767):**
  - **Kit de robótica KIT-RBT-01-RN.** Trae placa compatible con UNO, puente H, 2 motorreductores, HC-SR04, seguidor de línea, sensor IR de obstáculo, sensores de flama y ruido, LDR y servo SG90. **No trae baterías ni portapilas.**
  - **Kit Smart Home Keyes KEY-HOME.** Trae placa compatible con UNO + shield, PIR, LCD 1602, relé, 2 servos, ventilador, HM-10, sensores de gas, suelo y vapor, buzzer pasivo y portapilas de 6 AA **sin pilas**.
- **Vistrónica (4733-26), ya llegó:**
  - 2 sensores de pH DFRobot y 1 BME280 **versión 3.3 V**.
  - 1 módulo SD, 1 servo MG90S, 10 pulsadores B3F y 200 tapas A14 (amarillo, azul, blanco, rojo).
  - 100 LED azules, 100 LED RGB y 80 cables M-H de 20 cm.
- **Compra en la oficina:** 3 módulos MB102 (fuente de protoboard). Falta verificar si trajeron protoboard.

## Cómo se reparte lo que ya hay
- UNO, LCD y caja para UNO: uno para C01, C06 y C09, y dos para C05.
- MB102: una para C01, una para C06 y una para C09. Robótica no la necesita.
- DHT22: uno para C01 y otro para C09. Sensores de pH: uno para C01 y otro para C09. BMP180: los dos a C06.
- Pulsadores: 9 para C06 y 1 para C01.
- Resistencias: 10 para C01, 10 para C09 y el resto (360) para C06.

## Compra del lunes (mejores precios reales, consultados el 7-nov)
Prioridad 1 = sin esto un proyecto no cumple su objetivo; 2 = seguridad o algo prometido en el Excel; 3 = barato y con impacto.

| # | P | Caja | Ítem | Cant | Mejor precio unit. | Opción en Cali |
|---|---|---|---|---|---|---|
| 1 | 1 | C03 | Panel solar 12 V (Excel pide 80 W) | 1 | $120.960 (Emergente, 100 W) | Sunny Future, 50 W $186.000, Calle 8 #45-96 |
| 2 | 1 | C06 | Sensor UV GUVA-S12SD | 2 | $18.900 (Electronilab, quedan 2) | — |
| 3 | 1 | C09 | Relé 5 V 1 canal con optoacoplador | 1 | $4.500 (Zamux) | Innovatronics $7.500 |
| 4 | 1 | C09 | Bombillo 12 V 21 W (1156) + socket | 1 | $19.900 el par (Osram), socket sin precio | Repuestos automotrices |
| 5 | 1 | C09 | Adaptador 12 V 2 A | 1 | $15.900 (Zamux) | Innovatronics $39.000 (5 A) |
| 6 | 1 | C09 | DS18B20 sumergible | 1 | $8.500 (Innovatronics) | Innovatronics |
| 7 | 1 | C09 | Sensor de humedad de suelo capacitivo | 1 | $6.900 (Zamux) | Innovatronics $7.000, pero es **resistivo** |
| 8 | 1 | C05 | Portapilas 2×18650 + 2 celdas + cargador | 1 | $33.200 combinado | Innovatronics, cargador TP4056 |
| 9 | 1 | C05 | Pilas AA | 6 | $2.900 | — |
| 10 | 2 | C01, C05, C06, C09 | Backpack I2C PCF8574 | 5 | $5.900 (Zamux) | Innovatronics $7.000 |
| 11 | 2 | C01 | Conversor de nivel lógico 3.3↔5 V | 1 | $4.500 | — |
| 12 | 2 | C01, C06, C09 | Adaptador 9 V 1 A (para la MB102) | 3 | $11.900 | — |
| 13 | 2 | C01 | microSD 16 GB | 1 | $25.000 | — |
| 14 | 2 | C03 | Portafusible + fusible 10 A | 1 | $2.200 | — |
| 15 | 2 | C03 | Regulador XL4016 | 1 | $27.965 (Sigma) | Innovatronics LM2596 $7.500 (alternativa) |
| 16 | 2 | C03 | Puerto USB hembra | 1 | $1.500 | — |
| 17 | 2 | C03 | Toma 12 V tipo encendedor | 1 | **No encontrado** | Carrera 6 / repuestos automotrices |
| 18 | 2 | C03 | Cable 2×14 AWG (3 m) + terminales | 1 | $16.400 | — |
| 19 | 2 | C05 | Sensor de puerta MC-38 | 1 | $6.900 | — |
| 20 | 3 | C06, C09 | Transistor 2N2222 | 10 | $106 | — |
| 21 | 3 | C05, C06 | Condensador 470 µF 16 V | 4 | $400 | — |
| 22 | 3 | C03 | Carga de prueba 12 V (LED) | 1 | $7.500 | — |
| 23 | 3 | C03 | Pinzas caimán ×10 | 1 | $8.000 | — |
| 24 | 3 | C05 | Cinta negra + cartulina (pista) | 1 | Papelería | — |
| 25 | 3 | C05 | Rueda loca (solo si el kit no la trae) | 1 | $3.900 | — |
| 26 | 3 | C01, C06, C09 | Protoboard 830 (solo si no vino con la MB102) | 3 | $8.000 (Innovatronics) | Innovatronics |

**Totales:** prioridad 1 $265.060 · prioridades 1 y 2 $414.725 · todo $460.785. No incluye envíos.

**Tiendas físicas en Cali:**
- **Innovatronics:** Calle 71C #3A-2N-32, WhatsApp 312 704 1758. Hay que confirmar que atienda al público.
- **Sunny Future (solar):** Calle 8 #45-96.
- **Imperio Electronic:** Cra 6 #15-54.
- **Electrónica San Nicolás:** Cra 6 #16-56.
- **Electrónica Digital:** Cra 6 #15-85.
- **Zona de la Carrera 6 entre Calles 15 y 17:** concentra los locales de electrónica.

Zamux (Bogotá) y Electronilab tienen los mejores precios, pero requieren envío.

## Verificar al abrir (puede cambiar la compra)
1. ¿Las MB102 trajeron protoboard?
2. Puente H del robot: si es L298N, va con 2×18650; si es L9110S, con 4×AA.
3. ¿El robot trae rueda loca?
4. ¿Cuántos sensores trae el seguidor de línea?
5. ¿El buzzer BS3 es activo? (Suena continuo a 5 V.)
6. ¿El LED RGB es de cátodo común?
7. ¿La LCD del Smart Home ya trae I2C?
8. ¿El BMP180 trae regulador?
9. ¿La sonda de pH llegó con su capuchón húmedo?
10. ¿Las tapas A14 encajan en el B3F?

## Decisiones ya tomadas
- **Retirar el relé de estado sólido de 220 V:** ningún proyecto lo usa y es un riesgo para estudiantes. El inversor de 110 V queda como "uso exclusivo del docente" o se retira.
- **Probeta graduada:** retirar (decisión de agosto).
- **C01-P2 Microclimas:** queda BME280 + microSD como dice la propuesta. Por eso se compran la microSD y el conversor de nivel, porque el BME280 que llegó es de 3.3 V.
- **Buzzer del Tablero:** se alimenta con un transistor 2N2222 y una resistencia de 1 kΩ.
- **Tablero:** aviso discreto, igual para todos los botones, con duración parametrizable (modo discreto o demostración).
- **Biotecnología:** se añaden calefactor + relé (incubadora), DS18B20 (temperatura del líquido) y sensor de humedad de suelo (semillas). Ninguno estaba en el Excel.
- **Lo no electrónico lo consigue otra persona:** tubos, vasos, agitadores, bata, Petri, reactivos, semillas, levaduras, icopor, destornilladores y cortador. Los perecederos se entregan aparte de la caja.
- **Correcciones pendientes al Excel original:**
  - El encabezado de C01 dice "Alerta CO2", pero no hay sensor de CO2.
  - Robótica dice Micro:Bit; en realidad es Arduino.
  - El Tablero dice Arduino Mega; en realidad es UNO.
  - El LED verde es de 3 mm, no de 5 mm.

## Sugerencias de empaque
- Una bolsa por ítem con la etiqueta de su código (C06-08…), igual que en el Excel. Módulos y sensores en bolsa antiestática.
- Sonda de pH siempre de pie y con su capuchón húmedo.
- Batería de 12 V cargada, con los bornes tapados y separada de las herramientas. Pilas fuera de los portapilas.
- Sílica gel en cada caja. Reactivos en un empaque a prueba de derrames.
- En la tapa, el inventario con foto y un QR a la página del proyecto.

## Archivos (repo github.com/Jhonatand26/kits-steam-dislumbra, carpeta `exports/`)
- **Faltantes_BOM_Kits_STEAM.xlsx:** compra del lunes con precios reales, inventario contra el Excel original y verificaciones.
- **Separacion_por_caja.xlsx:** una hoja por caja con etiquetas, uso por proyecto, estado y la hoja de Pendientes (55 ítems).
- **precios_reales.csv:** los 79 precios encontrados, con URL.
- La fuente única de las cajas es `data/boxes/c0X.json`. El Excel de separación se regenera con `cd tools/inventario && uv run inventario`.
