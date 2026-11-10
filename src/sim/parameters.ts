// Subconjunto deliberado de C++: constantes literales y ternarios simples.
// No ejecuta código del sketch ni pretende interpretar C++ completo.
export type Parameters = Record<string, number | boolean>;

export function readParameters(code: string, overrides: Parameters = {}): Parameters {
  const values: Parameters = {};
  const clean = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const literal = (text: string): number | boolean => {
    const value = text.trim();
    if (value === "true" || value === "false") return value === "true";
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
    if (value in values) return values[value];
    throw new Error(`Parámetro no compatible con la simulación: ${value}`);
  };
  for (const match of clean.matchAll(/const\s+(?:bool|int|unsigned long|float)\s+([A-Z][A-Z_0-9]*)\s*=\s*([^;]+);/g)) {
    const [, name, expression] = match;
    if (name in overrides) {
      values[name] = overrides[name];
      continue;
    }
    const choice = /^\s*([A-Z][A-Z_0-9]*)\s*\?\s*([^:]+):(.+)$/.exec(expression);
    values[name] = choice ? literal(literal(choice[1]) ? choice[2] : choice[3]) : literal(expression);
  }
  return values;
}

export function numberParameter(params: Parameters, name: string): number {
  if (typeof params[name] !== "number" || !Number.isFinite(params[name])) {
    throw new Error(`Falta el parámetro numérico ${name} en el sketch.`);
  }
  return params[name] as number;
}

export function booleanParameter(params: Parameters, name: string): boolean {
  if (typeof params[name] !== "boolean") throw new Error(`Falta el parámetro ${name} en el sketch.`);
  return params[name] as boolean;
}
