"""Build the gap-analysis workbook for the Dislumbra STEAM kits."""
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule

EXPORTS = Path(__file__).resolve().parent.parent / "exports"
# Filas de Compra lunes ya resueltas sin comprar. Se conserva la
# numeración original para no romper las referencias "#N".
RESUELTO = {
    1,   # Panel: RTM020M 20 W de Dislumbra (7-nov)
    10,  # Backpack I2C: comprados y soldados a las 5 LCD (7-nov)
}

F = "Arial"
HDR = PatternFill("solid", fgColor="1F4E5F")
BOX = PatternFill("solid", fgColor="D9EAF0")
YEL = PatternFill("solid", fgColor="FFF2CC")
thin = Side(style="thin", color="BFBFBF")
B = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(wrap_text=True, vertical="top")

def header(ws, row, cols, widths):
    for i, (c, w) in enumerate(zip(cols, widths), 1):
        cell = ws.cell(row=row, column=i, value=c)
        cell.font = Font(name=F, bold=True, color="FFFFFF", size=10)
        cell.fill = HDR
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        cell.border = B
        ws.column_dimensions[cell.column_letter].width = w
    ws.freeze_panes = ws.cell(row=row + 1, column=1)

def put(ws, r, vals, blue_cols=(), fill_cols=()):
    for i, v in enumerate(vals, 1):
        c = ws.cell(row=r, column=i, value=v)
        c.font = Font(name=F, size=10, color="0000FF" if i in blue_cols else "000000")
        c.alignment = wrap
        c.border = B
        if i in fill_cols:
            c.fill = YEL

wb = Workbook()

# ---------------- Leeme ----------------
ws = wb.active
ws.title = "Leeme"
ws.column_dimensions["A"].width = 110
lines = [
    ("Kits STEAM Dislumbra · Faltantes del BOM y compra del lunes 9-nov-2026", True),
    ("Cruce: KITS Y SUS COMPONENTES VF.xlsx  ×  Propuesta técnica (objetivos)  ×  compras en mano: Comprados (San Nicolás 908817), Comprados2 (I+D S202767), Vistrónica 4733-26, y 3 MB102 compradas en la oficina.", False),
    ("Criterio: una caja por categoría; sus componentes deben bastar para hacer TODOS los proyectos de la categoría uno tras otro (secuencial). No se prestan piezas entre cajas. Audiovisuales (cat. 7) fuera del alcance.", False),
    ("", False),
    ("Hojas", True),
    ("Compra lunes · lista priorizada para el centro de Cali. Prioridad 1 = sin esto un proyecto NO cumple su objetivo; 2 = necesario para seguridad o para cumplir lo prometido en el Excel; 3 = recomendado, barato y con impacto.", False),
    ("Inventario por caja · cada línea del Excel original con su estado real (en mano / falta / retirar / interno).", False),
    ("Verificar al abrir · revisiones de 5 minutos ANTES de salir a comprar; algunas cambian la lista.", False),
    ("", False),
    ("Cómo diligenciar", True),
    ("Celdas amarillas = para llenar en tienda: 'Comprado' (Sí/No) y 'Precio real'. El subtotal real se calcula solo.", False),
    ("Texto azul = mejor precio REAL encontrado en línea el 7-nov-2026 (puede no ser en Cali). Celda vacía = no se encontró precio.", False),
    ("Ejemplo de diligenciamiento: fila 'Conversor de nivel lógico' → Comprado: Sí · Precio real: 5000.", False),
]
for i, (t, b) in enumerate(lines, 1):
    c = ws.cell(row=i, column=1, value=t)
    c.font = Font(name=F, size=12 if i == 1 else 10, bold=b)
    c.alignment = Alignment(wrap_text=True)

# ---------------- Compra lunes ----------------
wc = wb.create_sheet("Compra lunes")
cols = ["#", "Prio", "Caja", "Proyecto(s)", "Ítem a pedir en tienda", "Cant",
        "Mejor precio unit. encontrado (COP)", "Subtotal", "Por qué es necesario",
        "Alternativa si no hay", "Comprado (Sí/No)", "Precio pagado unit.", "Subtotal pagado",
        "Mejor opción en línea", "Opción en Cali", "URL producto"]
header(wc, 1, cols, [4, 5, 9, 13, 34, 6, 13, 13, 46, 32, 10, 11, 12, 26, 34, 40])
buy = [
 # prio, caja, proyectos, item, qty, price, why, alt
 (1,"C03","P1, P2","Panel solar 12 V (80 W como en el Excel; mínimo 30–50 W para pruebas)",1,220000,
  "Ambos proyectos de energía parten de cargar la batería con el sol. Sin panel no hay banco de energía ni punto de carga.",
  "Panel 30–50 W 12 V (más barato y liviano para la caja); registrar el cambio."),
 (1,"C06","P2 Semáforo UV","Sensor UV analógico GUVA-S12SD (módulo)",2,20000,
  "Nadie lo cotizó. Es el único sensor del Semáforo UV.",
  "Módulo ML8511 (salida analógica, 3.3 V) — requiere ajuste de firmware."),
 (1,"C09","P3 Incubadora","Módulo relé 5 V de 1 canal (con optoacoplador)",1,6000,
  "La incubadora debe encender/apagar una fuente de calor a 37 °C. El Arduino no puede alimentar calor directamente.",
  "MOSFET logic-level IRLZ44N + resistencia 1 kΩ (ya comprada)."),
 (1,"C09","P3 Incubadora","Bombillo automotriz incandescente 12 V 21 W (tipo 1156) + socket con cables",1,8000,
  "Fuente de calor segura a 12 V (sin 110 V). Además se ve encender: evidencia visual para el cliente.",
  "2 resistencias de potencia cerámicas 10 Ω 10 W en paralelo (calor sin luz)."),
 (1,"C09","P3 Incubadora","Adaptador 12 V 2 A, plug 5.5×2.1 mm",1,18000,
  "Alimenta el calefactor (≈1.75 A). Ninguna compra incluye fuentes.",
  "Usar la batería 12 V de C03 NO (no se prestan piezas entre cajas)."),
 (1,"C09","P1 Biorreactor","Sensor de temperatura DS18B20 sumergible (sonda de acero, 1 m)",1,10000,
  "Hay que medir la temperatura DEL LÍQUIDO en fermentación; el DHT22 mide aire y no se puede mojar. Usa la resistencia 4.7 kΩ ya comprada.",
  "—"),
 (1,"C09","P2 Semillas","Sensor de humedad de suelo CAPACITIVO v1.2",1,10000,
  "La propuesta pide 'sensores básicos de humedad' del sustrato; el DHT22 solo mide aire. El capacitivo no se corroe con el riego.",
  "Sensor resistivo YL-69/FC-28 (más barato, se corroe en semanas)."),
 (1,"C05","P1, P3 Robot","Portapilas 2×18650 con interruptor + 2 celdas 18650 + cargador USB 18650",1,45000,
  "El kit de robótica no trae baterías ni portapilas. Sin esto el robot no se mueve. Confirmar antes el puente H (ver 'Verificar al abrir').",
  "Portapilas 6×AA con interruptor + 6 pilas AA."),
 (1,"C05","P2, P4 Domótica","Pilas AA alcalinas",6,2500,
  "El Smart Home trae portapilas 6×AA sin pilas.",
  "Adaptador 9 V 1 A plug 5.5×2.1 (si la tarjeta lo acepta)."),
 (2,"C01, C06, C09","Todos con LCD","Backpack I2C PCF8574 para LCD 1602",5,8000,
  "Las 5 LCD compradas no traen I2C (el Excel dice 'con I2C'). Pasa de 12 cables a 4: crítico para usuarios no técnicos. Requiere soldar.",
  "LCD 1602 con I2C ya soldado (más caro, cero soldadura)."),
 (2,"C01","P2 Microclimas","Conversor de nivel lógico bidireccional 4 canales (3.3 V ↔ 5 V)",1,4000,
  "El BME280 que llegó es la versión 3.3 V y comparte el bus I2C con la LCD de 5 V. Sin conversor se sobrevolta el sensor.",
  "Módulo BME280 versión 5 V (con regulador)."),
 (2,"C01, C06, C09","Todos","Adaptador 9 V 1 A, plug 5.5×2.1 mm (para el jack de la MB102)",3,12000,
  "Las 3 MB102 no tienen fuente. 9 V en vez de 12 V reduce el calor del regulador a casi la mitad.",
  "Alimentar por USB desde cargador de celular 5 V (si la variante MB102 acepta USB de entrada)."),
 (2,"C01","P2 Microclimas","Memoria microSD 16 GB (SanDisk) + adaptador",1,20000,
  "Está en el Excel (línea 9) y el módulo SD ya llegó de Vistrónica. El cliente lo va a buscar en la caja.",
  "Retirar módulo + tarjeta y usar EEPROM interna (decisión de agosto); actualizar el Excel."),
 (2,"C03","P1, P2","Portafusible en línea + fusible 10 A (2 de repuesto)",1,5000,
  "Una batería de 7 Ah en corto puede quemar cables. Protección mínima obligatoria en un kit escolar.",
  "—"),
 (2,"C03","P2 Taller 5 V","Módulo reductor XL4016 (XH-M401) — como en el Excel",1,30000,
  "Es el 'módulo regulador' del Excel. El estudiante ajusta y MIDE 5.0 V con el multímetro: es el objetivo del proyecto.",
  "Módulo LM2596 con display (3 A, más común y barato)."),
 (2,"C03","P2 Taller 5 V","Módulo puerto USB hembra tipo A (breakout)",1,3000,
  "Salida de carga del celular desde el regulador ajustado.",
  "—"),
 (2,"C03","P1 Banco","Toma hembra automotriz 12 V (encendedor) con cables — está en el Excel",1,8000,
  "Punto de consumo 12 V del banco de energía.",
  "Bornera de 2 polos."),
 (2,"C03","P1, P2","Cable dúplex encauchetado 2×14 AWG (rojo/negro) + terminales de ojo y de pala",3,6000,
  "'Juego de cables y accesorios para kit solar' del Excel: panel–controlador–batería.",
  "Cable 2×16 AWG."),
 (2,"C05","P4 Laboratorio","Sensor magnético de puerta (reed switch MC-38)",1,5000,
  "La propuesta pide sensores de puerta/ventana; el Smart Home solo trae PIR. Es el ejemplo ideal de interrupción.",
  "Usar un pulsador como 'puerta' (menos realista)."),
 (3,"C06, C09","Tablero, Barrera, Incubadora","Transistor NPN 2N2222 (o BC547)",10,400,
  "El buzzer hoy va con 680 Ω en serie directo al pin y puede sonar débil o no arrancar. Con transistor + 1 kΩ (ya comprada) suena fuerte y protege el Arduino.",
  "BC337."),
 (3,"C05, C06","Barrera, servos","Capacitor electrolítico 470 µF 16 V",4,500,
  "Los servos MG90S tienen picos que reinician el Arduino. Uno en la alimentación del servo evita fallos 'misteriosos'.",
  "1000 µF 16 V."),
 (3,"C03","P1 Banco","Carga de prueba 12 V: bombillo LED 12 V 3–5 W con socket o tira LED 50 cm",1,6000,
  "Para mostrar que el banco alimenta algo durante un 'apagón' y medir consumo.",
  "Ventilador 12 V de PC."),
 (3,"C03","P1, P2","Cables con pinzas caimán (juego ×10)",1,6000,
  "Medir con multímetro y conectar sin herramientas ni soldadura.",
  "—"),
 (3,"C05","P3 Seguidor","Cinta aislante negra + 2 pliegos de cartulina blanca",1,6000,
  "Pista del seguidor de línea para demostrar al cliente.",
  "Cinta negra sobre el piso."),
 (3,"C05","P1, P3 Robot","Rueda loca de bola — SOLO si el kit de robótica no la trae",1,4900,
  "Tercer apoyo del chasis; sin ella el robot arrastra la base.",
  "Rueda loca plástica con bola."),
 (3,"C01, C06, C09","Todos","Protoboard 830 puntos — SOLO si las MB102 no trajeron protoboard",3,10000,
  "Base del montaje en las 3 cajas con Arduino.",
  "—"),
]
import csv
from collections import defaultdict
_rows = defaultdict(list)
for _r in csv.DictReader(open(EXPORTS / "precios_reales.csv", encoding="utf-8")):
    _rows[_r["item_num"]].append(_r)
# my row number -> agent item_num
_map = {i: str(i) for i in range(1, 24)}
_map[25] = "25"   # rueda loca (row 25 in my list after insert)
_map[26] = "24"   # protoboard
_composite = {8: 33200, 14: 2200, 18: 16400}
def _ok(r):
    return r["precio_unit_cop"] and "agotado" not in r["disponibilidad"].lower() and "sin stock" not in r["disponibilidad"].lower()
def _fmt(r):
    return f'{r["tienda"].split(" (")[0]} · ${int(float(r["precio_unit_cop"])):,}'.replace(",", ".")
REAL = {}
for row_i, num in _map.items():
    cand = [r for r in _rows.get(num, []) if _ok(r)]
    _must = {1: "100W", 7: "Capacitivo", 15: "XL4016"}.get(row_i)
    _cali_all = [r for r in cand if r["local_fisico_cali(si/no)"] == "si"]
    if _must:
        cand = [r for r in cand if _must in r["producto_exacto"]] + [r for r in _cali_all if _must not in r["producto_exacto"]][:0]
    if not cand:
        continue
    best = min(cand, key=lambda r: float(r["precio_unit_cop"]))
    cali = _cali_all
    cali_best = min(cali, key=lambda r: float(r["precio_unit_cop"])) if cali else None
    REAL[row_i] = (_composite.get(row_i, int(float(best["precio_unit_cop"]))), _fmt(best), _fmt(cali_best) + (" · " + cali_best["direccion"] if cali_best and cali_best["direccion"] else "") if cali_best else "—", best["url"])
n = 0
for i, (p, caja, proj, item, q, price, why, alt) in enumerate(buy, 1):
    if i in RESUELTO:
        continue
    n += 1
    if i == 18:
        q = 1
    if i in REAL:
        price = REAL[i][0]
    r = n + 1
    best_txt, cali_txt, url = (REAL[i][1], REAL[i][2], REAL[i][3]) if i in REAL else ("No encontrado en línea", "Buscar en Cra 6 (Cali)", "")
    if i in (8, 14, 18):
        best_txt = "Combinado (ver CSV) · " + best_txt
    put(wc, r, [i, p, caja, proj, item, q, price if i in REAL else None, f'=IF(G{r}="","",F{r}*G{r})', why, alt, None, None,
                f'=IF(L{r}="","",F{r}*L{r})', best_txt, cali_txt, url], blue_cols=(7,), fill_cols=(11, 12))
    for col in (7, 8, 12, 13):
        pass
    for col in (7, 8, 12, 13):
        wc.cell(row=r, column=col).number_format = '$#,##0;($#,##0);-'
last = n + 1
dv = DataValidation(type="list", formula1='"Sí,No"', allow_blank=True)
wc.add_data_validation(dv)
dv.add(f"K2:K{last}")
t = last + 2
for label, formula, col in [
    ("Total prioridad 1", f'=SUMIF(B2:B{last},1,H2:H{last})', 8),
    ("Total prioridad 1+2", f'=SUMIF(B2:B{last},"<=2",H2:H{last})', 8),
    ("Total todo (mejor precio)", f"=SUM(H2:H{last})", 8),
    ("Total real comprado", f'=SUM(M2:M{last})', 13),
]:
    wc.cell(row=t, column=5, value=label).font = Font(name=F, bold=True, size=10)
    c = wc.cell(row=t, column=col, value=formula)
    c.font = Font(name=F, bold=True, size=10)
    c.number_format = '$#,##0'
    t += 1
wc.cell(row=t + 1, column=5, value="Precios reales consultados en páginas de producto el 7-nov-2026 (Zamux, Electronilab, Sigma, Innovatronics-Cali, Sunny Future-Cali, otras). Detalle completo en precios_reales.csv. Zamux y Electronilab no están en Cali: si se compra el lunes en persona, usar la columna Opción en Cali o la Cra 6 entre Calles 15 y 17.").font = Font(name=F, italic=True, size=9)
red = PatternFill("solid", fgColor="F8CBAD")
org = PatternFill("solid", fgColor="FCE4D6")
wc.conditional_formatting.add(f"B2:B{last}", CellIsRule(operator="equal", formula=["1"], fill=red))
wc.conditional_formatting.add(f"B2:B{last}", CellIsRule(operator="equal", formula=["2"], fill=org))
wc.auto_filter.ref = f"A1:P{last}"

# ---------------- Inventario por caja ----------------
wi = wb.create_sheet("Inventario por caja")
cols = ["Caja", "Ítem (Excel original)", "Cant. Excel", "Cant. en mano", "Fuente", "Estado", "Nota"]
header(wi, 1, cols, [8, 46, 9, 9, 22, 20, 60])
SN, ID, VS, OF = "San Nicolás 908817", "I+D S202767", "Vistrónica 4733-26", "Compra oficina"
inv = {
 "C01 · 1.2 Guardianes de los ecosistemas": [
  ("Módulo DHT22",1,1,SN,"En mano","1 de las 2 compradas. P3 Índice térmico."),
  ("Sensor BME280",1,1,VS,"En mano ⚠","Versión 3.3 V: necesita conversor de nivel (Compra lunes)."),
  ("Vasos de precipitado 100 ml",2,0,"—","Falta · no electrónico","Útiles para calibrar pH con referencias caseras."),
  ("Probeta graduada",2,0,"—","Retirar","Ningún proyecto la usa (decisión de agosto)."),
  ("Tubos de ensayo 15 ml ×5 + soporte",1,0,"—","Falta · no electrónico","Necesario P1 pH (muestras de agua)."),
  ("Agitadores (en la propuesta, no en el Excel)",0,0,"—","Falta · no electrónico","Varillas o paletas plásticas; agregar al Excel."),
  ("Sensor analógico de pH",1,1,VS,"En mano","DFRobot. Guardar la sonda con su capuchón húmedo."),
  ("Bata de laboratorio",1,0,"—","Falta · no electrónico",""),
  ("Arduino UNO R3 + cable",1,1,SN,"En mano","1 de 5."),
  ("Caja para Arduino UNO",1,1,SN,"En mano","Plástica, no acrílica como dice el Excel."),
  ("LCD 1602 con I2C",1,1,SN,"En mano","Llegó sin I2C; backpack PCF8574 ya soldado (7-nov)."),
  ("Kit protoboard con fuente MB102",1,1,OF,"En mano · verificar","Confirmar si trae protoboard. Falta adaptador 9 V."),
  ("Cables de conexión (M-M, M-H, H-H)",40,40,SN+" / "+VS,"En mano","Se compraron 150 paquetes ×10: sobran para todas las cajas."),
  ("Módulo micro SD",1,1,VS,"En mano",""),
  ("Memoria micro SD 16 GB",1,0,"—","Falta · comprar lunes","O retirar módulo + tarjeta y dejar EEPROM."),
  ("Caja contenedora personalizada",1,0,"Dislumbra","Interno",""),
  ("Material pedagógico",1,0,"Asesoría + pedagoga","Interno","Página web + guía."),
 ],
 "C03 · 3.3 Territorios energéticamente resilientes": [
  ("Relé de estado sólido 15 A 12 V→220 V",1,0,"—","Retirar (propuesto)","Ningún proyecto lo usa y conmuta 220 V: riesgo innecesario. Ahorro."),
  ("Inversor 12 V → 120 V",1,1,SN,"En mano ⚠","Truper 120 W. Ningún objetivo pide AC. Propuesta: uso exclusivo del docente o retirar."),
  ("Toma hembra automotriz 12 V",1,0,"—","Falta · comprar lunes",""),
  ("Panel solar 80 W 12 V",1,1,"Dislumbra (RTM020M)","En mano · cambio","Panel de 20 W (Vmp 19,3 V · Imp 1,04 A) en lugar de 80 W. Con el controlador PWM carga a ~1 A = 0,14C, el rango sano para una batería de 7 Ah; uno de 80 W daría ~4,5 A (0,6C) y la calentaría. Repone ~45–55 Wh por día de sol, lo que se usa en un día. 45×35 cm: cabe en la caja. Cables de salida pelados: van directo a la bornera del controlador."),
  ("Controlador solar 10 A",1,1,SN,"En mano","Es de 30 A PWM con 2 USB (superior). Sus USB ya dan 5 V: el Taller 5 V usará el XL4016 para que el estudiante regule y mida."),
  ("Batería 12 V 7 Ah",1,1,SN,"En mano","Guardar cargada y con bornes tapados."),
  ("Cables y accesorios kit solar",1,0,"—","Falta · comprar lunes","Cable 2×14 AWG, terminales, fusible."),
  ("Módulo regulador XL4016",1,0,"—","Falta · comprar lunes",""),
  ("Juego de 6 destornilladores",1,0,"—","Falta · ferretería",""),
  ("Cortador de cables",1,0,"—","Falta · ferretería",""),
  ("Multímetro digital con buzzer",1,1,SN,"En mano","UNI-T UT33C+."),
  ("Caja contenedora personalizada",1,0,"Dislumbra","Interno",""),
  ("Material pedagógico",1,0,"Asesoría + pedagoga","Interno",""),
 ],
 "C05 · Robótica y automatización": [
  ("Kit de robótica con sensores (KIT-RBT-01-RN)",1,1,ID,"En mano ⚠","Trae tarjeta UNO, puente H, 2 motores, HC-SR04, seguidor de línea, IR, SG90. SIN baterías ni portapilas."),
  ("Kit Smart Home IoT Keyes (KEY-HOME)",1,1,ID,"En mano ⚠","Placa compatible UNO + shield, PIR, LCD 1602, relé, 2 servos, Bluetooth HM-10. Portapilas 6×AA SIN pilas."),
  ("Arduino UNO R3 + cable",2,2,SN,"En mano · redundante","Ambos kits traen su propia placa; quedan como placa extra para practicar."),
  ("Caja para Arduino UNO",2,2,SN,"En mano",""),
  ("LCD 1602 con I2C",2,2,SN,"En mano","Backpack I2C ya soldado (7-nov). El Smart Home trae además su propia LCD."),
  ("Kit protoboard con fuente MB102",2,0,"—","No requerido","Las 3 MB102 van a C01, C06 y C09; los kits de robótica se alimentan solos."),
  ("Cables de conexión",80,80,SN,"En mano",""),
  ("Caja contenedora personalizada",1,0,"Dislumbra","Interno",""),
  ("Material pedagógico",1,0,"Asesoría + pedagoga","Interno","Corregir el Excel: dice Micro:Bit; es Arduino."),
 ],
 "C06 · Diseño de software y aplicaciones": [
  ("Buzzer activo 5 V",6,6,SN,"En mano · verificar","BS3 5–15 V. Confirmar que es activo (ver Verificar al abrir)."),
  ("Fotorresistencia LDR",6,6,SN,"En mano",""),
  ("LED amarillo 5 mm",100,100,SN,"En mano",""),
  ("LED azul 5 mm",100,100,VS,"En mano",""),
  ("LED verde 5 mm",100,100,SN,"En mano ⚠","Son de 3 mm. Funciona igual; corregir el Excel."),
  ("LED rojo 5 mm",100,100,SN,"En mano",""),
  ("LED RGB 5 mm cátodo común",100,100,VS,"En mano · verificar","La cotización no dice si es cátodo o ánodo común."),
  ("Pulsador 12×12 B3F",10,10,VS,"En mano",""),
  ("Botones A14 (4 colores ×50)",200,200,VS,"En mano","Verificar que encajan en el B3F-4050."),
  ("Resistencias surtidas",600,380,SN,"En mano","19 valores ×20. Se reparten entre las cajas C01, C06 y C09."),
  ("Arduino UNO R3 + cable",1,1,SN,"En mano",""),
  ("Caja para Arduino UNO",1,1,SN,"En mano",""),
  ("LCD 1602 con I2C",1,1,SN,"En mano","Llegó sin I2C; backpack PCF8574 ya soldado (7-nov)."),
  ("Kit protoboard con fuente MB102",1,1,OF,"En mano · verificar",""),
  ("Cables de conexión",40,40,SN,"En mano",""),
  ("Sensor UV GUVA-S12SD",2,0,"—","Falta · comprar lunes","CRÍTICO: nadie lo cotizó."),
  ("Sensor de presión BMP180",2,2,SN,"En mano",""),
  ("Micro servo MG90S",1,1,VS,"En mano",""),
  ("Caja impresa en 3D (PLA)",1,0,"Taller 3D de la empresa","Interno","Ver requisitos en la respuesta de Claude."),
  ("Caja contenedora personalizada",1,0,"Dislumbra","Interno",""),
  ("Material pedagógico",1,0,"Asesoría + pedagoga","Interno",""),
 ],
 "C09 · Biotecnología": [
  ("Arduino UNO R3 + cable",1,1,SN,"En mano",""),
  ("Caja para Arduino UNO",1,1,SN,"En mano",""),
  ("LCD 1602 con I2C",1,1,SN,"En mano","Backpack I2C ya soldado (7-nov). Muestra la temperatura de la incubadora."),
  ("Kit protoboard con fuente MB102",1,1,OF,"En mano · verificar",""),
  ("Cables de conexión",40,40,SN,"En mano",""),
  ("Levaduras y cultivos (S. cerevisiae, yogur, L. lactis)",3,0,"—","Falta · no electrónico","Perecederos: entregar aparte o como reposición, no dentro de la caja por meses."),
  ("Reactivos (azul de metileno, NaCl, papel pH, rojo de fenol)",4,0,"—","Falta · no electrónico","En empaque secundario a prueba de derrames, lejos de la electrónica."),
  ("Sensor analógico de pH",1,1,VS,"En mano","2.º DFRobot."),
  ("Módulo DHT22",1,1,SN,"En mano","2.º DHT22: aire de la incubadora."),
  ("Cajas Petri 60×15 mm",20,0,"—","Falta · no electrónico",""),
  ("Semillas (maíz, fríjol, ahuyama, cilantro, tomate)",10,0,"—","Falta · no electrónico",""),
  ("Fuente de calor + relé (no está en el Excel)",0,0,"—","Falta · comprar lunes","Sin esto no existe la incubadora (P3)."),
  ("DS18B20 sumergible (no está en el Excel)",0,0,"—","Falta · comprar lunes","Temperatura del líquido (P1)."),
  ("Sensor de humedad de suelo (no está en el Excel)",0,0,"—","Falta · comprar lunes","Germinación (P2)."),
  ("Caja térmica de icopor (no está en el Excel)",0,0,"—","Falta · no electrónico","La 'maleta técnica' que se vuelve incubadora."),
  ("Caja contenedora personalizada",1,0,"Dislumbra","Interno",""),
  ("Material pedagógico",1,0,"Asesoría + pedagoga","Interno",""),
 ],
}
r = 2
for box, items in inv.items():
    wi.merge_cells(start_row=r, start_column=1, end_row=r, end_column=7)
    c = wi.cell(row=r, column=1, value=box)
    c.font = Font(name=F, bold=True, size=11)
    c.fill = BOX
    r += 1
    code = box.split(" ")[0]
    for it in items:
        put(wi, r, [code, *it])
        r += 1
rng = f"F2:F{r}"
for txt, color in [("Falta · comprar", "F8CBAD"), ("Retirar", "D9D9D9"), ("⚠", "FFF2CC"), ("verificar", "FFF2CC"), ("En mano", "E2EFDA")]:
    wi.conditional_formatting.add(rng, FormulaRule(formula=[f'ISNUMBER(SEARCH("{txt}",F2))'], fill=PatternFill("solid", fgColor=color), stopIfTrue=True))

# ---------------- Verificar al abrir ----------------
wv = wb.create_sheet("Verificar al abrir")
header(wv, 1, ["#", "Qué revisar", "Cómo (5 min)", "Si sale distinto…", "Resultado"], [4, 34, 52, 52, 22])
chk = [
 ("¿Las 3 MB102 trajeron protoboard?", "Mirar el empaque.", "Comprar 3 protoboard 830 (ítem #26 de Compra lunes)."),
 ("Puente H del robot: ¿L298N (disipador negro grande) o L9110S (pequeño)?", "Leer la serigrafía del chip/tarjeta.", "L298N → 2×18650 (7.4 V). L9110S → 4×AA (6 V) para no pasar los 6 V de los motores."),
 ("¿El robot trae rueda loca (tercera rueda)?", "Revisar bolsa de piezas.", "Comprar la rueda loca (ítem #25 de Compra lunes)."),
 ("Seguidor de línea del robot: ¿cuántos sensores (1, 2, 3 o 5)?", "Contar los pares emisor/receptor.", "Con 1 sensor se sigue el borde de la línea (sirve para el objetivo). Con 3+ se puede hacer el PID de la propuesta."),
 ("Buzzer BS3: ¿activo?", "Conectar sus patas a 5 V y GND de la MB102 (+ a la pata larga o marcada).", "Si no suena continuo, es pasivo: el firmware usará tone() y no se necesita transistor de potencia."),
 ("LED RGB: ¿cátodo común?", "Pata más larga a GND, otra pata a 5 V con 680 Ω.", "Si enciende → cátodo común. Si no, es ánodo común (pata larga a 5 V): se invierte la lógica en el firmware."),
 ("LCD del Smart Home: ¿ya trae I2C?", "Ver si tiene una plaquita de 4 pines atrás.", "Sin cambio en la compra; solo para la guía."),
 ("Módulo BMP180: ¿tiene regulador (3 patas pequeñas, 662K)?", "Mirar la placa.", "Si no tiene, agregar 1 conversor de nivel más para C06."),
 ("Sensor de pH: ¿la sonda trae su capuchón con líquido?", "Revisar sin abrir el capuchón.", "Si llegó seco, pedir solución KCl 3M al proveedor (la sonda se daña seca)."),
 ("Panel RTM020M al sol (antes de empacar)", "Sol directo, sin conectar nada. UT33C+ en V DC entre los dos cables: debe marcar 20–23 V. Luego en la escala 10 A (punta roja en el borne 10A) y por pocos segundos: ~1 A.", "Si marca mucho menos con sol pleno, revisar sombra o suciedad. Si no marca nada, revisar continuidad del cable. Anotar qué cable es el + y marcarlo con cinta roja."),
 ("Botones A14: ¿encajan en el pulsador B3F-4050?", "Poner uno.", "Si no encajan, usar los pulsadores sin tapa y retirar las tapas del Excel."),
]
for i, (a, b, c) in enumerate(chk, 1):
    put(wv, i + 1, [i, a, b, c, None], fill_cols=(5,))

for s in wb.worksheets:
    s.sheet_view.showGridLines = s.title == "Leeme" and False
wb.save(EXPORTS / "Faltantes_BOM_Kits_STEAM.xlsx")
