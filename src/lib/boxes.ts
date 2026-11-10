// Única capa de acceso a datos del sitio. Las páginas no saben dónde ni
// cómo se guardan las cajas: solo llaman a estas funciones.
// El contrato vive en schema/box.schema.json (validado antes del build).
import type { Lesson } from "../sim/lesson";

export type Status =
  | "en_mano"
  | "verificar"
  | "pendiente_compra"
  | "pendiente_no_electronico"
  | "interno";

export interface Item {
  id: string;
  name: string;
  qty: number;
  unit: string;
  status: Status;
  group: string;
  source?: string;
  note?: string;
  care?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  challenge: string;
  objective: string;
  grades?: string;
  ods?: string[];
  uses: { item: string; qty: number }[];
  wiring?: { from: string; to: string; note?: string }[];
  steps?: { title: string; detail: string }[];
  failures?: { symptom: string; cause: string; fix: string }[];
  checks?: string[];
  simulation: {
    kind: "wokwi" | "interactiva" | "ninguna";
    status: "validada" | "por_actualizar" | "pendiente";
    wokwi?: string;
    note?: string;
  };
}

export interface Box {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary?: string;
  accent?: string;
  items: Item[];
  projects: Project[];
}

const modules = import.meta.glob<Box>("../../data/boxes/*.json", {
  eager: true,
  import: "default",
});

export const boxes: Box[] = Object.values(modules).sort((a, b) =>
  a.id.localeCompare(b.id),
);

export const STATUS_LABEL: Record<Status, string> = {
  en_mano: "En la caja",
  verificar: "Por verificar",
  pendiente_compra: "Pendiente de compra",
  pendiente_no_electronico: "Pendiente (no electrónico)",
  interno: "Lo aporta Dislumbra",
};

export const SIM_LABEL: Record<Project["simulation"]["status"], string> = {
  validada: "Simulación validada",
  por_actualizar: "Simulación en actualización",
  pendiente: "Simulación en preparación",
};

/** Conteo de ítems por estado, en orden fijo para dibujar la barra. */
export function readiness(box: Box): { status: Status; count: number }[] {
  const order: Status[] = [
    "en_mano",
    "verificar",
    "interno",
    "pendiente_compra",
    "pendiente_no_electronico",
  ];
  return order.map((status) => ({
    status,
    count: box.items.filter((i) => i.status === status).length,
  }));
}

/** Ítems de la caja que usa un proyecto, con la cantidad que necesita. */
export function itemsFor(box: Box, project: Project) {
  return project.uses.map((u) => ({
    ...box.items.find((i) => i.id === u.item)!,
    need: u.qty,
  }));
}

/** Dígitos del código de color de resistencia para el número de caja. */
export function bandDigits(box: Box): number[] {
  return box.id.slice(1).split("").map(Number);
}

// ---- Lecciones paso a paso y firmware real ----
const lessonModules = import.meta.glob<Lesson>("../../data/lessons/*.json", {
  eager: true,
  import: "default",
});
const firmwareModules = import.meta.glob<string>("../../firmware/**/*.ino", {
  eager: true,
  query: "?raw",
  import: "default",
});

/** Lección del proyecto (C06-P1 → data/lessons/c06-p1.json), si existe. */
export function lessonFor(box: Box, project: Project): Lesson | undefined {
  const key = `${box.id}-${project.id}`;
  return Object.values(lessonModules).find((l) => l.project === key);
}

/** Código del sketch real, tal como se carga en la placa. */
export function firmwareCode(lesson: Lesson): string {
  const hit = Object.entries(firmwareModules).find(([path]) =>
    path.endsWith(`/firmware/${lesson.firmware}`),
  );
  return hit ? hit[1] : "";
}
