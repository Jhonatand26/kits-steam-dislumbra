"""Lectura de los datos y resolución de referencias a las cajas.

Los faltantes no repiten el nombre de cajas ni proyectos: los citan
como ``"C09-P3"`` o ``"C01"``. Aquí se traducen usando
``data/boxes/*.json``, que es la fuente única de cajas y proyectos.
"""

import json
from dataclasses import dataclass
from pathlib import Path

from informe.models import Catalogo


@dataclass(frozen=True)
class Uso:
    """Dónde se usa un faltante, ya con nombres legibles."""

    caja: str
    caja_titulo: str
    color: str
    proyecto: str | None
    proyecto_titulo: str | None


class ReferenciaRota(ValueError):
    """Un faltante cita una caja o un proyecto que no existe."""


def load_catalogo(path: Path) -> Catalogo:
    """Leer y validar ``faltantes.json``."""
    return Catalogo.model_validate_json(path.read_text(encoding="utf-8"))


def load_cajas(data_dir: Path) -> dict[str, dict]:
    """Leer las cajas indexadas por id (``C01``, ``C03``...)."""
    cajas = {}
    for f in sorted(data_dir.glob("c0*.json")):
        caja = json.loads(f.read_text(encoding="utf-8"))
        cajas[caja["id"]] = caja
    return cajas


def resolver_uso(ref: str, cajas: dict[str, dict]) -> Uso:
    """Traducir ``"C09-P3"`` o ``"C01"`` a un :class:`Uso`."""
    caja_id, _, proyecto_id = ref.partition("-")
    caja = cajas.get(caja_id)
    if caja is None:
        raise ReferenciaRota(f"No existe la caja {caja_id!r} ({ref})")
    titulo = None
    if proyecto_id:
        titulos = {p["id"]: p["title"] for p in caja["projects"]}
        if proyecto_id not in titulos:
            raise ReferenciaRota(f"No existe el proyecto {ref!r}")
        titulo = titulos[proyecto_id]
    return Uso(
        caja=caja_id,
        caja_titulo=caja["title"],
        color=caja["accent"].lstrip("#").upper(),
        proyecto=proyecto_id or None,
        proyecto_titulo=titulo,
    )
