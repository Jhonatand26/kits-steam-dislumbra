// <sim-player>: lección paso a paso + simulación interactiva.
// Recibe la lección, el catálogo de piezas y el código como JSON; la
// lógica de cada proyecto llega como fábrica de firmware.

import { STAGE } from "./geometry";
import { RENDERERS, el, renderWire, type PartSpec, type Rendered } from "./parts";
import { Beeper, Board, run, type FirmwareFactory } from "./runtime";
import type { Lesson } from "./lesson";
import { readParameters, type Parameters } from "./parameters";
import { configuredCode, resolveEndpoint, resolvePart, wireEnabled } from "./configuration";
import { bindButton } from "./buttons";
interface Catalog { [type: string]: { name: string; what: string; how: string; care: string } }
interface Items { [id: string]: { name: string; status: string } }

const FIRMWARE: Record<string, () => Promise<{ default: FirmwareFactory }>> = {
  "C06-P1": () => import("./firmware/c06-p1"),
};

class SimPlayer extends HTMLElement {
  private static instances = 0;
  private instanceId = `sim-${++SimPlayer.instances}`;
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
  private params: Parameters = {};
  private overrides: Parameters = {};
  private starting = false;
  private request = 0;
  private serialBuffer = "";
  private initialized = false;

  connectedCallback() {
    if (this.initialized) return;
    const data = JSON.parse(this.querySelector("script[type='application/json']")!.textContent!);
    this.lesson = data.lesson;
    this.catalog = data.catalog;
    this.items = data.items;
    this.code = data.code;
    this.project = data.project;
    this.params = readParameters(this.code);
    this.initialized = true;
    this.build();
    this.go(0);
  }

  disconnectedCallback() {
    this.stop();
    this.beeper.dispose();
  }

  private $(sel: string) { return this.querySelector(sel) as HTMLElement; }

  private build() {
    this.innerHTML = `
      <div class="sp">
        <div class="sp-stage">
          <p class="sp-stage-label">Banco de pruebas <span class="sp-state" role="status">Detenido</span></p>
          <div class="sp-svg"></div>
          <p class="sp-pan-hint">Desliza el montaje para recorrer la placa. También puedes usar los pulsadores de abajo.</p>
          <div class="sp-inputs" aria-label="Pulsadores del circuito"></div>
          <div class="sp-run">
            <button class="sp-play" type="button">Iniciar simulación</button>
            <button class="sp-reset" type="button" disabled>Reiniciar</button>
            <label class="sp-toggle"><input type="checkbox" class="sp-sound" checked> Sonido</label>
          </div>
          <details class="sp-settings">
            <summary>Configuración del experimento</summary>
            <p class="sp-hint">Cambiar una opción reinicia el experimento y sus contadores. El código y el montaje se ajustan juntos.</p>
            <div class="sp-controls"></div>
          </details>
        </div>
        <aside class="sp-panel">
          <div class="sp-tabs" role="tablist" aria-label="Explorar el montaje">
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
            <p class="sp-hint">Sketch con la configuración seleccionada. El simulador reproduce su comportamiento; no compila C++ ni calcula corrientes.</p>
            <pre class="sp-code"></pre>
          </section>
        </aside>
        <div class="sp-serial">
          <p class="sp-serial-title">Monitor serie</p>
          <pre class="sp-serial-out" role="log" aria-live="polite">La simulación está detenida.</pre>
        </div>
        <ol class="sp-strip"></ol>
      </div>`;

    this.drawScene();
    this.renderCode();

    // Tira de pasos
    const strip = this.$(".sp-strip");
    this.lesson.steps.forEach((s, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<button type="button"><span>${i + 1}</span>${s.title}</button>`;
      li.querySelector("button")!.addEventListener("click", () => this.go(i));
      strip.appendChild(li);
    });

    const tabs = [...this.querySelectorAll<HTMLButtonElement>(".sp-tabs button")];
    tabs.forEach((button, i) => {
      const name = button.dataset.tab!;
      button.id = `${this.instanceId}-tab-${name}`;
      button.setAttribute("aria-controls", `${this.instanceId}-view-${name}`);
      const view = this.$(`[data-view="${name}"]`);
      view.id = `${this.instanceId}-view-${name}`;
      view.setAttribute("role", "tabpanel");
      view.setAttribute("aria-labelledby", button.id);
      view.tabIndex = 0;
      button.addEventListener("click", () => this.tab(name));
      button.addEventListener("keydown", (event) => {
        const target = event.key === "ArrowRight" ? (i + 1) % tabs.length
          : event.key === "ArrowLeft" ? (i + tabs.length - 1) % tabs.length
          : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
        if (target < 0) return;
        event.preventDefault();
        this.tab(tabs[target].dataset.tab!);
        tabs[target].focus();
      });
    });
    this.tab("paso");
    this.$(".sp-prev").addEventListener("click", () => this.go(this.step - 1));
    this.$(".sp-next").addEventListener("click", () => this.go(this.step + 1));
    this.$(".sp-play").addEventListener("click", () => (this.board.running || this.starting ? this.stop() : void this.start()));
    this.$(".sp-reset").addEventListener("click", () => { this.stop(); void this.start(); });
    for (const control of this.lesson.controls) {
      const label = document.createElement("label");
      label.className = "sp-control";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.parameter = control.parameter;
      input.checked = Boolean(this.params[control.parameter]);
      const help = document.createElement("small");
      help.id = `${this.instanceId}-${control.parameter}-help`;
      help.textContent = control.help;
      input.setAttribute("aria-describedby", help.id);
      label.append(input, document.createTextNode(control.label), help);
      input.addEventListener("change", () => {
        const restart = this.board.running || this.starting;
        this.stop();
        this.overrides[control.parameter] = input.checked;
        this.params = readParameters(this.code, this.overrides);
        this.drawScene();
        this.renderCode();
        this.go(this.step);
        if (restart) void this.start();
      });
      this.$(".sp-controls").append(label);
    }
    const sound = this.$(".sp-sound") as HTMLInputElement;
    sound.addEventListener("change", () => {
      this.beeper.enabled = sound.checked;
      if (sound.checked) this.beeper.unlock();
      this.refresh();
    });
    this.board.onChange = () => this.refresh();
    this.board.onSerial = (text) => {
      this.serialBuffer = (this.serialBuffer + text).split("\n").slice(-12).join("\n");
      const out = this.$(".sp-serial-out");
      out.textContent = this.serialBuffer;
      out.scrollTop = out.scrollHeight;
    };
  }

  private drawScene() {
    this.nodes.clear();
    this.specs.clear();
    this.$(".sp-svg").replaceChildren();
    this.$(".sp-inputs").replaceChildren();
    this.$(".sp-piece").replaceChildren();
    this.svg = el("svg", { viewBox: `0 0 ${STAGE.w} ${STAGE.h}`, class: "sp-canvas", role: "group", "aria-label": "Montaje del circuito: selecciona una pieza para inspeccionarla" });
    const defs = el("defs", {}, this.svg);
    const f = el("filter", { id: `${this.instanceId}-glow`, x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
    el("feGaussianBlur", { stdDeviation: 6 }, f);
    this.$(".sp-svg").appendChild(this.svg);
    const layerParts = el("g", {}, this.svg);
    const layerWires = el("g", {}, this.svg);
    const layerTop = el("g", {}, this.svg);
    for (const source of this.lesson.parts) {
      const spec = resolvePart(source, this.params);
      const r = RENDERERS[spec.type](spec, this.board);
      r.g.querySelector<SVGElement>(".led-glow")?.style.setProperty("filter", `url(#${this.instanceId}-glow)`);
      this.nodes.set(spec.id, r);
      this.specs.set(spec.id, spec);
      (spec.type === "arduino-uno" || spec.type === "breadboard" ? layerParts : layerTop).appendChild(r.g);
      if (spec.type === "button") {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = spec.label;
        button.style.setProperty("--button-color", spec.cap ?? "var(--ink)");
        bindButton(button, this.board, spec.bind!.pin);
        this.$(".sp-inputs").append(button);
      }
    }
    for (const w of this.lesson.wires) {
      const r = renderWire({ ...w, from: resolveEndpoint(w.from, this.params), to: resolveEndpoint(w.to, this.params) });
      this.nodes.set(w.id, r);
      layerWires.appendChild(r.g);
    }
    this.svg.addEventListener("click", (e) => {
      const g = (e.target as Element).closest(".part") as SVGGElement | null;
      if (g) this.inspect(g.dataset.id!);
    });
    this.svg.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const group = (event.target as Element).closest<SVGGElement>(".part");
      if (group) this.inspect(group.dataset.id!);
    });
    this.refresh();
  }

  private renderCode() {
    // Código con números de línea
    const pre = this.$(".sp-code");
    pre.replaceChildren();
    configuredCode(this.code, this.lesson.controls, this.params).split("\n").forEach((line, i) => {
      const span = document.createElement("span");
      span.className = "ln";
      span.dataset.n = String(i + 1);
      span.textContent = line || " ";
      pre.appendChild(span);
    });

  }

  private tab(name: string) {
    this.querySelectorAll<HTMLButtonElement>(".sp-tabs button").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.tab === name));
      b.tabIndex = b.dataset.tab === name ? 0 : -1;
    });
    this.querySelectorAll<HTMLElement>(".sp-view").forEach((v) => (v.hidden = v.dataset.view !== name));
    if (name === "codigo") this.highlight(this.lesson.steps[this.step].code);
  }

  private visibleUntil(n: number): Set<string> {
    const s = new Set<string>();
    this.lesson.steps.slice(0, n + 1).forEach((st) => st.show.forEach((id) => s.add(id)));
    return s;
  }

  private go(n: number) {
    const steps = this.lesson.steps;
    n = Math.max(0, Math.min(steps.length - 1, n));
    if (n < steps.length - 1 && (this.board.running || this.starting)) this.stop();
    const prevVisible = this.visibleUntil(this.step);
    this.step = n;
    const st = steps[n];
    const visible = this.visibleUntil(n);
    for (const [id, node] of this.nodes) {
      const wire = this.lesson.wires.find((wire) => wire.id === id);
      const show = visible.has(id) && (!wire || wireEnabled(wire, this.params));
      node.g.classList.toggle("hidden", !show);
      node.g.setAttribute("aria-hidden", String(!show));
      node.g.setAttribute("tabindex", show ? "0" : "-1");
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
      li.querySelector("button")!.setAttribute("aria-current", i === n ? "step" : "false");
    });
    this.highlight(st.code);
    if (st.focus.length === 1) this.inspect(st.focus[0], false);
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
    const where = wire ? `Va de ${resolveEndpoint(wire.from, this.params).replace("uno.", "pin ").replace("bb.", "agujero ")} a ${resolveEndpoint(wire.to, this.params).replace("uno.", "pin ").replace("bb.", "agujero ")}.`
      : spec?.at ? `Se ubica desde el agujero ${spec.at}.` : spec?.from ? `Va del agujero ${spec.from} al ${spec.to}.` : spec?.plus ? `Pata + en ${spec.plus}, pata − en ${spec.minus}.` : "";
    box.innerHTML = `
      <h3>${spec?.label ?? info.name}</h3>
      ${item ? `<p class="sp-bag">Referencia <strong>${spec!.item}</strong> · ${item.name}. Consulta su disponibilidad en la lista de materiales.</p>` : ""}
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
    const bz = [...this.specs.values()].find((p) => p.type === "buzzer" || p.type === "buzzer-module");
    this.beeper.set(!!bz?.bind?.pin && this.board.activeLevel(bz.bind.pin, bz.activeLow) > 0.5);
    this.querySelectorAll<HTMLButtonElement>(".sp-inputs button").forEach((button) => {
      button.disabled = !this.board.running;
      if (!this.board.running) button.setAttribute("aria-pressed", "false");
    });
  }

  private async start() {
    const load = FIRMWARE[this.project];
    if (!load || this.starting || this.board.running) return;
    const all = this.lesson.steps.length - 1;
    if (this.step < all) this.go(all);
    const request = ++this.request;
    this.starting = true;
    this.beeper.unlock();
    this.$(".sp-play").textContent = "Cancelar inicio";
    this.$(".sp-state").textContent = "Preparando…";
    try {
      const factory = (await load()).default;
      if (request !== this.request || !this.isConnected) return;
      this.serialBuffer = "";
      this.$(".sp-serial-out").textContent = "";
      this.$(".sp-play").textContent = "Detener";
      this.$(".sp-state").textContent = "En marcha · oprime un botón";
      (this.$(".sp-reset") as HTMLButtonElement).disabled = false;
      this.classList.add("running");
      this.starting = false;
      await run(this.board, factory(this.board, this.params));
    } catch (error) {
      if (request === this.request) this.$(".sp-serial-out").textContent = `No se pudo ejecutar: ${error instanceof Error ? error.message : error}`;
    } finally {
      if (request === this.request) this.stop();
    }
  }

  private stop() {
    this.request++;
    this.starting = false;
    this.board.stop();
    this.beeper.set(false);
    this.$(".sp-play").textContent = "Iniciar simulación";
    this.$(".sp-state").textContent = "Detenido";
    (this.$(".sp-reset") as HTMLButtonElement).disabled = true;
    this.classList.remove("running");
    this.refresh();
  }
}

if (!customElements.get("sim-player")) customElements.define("sim-player", SimPlayer);
