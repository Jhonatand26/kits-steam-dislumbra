"""Punto de entrada: validar datos y generar el Excel de separación."""

import argparse
import os
import sys
from pathlib import Path

from inventario.excel import write_workbook
from inventario.loader import load_boxes
from inventario.rules import find_problems

REPO_ROOT = Path(__file__).resolve().parents[4]


def main() -> int:
    """Validar las cajas y, si no hay problemas, escribir el Excel."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--data",
        type=Path,
        default=Path(os.getenv("KITS_DATA_DIR", REPO_ROOT / "data/boxes")),
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=Path(
            os.getenv("KITS_SCHEMA", REPO_ROOT / "schema/box.schema.json")
        ),
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(
            os.getenv(
                "KITS_INVENTORY_OUT",
                REPO_ROOT / "exports/Separacion_por_caja.xlsx",
            )
        ),
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Solo validar, sin escribir el Excel.",
    )
    args = parser.parse_args()

    boxes = load_boxes(args.data, args.schema)
    problems = [p for box in boxes for p in find_problems(box)]
    for problem in problems:
        print(f"ERROR {problem}", file=sys.stderr)
    if problems:
        return 1
    print(
        f"OK: {len(boxes)} cajas, "
        f"{sum(len(b.items) for b in boxes)} ítems, "
        f"{sum(len(b.projects) for b in boxes)} proyectos"
    )
    if not args.check:
        write_workbook(boxes, args.out)
        print(f"Excel: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
