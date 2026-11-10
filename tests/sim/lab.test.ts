import assert from "node:assert/strict";
import { test } from "node:test";
import { SimulationSceneRegistry } from "../../src/lab/registry.ts";
import { Playback, chapterAt } from "../../src/lab/playback.ts";
import type { SimulationSceneDefinition } from "../../src/lab/contracts.ts";

const chapters = [
  { at: 0, title: "Connect", description: "Start" },
  { at: 2, title: "Observe", description: "Signal" },
  { at: 4, title: "Explain", description: "Result" },
];
const definition = {
  id: "example",
  title: "Example",
  summary: "Example scene",
  duration: 6,
  chapters,
  components: [],
  load: async () => {
    throw new Error("Not used");
  },
} satisfies SimulationSceneDefinition;

test("registry discovers independent scene plugins without invoking their loaders", () => {
  const registry = new SimulationSceneRegistry();
  registry.register(definition).register({ ...definition, id: "second" });
  assert.deepEqual(
    registry.list().map(({ id }) => id),
    ["example", "second"],
  );
  assert.equal(registry.get("second").title, "Example");
});

test("registry refuses duplicate IDs and missing scenes without changing registration", () => {
  const registry = new SimulationSceneRegistry().register(definition);
  assert.throws(() => registry.register(definition), /Duplicate/);
  assert.throws(() => registry.get("missing"), /Unknown/);
  assert.equal(registry.list().length, 1);
});

test("registry rejects invalid duration and chapter ordering", () => {
  const registry = new SimulationSceneRegistry();
  assert.throws(
    () => registry.register({ ...definition, duration: NaN }),
    /duration/,
  );
  assert.throws(
    () => registry.register({ ...definition, chapters: [] }),
    /chapter/,
  );
  assert.throws(
    () => registry.register({ ...definition, chapters: [chapters[1]] }),
    /chapter/,
  );
  assert.throws(
    () =>
      registry.register({
        ...definition,
        chapters: [...chapters, chapters[1]],
      }),
    /chapter/,
  );
  assert.equal(registry.list().length, 0);
});

test("playback starts paused and does not advance until explicitly played", () => {
  const player = new Playback(6);
  player.advance(2);
  assert.equal(player.time, 0);
  player.play();
  player.advance(1);
  player.pause();
  player.advance(3);
  assert.equal(player.time, 1);
});

test("rate, end and replay produce deterministic positions", () => {
  const player = new Playback(6);
  player.setRate(2);
  player.play();
  player.advance(1.5);
  assert.equal(player.time, 3);
  player.advance(2);
  assert.equal(player.time, 6);
  assert.equal(player.playing, false);
  player.play();
  assert.equal(player.time, 0);
  assert.equal(player.playing, true);
});

test("loop preserves overshoot and seek clamps to the timeline", () => {
  const player = new Playback(6);
  player.loop = true;
  player.seek(5);
  player.play();
  player.advance(2);
  assert.equal(player.time, 1);
  player.seek(-5);
  assert.equal(player.time, 0);
  player.seek(50);
  assert.equal(player.time, 6);
});

test("chapter stepping pauses and reset restores the starting position", () => {
  const player = new Playback(6);
  player.play();
  player.step(chapters, 1);
  assert.equal(player.time, 2);
  assert.equal(player.playing, false);
  player.step(chapters, -1);
  assert.equal(player.time, 0);
  player.seek(3);
  assert.equal(chapterAt(chapters, player.time), 1);
  player.reset();
  assert.equal(player.time, 0);
  assert.equal(player.playing, false);
});

test("invalid numeric input cannot poison transport state", () => {
  assert.throws(() => new Playback(0), /duration/);
  const player = new Playback(6);
  assert.throws(() => player.setRate(0), /rate/);
  assert.throws(() => player.seek(NaN), /time/);
  player.play();
  assert.throws(() => player.advance(Infinity), /delta/);
  assert.equal(player.time, 0);
  assert.equal(player.rate, 1);
});
