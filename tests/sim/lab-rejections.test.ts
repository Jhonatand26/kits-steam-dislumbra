import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { SimulationSceneRegistry } from "../../src/lab/registry.ts";
import type { SimulationSceneDefinition } from "../../src/lab/contracts.ts";

test("rejected registrations preserve the registry", () => {
  const chapter = { at: 0, title: "Start", description: "Start" };
  const scene: SimulationSceneDefinition = {
    id: "probe",
    title: "Probe",
    summary: "Probe",
    duration: 4,
    chapters: [chapter],
    components: [{ id: "part", label: "Part", description: "Part" }],
    load: async () => {
      throw new Error("Loader must not run");
    },
  };
  const registry = new SimulationSceneRegistry().register(scene);
  const digest = () =>
    createHash("sha256").update(JSON.stringify(registry.list())).digest("hex");
  const cases: [Partial<SimulationSceneDefinition>, string][] = [
    [{ id: "probe" }, "Duplicate scene: probe"],
    [{ id: "" }, "Invalid scene ID"],
    [{ id: "Bad ID" }, "Invalid scene ID"],
    [{ duration: 0 }, "Invalid scene duration"],
    [{ duration: -1 }, "Invalid scene duration"],
    [{ duration: NaN }, "Invalid scene duration"],
    [{ chapters: [] }, "Invalid scene chapter sequence"],
    [{ chapters: [{ ...chapter, at: 1 }] }, "Invalid scene chapter sequence"],
    [{ chapters: [chapter, chapter] }, "Invalid scene chapter sequence"],
    [
      { chapters: [chapter, { ...chapter, at: 4 }] },
      "Invalid scene chapter sequence",
    ],
    [
      { components: [scene.components[0], scene.components[0]] },
      "Duplicate component ID",
    ],
  ];
  for (const [change, message] of cases) {
    const before = digest();
    assert.throws(
      () => registry.register({ ...scene, id: "other", ...change }),
      { message },
    );
    assert.equal(digest(), before);
  }
  const before = digest();
  assert.throws(() => registry.get("missing"), {
    message: "Unknown scene: missing",
  });
  assert.equal(digest(), before);
});
