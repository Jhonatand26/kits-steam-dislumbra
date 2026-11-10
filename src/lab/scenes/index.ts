import { SimulationSceneRegistry } from "../registry.ts";

export const simulationScenes = new SimulationSceneRegistry()
  .register({
    id: "explorar-uno",
    title: "Conoce la placa UNO",
    summary:
      "Sigue el recorrido de una instrucción: energía, programa y señales.",
    duration: 12,
    chapters: [
      {
        at: 0,
        title: "Una placa, varias funciones",
        description:
          "Gira la placa y selecciona una pieza. Cada componente tiene una tarea distinta; el microcontrolador coordina las señales.",
        signal: "En observación",
      },
      {
        at: 3,
        title: "Energía y comunicación",
        description:
          "El conector USB permite alimentar la placa y transferir un programa desde el computador. Aquí no se conecta ni programa una placa real.",
        signal: "USB · alimentación",
      },
      {
        at: 6,
        title: "El programa toma decisiones",
        description:
          "El microcontrolador ejecuta instrucciones y lee entradas. No interpreta intenciones: necesita una secuencia precisa.",
        signal: "Microcontrolador · instrucciones",
      },
      {
        at: 9,
        title: "Del programa al mundo",
        description:
          "Los conectores permiten leer sensores y controlar salidas. Predice: ¿qué cambiaría si una señal de salida permaneciera siempre en HIGH?",
        signal: "Entradas / salidas",
      },
    ],
    components: [
      {
        id: "board",
        label: "Placa de circuito",
        description:
          "Las pistas conectan componentes. Modelo geométrico educativo de una UNO, no plano de fabricación ni guía de conexión física.",
      },
      {
        id: "usb",
        label: "Puerto USB",
        description:
          "Comunica la placa con el computador y puede suministrar energía. El modelo no accede a dispositivos USB.",
      },
      {
        id: "chip",
        label: "Microcontrolador",
        description:
          "Ejecuta las instrucciones almacenadas. Este laboratorio ilustra su comportamiento; no emula un procesador AVR.",
      },
      {
        id: "headers",
        label: "Conectores de señales",
        description:
          "Agrupan entradas, salidas y alimentación. Antes de conectar hardware, verifica las etiquetas y la guía del proyecto correspondiente.",
      },
    ],
    load: async () => (await import("./uno.ts")).createUnoScene,
  })
  .register({
    id: "senal-led",
    title: "De una señal a la luz",
    summary: "Observa, pausa y compara dos estados de una salida digital.",
    duration: 8,
    chapters: [
      {
        at: 0,
        title: "Prepara tu predicción",
        description:
          "La línea representa un recorrido de señal conceptual, no un esquema de cableado. La resistencia limita la corriente en un montaje real; su valor debe calcularse según el circuito.",
        signal: "LOW · LED apagado",
        code: "digitalWrite(LED_PIN, LOW);",
      },
      {
        at: 2,
        title: "La salida pasa a HIGH",
        description:
          "En este ejemplo conceptual, el LED se ilumina cuando la salida está en HIGH. Otros módulos pueden ser activos en LOW: consulta siempre su documentación.",
        signal: "HIGH · LED encendido",
        code: "digitalWrite(LED_PIN, HIGH);\ndelay(2000);",
      },
      {
        at: 4,
        title: "La salida vuelve a LOW",
        description:
          "La salida cambia de estado y el LED se apaga. Pausa y mueve la línea de tiempo para comparar ambos momentos.",
        signal: "LOW · LED apagado",
        code: "digitalWrite(LED_PIN, LOW);\ndelay(2000);",
      },
      {
        at: 6,
        title: "Comprueba tu explicación",
        description:
          "El LED vuelve a encenderse. ¿Cambiar la velocidad de reproducción cambia la secuencia o solo cuánto tarda en verse? Activa Repetir para observar otro ciclo.",
        signal: "HIGH · LED encendido",
        code: "digitalWrite(LED_PIN, HIGH);",
      },
    ],
    components: [
      {
        id: "board",
        label: "Placa de control",
        description:
          "Representa la fuente de la señal digital. Esta demostración no modifica el firmware ni el inventario de las cajas.",
      },
      {
        id: "resistor",
        label: "Resistencia",
        description:
          "Limita la corriente del LED. El dibujo no prescribe valor, potencia ni conexión: no sustituye un cálculo eléctrico.",
      },
      {
        id: "led",
        label: "LED",
        description:
          "Convierte energía eléctrica en luz. Su polaridad importa; este modelo visual no comprueba conexiones reales.",
      },
      {
        id: "signal",
        label: "Recorrido de señal",
        description:
          "Las marcas animadas ayudan a seguir la secuencia de control. No representan electrones ni una medición de corriente.",
      },
    ],
    load: async () => (await import("./led.ts")).createLedScene,
  });
