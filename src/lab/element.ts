import { chapterAt, Playback } from "./playback.ts";
import { simulationScenes } from "./scenes/index.ts";
import type {
  LabPalette,
  SimulationModel,
  SimulationSceneDefinition,
} from "./contracts.ts";
import type { LabViewer } from "./viewer.ts";

class SimulationLab extends HTMLElement {
  private definition!: SimulationSceneDefinition;
  private player!: Playback;
  private viewer?: LabViewer;
  private events?: AbortController;
  private themeObserver?: MutationObserver;
  private generation = 0;
  private frame = 0;
  private lastTime = 0;
  private lastChapter = -1;
  private activated = false;
  private selected?: string;

  private find<T extends HTMLElement>(selector: string): T {
    const element = this.querySelector<T>(selector);
    if (!element) throw new Error(`Missing lab element: ${selector}`);
    return element;
  }

  connectedCallback(): void {
    if (this.events) return;
    this.events = new AbortController();
    const options = { signal: this.events.signal };
    this.find("[data-no-script]").hidden = true;
    this.find<HTMLElement>("[data-controls]").hidden = false;
    this.addEventListener("click", this.onClick, options);
    this.find<HTMLSelectElement>("[data-scenes]").addEventListener(
      "change",
      (event) => {
        this.chooseScene((event.target as HTMLSelectElement).value);
      },
      options,
    );
    this.find<HTMLInputElement>("[data-timeline]").addEventListener(
      "input",
      (event) => {
        const time = Number((event.target as HTMLInputElement).value);
        this.pause();
        this.player.seek(time);
        this.paint();
      },
      options,
    );
    this.find<HTMLSelectElement>("[data-rate]").addEventListener(
      "change",
      (event) => {
        this.player.setRate(Number((event.target as HTMLSelectElement).value));
      },
      options,
    );
    this.find<HTMLInputElement>("[data-loop]").addEventListener(
      "change",
      (event) => {
        this.player.loop = (event.target as HTMLInputElement).checked;
      },
      options,
    );
    this.find<HTMLInputElement>("[data-exploded]").addEventListener(
      "change",
      () => this.paint(),
      options,
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) this.pause();
      },
      options,
    );
    window.addEventListener(
      "pagehide",
      () => {
        this.pause();
        this.deactivate();
      },
      options,
    );
    matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
      "change",
      () => this.pause(),
      options,
    );
    matchMedia("(prefers-color-scheme: dark)").addEventListener(
      "change",
      () => {
        if (this.activated) void this.loadViewer();
      },
      options,
    );
    this.themeObserver = new MutationObserver(() => {
      if (this.activated) void this.loadViewer();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    this.chooseScene(this.find<HTMLSelectElement>("[data-scenes]").value);
    this.setViewerState(
      "idle",
      "El modelo se carga solo cuando activas el visor. La guía y el reproductor funcionan también sin 3D.",
    );
  }

  disconnectedCallback(): void {
    this.pause();
    this.deactivate();
    this.events?.abort();
    this.events = undefined;
    this.themeObserver?.disconnect();
  }

  private deactivate(): void {
    this.generation++;
    this.activated = false;
    this.viewer?.dispose();
    this.viewer = undefined;
    this.setViewerState("idle", "Activa el visor para explorar el modelo.");
  }

  private chooseScene(id: string): void {
    this.pause();
    this.definition = simulationScenes.get(id);
    this.player = new Playback(this.definition.duration);
    this.lastChapter = -1;
    this.selected = undefined;
    this.find<HTMLSelectElement>("[data-scenes]").value = id;
    this.find<HTMLInputElement>("[data-timeline]").max = String(
      this.definition.duration,
    );
    this.find<HTMLSelectElement>("[data-rate]").value = "1";
    this.find<HTMLInputElement>("[data-loop]").checked = false;
    this.find<HTMLInputElement>("[data-exploded]").checked = false;
    this.find("[data-scene-summary]").textContent = this.definition.summary;
    this.find("[data-scene-title]").textContent = this.definition.title;
    this.find("[data-inspector-title]").textContent = "Selecciona una pieza";
    this.find("[data-inspector-description]").textContent =
      "Puedes tocar el modelo o usar los botones de componentes. Ambos muestran la misma explicación.";
    this.find<HTMLButtonElement>('[data-action="focus"]').disabled = true;
    this.find("[data-parts]").replaceChildren(
      ...this.definition.components.map((part) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.part = part.id;
        button.textContent = part.label;
        button.setAttribute("aria-pressed", "false");
        return button;
      }),
    );
    this.find("[data-chapters]").replaceChildren(
      ...this.definition.chapters.map((chapter, index) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.chapter = String(index);
        button.textContent = `${index + 1}. ${chapter.title}`;
        item.append(button);
        return item;
      }),
    );
    this.paint();
    if (this.activated) void this.loadViewer();
  }

  private onClick = (event: MouseEvent): void => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button",
    );
    if (!button || !this.contains(button)) return;
    if (button.dataset.part) {
      this.inspect(button.dataset.part);
      return;
    }
    if (button.dataset.chapter !== undefined) {
      this.pause();
      this.player.seek(
        this.definition.chapters[Number(button.dataset.chapter)].at,
      );
      this.paint();
      return;
    }
    switch (button.dataset.action) {
      case "activate":
        this.activated = true;
        void this.loadViewer();
        break;
      case "play":
        if (this.player.playing) this.pause();
        else {
          this.player.play();
          this.lastTime = performance.now();
          this.tick(this.lastTime);
        }
        break;
      case "previous":
        this.pause();
        this.player.step(this.definition.chapters, -1);
        this.paint();
        break;
      case "next":
        this.pause();
        this.player.step(this.definition.chapters, 1);
        this.paint();
        break;
      case "reset":
        this.pause();
        this.player.reset();
        this.paint();
        break;
      case "home":
        this.viewer?.preset(false);
        break;
      case "top":
        this.viewer?.preset(true);
        break;
      case "zoom-in":
        this.viewer?.zoom(0.8);
        break;
      case "zoom-out":
        this.viewer?.zoom(1.25);
        break;
      case "focus":
        this.viewer?.preset(false, this.selected);
        break;
      case "fullscreen":
        void this.fullscreen();
        break;
    }
  };

  private async fullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement === this) await document.exitFullscreen();
      else if (this.requestFullscreen) await this.requestFullscreen();
      else
        this.find("[data-viewer-message]").textContent =
          "Este navegador no admite pantalla completa. Puedes ampliar el modelo con los controles de zoom.";
    } catch {
      this.find("[data-viewer-message]").textContent =
        "No se pudo activar pantalla completa. El resto de los controles sigue disponible.";
    }
  }

  private inspect(id: string): void {
    const part = this.definition.components.find(
      (component) => component.id === id,
    );
    if (!part) return;
    this.selected = id;
    this.find("[data-inspector-title]").textContent = part.label;
    this.find("[data-inspector-description]").textContent = part.description;
    this.querySelectorAll<HTMLButtonElement>("[data-part]").forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.part === id)),
    );
    this.find<HTMLButtonElement>('[data-action="focus"]').disabled =
      !this.viewer;
    this.viewer?.select(id);
  }

  private pause(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.player?.pause();
    if (this.player) this.paint();
  }

  private tick = (now: number): void => {
    this.frame = 0;
    if (!this.isConnected || !this.player.playing) return;
    this.player.advance(Math.min(0.1, (now - this.lastTime) / 1000));
    this.lastTime = now;
    this.paint();
    if (this.player.playing) this.frame = requestAnimationFrame(this.tick);
  };

  private paint(): void {
    const index = chapterAt(this.definition.chapters, this.player.time);
    const chapter = this.definition.chapters[index];
    this.find<HTMLButtonElement>('[data-action="play"]').textContent = this
      .player.playing
      ? "Pausar"
      : "Reproducir";
    this.find("[data-time]").textContent =
      `${this.player.time.toFixed(1)} / ${this.player.duration.toFixed(1)} s`;
    this.find<HTMLInputElement>("[data-timeline]").value = String(
      this.player.time,
    );
    if (index !== this.lastChapter) {
      this.lastChapter = index;
      this.find("[data-chapter-title]").textContent = chapter.title;
      this.find("[data-chapter-description]").textContent = chapter.description;
      this.find("[data-signal]").textContent =
        chapter.signal ?? "En observación";
      this.find("[data-code]").textContent =
        chapter.code ?? "// Selecciona una pieza para conocer su función.";
      this.find("[data-step-count]").textContent =
        `Paso ${index + 1} de ${this.definition.chapters.length}`;
      this.querySelectorAll<HTMLButtonElement>("[data-chapter]").forEach(
        (button) => {
          if (Number(button.dataset.chapter) === index)
            button.setAttribute("aria-current", "step");
          else button.removeAttribute("aria-current");
        },
      );
    }
    this.find<HTMLButtonElement>('[data-action="previous"]').disabled =
      index === 0;
    this.find<HTMLButtonElement>('[data-action="next"]').disabled =
      index === this.definition.chapters.length - 1;
    this.viewer?.update(
      this.player.time,
      this.find<HTMLInputElement>("[data-exploded]").checked,
    );
  }

  private palette(): LabPalette {
    const styles = getComputedStyle(this);
    const value = (token: string) => styles.getPropertyValue(token).trim();
    return {
      paper: value("--paper"),
      surface: value("--surface"),
      ink: value("--ink"),
      copper: value("--copper"),
      line: value("--line"),
      accent: value("--inner"),
      ok: value("--ok"),
    };
  }

  private setViewerState(state: string, message: string): void {
    this.dataset.viewerState = state;
    this.find("[data-viewer-message]").textContent = message;
    this.find("[data-placeholder]").hidden = state === "ready";
    const activate = this.find<HTMLButtonElement>('[data-action="activate"]');
    activate.disabled = state === "loading";
    activate.textContent =
      state === "loading"
        ? "Cargando modelo…"
        : state === "unavailable"
          ? "Reintentar visor 3D"
          : "Activar visor 3D";
    this.querySelectorAll<HTMLButtonElement>("[data-camera]").forEach(
      (button) => {
        button.disabled = state !== "ready";
      },
    );
    this.find<HTMLInputElement>("[data-exploded]").disabled = state !== "ready";
    this.find<HTMLButtonElement>('[data-action="focus"]').disabled =
      state !== "ready" || !this.selected;
  }

  private async loadViewer(): Promise<void> {
    const generation = ++this.generation;
    this.viewer?.dispose();
    this.viewer = undefined;
    this.setViewerState(
      "loading",
      "Cargando el motor y el modelo de esta experiencia…",
    );
    let model: SimulationModel | undefined;
    try {
      const [{ LabViewer }, factory] = await Promise.all([
        import("./viewer.ts"),
        this.definition.load(),
      ]);
      if (!this.isConnected || generation !== this.generation) return;
      const palette = this.palette();
      model = factory(palette);
      model.update(
        this.player.time,
        this.find<HTMLInputElement>("[data-exploded]").checked,
      );
      this.viewer = new LabViewer(
        this.find("[data-viewport]"),
        model,
        palette,
        (id) => this.inspect(id),
        () => {
          if (generation !== this.generation) return;
          this.pause();
          this.viewer?.dispose();
          this.viewer = undefined;
          this.setViewerState(
            "unavailable",
            "Se perdió el contexto gráfico. Puedes continuar con la guía o reintentar el visor.",
          );
        },
      );
      model = undefined;
      this.setViewerState(
        "ready",
        "Visor 3D listo. Arrastra para girar o usa los controles de cámara.",
      );
      if (this.selected) this.inspect(this.selected);
      this.paint();
    } catch {
      model?.dispose();
      if (!this.isConnected || generation !== this.generation) return;
      this.setViewerState(
        "unavailable",
        "El visor 3D no está disponible. Comprueba WebGL y tu conexión, reintenta o continúa con la guía y el reproductor.",
      );
    }
  }
}

if (!customElements.get("simulation-lab"))
  customElements.define("simulation-lab", SimulationLab);
