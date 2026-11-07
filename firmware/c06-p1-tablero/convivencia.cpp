#include "convivencia.h"

Estado estadoDesdeBoton(int boton) {
  switch (boton) {
    case 0: return Estado::BIEN;
    case 1: return Estado::REGULAR;
    case 2: return Estado::AYUDA;
    default: return Estado::NINGUNO;
  }
}

Color colorParaEstado(Estado estado, int brillo) {
  switch (estado) {
    case Estado::BIEN:    return {0, brillo, 0};           // verde
    case Estado::REGULAR: return {brillo, brillo / 2, 0};  // amarillo
    case Estado::AYUDA:   return {brillo, 0, 0};           // rojo
    default:              return {0, 0, 0};                // apagado
  }
}
