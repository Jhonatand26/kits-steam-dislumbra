// Dibujo de cada tipo de pieza. Una pieza conoce su forma y cómo se ve
// según el estado de los pines; no conoce la lección ni el programa.

import {
  ALL_ROWS, BB, BB_SIZE, PITCH, UNO, colX, holeXY, parseHole, rowY,
  shiftHole, unoPins, refXY, type Pt,
} from "./geometry";
import type { Board } from "./runtime";

const NS = "http://www.w3.org/2000/svg";

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K, attrs: Record<string, string | number> = {}, parent?: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
}

export interface PartSpec {
  id: string;
  type: string;
  label: string;
  item?: string;
  at?: string;
  from?: string;
  to?: string;
  plus?: string;
  minus?: string;
  ohms?: number;
  cap?: string;
  bind?: Record<string, string>;
}

export interface Rendered {
  g: SVGGElement;
  update?: (board: Board) => void;
  center: Pt;
}

type Renderer = (spec: PartSpec, board: Board) => Rendered;

function group(spec: PartSpec): SVGGElement {
  return el("g", { class: `part part-${spec.type}`, "data-id": spec.id, tabindex: 0, role: "button", "aria-label": spec.label });
}

function leg(g: SVGGElement, a: Pt, b: Pt) {
  el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "leg" }, g);
  el("circle", { cx: a.x, cy: a.y, r: 2.2, class: "leg-foot" }, g);
}

// ---------- Arduino UNO ----------
const uno: Renderer = (spec) => {
  const g = group(spec);
  const { x, y, w, h } = UNO;
  el("rect", { x, y, width: w, height: h, rx: 10, class: "uno-board" }, g);
  el("rect", { x: x - 10, y: y + 30, width: 46, height: 40, rx: 3, class: "uno-usb" }, g);
  el("rect", { x: x - 6, y: y + 140, width: 40, height: 34, rx: 4, class: "uno-jack" }, g);
  el("rect", { x: x + 120, y: y + 108, width: 120, height: 30, rx: 2, class: "uno-chip" }, g);
  for (let i = 0; i < 14; i++) {
    el("rect", { x: x + 124 + i * 8.2, y: y + 103, width: 3, height: 5, class: "uno-chip-pin" }, g);
    el("rect", { x: x + 124 + i * 8.2, y: y + 138, width: 3, height: 5, class: "uno-chip-pin" }, g);
  }
  el("rect", { x: x + 44, y: y + 5, width: 242 - 30, height: 16, rx: 2, class: "uno-header" }, g);
  el("rect", { x: x + 86, y: y + h - 21, width: 186, height: 16, rx: 2, class: "uno-header" }, g);
  const t = el("text", { x: x + 70, y: y + 82, class: "uno-logo" }, g);
  t.textContent = "UNO";
  const s = el("text", { x: x + 72, y: y + 96, class: "uno-sub" }, g);
  s.textContent = "ARDUINO";
  for (const pin of unoPins()) {
    el("rect", { x: pin.p.x - 3.2, y: pin.p.y - 3.2, width: 6.4, height: 6.4, class: "uno-pin", "data-pin": pin.name }, g);
    const ly = pin.side === "top" ? pin.p.y + 15 : pin.p.y - 11;
    const lbl = el("text", {
      x: pin.p.x, y: ly, class: "uno-pin-label",
      transform: `rotate(-90 ${pin.p.x} ${ly})`,
      "text-anchor": pin.side === "top" ? "end" : "start",
    }, g);
    lbl.textContent = pin.name.replace(/^D/, "").replace(/GND\d/, "GND");
  }
  return { g, center: { x: x + w / 2, y: y + h / 2 } };
};

// ---------- Protoboard ----------
const breadboard: Renderer = (spec) => {
  const g = group(spec);
  const { x, y } = BB;
  el("rect", { x, y, width: BB_SIZE.w, height: BB_SIZE.h, rx: 8, class: "bb-body" }, g);
  el("rect", { x: x + 6, y: rowY("e") + 9, width: BB_SIZE.w - 12, height: 8, rx: 2, class: "bb-gap" }, g);
  for (const [row, cls] of [["tp", "rail-p"], ["tn", "rail-n"], ["bn", "rail-n"], ["bp", "rail-p"]] as const) {
    el("line", { x1: x + 12, y1: rowY(row) + (row.endsWith("p") ? -6 : 6) * (row.startsWith("t") ? 1 : -1), x2: x + BB_SIZE.w - 12, y2: rowY(row) + (row.endsWith("p") ? -6 : 6) * (row.startsWith("t") ? 1 : -1), class: cls }, g);
  }
  for (const row of ALL_ROWS) {
    for (let c = 1; c <= BB.cols; c++) {
      el("rect", { x: colX(c) - 2.4, y: rowY(row) - 2.4, width: 4.8, height: 4.8, rx: 1, class: "bb-hole", "data-hole": `${row}${c}` }, g);
    }
  }
  for (const c of [1, 5, 10, 15, 20, 25, 30]) {
    const t = el("text", { x: colX(c), y: rowY("a") - 9, class: "bb-label", "text-anchor": "middle" }, g);
    t.textContent = String(c);
  }
  for (const r of ["a", "e", "f", "j"]) {
    const t = el("text", { x: x + 8, y: rowY(r) + 3, class: "bb-label", "text-anchor": "middle" }, g);
    t.textContent = r;
  }
  return { g, center: { x: x + BB_SIZE.w / 2, y: y + BB_SIZE.h / 2 } };
};

// ---------- Resistencia ----------
const BAND = ["#1a1a1a", "#7a4a21", "#c62d2d", "#e57a1f", "#f2c318", "#2f8f4e", "#2f63c4", "#7d3fb0", "#8a8f93", "#f4f4f4"];

function bands(ohms: number): string[] {
  const exp = Math.floor(Math.log10(ohms)) - 1;
  const digits = String(Math.round(ohms / 10 ** exp)).padStart(2, "0");
  return [BAND[+digits[0]], BAND[+digits[1]], BAND[exp], "#c9a227"];
}

const resistor: Renderer = (spec) => {
  const g = group(spec);
  const a = holeXY(spec.from!);
  const b = holeXY(spec.to!);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 7 };
  const len = 30;
  const horiz = Math.abs(a.y - b.y) < 1;
  el("path", { d: `M${a.x} ${a.y} L${a.x} ${mid.y} L${b.x} ${mid.y} L${b.x} ${b.y}`, class: "leg", fill: "none" }, g);
  el("circle", { cx: a.x, cy: a.y, r: 2.2, class: "leg-foot" }, g);
  el("circle", { cx: b.x, cy: b.y, r: 2.2, class: "leg-foot" }, g);
  const bx = mid.x - len / 2;
  el("rect", { x: bx, y: mid.y - 5, width: len, height: 10, rx: 5, class: "res-body" }, g);
  bands(spec.ohms ?? 220).forEach((c, i) => {
    el("rect", { x: bx + 6 + i * 5.2 + (i === 3 ? 3 : 0), y: mid.y - 5, width: 2.8, height: 10, fill: c }, g);
  });
  void horiz;
  return { g, center: mid };
};

// ---------- LED RGB (patas R, K, G, B) ----------
const rgbLed: Renderer = (spec) => {
  const g = group(spec);
  const holes = [0, 1, 2, 3].map((d) => holeXY(shiftHole(spec.at!, d)));
  const cx = (holes[0].x + holes[3].x) / 2;
  const top = holes[0].y - 2.4 * PITCH;
  holes.forEach((h, i) => leg(g, h, { x: cx + (i - 1.5) * 3, y: top + 16 }));
  const glow = el("circle", { cx, cy: top + 4, r: 17, class: "led-glow" }, g);
  el("path", { d: `M${cx - 11} ${top + 16} L${cx - 11} ${top + 2} A11 11 0 0 1 ${cx + 11} ${top + 2} L${cx + 11} ${top + 16} Z`, class: "led-dome" }, g);
  const lens = el("path", { d: `M${cx - 8} ${top + 14} L${cx - 8} ${top + 2} A8 8 0 0 1 ${cx + 8} ${top + 2} L${cx + 8} ${top + 14} Z`, class: "led-lens" }, g);
  return {
    g,
    center: { x: cx, y: top + 6 },
    update(board) {
      const v = (pin?: string) => (pin ? board.level(pin) : 0);
      const r = v(spec.bind?.r), gr = v(spec.bind?.g), b = v(spec.bind?.b);
      // El tono sale de la mezcla; el brillo, del canal más alto.
      const on = Math.max(r, gr, b);
      const hue = (c: number) => Math.round(on > 0 ? 40 + (c / on) * 215 : 0);
      const color = `rgb(${hue(r)}, ${hue(gr)}, ${hue(b)})`;
      lens.style.fill = on > 0 ? color : "";
      lens.style.fillOpacity = on > 0 ? String(0.6 + on * 0.4) : "";
      glow.setAttribute("fill", color);
      glow.setAttribute("opacity", String(on > 0 ? 0.35 + on * 0.55 : 0));
    },
  };
};

// ---------- Pulsador (atraviesa el canal central) ----------
const button: Renderer = (spec, board) => {
  const g = group(spec);
  const { col } = parseHole(spec.at!);
  const pts = [`e${col}`, `e${col + 2}`, `f${col}`, `f${col + 2}`].map(holeXY);
  const cx = (pts[0].x + pts[1].x) / 2;
  const cy = (pts[0].y + pts[2].y) / 2;
  pts.forEach((p) => el("circle", { cx: p.x, cy: p.y, r: 2.4, class: "leg-foot" }, g));
  el("rect", { x: cx - 17, y: cy - 17, width: 34, height: 34, rx: 3, class: "btn-base" }, g);
  const cap = el("circle", { cx, cy, r: 11, fill: spec.cap ?? "#333", class: "btn-cap" }, g);
  const pin = spec.bind?.pin;
  g.classList.add("pressable");
  const press = (v: boolean) => {
    if (!pin) return;
    board.setInput(pin, v ? 0 : 1);
    cap.classList.toggle("down", v);
  };
  g.addEventListener("pointerdown", (e) => { e.preventDefault(); press(true); });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) g.addEventListener(ev, () => press(false));
  g.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === " " || (e as KeyboardEvent).key === "Enter") press(true); });
  g.addEventListener("keyup", () => press(false));
  return { g, center: { x: cx, y: cy } };
};

// ---------- Zumbador activo ----------
const buzzer: Renderer = (spec) => {
  const g = group(spec);
  const a = holeXY(spec.minus!);
  const b = holeXY(spec.plus!);
  const cx = (a.x + b.x) / 2;
  const cy = a.y;
  el("circle", { cx: a.x, cy: a.y, r: 2.2, class: "leg-foot" }, g);
  el("circle", { cx: b.x, cy: b.y, r: 2.2, class: "leg-foot" }, g);
  const waves = el("g", { class: "bz-waves" }, g);
  for (const r of [26, 34]) el("circle", { cx, cy, r, class: "bz-wave" }, waves);
  el("circle", { cx, cy, r: 21, class: "bz-body" }, g);
  el("circle", { cx, cy, r: 4, class: "bz-hole" }, g);
  const plus = el("text", { x: b.x - 2, y: cy - 10, class: "bz-plus", "text-anchor": "middle" }, g);
  plus.textContent = "+";
  return {
    g,
    center: { x: cx, y: cy },
    update(board) {
      const on = spec.bind?.pin ? board.level(spec.bind.pin) > 0.5 : false;
      g.classList.toggle("sounding", on);
    },
  };
};

// ---------- Transistor NPN (E, B, C) ----------
const npn: Renderer = (spec) => {
  const g = group(spec);
  const holes = [0, 1, 2].map((d) => holeXY(shiftHole(spec.at!, d)));
  const cx = holes[1].x;
  const top = holes[0].y - 22;
  holes.forEach((h, i) => leg(g, h, { x: cx + (i - 1) * 5, y: top + 12 }));
  el("path", { d: `M${cx - 12} ${top + 12} L${cx - 12} ${top} A12 12 0 0 1 ${cx + 12} ${top} L${cx + 12} ${top + 12} Z`, class: "npn-body" }, g);
  ["E", "B", "C"].forEach((n, i) => {
    const t = el("text", { x: cx + (i - 1) * 7, y: top + 9, class: "npn-label", "text-anchor": "middle" }, g);
    t.textContent = n;
  });
  return { g, center: { x: cx, y: top + 4 } };
};

export const RENDERERS: Record<string, Renderer> = {
  "arduino-uno": uno,
  breadboard,
  resistor,
  "rgb-led": rgbLed,
  button,
  buzzer,
  npn,
};

// ---------- Cables ----------
const WIRE_COLORS: Record<string, string> = {
  red: "#d23a2e", black: "#2a2f33", orange: "#e8812a", green: "#2f9a55",
  blue: "#2f6fd0", yellow: "#e8b922", violet: "#8a4fc1", white: "#e9ecea",
};

export function wirePath(from: string, to: string): string {
  const a = refXY(from);
  const b = refXY(to);
  if (Math.abs(a.p.x - b.p.x) < 1) return `M${a.p.x} ${a.p.y} L${b.p.x} ${b.p.y}`;
  const lift = Math.min(70, 26 + Math.abs(a.p.x - b.p.x) * 0.12);
  const c1 = { x: a.p.x, y: a.p.y + a.dir * lift };
  const c2 = { x: b.p.x, y: b.p.y + b.dir * lift };
  return `M${a.p.x} ${a.p.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.p.x} ${b.p.y}`;
}

export function renderWire(spec: { id: string; from: string; to: string; color: string }): Rendered {
  const g = el("g", { class: "part part-wire", "data-id": spec.id, tabindex: 0, role: "button", "aria-label": `Cable de ${spec.from} a ${spec.to}` });
  const d = wirePath(spec.from, spec.to);
  el("path", { d, class: "wire-shadow" }, g);
  const p = el("path", { d, class: "wire", stroke: WIRE_COLORS[spec.color] ?? spec.color, pathLength: 1 }, g);
  void p;
  const a = refXY(spec.from).p;
  const b = refXY(spec.to).p;
  el("circle", { cx: a.x, cy: a.y, r: 3, class: "wire-end", fill: WIRE_COLORS[spec.color] ?? spec.color }, g);
  el("circle", { cx: b.x, cy: b.y, r: 3, class: "wire-end", fill: WIRE_COLORS[spec.color] ?? spec.color }, g);
  return { g, center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
}
