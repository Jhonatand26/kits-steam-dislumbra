"""Pruebas de contrato sobre los datos reales del repositorio."""

from pathlib import Path

from inventario.loader import load_boxes
from inventario.rules import find_problems

ROOT = Path(__file__).resolve().parents[3]


def test_all_boxes_match_schema():
    """Los cinco JSON de cajas cumplen el esquema compartido."""
    boxes = load_boxes(ROOT / "data/boxes", ROOT / "schema/box.schema.json")
    assert [b.id for b in boxes] == ["C01", "C03", "C05", "C06", "C09"]


def test_boxes_have_no_business_problems():
    """Ninguna caja tiene referencias rotas ni piezas cortas."""
    boxes = load_boxes(ROOT / "data/boxes", ROOT / "schema/box.schema.json")
    assert [p for b in boxes for p in find_problems(b)] == []
