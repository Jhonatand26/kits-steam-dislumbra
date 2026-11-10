import type { PartSpec } from "./parts";

export interface LessonStep {
  title: string;
  body: string;
  show: string[];
  focus: string[];
  code?: [number, number];
}

export interface LessonWire {
  id: string;
  from: string;
  to: string;
  color: string;
  when?: { parameter: string; equals: boolean };
}

export interface Pedagogy {
  duration: string;
  question: string;
  goals: string[];
  vocabulary: { term: string; meaning: string }[];
  activities: { title: string; predict: string; action: string; observe: string; explain: string }[];
  evidence: string[];
  teacher: { preparation: string[]; sequence: string[]; discussion: string[]; assessment: string[] };
}

export interface Lesson {
  project: string;
  firmware: string;
  parts: PartSpec[];
  wires: LessonWire[];
  steps: LessonStep[];
  hardware: string[];
  controls: { parameter: string; label: string; help: string }[];
  pedagogy: Pedagogy;
}
