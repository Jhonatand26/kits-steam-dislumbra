import { Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import type { Object3D } from "three";
import type { SceneFactory } from "../contracts.ts";
import {
  box,
  buildUno,
  component,
  cylinder,
  disposeTree,
  label,
  wire,
} from "./model.ts";

export const createLedScene: SceneFactory = (palette) => {
  const root = new Group();
  const uno = buildUno(palette);
  uno.root.scale.setScalar(0.65);
  uno.root.position.set(-3.2, 0.12, 0);
  uno.root.traverse((object) => {
    delete object.userData.componentId;
  });
  uno.root.userData.componentId = "board";
  root.add(uno.root);

  const resistor = component(root, "resistor");
  box(resistor, [1.25, 0.34, 0.5], [0.5, 0.4, -0.5], palette.paper);
  for (const x of [0.12, 0.34, 0.77])
    box(resistor, [0.09, 0.35, 0.51], [x, 0.4, -0.5], palette.copper);
  label(resistor, "RESISTENCIA", [0.5, 0.1, 0.3], 2.2, palette.ink);

  const led = component(root, "led");
  const lightMaterial = new MeshStandardMaterial({
    color: palette.ok,
    emissive: palette.ok,
    emissiveIntensity: 0,
    roughness: 0.22,
  });
  const bulb = new Mesh(new SphereGeometry(0.45, 32, 24), lightMaterial);
  bulb.position.set(3.2, 0.95, -0.5);
  bulb.castShadow = true;
  led.add(bulb);
  cylinder(led, 0.45, 0.35, [3.2, 0.7, -0.5], palette.ok);
  for (const z of [-0.67, -0.33])
    box(led, [0.06, 0.6, 0.06], [3.2, 0.25, z], palette.line);
  label(led, "LED", [3.2, 0.1, 0.35], 0.9, palette.ink);

  const signal = component(root, "signal");
  const path = wire(
    signal,
    [
      [-1.2, 0.35, -0.5],
      [-0.6, 0.5, -0.5],
      [0.5, 0.42, -0.5],
      [2, 0.35, -0.5],
      [3.2, 0.3, -0.5],
    ],
    palette.copper,
  );
  wire(
    signal,
    [
      [3.2, 0.25, -0.3],
      [3.5, 0.15, 1.5],
      [0, 0.15, 1.7],
      [-2, 0.25, 1.2],
    ],
    palette.accent,
  );
  const markers = Array.from({ length: 5 }, () => {
    const marker = new Mesh(
      new SphereGeometry(0.075, 12, 8),
      new MeshStandardMaterial({
        color: palette.paper,
        emissive: palette.copper,
        emissiveIntensity: 0.7,
      }),
    );
    signal.add(marker);
    return marker;
  });
  const targets = new Map<string, Object3D>([
    ["board", uno.root],
    ["resistor", resistor],
    ["led", led],
    ["signal", signal],
  ]);
  return {
    root,
    targets,
    update(time, exploded) {
      const high = Math.floor(Math.min(time, 7.999) / 2) % 2 === 1;
      lightMaterial.emissiveIntensity = high ? 1.8 : 0;
      bulb.scale.setScalar(high ? 1.05 : 1);
      resistor.position.y = exploded ? 0.8 : 0;
      led.position.y = exploded ? 0.8 : 0;
      uno.update(time, exploded);
      markers.forEach((marker, index) => {
        marker.visible = high && !exploded;
        marker.position.copy(
          path.getPointAt((time * 0.25 + index / markers.length) % 1),
        );
      });
    },
    dispose() {
      disposeTree(root);
    },
  };
};
