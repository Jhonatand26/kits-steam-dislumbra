// Contratos del Laboratorio 3D. Este archivo NO importa Three.js ni el
// DOM: es el acuerdo entre escenas, motor, simulación y HUD. Una escena
// nueva solo tiene que cumplir InteractiveSceneConfig.

/** Vector en coordenadas de escena (milímetros, Y hacia arriba). */
export type Vec3 = readonly [x: number, y: number, z: number];

/** Referencia física, igual que en el montaje real: "uno.D9", "bb.e20". */
export type PinRef = `${string}.${string}`;

// ---------------------------------------------------------------- Cámara

export interface CameraView {
  target: Vec3;
  /** Grados alrededor del eje Y. */
  azimuth: number;
  /** Grados sobre el plano de la mesa (5..85). */
  elevation: number;
  /** Factor de zoom de la cámara ortográfica. */
  zoom: number;
}

export interface CameraLimits {
  zoom: [min: number, max: number];
  elevation: [min: number, max: number];
  /** Caja donde puede moverse el target (plano XZ). */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

// ---------------------------------------------------------------- Piezas

/** Tipos de pieza con fábrica procedural registrada en src/lab/parts. */
export type PartKind =
  | "arduino-uno" | "breadboard" | "resistor" | "led" | "rgb-led"
  | "button" | "buzzer" | "npn" | "lcd1602" | "dht22" | "servo"
  | "ldr" | "potentiometer" | "sensor-module" | "relay" | "wire";

export interface PartPlacement {
  id: string;
  kind: PartKind;
  label: string;
  /** Bolsa de la caja física (C06-08…) para cruzar con el inventario. */
  item?: string;
  /** Ubicación por agujeros/pines; la fábrica la convierte a 3D. */
  at?: PinRef;
  from?: PinRef;
  to?: PinRef;
  /** Propiedades propias del tipo (ohms, color de tapa, cátodo común…). */
  props?: Record<string, string | number | boolean>;
  /** Pines del Arduino que esta pieza lee o escribe en la simulación. */
  bind?: Record<string, PinRef>;
}

/** Lo que devuelve una fábrica de pieza al motor (sin tipos de Three
 *  aquí: el motor los concreta). */
export interface PartInstance<TObject = unknown> {
  id: string;
  object: TObject;
  /** Puntos con nombre para hotspots y llamadas ("lens", "usb"…). */
  anchors: Record<string, Vec3>;
  /** Refleja el estado eléctrico en lo visual (brillo, ángulo…). */
  update?(pins: PinReader, dtMs: number): void;
  /** Interacción directa: oprimir botón, girar perilla. */
  grab?: GrabHandler;
  dispose(): void;
}

export interface GrabHandler {
  down(hit: Vec3): void;
  move?(hit: Vec3): void;
  up(): void;
}

// ---------------------------------------------------------------- Hotspots

export type InspectorTab = "resumen" | "pines" | "ejemplo" | "especificaciones";

export interface Hotspot {
  id: string;
  /** Texto de la píldora flotante. */
  label: string;
  /** Pieza (y ancla) a la que apunta. */
  part: string;
  anchor?: string;
  /** Vista de cámara al seleccionarlo. */
  camera: Partial<CameraView>;
  /** Contenido que abre en el inspector. */
  info: {
    title: string;
    summary: string;
    pins?: { pin: string; role: string; note: string }[];
    specs?: [label: string, value: string][];
    care?: string;
  };
}

// ---------------------------------------------------------------- Pasos

export interface LessonStep {
  title: string;
  body: string;
  /** Piezas/cables que aparecen en este paso (acumulativo). */
  show: string[];
  focus: string[];
  camera?: Partial<CameraView>;
  /** Líneas del sketch real que explica este paso. */
  code?: [from: number, to: number];
  /** El último paso arranca la simulación. */
  run?: boolean;
}

// ---------------------------------------------------------------- Simulación

/** Lectura de pines que usan las piezas para dibujarse. */
export interface PinReader {
  level(pin: string): number; // 0..1 (PWM o digital)
  isOutput(pin: string): boolean;
}

/** Entradas que el estudiante manipula (sensor de temperatura, perilla…). */
export interface SimParam {
  key: string;
  label: string;
  part?: string;
  type: "range" | "toggle" | "select";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: string; label: string }[];
  value: number | boolean | string;
  /** Pin analógico al que alimenta ("A0") y cómo convertir a 0..1023. */
  feeds?: { pin: string; toRaw: (v: number) => number };
}

/** Programa del proyecto portado del .ino; habla con un Arduino virtual. */
export interface SimulationModule {
  /** Recibe la API Arduino (pinMode, digitalWrite, delay, Serial…). */
  create(api: ArduinoApi, params: Record<string, number | boolean | string>): {
    setup(): void | Promise<void>;
    loop(): void | Promise<void>;
  };
}

export interface ArduinoApi {
  pinMode(pin: string, mode: "INPUT" | "INPUT_PULLUP" | "OUTPUT"): void;
  digitalWrite(pin: string, v: 0 | 1): void;
  digitalRead(pin: string): 0 | 1;
  analogWrite(pin: string, v: number): void;
  analogRead(pin: string): number;
  millis(): number;
  delay(ms: number): Promise<void>;
  Serial: { begin(b: number): void; print(v: unknown): void; println(v?: unknown): void };
}

// ---------------------------------------------------------------- Escena

export interface InteractiveSceneConfig {
  /** "C06-P1": une la escena con su caja e inventario. */
  id: string;
  title: string;
  metadata: { box: string; grades?: string; ods?: string[]; tags?: string[] };
  /** Montaje: piezas por agujero + cables (misma data que la vista 2D). */
  assembly: { parts: PartPlacement[]; wires: { id: string; from: PinRef; to: PinRef; color: string }[] };
  camera: { home: CameraView; limits?: Partial<CameraLimits> };
  hotspots: Hotspot[];
  steps: LessonStep[];
  params?: SimParam[];
  /** Ruta del sketch real (firmware/…/*.ino) que se muestra y resalta. */
  firmware: string;
  /** Carga perezosa: el JS de la simulación solo baja al iniciar. */
  simulation: () => Promise<{ default: SimulationModule }>;
}
