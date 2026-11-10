import { buildUno } from "./model.ts";
import type { SceneFactory } from "../contracts.ts";

export const createUnoScene: SceneFactory = (palette) => buildUno(palette);
