#!/usr/bin/env bash
# Compila un sketch para Arduino UNO con avr-gcc y el core oficial,
# tratando cualquier warning del código propio como error.
# Uso: scripts/compile-firmware.sh firmware/c06-p1-tablero
# Requiere: avr-gcc, avr-libc y ARDUINO_CORE (clon de ArduinoCore-avr).
set -euo pipefail
SKETCH_DIR="$1"
CORE="${ARDUINO_CORE:?Define ARDUINO_CORE con la ruta de ArduinoCore-avr}"
OUT="$(mktemp -d)"
MCU="-mmcu=atmega328p -DF_CPU=16000000L -DARDUINO=10819 -DARDUINO_AVR_UNO -DARDUINO_ARCH_AVR"
INC="-I$CORE/cores/arduino -I$CORE/variants/standard -I$SKETCH_DIR"
CXX="avr-g++ -Os -std=gnu++11 -fno-exceptions -fno-threadsafe-statics -ffunction-sections -fdata-sections $MCU $INC"
CC="avr-gcc -Os -std=gnu11 -ffunction-sections -fdata-sections $MCU $INC"

# Core de Arduino (sus warnings no son nuestros)
for f in "$CORE"/cores/arduino/*.c; do $CC -c "$f" -o "$OUT/$(basename "$f").o" 2>/dev/null; done
for f in "$CORE"/cores/arduino/*.cpp; do $CXX -c "$f" -o "$OUT/$(basename "$f").o" 2>/dev/null; done
for f in "$CORE"/cores/arduino/*.S; do avr-gcc -x assembler-with-cpp $MCU $INC -c "$f" -o "$OUT/$(basename "$f").o"; done

# Código propio: cero warnings
INO=$(ls "$SKETCH_DIR"/*.ino)
{ echo '#include <Arduino.h>'; echo "#line 1 \"$(basename "$INO")\""; cat "$INO"; } > "$OUT/sketch.cpp"
$CXX -Wall -Wextra -Werror -c "$OUT/sketch.cpp" -o "$OUT/sketch.o"
for f in "$SKETCH_DIR"/*.cpp; do
  [ -e "$f" ] && $CXX -Wall -Wextra -Werror -c "$f" -o "$OUT/user_$(basename "$f").o"
done
avr-gcc -Os -Wl,--gc-sections $MCU "$OUT"/*.o -o "$OUT/firmware.elf" -lm
avr-size --mcu=atmega328p -C "$OUT/firmware.elf" | grep -E "Program|Data"
echo "OK: $SKETCH_DIR compila sin warnings"
