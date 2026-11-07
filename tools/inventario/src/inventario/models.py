"""Contrato en código de una caja de kit (espejo de box.schema.json)."""

from dataclasses import dataclass, field
from typing import Literal

Status = Literal[
    "en_mano",
    "verificar",
    "pendiente_compra",
    "pendiente_no_electronico",
    "interno",
]

STATUS_LABEL: dict[str, str] = {
    "en_mano": "En mano",
    "verificar": "En mano · verificar",
    "pendiente_compra": "PENDIENTE · compra lunes",
    "pendiente_no_electronico": "PENDIENTE · no electrónico",
    "interno": "Interno (Dislumbra)",
}


@dataclass(frozen=True)
class Item:
    """Un componente físico dentro de una caja."""

    id: str
    name: str
    qty: int
    unit: str
    status: Status
    group: str
    source: str = ""
    note: str = ""
    care: str = ""


@dataclass(frozen=True)
class Use:
    """Cantidad de un ítem que necesita un proyecto."""

    item: str
    qty: int


@dataclass(frozen=True)
class Project:
    """Proyecto de una categoría; consume ítems de su propia caja."""

    id: str
    slug: str
    title: str
    challenge: str
    objective: str
    uses: tuple[Use, ...]
    simulation_kind: str
    simulation_status: str


@dataclass(frozen=True)
class Box:
    """Caja de una categoría: inventario y proyectos secuenciales."""

    id: str
    slug: str
    title: str
    category: str
    items: tuple[Item, ...]
    projects: tuple[Project, ...] = field(default_factory=tuple)

    def item(self, item_id: str) -> Item:
        """Devolver el ítem con ese identificador."""
        for it in self.items:
            if it.id == item_id:
                return it
        raise KeyError(item_id)
