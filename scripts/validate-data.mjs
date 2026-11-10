// Valida data/boxes/*.json contra schema/box.schema.json antes del build.
// Es el mismo esquema que usa la herramienta de inventario en Python:
// un solo contrato para la página y para el Excel.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { validateLessonReferences } from "../src/sim/validation.ts";

const root = new URL("..", import.meta.url).pathname;
const schema = JSON.parse(
  readFileSync(join(root, "schema/box.schema.json"), "utf8"),
);
const validate = new Ajv2020({ allErrors: true }).compile(schema);

const dir = join(root, "data/boxes");
const boxes = [];
let failed = false;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const box = JSON.parse(readFileSync(join(dir, file), "utf8"));
  boxes.push(box);
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
const lessonSchema = JSON.parse(readFileSync(join(root, "schema/lesson.schema.json"), "utf8"));
const validateLesson = new Ajv2020({ allErrors: true }).compile(lessonSchema);
const catalog = JSON.parse(readFileSync(join(root, "data/parts.json"), "utf8"));
const projects = new Set();
for (const file of readdirSync(join(root, "data/lessons")).filter((file) => file.endsWith(".json"))) {
  try {
    const lesson = JSON.parse(readFileSync(join(root, "data/lessons", file), "utf8"));
    if (!validateLesson(lesson)) throw new Error(JSON.stringify(validateLesson.errors));
    if (projects.has(lesson.project)) throw new Error(`Lección duplicada: ${lesson.project}`);
    projects.add(lesson.project);
    const box = boxes.find((box) => lesson.project.startsWith(`${box.id}-`));
    if (!box) throw new Error(`Caja desconocida: ${lesson.project}`);
    const code = readFileSync(join(root, "firmware", lesson.firmware), "utf8");
    const errors = validateLessonReferences(lesson, box, code, catalog);
    if (errors.length) throw new Error(errors.join("\n"));
  } catch (error) {
    failed = true;
    console.error(`${file}: ${error.message}`);
  }
}
if (failed) process.exit(1);
console.log("Cajas, lecciones, conexiones, parámetros y referencias pedagógicas válidos.");
