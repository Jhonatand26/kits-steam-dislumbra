import type { Group, Object3D } from "three";

export interface Chapter {
  readonly at: number;
  readonly title: string;
  readonly description: string;
  readonly signal?: string;
  readonly code?: string;
}

export interface LabComponent {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface LabPalette {
  paper: string;
  surface: string;
  ink: string;
  copper: string;
  line: string;
  accent: string;
  ok: string;
}

/** Scene factories own their GPU resources; the viewer owns the renderer. */
export interface SimulationModel {
  root: Group;
  targets: ReadonlyMap<string, Object3D>;
  update(time: number, exploded: boolean): void;
  dispose(): void;
}

export type SceneFactory = (palette: LabPalette) => SimulationModel;

export interface SimulationSceneDefinition {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly duration: number;
  readonly chapters: readonly Chapter[];
  readonly components: readonly LabComponent[];
  readonly load: () => Promise<SceneFactory>;
}
