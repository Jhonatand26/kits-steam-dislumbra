import type { Lesson, LessonWire } from "./lesson.ts";
import type { PartSpec } from "./parts.ts";
import { booleanParameter, numberParameter, type Parameters } from "./parameters.ts";

export function resolvePin(value: string, params: Parameters): string {
  if (!value.startsWith("PIN_")) return value;
  const pin = numberParameter(params, value);
  if (!Number.isInteger(pin) || pin < 0 || pin > 13) throw new Error(`Pin digital fuera de rango: ${value}`);
  return `D${pin}`;
}

export function resolveEndpoint(value: string, params: Parameters): string {
  return value.startsWith("uno.") ? `uno.${resolvePin(value.slice(4), params)}` : value;
}

export function resolvePart(part: PartSpec, params: Parameters): PartSpec {
  return {
    ...part,
    bind: part.bind && Object.fromEntries(Object.entries(part.bind).map(([key, value]) => [key, resolvePin(value, params)])),
    activeLow: part.polarity
      ? booleanParameter(params, part.polarity.parameter) === part.polarity.activeLowWhen
      : false,
  };
}

export function wireEnabled(wire: LessonWire, params: Parameters): boolean {
  return !wire.when || booleanParameter(params, wire.when.parameter) === wire.when.equals;
}

/** El código visible conserva el sketch original, salvo los controles elegidos. */
export function configuredCode(code: string, controls: Lesson["controls"], params: Parameters): string {
  return controls.reduce((source, control) => source.replace(
    new RegExp(`(const\\s+bool\\s+${control.parameter}\\s*=\\s*)(true|false)(\\s*;)`),
    `$1${booleanParameter(params, control.parameter)}$3`,
  ), code);
}
