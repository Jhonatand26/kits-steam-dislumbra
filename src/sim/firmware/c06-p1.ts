// Port en TypeScript de firmware/c06-p1-tablero (misma lógica, mismos
// pines). Los parámetros MODO_DEMO, AVISO_MS, etc. se leen del sketch
// real, así el simulador y la placa usan los mismos valores.
import { LOW, HIGH, type FirmwareFactory } from "../runtime";

type Estado = "BIEN" | "REGULAR" | "AYUDA";
const ESTADOS: Estado[] = ["BIEN", "REGULAR", "AYUDA"];

function color(estado: Estado, brillo: number) {
  if (estado === "BIEN") return [0, brillo, 0];
  if (estado === "REGULAR") return [brillo, Math.floor(brillo / 2), 0];
  return [brillo, 0, 0];
}

const factory: FirmwareFactory = (b, params) => {
  const demo = Boolean(params.MODO_DEMO);
  const AVISO_MS = demo ? 1200 : 150;
  const COLOR_MS = demo ? 5000 : 2000;
  const BRILLO = demo ? 255 : 60;
  const BOTONES = ["D2", "D3", "D4"];
  const conteo = [0, 0, 0];
  let finColor = 0;

  const mostrar = ([r, g, bl]: number[]) => {
    b.analogWrite("D9", r);
    b.analogWrite("D10", g);
    b.analogWrite("D11", bl);
  };
  const oprimido = () => BOTONES.findIndex((p) => b.digitalRead(p) === LOW);

  return {
    setup() {
      b.Serial.begin(9600);
      BOTONES.forEach((p) => b.pinMode(p, "INPUT_PULLUP"));
      b.pinMode("D8", "OUTPUT");
      b.Serial.println(`Tablero listo (modo ${demo ? "demostración" : "discreto"})`);
    },
    async loop() {
      const boton = oprimido();
      if (boton >= 0) {
        conteo[boton]++;
        mostrar(color(ESTADOS[boton], BRILLO));
        finColor = b.millis() + COLOR_MS;
        b.digitalWrite("D8", HIGH);
        await b.delay(AVISO_MS);
        b.digitalWrite("D8", LOW);
        b.Serial.println(`Reportes  bien:${conteo[0]}  regular:${conteo[1]}  ayuda:${conteo[2]}`);
        while (b.digitalRead(BOTONES[boton]) === LOW) await b.delay(10);
        await b.delay(250);
      }
      if (finColor > 0 && b.millis() > finColor) {
        mostrar([0, 0, 0]);
        finColor = 0;
      }
    },
  };
};

export default factory;
