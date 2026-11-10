// Modelo de comportamiento: las constantes se leen del sketch real.
import { LOW, HIGH, type FirmwareFactory } from "../runtime.ts";
import { numberParameter, booleanParameter } from "../parameters.ts";

const factory: FirmwareFactory = (board, params) => {
  const pin = (name: string) => `D${numberParameter(params, name)}`;
  const buttons = ["PIN_BIEN", "PIN_REGULAR", "PIN_AYUDA"].map(pin);
  const channels = ["PIN_ROJO", "PIN_VERDE", "PIN_AZUL"].map(pin);
  const buzzer = pin("PIN_ZUMBADOR");
  const commonAnode = booleanParameter(params, "ANODO_COMUN");
  const activeHigh = booleanParameter(params, "BUZZER_ACTIVO_ALTO");
  const brightness = numberParameter(params, "BRILLO");
  const noticeMs = numberParameter(params, "AVISO_MS");
  const colorMs = numberParameter(params, "COLOR_MS");
  const colors = [[0, brightness, 0], [brightness, Math.floor(brightness / 2), 0], [brightness, 0, 0]];
  const counts = [0, 0, 0];
  let colorUntil = 0;
  const show = (values: number[]) => channels.forEach((channel, i) => {
    board.analogWrite(channel, commonAnode ? 255 - values[i] : values[i]);
  });
  const sound = (on: boolean) => board.digitalWrite(buzzer, on === activeHigh ? HIGH : LOW);

  return {
    setup() {
      buttons.forEach((button) => board.pinMode(button, "INPUT_PULLUP"));
      channels.forEach((channel) => board.pinMode(channel, "OUTPUT"));
      board.pinMode(buzzer, "OUTPUT");
      show([0, 0, 0]);
      sound(false);
      board.Serial.println("Tablero listo");
    },
    async loop() {
      const button = buttons.findIndex((key) => board.digitalRead(key) === LOW);
      if (button >= 0) {
        counts[button]++;
        show(colors[button]);
        colorUntil = board.millis() + colorMs;
        sound(true);
        await board.delay(noticeMs);
        sound(false);
        board.Serial.println(`Reportes  bien:${counts[0]}  regular:${counts[1]}  ayuda:${counts[2]}`);
        while (board.digitalRead(buttons[button]) === LOW) await board.delay(10);
        await board.delay(250);
      }
      if (colorUntil > 0 && board.millis() > colorUntil) {
        show([0, 0, 0]);
        colorUntil = 0;
      }
    },
  };
};

export default factory;
