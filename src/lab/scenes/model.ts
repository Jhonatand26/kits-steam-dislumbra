import {
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from "three";
import type { Object3D } from "three";
import type { LabPalette, SimulationModel } from "../contracts.ts";

export function box(
  parent: Object3D,
  size: [number, number, number],
  position: [number, number, number],
  color: string,
): Mesh {
  const mesh = new Mesh(
    new BoxGeometry(...size),
    new MeshStandardMaterial({ color, roughness: 0.58 }),
  );
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function cylinder(
  parent: Object3D,
  radius: number,
  height: number,
  position: [number, number, number],
  color: string,
): Mesh {
  const mesh = new Mesh(
    new CylinderGeometry(radius, radius, height, 24),
    new MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.25 }),
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function label(
  parent: Object3D,
  text: string,
  position: [number, number, number],
  width: number,
  color: string,
): void {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = color;
  context.font = "600 46px Barlow, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 48);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const mesh = new Mesh(
    new PlaneGeometry(width, (width * 96) / 512),
    new MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      roughness: 1,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(...position);
  parent.add(mesh);
}

export function wire(
  parent: Object3D,
  points: [number, number, number][],
  color: string,
): CatmullRomCurve3 {
  const curve = new CatmullRomCurve3(
    points.map((point) => new Vector3(...point)),
  );
  parent.add(
    new Mesh(
      new TubeGeometry(curve, 48, 0.045, 8, false),
      new MeshStandardMaterial({ color, roughness: 0.55 }),
    ),
  );
  return curve;
}

export function component(root: Group, id: string): Group {
  const group = new Group();
  group.name = id;
  group.userData.componentId = id;
  root.add(group);
  return group;
}

export function disposeTree(root: Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (material instanceof MeshStandardMaterial) material.map?.dispose();
      material.dispose();
    }
  });
  root.clear();
}

export function buildUno(palette: LabPalette): SimulationModel {
  const root = new Group();
  const board = component(root, "board");
  box(board, [6.8, 0.16, 5.3], [0, 0, 0], palette.accent);
  // Original simplified geometry, not an electrical or fabrication blueprint.
  for (const x of [-2.9, 2.9])
    for (const z of [-2.12, 2.12]) {
      cylinder(board, 0.19, 0.025, [x, 0.09, z], palette.copper);
      cylinder(board, 0.1, 0.03, [x, 0.11, z], palette.ink);
    }
  for (let i = 0; i < 6; i++) {
    box(
      board,
      [2.8, 0.012, 0.022],
      [0.8, 0.09, -0.8 + i * 0.27],
      palette.copper,
    );
  }
  label(board, "UNO  /  DISLUMBRA", [0, 0.1, 1.65], 3, palette.paper);
  label(board, "MODELO EDUCATIVO", [0.1, 0.1, 1.98], 2.5, palette.paper);

  const usb = component(root, "usb");
  box(usb, [1.25, 0.85, 1.1], [-2.95, 0.5, -0.9], palette.line);
  box(usb, [0.04, 0.54, 0.75], [-3.59, 0.5, -0.9], palette.ink);
  cylinder(usb, 0.31, 0.6, [-2.75, 0.4, 1.0], palette.ink);

  const chip = component(root, "chip");
  box(chip, [2.35, 0.4, 0.8], [0.35, 0.4, 0.1], palette.ink);
  label(chip, "ATmega328P", [0.35, 0.61, 0.1], 1.85, palette.paper);
  for (let i = 0; i < 14; i++)
    for (const z of [-0.44, 0.64]) {
      box(chip, [0.07, 0.19, 0.21], [-0.7 + i * 0.16, 0.22, z], palette.line);
    }

  const headers = component(root, "headers");
  for (const z of [-2.2, 2.2]) {
    box(headers, [3.7, 0.4, 0.34], [0.6, 0.32, z], palette.ink);
    for (let i = 0; i < 14; i++) {
      box(
        headers,
        [0.1, 0.015, 0.12],
        [-1.05 + i * 0.25, 0.53, z],
        palette.copper,
      );
    }
  }
  label(headers, "DIGITAL", [0.7, 0.12, -1.78], 1.5, palette.paper);
  label(headers, "POWER  /  ANALOG", [0.8, 0.12, 1.0], 2.2, palette.paper);
  const targets = new Map<string, Object3D>([
    ["board", board],
    ["usb", usb],
    ["chip", chip],
    ["headers", headers],
  ]);
  return {
    root,
    targets,
    update(_time, exploded) {
      chip.position.y = exploded ? 1.3 : 0;
      headers.position.y = exploded ? 0.8 : 0;
      usb.position.y = exploded ? 0.5 : 0;
    },
    dispose() {
      disposeTree(root);
    },
  };
}
