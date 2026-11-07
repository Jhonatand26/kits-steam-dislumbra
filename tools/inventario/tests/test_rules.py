"""Pruebas de las reglas de negocio (sin mocks: lógica propia)."""

from inventario.models import Box, Item, Project, Use
from inventario.rules import find_problems, required_qty


def _box(item_qty: int, uses: list[list[tuple[str, int]]]) -> Box:
    """Construir una caja mínima con un ítem y varios proyectos."""
    item = Item(
        id="C99-01",
        name="Cable",
        qty=item_qty,
        unit="und",
        status="en_mano",
        group="cableado",
    )
    projects = tuple(
        Project(
            id=f"P{i}",
            slug=f"p{i}",
            title="t",
            challenge="c",
            objective="o",
            uses=tuple(Use(*u) for u in us),
            simulation_kind="wokwi",
            simulation_status="pendiente",
        )
        for i, us in enumerate(uses, 1)
    )
    return Box(
        id="C99",
        slug="x",
        title="x",
        category="x",
        items=(item,),
        projects=projects,
    )


def test_required_is_max_not_sum():
    """En serie, la caja necesita el máximo de un proyecto."""
    box = _box(10, [[("C99-01", 8)], [("C99-01", 6)]])
    assert required_qty(box, "C99-01") == 8


def test_short_quantity_is_reported():
    """Si un proyecto pide más de lo que trae la caja, se reporta."""
    box = _box(5, [[("C99-01", 8)]])
    assert find_problems(box) == [
        "C99-01: la caja trae 5 y un proyecto necesita 8"
    ]


def test_unknown_item_is_reported():
    """Un proyecto no puede usar un ítem que no está en la caja."""
    box = _box(5, [[("C99-07", 1)]])
    assert find_problems(box) == ["C99-P1: usa C99-07, que no existe"]
