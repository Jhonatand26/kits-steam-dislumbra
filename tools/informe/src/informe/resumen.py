"""Cifras del informe: totales por grupo y conteo de vacíos.

Lógica pura sobre los modelos, sin archivos ni LaTeX, para poder
probarla directamente.
"""

from collections.abc import Iterable
from dataclasses import dataclass

from informe.models import Item

CATEGORIAS = {
    "electronica": "Electrónica",
    "energia": "Energía y alimentación",
    "laboratorio": "Laboratorio y biología",
    "herramientas": "Herramientas y papelería",
}

PRIORIDADES = {
    1: "Imprescindible",
    2: "Necesario",
    3: "Recomendado",
}


@dataclass(frozen=True)
class Total:
    """Suma de un grupo de ítems."""

    etiqueta: str
    items: int
    valor: int
    sin_precio: int


def total(etiqueta: str, items: Iterable[Item]) -> Total:
    """Sumar los subtotales conocidos y contar los que no tienen."""
    items = list(items)
    conocidos = [i.precio.subtotal for i in items if i.precio.subtotal]
    sin_precio = sum(1 for i in items if i.precio.subtotal is None)
    return Total(etiqueta, len(items), sum(conocidos), sin_precio)


def por_categoria(items: list[Item]) -> list[Total]:
    """Totales en el orden fijo de :data:`CATEGORIAS`."""
    return [
        total(nombre, (i for i in items if i.categoria == clave))
        for clave, nombre in CATEGORIAS.items()
    ]


def por_prioridad(items: list[Item]) -> list[Total]:
    """Totales de prioridad 1, 2 y 3."""
    return [
        total(f"{p} · {nombre}", (i for i in items if i.prioridad == p))
        for p, nombre in PRIORIDADES.items()
    ]


def por_responsable(items: list[Item]) -> list[Total]:
    """Separar lo que se compra el lunes de lo que consigue otro."""
    return [
        total(
            "Compras del lunes",
            (i for i in items if i.responsable == "compras"),
        ),
        total(
            "Lo consigue otra persona",
            (i for i in items if i.responsable == "otra persona"),
        ),
    ]
