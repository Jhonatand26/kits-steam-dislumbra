import type { SimulationSceneDefinition } from "./contracts.ts";

/** Adding a scene is registration, not a branch in the viewer or UI. */
export class SimulationSceneRegistry {
  private readonly scenes = new Map<string, SimulationSceneDefinition>();

  register(scene: SimulationSceneDefinition): this {
    if (this.scenes.has(scene.id))
      throw new Error(`Duplicate scene: ${scene.id}`);
    if (!/^[a-z][a-z0-9-]*$/.test(scene.id))
      throw new Error("Invalid scene ID");
    if (!Number.isFinite(scene.duration) || scene.duration <= 0) {
      throw new Error("Invalid scene duration");
    }
    if (
      !scene.chapters.length ||
      scene.chapters[0].at !== 0 ||
      scene.chapters.some(
        (chapter, index) =>
          !Number.isFinite(chapter.at) ||
          chapter.at >= scene.duration ||
          (index > 0 && chapter.at <= scene.chapters[index - 1].at),
      )
    ) {
      throw new Error("Invalid scene chapter sequence");
    }
    const ids = scene.components.map(({ id }) => id);
    if (new Set(ids).size !== ids.length)
      throw new Error("Duplicate component ID");
    this.scenes.set(scene.id, scene);
    return this;
  }

  get(id: string): SimulationSceneDefinition {
    const scene = this.scenes.get(id);
    if (!scene) throw new Error(`Unknown scene: ${id}`);
    return scene;
  }

  list(): readonly SimulationSceneDefinition[] {
    return [...this.scenes.values()];
  }
}
