// Tablero de Convivencia - Kit 6, proyecto 1
#include "convivencia.h"

// 1. Parametros que puede cambiar el docente
const bool MODO_DEMO = false;  // true: aviso largo para mostrar
const bool ANODO_COMUN = true;  // Hipotesis del proveedor: comprobar el LED
const bool BUZZER_ACTIVO_ALTO = true;  // Comprobar al recibir el modulo
const unsigned long AVISO_MS = MODO_DEMO ? 1200 : 150;
const unsigned long COLOR_MS = MODO_DEMO ? 5000 : 2000;
const int BRILLO = MODO_DEMO ? 255 : 60;

// 2. Pines
const int PIN_BIEN = 2;
const int PIN_REGULAR = 3;
const int PIN_AYUDA = 4;
const int BOTONES[3] = {PIN_BIEN, PIN_REGULAR, PIN_AYUDA};
const int PIN_ROJO = 9;
const int PIN_VERDE = 10;
const int PIN_AZUL = 11;
const int PIN_ZUMBADOR = 8;

int conteo[3] = {0, 0, 0};
unsigned long finColor = 0;

void mostrar(Color c) {
  analogWrite(PIN_ROJO, ANODO_COMUN ? 255 - c.rojo : c.rojo);
  analogWrite(PIN_VERDE, ANODO_COMUN ? 255 - c.verde : c.verde);
  analogWrite(PIN_AZUL, ANODO_COMUN ? 255 - c.azul : c.azul);
}

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 3; i++) pinMode(BOTONES[i], INPUT_PULLUP);
  digitalWrite(PIN_ZUMBADOR, BUZZER_ACTIVO_ALTO ? LOW : HIGH);
  pinMode(PIN_ZUMBADOR, OUTPUT);
  mostrar({0, 0, 0});
  Serial.println("Tablero listo");
}

int botonOprimido() {
  for (int i = 0; i < 3; i++) {
    if (digitalRead(BOTONES[i]) == LOW) return i;
  }
  return -1;
}

void loop() {
  // 3. Leer el boton y mostrar el color
  int boton = botonOprimido();
  if (boton >= 0) {
    conteo[boton]++;
    mostrar(colorParaEstado(estadoDesdeBoton(boton), BRILLO));
    finColor = millis() + COLOR_MS;

    // 4. Mismo aviso para cualquier boton
    digitalWrite(PIN_ZUMBADOR, BUZZER_ACTIVO_ALTO ? HIGH : LOW);
    delay(AVISO_MS);
    digitalWrite(PIN_ZUMBADOR, BUZZER_ACTIVO_ALTO ? LOW : HIGH);
    Serial.print("Reportes  bien:");
    Serial.print(conteo[0]);
    Serial.print("  regular:");
    Serial.print(conteo[1]);
    Serial.print("  ayuda:");
    Serial.println(conteo[2]);

    // 5. Esperar a que suelte el boton (un toque = un reporte)
    while (digitalRead(BOTONES[boton]) == LOW) delay(10);
    delay(250);
  }
  if (finColor > 0 && millis() > finColor) {
    mostrar({0, 0, 0});
    finColor = 0;
  }
}
