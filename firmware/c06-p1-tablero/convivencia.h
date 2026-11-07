#ifndef CONVIVENCIA_H
#define CONVIVENCIA_H

// Lo que el estudiante reporta con cada boton.
enum class Estado { BIEN, REGULAR, AYUDA, NINGUNO };

struct Color {
  int rojo;
  int verde;
  int azul;
};

// Boton presionado (0, 1, 2) o -1 si ninguno -> estado.
Estado estadoDesdeBoton(int boton);

// Color del panel para cada estado, con el brillo indicado (0-255).
// El sonido es el MISMO para todos: nadie sabe que boton se oprimio.
Color colorParaEstado(Estado estado, int brillo);

#endif
