"""Lectura de los JSON de cajas validados contra el esquema común."""

import json
from pathlib import Path

from jsonschema import Draft202012Validator

from inventario.models import Box, Item, Project, Use


def load_schema(schema_path: Path) -> Draft202012Validator:
    """Construir el validador a partir del esquema compartido."""
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    return Draft202012Validator(schema)


def parse_box(raw: dict) -> Box:
    """Convertir un diccionario ya validado en un objeto Box."""
    items = tuple(Item(**it) for it in raw["items"])
    projects = tuple(
        Project(
            id=p["id"],
            slug=p["slug"],
            title=p["title"],
            challenge=p["challenge"],
            objective=p["objective"],
            uses=tuple(Use(**u) for u in p["uses"]),
            simulation_kind=p["simulation"]["kind"],
            simulation_status=p["simulation"]["status"],
        )
        for p in raw["projects"]
    )
    return Box(
        id=raw["id"],
        slug=raw["slug"],
        title=raw["title"],
        category=raw["category"],
        items=items,
        projects=projects,
    )


def load_boxes(data_dir: Path, schema_path: Path) -> list[Box]:
    """Leer y validar todas las cajas; falla con el primer error."""
    validator = load_schema(schema_path)
    boxes = []
    for path in sorted(data_dir.glob("*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        errors = sorted(validator.iter_errors(raw), key=str)
        if errors:
            first = errors[0]
            where = "/".join(str(p) for p in first.absolute_path)
            raise ValueError(f"{path.name}: {where}: {first.message}")
        boxes.append(parse_box(raw))
    return boxes
