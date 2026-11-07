"""Reglas de negocio de las cajas, independientes del formato de salida.

Regla central: los proyectos de una caja se hacen uno tras otro con las
mismas piezas. Por eso la caja necesita, de cada ítem, el MÁXIMO que
pide un solo proyecto, no la suma de todos.
"""

from inventario.models import Box


def required_qty(box: Box, item_id: str) -> int:
    """Cantidad mínima del ítem para hacer los proyectos en serie."""
    return max(
        (u.qty for p in box.projects for u in p.uses if u.item == item_id),
        default=0,
    )


def find_problems(box: Box) -> list[str]:
    """Listar inconsistencias: referencias rotas o cantidades cortas."""
    problems = []
    ids = [it.id for it in box.items]
    duplicated = {i for i in ids if ids.count(i) > 1}
    problems += [f"{box.id}: ítem duplicado {i}" for i in sorted(duplicated)]
    known = set(ids)
    for project in box.projects:
        for use in project.uses:
            if use.item not in known:
                problems.append(
                    f"{box.id}-{project.id}: usa {use.item}, que no existe"
                )
            elif not use.item.startswith(box.id):
                problems.append(
                    f"{box.id}-{project.id}: {use.item} es de otra caja"
                )
    for item in box.items:
        need = required_qty(box, item.id)
        if need > item.qty:
            problems.append(
                f"{item.id}: la caja trae {item.qty} y un proyecto "
                f"necesita {need}"
            )
    return problems


def pending_items(box: Box) -> list:
    """Ítems que todavía no están físicamente listos para la caja."""
    return [it for it in box.items if it.status not in ("en_mano",)]
