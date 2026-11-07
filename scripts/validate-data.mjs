// Valida data/boxes/*.json contra schema/box.schema.json antes del build.
// Es el mismo esquema que usa la herramienta de inventario en Python:
// un solo contrato para la página y para el Excel.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const root = new URL("..", import.meta.url).pathname;
const schema = JSON.parse(
  readFileSync(join(root, "schema/box.schema.json"), "utf8"),
);
const validate = new Ajv2020({ allErrors: true }).compile(schema);

const dir = join(root, "data/boxes");
let failed = false;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const box = JSON.parse(readFileSync(join(dir, file), "utf8"));
  if (!validate(box)) {
    failed = true;
    for (const err of validate.errors) {
      console.error(`${file} ${err.instancePath}: ${err.message}`);
    }
  }
  const ids = new Set(box.items.map((i) => i.id));
  for (const p of box.projects) {
    for (const u of p.uses) {
      if (!ids.has(u.item)) {
        failed = true;
        console.error(`${file} ${p.id}: usa ${u.item}, que no existe`);
      }
    }
  }
}
if (failed) process.exit(1);
console.log("Datos de cajas válidos.");
