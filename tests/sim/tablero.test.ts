import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { Board, run } from "../../src/sim/runtime.ts";
import factory from "../../src/sim/firmware/c06-p1.ts";
import { readParameters } from "../../src/sim/parameters.ts";
import { configuredCode, resolvePart, wireEnabled } from "../../src/sim/configuration.ts";
import { validateLessonReferences } from "../../src/sim/validation.ts";
import type { Lesson } from "../../src/sim/lesson.ts";
import type { Box } from "../../src/lib/boxes.ts";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const code = read("firmware/c06-p1-tablero/c06-p1-tablero.ino");
const lesson: Lesson = JSON.parse(read("data/lessons/c06-p1.json"));
const box: Box = JSON.parse(read("data/boxes/c06.json"));
const catalog = JSON.parse(read("data/parts.json"));

test("demo overrides recalculate the dependent sketch timings and brightness", () => {
  const normal = readParameters(code);
  const demo = readParameters(code, { MODO_DEMO: true });
  assert.deepEqual([normal.AVISO_MS, normal.COLOR_MS, normal.BRILLO], [150, 2000, 60]);
  assert.deepEqual([demo.AVISO_MS, demo.COLOR_MS, demo.BRILLO], [1200, 5000, 255]);
  assert.deepEqual(readParameters(configuredCode(code, lesson.controls, demo)), demo);
});

test("parameter parsing ignores comments and rejects executable expressions", () => {
  assert.deepEqual(readParameters("// const int BAD = 99;\nconst int PIN_2 = 7; /* const bool BAD = true; */"), { PIN_2: 7 });
  assert.throws(() => readParameters("const int BAD = globalThis.process.exit();"), /no compatible/);
});

test("every hardware variant has exactly one common wire and 17 jumpers", () => {
  for (const anode of [false, true]) {
    const params = readParameters(code, { ANODO_COMUN: anode });
    const wires = lesson.wires.filter((wire) => wireEnabled(wire, params));
    const common = wires.filter((wire) => wire.from === "bb.a21");
    assert.equal(common.length, 1);
    assert.equal(common[0].to, anode ? "bb.tp21" : "bb.tn21");
    assert.equal(wires.length, box.projects[0].uses.find((use) => use.item === "C06-23")!.qty);
    assert.equal(resolvePart(lesson.parts.find((part) => part.id === "rgb")!, params).activeLow, anode);
  }
});

for (const anode of [false, true]) for (const activeHigh of [false, true]) {
  test(`held buttons count once and preserve colors/sound: anode=${anode}, activeHigh=${activeHigh}`, async () => {
    const params = readParameters(code, { ANODO_COMUN: anode, BUZZER_ACTIVO_ALTO: activeHigh });
    const board = new Board();
    board.running = true;
    let now = 0;
    board.millis = () => now;
    const serial: string[] = [];
    board.onSerial = (text) => serial.push(text);
    const firmware = factory(board, params);
    firmware.setup();
    assert.equal(board.activeLevel("D8", !activeHigh), 0);
    assert.equal(board.activeLevel("D10", anode), 0);
    const colors = [[0, 60, 0], [60, 30, 0], [60, 0, 0]];
    for (let button = 0; button < 3; button++) {
      const pin = `D${button + 2}`;
      board.setInput(pin, 0);
      let heldChecks = 0;
      board.delay = async (ms) => {
        if (ms === params.AVISO_MS) {
          assert.equal(board.activeLevel("D8", !activeHigh), 1);
          ["D9", "D10", "D11"].forEach((channel, i) => {
            assert.ok(Math.abs(board.activeLevel(channel, anode) - colors[button][i] / 255) < 0.001);
          });
        }
        if (ms === 10 && ++heldChecks === 3) board.setInput(pin, 1);
        now += ms;
      };
      await firmware.loop();
      assert.equal(heldChecks, 3);
      assert.equal(board.activeLevel("D8", !activeHigh), 0);
    }
    assert.equal(serial.length, 4);
    assert.equal(serial.at(-1), "Reportes  bien:1  regular:1  ayuda:1\n");
    now += 6000;
    await firmware.loop();
    for (const pin of ["D9", "D10", "D11"]) assert.equal(board.activeLevel(pin, anode), 0);
    board.stop();
  });
}

test("restart cancels the old delayed program without stopping the new one", async () => {
  const board = new Board();
  let staleWrites = 0;
  let freshLoops = 0;
  let entered!: () => void;
  const waiting = new Promise<void>((resolve) => entered = resolve);
  const old = run(board, {
    setup() {},
    async loop() { entered(); await board.delay(30); staleWrites++; },
  });
  await waiting;
  board.setInput("D2", 0);
  board.stop();
  const fresh = run(board, {
    setup() { board.pinMode("D2", "INPUT_PULLUP"); assert.equal(board.digitalRead("D2"), 1); },
    loop() { if (++freshLoops === 5) board.stop(); },
  });
  await Promise.all([old, fresh]);
  assert.equal(staleWrites, 0);
  assert.equal(freshLoops, 5);
  assert.equal(board.activeLevel("D8", true), 0);
});

test("lesson validation catches broken references before browser execution", () => {
  assert.deepEqual(validateLessonReferences(lesson, box, code, catalog), []);
  const broken = structuredClone(lesson);
  broken.steps[0].show.push("missing-part");
  broken.steps[0].code = [1, 999];
  broken.wires[0].to = "bb.a31";
  const errors = validateLessonReferences(broken, box, code, catalog).join("\n");
  assert.match(errors, /missing-part/);
  assert.match(errors, /Rango de código inválido/);
  assert.match(errors, /Agujero inválido/);
});
