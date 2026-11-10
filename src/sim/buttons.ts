import type { Board } from "./runtime.ts";

/** Una entrada sostenida, tanto por puntero como por teclado. */
export function bindButton(element: HTMLElement | SVGElement, board: Board, pin: string, onPress = (_pressed: boolean) => {}) {
  let pressedAt = 0;
  let session = board.session;
  let releaseTimer: ReturnType<typeof setTimeout> | undefined;
  const apply = (pressed: boolean) => {
    board.setInput(pin, pressed ? 0 : 1);
    element.setAttribute("aria-pressed", String(pressed));
    onPress(pressed);
  };
  const press = (pressed: boolean) => {
    clearTimeout(releaseTimer);
    if (pressed) {
      if (!board.running) return;
      pressedAt = performance.now();
      session = board.session;
      apply(true);
    } else {
      // Un clic puede llegar completo antes del próximo ciclo de lectura.
      // Conserva al menos 32 ms de entrada; una sesión nueva invalida la liberación.
      const remaining = Math.max(0, 32 - (performance.now() - pressedAt));
      if (remaining > 0) {
        releaseTimer = setTimeout(() => { if (board.isCurrent(session)) apply(false); }, remaining);
      } else if (board.isCurrent(session)) apply(false);
    }
  };
  element.setAttribute("aria-pressed", "false");
  element.addEventListener("pointerdown", (event) => {
    const pointer = event as PointerEvent;
    if (pointer.button !== 0) return;
    element.setPointerCapture(pointer.pointerId);
    press(true);
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture", "blur"]) {
    element.addEventListener(event, () => press(false));
  }
  element.addEventListener("keydown", (event) => {
    const key = event as KeyboardEvent;
    if (key.key !== " " && key.key !== "Enter") return;
    key.preventDefault();
    if (!key.repeat) press(true);
  });
  element.addEventListener("keyup", (event) => {
    const key = event as KeyboardEvent;
    if (key.key === " " || key.key === "Enter") { key.preventDefault(); press(false); }
  });
  // Activación de tecnología asistiva sin eventos de puntero o teclado.
  element.addEventListener("click", (event) => {
    if ((event as MouseEvent).detail === 0) { press(true); press(false); }
  });
}
