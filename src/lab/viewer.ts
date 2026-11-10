import {
  AmbientLight,
  Box3,
  BoxHelper,
  Color,
  DirectionalLight,
  GridHelper,
  PCFShadowMap,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Spherical,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Object3D } from "three";
import type { LabPalette, SimulationModel } from "./contracts.ts";

/** No scene IDs or lesson-specific branches belong in this renderer. */
export class LabViewer {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(38, 1, 0.1, 150);
  private readonly controls: OrbitControls;
  private readonly observer: ResizeObserver;
  private readonly events = new AbortController();
  private readonly grid: GridHelper;
  private readonly selection: BoxHelper;
  private frame = 0;
  private disposed = false;
  private selected?: string;
  private down = new Vector2();
  private readonly model: SimulationModel;

  constructor(
    host: HTMLElement,
    model: SimulationModel,
    palette: LabPalette,
    select: (id: string) => void,
    lost: () => void,
  ) {
    this.model = model;
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    const canvas = this.renderer.domElement;
    canvas.setAttribute("aria-label", "Vista 3D interactiva");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-describedby", "lab-viewer-help");
    canvas.tabIndex = 0;
    host.append(canvas);
    this.scene.background = new Color(palette.paper);
    this.scene.add(model.root, new AmbientLight(0xffffff, 2.4));
    const light = new DirectionalLight(0xffffff, 3.5);
    light.position.set(3, 9, 6);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = light.shadow.camera.bottom = -10;
    light.shadow.camera.right = light.shadow.camera.top = 10;
    this.scene.add(light);
    this.grid = new GridHelper(24, 48, palette.line, palette.line);
    this.grid.position.y = -0.15;
    this.scene.add(this.grid);
    this.selection = new BoxHelper(model.root, palette.copper);
    this.selection.visible = false;
    this.scene.add(this.selection);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 45;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.addEventListener("change", this.requestRender);

    const options = { signal: this.events.signal };
    canvas.addEventListener(
      "pointerdown",
      (event) => this.down.set(event.clientX, event.clientY),
      options,
    );
    canvas.addEventListener(
      "pointerup",
      (event) => {
        if (this.down.distanceTo(new Vector2(event.clientX, event.clientY)) > 5)
          return;
        const rect = canvas.getBoundingClientRect();
        const point = new Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const ray = new Raycaster();
        ray.setFromCamera(point, this.camera);
        let object: Object3D | null =
          ray.intersectObject(model.root, true)[0]?.object ?? null;
        while (object) {
          const id = object.userData.componentId;
          if (typeof id === "string") {
            select(id);
            break;
          }
          object = object.parent;
        }
      },
      options,
    );
    canvas.addEventListener(
      "keydown",
      (event) => {
        const delta = this.camera.position.clone().sub(this.controls.target);
        const spherical = new Spherical().setFromVector3(delta);
        if (event.key === "ArrowLeft") spherical.theta -= 0.15;
        else if (event.key === "ArrowRight") spherical.theta += 0.15;
        else if (event.key === "ArrowUp")
          spherical.phi = Math.max(0.05, spherical.phi - 0.1);
        else if (event.key === "ArrowDown")
          spherical.phi = Math.min(1.5, spherical.phi + 0.1);
        else if (event.key === "+" || event.key === "=") {
          this.zoom(0.8);
          event.preventDefault();
          return;
        } else if (event.key === "-") {
          this.zoom(1.25);
          event.preventDefault();
          return;
        } else if (event.key === "Home") {
          this.preset(false);
          event.preventDefault();
          return;
        } else return;
        event.preventDefault();
        this.camera.position
          .copy(this.controls.target)
          .add(new Vector3().setFromSpherical(spherical));
        this.controls.update();
      },
      options,
    );
    canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        lost();
      },
      options,
    );
    this.observer = new ResizeObserver(() => this.resize(host));
    this.observer.observe(host);
    this.resize(host);
    this.preset(false);
  }

  private resize(host: HTMLElement): void {
    if (this.disposed) return;
    const { width, height } = host.getBoundingClientRect();
    this.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    this.camera.aspect = Math.max(1, width) / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.requestRender();
  }

  private requestRender = (): void => {
    if (this.disposed || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      if (!this.disposed) this.renderer.render(this.scene, this.camera);
    });
  };

  update(time: number, exploded: boolean): void {
    this.model.update(time, exploded);
    if (this.selected)
      this.selection.setFromObject(this.model.targets.get(this.selected)!);
    this.requestRender();
  }

  select(id: string): void {
    const target = this.model.targets.get(id);
    if (!target) return;
    this.selected = id;
    this.selection.setFromObject(target);
    this.selection.visible = true;
    this.requestRender();
  }

  preset(top: boolean, id?: string): void {
    const target = (id && this.model.targets.get(id)) || this.model.root;
    const bounds = new Box3().setFromObject(target);
    const center = bounds.getCenter(new Vector3());
    const radius = Math.max(1.2, bounds.getSize(new Vector3()).length() / 2);
    const distance = Math.min(
      42,
      (radius /
        Math.sin((19 * Math.PI) / 180) /
        Math.min(1, this.camera.aspect)) *
        1.05,
    );
    this.camera.up.set(0, 1, 0);
    this.camera.position
      .copy(center)
      .add(
        new Vector3(top ? 0 : 1, top ? 1 : 1.15, top ? 0.001 : 1.4)
          .normalize()
          .multiplyScalar(distance),
      );
    this.controls.target.copy(center);
    this.controls.update();
    this.requestRender();
  }

  zoom(factor: number): void {
    const offset = this.camera.position
      .clone()
      .sub(this.controls.target)
      .multiplyScalar(factor);
    offset.clampLength(this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.events.abort();
    this.observer.disconnect();
    this.controls.removeEventListener("change", this.requestRender);
    this.controls.dispose();
    this.model.dispose();
    this.grid.geometry.dispose();
    const materials = Array.isArray(this.grid.material)
      ? this.grid.material
      : [this.grid.material];
    materials.forEach((material) => material.dispose());
    this.selection.geometry.dispose();
    this.selection.material.dispose();
    this.scene.traverse((object) => {
      if (object instanceof DirectionalLight) object.shadow.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.scene.clear();
  }
}
