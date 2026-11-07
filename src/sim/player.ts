// <sim-player>: lección paso a paso + simulación interactiva.
// Recibe la lección, el catálogo de piezas y el código como JSON; la
// lógica de cada proyecto llega como fábrica de firmware.

import { STAGE } from "./geometry";
import { RENDERERS, el, renderWire, type PartSpec, type Rendered } from "./parts";
import { Beeper, Board, run, type FirmwareFactory } from "./runtime";

interface Step {
  title: string;
  body: string;
  show: string[];
  focus: string[];
  code?: [number, number];
  run?: boolean;
}
interface Lesson {
  parts: PartSpec[];
  wires: { id: string; from: string; to: string; color: string }[];
  steps: Step[];
}
interface Catalog { [type: string]: { name: string; what: string; how: string; care: string } }
interface Items { [id: string]: { name: string; status: string } }

const FIRMWARE: Record<string, () => Promise<{ default: FirmwareFactory }>> = {
  "C06-P1": () => import("./firmware/c06-p1"),
};

function readParams(code: string): Record<string, number | boolean> {
  const out: Record<string, number | boolean> = {};
  for (const m of code.matchAll(/const\s+(?:bool|int|unsigned long|float)\s+([A-Z_]+)\s*=\s*(true|false|-?\d+(?:\.\d+)?)\s*;/g)) {
    out[m[1]] = m[2] === "true" ? true : m[2] === "false" ? false : Number(m[2]);
  }
  return out;
}

class SimPlayer extends HTMLElement {
  private lesson!: Lesson;
  private catalog!: Catalog;
  private items!: Items;
  private code = "";
  private project = "";
  private step = 0;
  private board = new Board();
  private beeper = new Beeper();
  private nodes = new Map<string, Rendered>();
  private specs = new Map<string, PartSpec>();
  private svg!: SVGSVGElement;
  private demo = false;
  private starting = false;

  connectedCallback() {
    const data = JSON.parse(this.querySelector("script[type='application/json']")!.textContent!);
    this.lesson = data.lesson;
    this.catalog = data.catalog;
    this.items = data.items;
    this.code = data.code;
    this.project = data.project;
    this.demo = Boolean(readParams(this.code).MODO_DEMO);
    this.build();
    this.go(0);
  }

  private $(sel: string) { return this.querySelector(sel) as HTMLElement; }

  private build() {
    this.innerHTML = `
      <div class="sp">
        <div class="sp-stage">
          <div class="sp-svg"></div>
          <div class="sp-run">
            <button class="sp-play" type="button">Iniciar simulación</button>
            <button class="sp-reset" type="button" disabled>Reiniciar</button>
            <label class="sp-toggle"><input type="checkbox" class="sp-demo"> Modo demostración</label>
            <label class="sp-toggle"><input type="checkbox" class="sp-sound" checked> Sonido</label>
          </div>
        </div>
        <aside class="sp-panel">
          <div class="sp-tabs" role="tablist">
            <button role="tab" data-tab="paso" aria-selected="true">Paso a paso</button>
            <button role="tab" data-tab="pieza" aria-selected="false">Pieza</button>
            <button role="tab" data-tab="codigo" aria-selected="false">Código</button>
          </div>
          <section class="sp-view" data-view="paso">
            <p class="sp-count"></p>
            <h3 class="sp-title"></h3>
            <p class="sp-body"></p>
            <div class="sp-nav">
              <button class="sp-prev" type="button">Anterior</button>
              <button class="sp-next" type="button">Siguiente paso</button>
            </div>
          </section>
          <section class="sp-view" data-view="pieza" hidden>
            <p class="sp-hint">Toca una pieza del montaje para ver qué es, cómo se conecta y cómo cuidarla.</p>
            <div class="sp-piece"></div>
          </section>
          <section class="sp-view" data-view="codigo" hidden>
            <pre class="sp-code"></pre>
          </section>
        </aside>
        <div class="sp-serial">
          <p class="sp-serial-title">Monitor serie</p>
          <pre class="sp-serial-out" aria-live="polite">La simulación está detenida.</pre>
        </div>
        <ol class="sp-strip"></ol>
      </div>`;

    // Escenario
    this.svg = el("svg", { viewBox: `0 0 ${STAGE.w} ${STAGE.h}`, class: "sp-canvas", role: "img", "aria-label": "Montaje del circuito" });
    const defs = el("defs", {}, this.svg);
    const f = el("filter", { id: "glow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
    el("feGaussianBlur", { stdDeviation: 6 }, f);
    this.$(".sp-svg").appendChild(this.svg);
    const layerParts = el("g", {}, this.svg);
    const layerWires = el("g", {}, this.svg);
    const layerTop = el("g", {}, this.svg);
    for (const spec of this.lesson.parts) {
      const r = RENDERERS[spec.type](spec, this.board);
      this.nodes.set(spec.id, r);
      this.specs.set(spec.id, spec);
      (spec.type === "arduino-uno" || spec.type === "breadboard" ? layerParts : layerTop).appendChild(r.g);
    }
    for (const w of this.lesson.wires) {
      const r = renderWire(w);
      this.nodes.set(w.id, r);
      layerWires.appendChild(r.g);
    }
    this.svg.addEventListener("click", (e) => {
      const g = (e.target as Element).closest(".part") as SVGGElement | null;
      if (g) this.inspect(g.dataset.id!);
    });

    // Código con números de línea
    const pre = this.$(".sp-code");
    this.code.split("\n").forEach((line, i) => {
      const span = document.createElement("span");
      span.className = "ln";
      span.dataset.n = String(i + 1);
      span.textContent = line || " ";
      pre.appendChild(span);
    });

    // Tira de pasos
    const strip = this.$(".sp-strip");
    this.lesson.steps.forEach((s, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<button type="button"><span>${i + 1}</span>${s.title}</button>`;
      li.querySelector("button")!.addEventListener("click", () => this.go(i));
      strip.appendChild(li);
    });

    // Controles
    this.querySelectorAll<HTMLButtonElement>(".sp-tabs button").forEach((b) =>
      b.addEventListener("click", () => this.tab(b.dataset.tab!)));
    this.$(".sp-prev").addEventListener("click", () => this.go(this.step - 1));
    this.$(".sp-next").addEventListener("click", () => this.go(this.step + 1));
    this.$(".sp-play").addEventListener("click", () => (this.board.running ? this.stop() : this.start()));
    this.$(".sp-reset").addEventListener("click", async () => { this.stop(); await new Promise((r) => setTimeout(r, 30)); this.start(); });
    const demo = this.$(".sp-demo") as HTMLInputElement;
    demo.checked = this.demo;
    demo.addEventListener("change", () => { this.demo = demo.checked; if (this.board.running) { this.stop(); setTimeout(() => this.start(), 30); } });
    const sound = this.$(".sp-sound") as HTMLInputElement;
    sound.addEventListener("change", () => { this.beeper.enabled = sound.checked; this.beeper.set(false); });

    this.board.onChange = () => this.refresh();
    let serialBuf = "";
    this.board.onSerial = (t) => {
      serialBuf = (serialBuf + t).split("\n").slice(-12).join("\n");
      const out = this.$(".sp-serial-out");
      out.textContent = serialBuf;
      out.scrollTop = out.scrollHeight;
    };
  }

  private tab(name: string) {
    this.querySelectorAll<HTMLButtonElement>(".sp-tabs button").forEach((b) =>
      b.setAttribute("aria-selected", String(b.dataset.tab === name)));
    this.querySelectorAll<HTMLElement>(".sp-view").forEach((v) => (v.hidden = v.dataset.view !== name));
  }

  private visibleUntil(n: number): Set<string> {
    const s = new Set<string>();
    this.lesson.steps.slice(0, n + 1).forEach((st) => st.show.forEach((id) => s.add(id)));
    return s;
  }

  private go(n: number) {
    const steps = this.lesson.steps;
    n = Math.max(0, Math.min(steps.length - 1, n));
    const prevVisible = this.visibleUntil(this.step);
    this.step = n;
    const st = steps[n];
    const visible = this.visibleUntil(n);
    for (const [id, node] of this.nodes) {
      const show = visible.has(id);
      node.g.classList.toggle("hidden", !show);
      node.g.classList.toggle("enter", show && !prevVisible.has(id) && st.show.includes(id));
      node.g.classList.toggle("focus", st.focus.includes(id));
      node.g.classList.toggle("dim", show && st.focus.length > 0 && !st.focus.includes(id) && !st.show.includes(id));
    }
    this.$(".sp-count").textContent = `Paso ${n + 1} de ${steps.length}`;
    this.$(".sp-title").textContent = st.title;
    this.$(".sp-body").textContent = st.body;
    (this.$(".sp-prev") as HTMLButtonElement).disabled = n === 0;
    const next = this.$(".sp-next") as HTMLButtonElement;
    next.disabled = n === steps.length - 1;
    next.textContent = n === steps.length - 2 ? "Ir a la prueba" : "Siguiente paso";
    this.querySelectorAll(".sp-strip li").forEach((li, i) => {
      li.classList.toggle("current", i === n);
      li.classList.toggle("done", i < n);
    });
    this.highlight(st.code);
    if (st.focus.length === 1) this.inspect(st.focus[0], false);
    if (st.run && !this.board.running && !this.starting) this.start();
  }

  private highlight(range?: [number, number]) {
    const pre = this.$(".sp-code");
    let first: HTMLElement | null = null;
    pre.querySelectorAll<HTMLElement>(".ln").forEach((ln) => {
      const n = Number(ln.dataset.n);
      const on = !!range && n >= range[0] && n <= range[1];
      ln.classList.toggle("hl", on);
      if (on && !first) first = ln;
    });
    if (first) pre.scrollTop = (first as HTMLElement).offsetTop - pre.offsetTop - 24;
  }

  private inspect(id: string, switchTab = true) {
    const spec = this.specs.get(id);
    const wire = this.lesson.wires.find((w) => w.id === id);
    const type = spec?.type ?? "wire";
    const info = this.catalog[type];
    const box = this.$(".sp-piece");
    const item = spec?.item ? this.items[spec.item] : undefined;
    const where = wire ? `Va de ${wire.from.replace("uno.", "pin ").replace("bb.", "agujero ")} a ${wire.to.replace("uno.", "pin ").replace("bb.", "agujero ")}.`
      : spec?.at ? `Se ubica desde el agujero ${spec.at}.` : spec?.from ? `Va del agujero ${spec.from} al ${spec.to}.` : spec?.plus ? `Pata + en ${spec.plus}, pata − en ${spec.minus}.` : "";
    box.innerHTML = `
      <h3>${spec?.label ?? info.name}</h3>
      ${item ? `<p class="sp-bag">En la caja: bolsa <strong>${spec!.item}</strong> · ${item.name}</p>` : ""}
      <p>${info.what}</p>
      <h4>Cómo se conecta</h4>
      <p>${info.how}${where ? ` ${where}` : ""}</p>
      <h4>Cuidado</h4>
      <p>${info.care}</p>`;
    for (const n of this.nodes.values()) n.g.classList.remove("selected");
    this.nodes.get(id)?.g.classList.add("selected");
    if (switchTab) this.tab("pieza");
  }

  private refresh() {
    for (const n of this.nodes.values()) n.update?.(this.board);
    const bz = this.lesson.parts.find((p) => p.type === "buzzer");
    if (bz?.bind?.pin) this.beeper.set(this.board.level(bz.bind.pin) > 0.5);
  }

  private async start() {
    const load = FIRMWARE[this.project];
    if (!load || this.starting || this.board.running) return;
    this.starting = true;
    const all = this.lesson.steps.length - 1;
    if (this.step < all) this.go(all);
    const factory = (await load()).default;
    const params = { ...readParams(this.code), MODO_DEMO: this.demo };
    this.$(".sp-serial-out").textContent = "";
    this.$(".sp-play").textContent = "Detener";
    (this.$(".sp-reset") as HTMLButtonElement).disabled = false;
    this.classList.add("running");
    this.starting = false;
    run(this.board, factory(this.board, params)).finally(() => this.refresh());
  }

  private stop() {
    this.board.running = false;
    this.beeper.set(false);
    this.$(".sp-play").textContent = "Iniciar simulación";
    this.classList.remove("running");
    this.refresh();
  }
}

customElements.define("sim-player", SimPlayer);
