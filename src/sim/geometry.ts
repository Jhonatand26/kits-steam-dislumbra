// Geometría del banco de trabajo: dónde está cada pin del Arduino y cada
// agujero de la protoboard. Toda pieza se ubica por su agujero ("bb.e20")
// o pin ("uno.D9"), igual que en el montaje físico.

export const PITCH = 14;
export const STAGE = { w: 800, h: 352 };
export const UNO = { x: 16, y: 74, w: 276, h: 204 };
export const BB = { x: 334, y: 36, cols: 30 };

const UNO_TOP: (string | null)[] = [
  "SCL", "SDA", "AREF", "GND3", "D13", "D12", "D11", "D10", "D9", "D8",
  null, "D7", "D6", "D5", "D4", "D3", "D2", "D1", "D0",
];
const UNO_BOTTOM: (string | null)[] = [
  "IOREF", "RESET", "3V3", "5V", "GND1", "GND2", "VIN",
  null, "A0", "A1", "A2", "A3", "A4", "A5",
];
const UNO_PIN_STEP = 12.4;

export interface Pt { x: number; y: number; }

export function unoPins(): { name: string; side: "top" | "bottom"; p: Pt }[] {
  const out: { name: string; side: "top" | "bottom"; p: Pt }[] = [];
  UNO_TOP.forEach((n, i) => {
    if (n) out.push({ name: n, side: "top", p: { x: UNO.x + 50 + i * UNO_PIN_STEP, y: UNO.y + 13 } });
  });
  UNO_BOTTOM.forEach((n, i) => {
    if (n) out.push({ name: n, side: "bottom", p: { x: UNO.x + 92 + i * UNO_PIN_STEP, y: UNO.y + UNO.h - 13 } });
  });
  return out;
}

const ROWS_TOP = ["a", "b", "c", "d", "e"];
const ROWS_BOTTOM = ["f", "g", "h", "i", "j"];

export const BB_SIZE = {
  w: 36 + (BB.cols - 1) * PITCH,
  h: 290,
};

export function colX(col: number): number {
  return BB.x + 18 + (col - 1) * PITCH;
}

export function rowY(row: string): number {
  const rails: Record<string, number> = { tp: 16, tn: 30, bn: 260, bp: 274 };
  if (row in rails) return BB.y + rails[row];
  const t = ROWS_TOP.indexOf(row);
  if (t >= 0) return BB.y + 66 + t * PITCH;
  const b = ROWS_BOTTOM.indexOf(row);
  if (b >= 0) return BB.y + 66 + 5 * PITCH + 22 + b * PITCH;
  throw new Error(`Fila desconocida: ${row}`);
}

/** Separa "e20" o "tp4" en fila y columna. */
export function parseHole(hole: string): { row: string; col: number } {
  const m = /^(tp|tn|bp|bn|[a-j])(\d{1,2})$/.exec(hole);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > BB.cols) throw new Error(`Agujero inválido: ${hole}`);
  return { row: m[1], col: Number(m[2]) };
}

export function holeXY(hole: string): Pt {
  const { row, col } = parseHole(hole);
  return { x: colX(col), y: rowY(row) };
}

export function shiftHole(hole: string, dCol: number, row?: string): string {
  const h = parseHole(hole);
  return `${row ?? h.row}${h.col + dCol}`;
}

/** Punto de cualquier referencia: "uno.D9" o "bb.e20". */
export function refXY(ref: string): { p: Pt; dir: number } {
  const [dev, pin] = ref.split(".");
  if (dev === "uno") {
    const found = unoPins().find((u) => u.name === pin);
    if (!found) throw new Error(`Pin desconocido: ${ref}`);
    return { p: found.p, dir: found.side === "top" ? -1 : 1 };
  }
  if (dev !== "bb") throw new Error(`Dispositivo desconocido: ${ref}`);
  const { row } = parseHole(pin);
  const top = ["tp", "tn", ...ROWS_TOP].includes(row);
  return { p: holeXY(pin), dir: top ? -1 : 1 };
}

export const ALL_ROWS = ["tp", "tn", ...ROWS_TOP, ...ROWS_BOTTOM, "bn", "bp"];
