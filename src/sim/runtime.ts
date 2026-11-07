// Arduino virtual: estado de los pines, reloj, monitor serie y sonido.
// El programa de cada proyecto (sim/firmware/*.ts) solo habla con esta
// API, igual que el sketch real habla con el Arduino.

export const HIGH = 1;
export const LOW = 0;
export type PinMode = "INPUT" | "INPUT_PULLUP" | "OUTPUT";

export class Stopped extends Error {}

export class Board {
  private modes = new Map<string, PinMode>();
  private out = new Map<string, number>();
  private inputs = new Map<string, number>();
  private analogIn = new Map<string, number>();
  private t0 = performance.now();
  running = false;
  onChange: () => void = () => {};
  onSerial: (text: string) => void = () => {};

  reset() {
    this.modes.clear();
    this.out.clear();
    this.t0 = performance.now();
    this.onChange();
  }

  // ---- API que usa el programa ----
  pinMode = (pin: string, mode: PinMode) => { this.modes.set(pin, mode); };
  digitalWrite = (pin: string, v: number) => { this.out.set(pin, v ? 1 : 0); this.onChange(); };
  analogWrite = (pin: string, v: number) => { this.out.set(pin, Math.max(0, Math.min(255, v)) / 255); this.onChange(); };
  digitalRead = (pin: string): number => {
    const mode = this.modes.get(pin);
    const ext = this.inputs.get(pin);
    if (ext !== undefined) return ext;
    return mode === "INPUT_PULLUP" ? HIGH : LOW;
  };
  analogRead = (pin: string): number => Math.round(this.analogIn.get(pin) ?? 0);
  millis = (): number => Math.floor(performance.now() - this.t0);
  delay = (ms: number): Promise<void> =>
    new Promise((resolve, reject) => {
      const start = performance.now();
      const tick = () => {
        if (!this.running) return reject(new Stopped());
        if (performance.now() - start >= ms) return resolve();
        setTimeout(tick, Math.min(16, ms));
      };
      tick();
    });
  Serial = {
    begin: (_baud: number) => {},
    print: (v: unknown) => this.onSerial(String(v)),
    println: (v: unknown = "") => this.onSerial(`${String(v)}\n`),
  };

  // ---- Lo que usan las piezas dibujadas ----
  /** Nivel 0..1 de una salida (PWM o digital). */
  level(pin: string): number {
    return this.running ? this.out.get(pin) ?? 0 : 0;
  }
  setInput(pin: string, v: number) { this.inputs.set(pin, v); }
  setAnalog(pin: string, raw: number) { this.analogIn.set(pin, raw); }
}

export interface Firmware {
  setup(): void | Promise<void>;
  loop(): void | Promise<void>;
}

export type FirmwareFactory = (b: Board, params: Record<string, number | boolean>) => Firmware;

/** Corre setup() y loop() hasta que se detenga la simulación. */
export async function run(board: Board, fw: Firmware): Promise<void> {
  board.running = true;
  board.reset();
  try {
    await fw.setup();
    while (board.running) {
      await fw.loop();
      await board.delay(5);
    }
  } catch (e) {
    if (!(e instanceof Stopped)) throw e;
  }
}

/** Pitido para el zumbador activo (Web Audio). */
export class Beeper {
  private ctx?: AudioContext;
  private osc?: OscillatorNode;
  enabled = true;
  set(on: boolean) {
    if (!this.enabled) on = false;
    if (on && !this.osc) {
      this.ctx ??= new AudioContext();
      const gain = this.ctx.createGain();
      gain.gain.value = 0.06;
      this.osc = this.ctx.createOscillator();
      this.osc.type = "square";
      this.osc.frequency.value = 2300;
      this.osc.connect(gain).connect(this.ctx.destination);
      this.osc.start();
    } else if (!on && this.osc) {
      this.osc.stop();
      this.osc = undefined;
    }
  }
}
