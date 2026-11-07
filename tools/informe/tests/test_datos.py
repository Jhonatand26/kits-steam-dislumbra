"""Pruebas de contrato sobre los datos reales del repositorio."""

from pathlib import Path

import pytest

from informe.loader import (
    ReferenciaRota,
    load_cajas,
    load_catalogo,
    resolver_uso,
)

ROOT = Path(__file__).resolve().parents[3]
FALTANTES = ROOT / "data/compras/faltantes.json"
ILUSTRACIONES = ROOT / "reports/informe-faltantes/ilustraciones.tex"


def test_faltantes_cumplen_el_contrato():
    """El JSON de faltantes valida contra los modelos."""
    assert load_catalogo(FALTANTES).items


def test_ids_de_faltantes_son_unicos():
    """Dos fichas nunca comparten id (el id nombra la foto)."""
    ids = [i.id for i in load_catalogo(FALTANTES).items]
    assert len(ids) == len(set(ids))


def test_todos_los_usos_existen_en_las_cajas():
    """Cada "C09-P3" citado existe en data/boxes."""
    cajas = load_cajas(ROOT / "data/boxes")
    for item in load_catalogo(FALTANTES).items:
        for ref in item.usos:
            resolver_uso(ref, cajas)


def test_referencia_inexistente_falla_con_mensaje_claro():
    """Un proyecto inventado produce ReferenciaRota."""
    cajas = load_cajas(ROOT / "data/boxes")
    with pytest.raises(ReferenciaRota):
        resolver_uso("C09-P9", cajas)


def test_toda_ilustracion_citada_esta_dibujada():
    """Ninguna ficha cae en la ilustración genérica por error."""
    tex = ILUSTRACIONES.read_text(encoding="utf-8")
    faltan = {
        i.ilustracion
        for i in load_catalogo(FALTANTES).items
        if f"ilus@{i.ilustracion}" not in tex
    }
    assert faltan == set()
