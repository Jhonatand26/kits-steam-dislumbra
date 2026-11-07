"""Render del Excel de separación física; solo presentación."""

from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

from inventario.models import STATUS_LABEL, Box
from inventario.rules import pending_items, required_qty

FONT = "Arial"
HEAD_FILL = PatternFill("solid", fgColor="1F4E5F")
INPUT_FILL = PatternFill("solid", fgColor="FFF2CC")
_SIDE = Side(style="thin", color="BFBFBF")
BORDER = Border(left=_SIDE, right=_SIDE, top=_SIDE, bottom=_SIDE)
WRAP = Alignment(wrap_text=True, vertical="top")
STATUS_FILL = {
    "PENDIENTE": "F8CBAD",
    "verificar": "FFF2CC",
    "Interno": "DDEBF7",
    "En mano": "E2EFDA",
}


def _header(ws, row: int, titles: list[str], widths: list[int]) -> None:
    """Escribir una fila de encabezado con anchos de columna."""
    for col, (title, width) in enumerate(zip(titles, widths), 1):
        cell = ws.cell(row=row, column=col, value=title)
        cell.font = Font(name=FONT, bold=True, color="FFFFFF", size=10)
        cell.fill = HEAD_FILL
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        cell.border = BORDER
        ws.column_dimensions[cell.column_letter].width = width


def _row(ws, row: int, values: list, inputs: tuple[int, ...] = ()) -> None:
    """Escribir una fila; las columnas de entrada van en amarillo."""
    for col, value in enumerate(values, 1):
        cell = ws.cell(row=row, column=col, value=value)
        cell.font = Font(name=FONT, size=10)
        cell.alignment = WRAP
        cell.border = BORDER
        if col in inputs:
            cell.fill = INPUT_FILL


def _status_colors(ws, col_letter: str, last_row: int) -> None:
    """Colorear la columna de estado según su texto."""
    rng = f"{col_letter}2:{col_letter}{last_row}"
    for text, color in STATUS_FILL.items():
        ws.conditional_formatting.add(
            rng,
            FormulaRule(
                formula=[f'ISNUMBER(SEARCH("{text}",{col_letter}2))'],
                fill=PatternFill("solid", fgColor=color),
                stopIfTrue=True,
            ),
        )


def _box_sheet(wb: Workbook, box: Box) -> None:
    """Hoja de una caja: etiqueta, cantidades, uso por proyecto."""
    ws = wb.create_sheet(box.id)
    project_cols = [f"{p.id}" for p in box.projects]
    titles = (
        ["Etiqueta", "Ítem", "Cant. en caja", "Unidad"]
        + project_cols
        + [
            "Mín. requerido",
            "Estado",
            "Fuente",
            "Nota",
            "Cuidado",
            "Separado (Sí/No)",
        ]
    )
    widths = [9, 44, 8, 7] + [5] * len(project_cols) + [9, 20, 24, 34, 34, 10]
    _header(ws, 1, titles, widths)
    ws.freeze_panes = "C2"
    n_proj = len(project_cols)
    sep_col = len(titles)
    for r, item in enumerate(box.items, 2):
        per_project = [
            next((u.qty for u in p.uses if u.item == item.id), None)
            for p in box.projects
        ]
        _row(
            ws,
            r,
            [
                item.id,
                item.name,
                item.qty,
                item.unit,
                *per_project,
                required_qty(box, item.id),
                STATUS_LABEL[item.status],
                item.source,
                item.note,
                item.care,
                None,
            ],
            inputs=(sep_col,),
        )
    last = len(box.items) + 1
    status_letter = ws.cell(row=1, column=5 + n_proj + 1).column_letter
    _status_colors(ws, status_letter, last)
    sep_letter = ws.cell(row=1, column=sep_col).column_letter
    dv = DataValidation(type="list", formula1='"Sí,No"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"{sep_letter}2:{sep_letter}{last}")
    legend = last + 2
    ws.cell(row=legend, column=2, value="Proyectos de esta caja:").font = Font(
        name=FONT, bold=True, size=10
    )
    for i, p in enumerate(box.projects, 1):
        ws.cell(
            row=legend + i, column=2, value=f"{p.id} · {p.title}"
        ).font = Font(name=FONT, size=10)
    ws.cell(
        row=legend + len(box.projects) + 1,
        column=2,
        value=(
            "Columnas P1…P4: cantidad que usa cada proyecto. "
            "'Mín. requerido' = lo máximo que pide UN proyecto, "
            "porque se hacen en serie con las mismas piezas."
        ),
    ).font = Font(name=FONT, italic=True, size=9)


def _summary_sheet(wb: Workbook, boxes: list[Box]) -> None:
    """Resumen: conteo de ítems por estado en cada caja."""
    ws = wb.active
    ws.title = "Resumen"
    statuses = list(STATUS_LABEL)
    _header(
        ws,
        1,
        ["Caja", "Título", "Proyectos", "Ítems"]
        + [STATUS_LABEL[s] for s in statuses],
        [7, 40, 10, 7] + [14] * len(statuses),
    )
    for r, box in enumerate(boxes, 2):
        sheet = box.id
        last = len(box.items) + 1
        status_col = chr(ord("E") + len(box.projects) + 1)
        counts = [
            f"=COUNTIF({sheet}!{status_col}2:{status_col}{last},"
            f'"{STATUS_LABEL[s]}")'
            for s in statuses
        ]
        _row(
            ws,
            r,
            [
                box.id,
                box.title,
                len(box.projects),
                f"=COUNTA({sheet}!A2:A{last})",
                *counts,
            ],
        )
    note_row = len(boxes) + 3
    ws.cell(
        row=note_row,
        column=2,
        value=(
            "Generado desde data/boxes/*.json (misma fuente que la página "
            "web). No editar a mano: cambiar el JSON y regenerar."
        ),
    ).font = Font(name=FONT, italic=True, size=9)


def _pending_sheet(wb: Workbook, boxes: list[Box]) -> None:
    """Consolidado de todo lo que falta, para no perder nada."""
    ws = wb.create_sheet("Pendientes")
    _header(
        ws,
        1,
        [
            "Etiqueta",
            "Caja",
            "Ítem",
            "Cant.",
            "Estado",
            "Fuente",
            "Llegó y se puso en la caja (Sí/No)",
        ],
        [9, 6, 48, 6, 24, 26, 14],
    )
    r = 2
    for box in boxes:
        for item in pending_items(box):
            _row(
                ws,
                r,
                [
                    item.id,
                    box.id,
                    item.name,
                    item.qty,
                    STATUS_LABEL[item.status],
                    item.source,
                    None,
                ],
                inputs=(7,),
            )
            r += 1
    _status_colors(ws, "E", r - 1)
    ws.auto_filter.ref = f"A1:G{r - 1}"


def write_workbook(boxes: list[Box], out: Path) -> None:
    """Generar el libro completo en la ruta indicada."""
    wb = Workbook()
    _summary_sheet(wb, boxes)
    for box in boxes:
        _box_sheet(wb, box)
    _pending_sheet(wb, boxes)
    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
