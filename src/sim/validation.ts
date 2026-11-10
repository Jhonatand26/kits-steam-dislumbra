import type { Box } from "../lib/boxes.ts";
import type { Lesson } from "./lesson.ts";
import { RENDERERS } from "./parts.ts";
import { refXY, holeXY, shiftHole } from "./geometry.ts";
import { readParameters, booleanParameter, type Parameters } from "./parameters.ts";
import { resolvePart, resolveEndpoint, wireEnabled } from "./configuration.ts";

/** Complementa JSON Schema con referencias entre lección, inventario y sketch. */
export function validateLessonReferences(lesson: Lesson, box: Box, code: string, catalog: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const check = (condition: unknown, message: string) => { if (!condition) errors.push(message); };
  const attempt = (action: () => void) => { try { action(); } catch (error) { errors.push(String(error)); } };
  const project = box.projects.find((project) => `${box.id}-${project.id}` === lesson.project);
  check(project, `Proyecto desconocido: ${lesson.project}`);
  const nodes = [...lesson.parts, ...lesson.wires];
  const ids = new Set(nodes.map((node) => node.id));
  check(ids.size === nodes.length, "Hay identificadores de piezas o cables repetidos");
  const shown = new Set<string>();
  for (const step of lesson.steps) {
    step.show.forEach((id) => { check(ids.has(id), `Paso «${step.title}»: pieza desconocida ${id}`); shown.add(id); });
    step.focus.forEach((id) => check(shown.has(id), `Foco aún no visible: ${id}`));
    if (step.code) check(step.code[0] <= step.code[1] && step.code[1] <= code.split("\n").length, `Rango de código inválido: ${step.title}`);
  }
  for (const id of ids) check(shown.has(id), `Ningún paso muestra ${id}`);
  const counts = new Map<string, number>();
  for (const part of lesson.parts) {
    check(RENDERERS[part.type] && catalog[part.type], `Pieza sin dibujo o descripción: ${part.type}`);
    if (part.item) {
      check(box.items.some((item) => item.id === part.item), `Ítem de inventario desconocido: ${part.item}`);
      counts.set(part.item, (counts.get(part.item) ?? 0) + 1);
    }
    const required: Record<string, string[]> = {
      "rgb-led": ["at", "bind.r", "bind.g", "bind.b"], button: ["at", "bind.pin"],
      "buzzer-module": ["at", "bind.pin"], buzzer: ["plus", "minus", "bind.pin"],
      resistor: ["from", "to", "ohms"], npn: ["at"],
    };
    for (const property of required[part.type] ?? []) {
      const [key, binding] = property.split(".");
      check(binding ? part.bind?.[binding] : part[key as keyof typeof part], `Falta ${property} en ${part.id}`);
    }
    attempt(() => {
      for (const hole of [part.at, part.from, part.to, part.plus, part.minus]) if (hole) holeXY(hole);
      const span = part.type === "rgb-led" ? 3 : ["button", "npn", "buzzer-module"].includes(part.type) ? 2 : 0;
      if (part.at && span) holeXY(shiftHole(part.at, span));
    });
  }
  for (const [item, count] of counts) check((project?.uses.find((use) => use.item === item)?.qty ?? 0) >= count, `Cantidad insuficiente en el proyecto: ${item}`);
  check(new Set(lesson.controls.map((control) => control.parameter)).size === lesson.controls.length, "Hay controles repetidos");
  attempt(() => {
    const defaults = readParameters(code);
    lesson.controls.forEach((control) => booleanParameter(defaults, control.parameter));
    // Todas las combinaciones: el cableado debe ser válido en cada variante.
    for (let mask = 0; mask < 2 ** lesson.controls.length; mask++) {
      const overrides: Parameters = Object.fromEntries(lesson.controls.map((control, index) => [control.parameter, !!(mask & (1 << index))]));
      const params = readParameters(code, overrides);
      for (const part of lesson.parts) {
        const resolved = resolvePart(part, params);
        Object.values(resolved.bind ?? {}).forEach((pin) => refXY(`uno.${pin}`));
      }
      for (const wire of lesson.wires) {
        wireEnabled(wire, params);
        for (const endpoint of [wire.from, wire.to]) {
          check(ids.has(endpoint.split(".")[0]), `Dispositivo no incluido: ${endpoint}`);
          refXY(resolveEndpoint(endpoint, params));
        }
      }
    }
  });
  return [...new Set(errors)];
}
