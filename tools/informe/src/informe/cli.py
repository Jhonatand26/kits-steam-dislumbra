"""Punto de entrada: datos → LaTeX → PDF en ``exports/``."""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

from informe.latex import entorno
from informe.loader import load_cajas, load_catalogo, resolver_uso
from informe.resumen import (
    CATEGORIAS,
    PRIORIDADES,
    por_categoria,
    por_prioridad,
    por_responsable,
    total,
)

REPO_ROOT = Path(__file__).resolve().parents[4]
FOTO_EXT = (".jpg", ".jpeg", ".png")


def _ruta(var: str, defecto: str) -> Path:
    """Leer una ruta de una variable de entorno o usar la del repo."""
    return Path(os.getenv(var, REPO_ROOT / defecto))


def _foto(fotos: Path, item_id: str) -> str | None:
    """Devolver el nombre de la foto real del ítem, si existe."""
    for ext in FOTO_EXT:
        if (fotos / f"{item_id}{ext}").exists():
            return f"{item_id}{ext}"
    return None


def contexto(faltantes: Path, cajas_dir: Path, fotos: Path) -> dict:
    """Armar todo lo que la plantilla necesita, ya resuelto."""
    catalogo = load_catalogo(faltantes)
    cajas = load_cajas(cajas_dir)
    items = catalogo.items
    fichas = [
        {
            "item": it,
            "usos": [resolver_uso(u, cajas) for u in it.usos],
            "foto": _foto(fotos, it.id),
        }
        for it in items
    ]
    grupos = [
        (nombre, [f for f in fichas if f["item"].categoria == clave])
        for clave, nombre in CATEGORIAS.items()
    ]
    return {
        "c": catalogo,
        "grupos": grupos,
        "prioridades": PRIORIDADES,
        "por_categoria": por_categoria(items),
        "por_prioridad": por_prioridad(items),
        "por_responsable": por_responsable(items),
        "total": total("Total", items),
        "cajas": cajas,
        "con_foto": sum(1 for f in fichas if f["foto"]),
    }


def compilar(tex: Path) -> Path:
    """Compilar con XeLaTeX vía latexmk y devolver el PDF."""
    subprocess.run(
        [
            "latexmk",
            "-xelatex",
            "-interaction=nonstopmode",
            "-halt-on-error",
            tex.name,
        ],
        cwd=tex.parent,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return tex.with_suffix(".pdf")


def main() -> int:
    """Generar el informe y copiarlo a ``exports/``."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--faltantes",
        type=Path,
        default=_ruta("KITS_FALTANTES", "data/compras/faltantes.json"),
    )
    parser.add_argument(
        "--data", type=Path, default=_ruta("KITS_DATA_DIR", "data/boxes")
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=_ruta(
            "KITS_INFORME_OUT", "exports/Informe_Faltantes_Kits_STEAM.pdf"
        ),
    )
    parser.add_argument(
        "--solo-tex",
        action="store_true",
        help="Escribir el .tex sin compilar (útil para depurar).",
    )
    args = parser.parse_args()

    base = REPO_ROOT / "reports/informe-faltantes"
    build = base / "build"
    build.mkdir(exist_ok=True)
    ctx = contexto(args.faltantes, args.data, base / "fotos")
    tex = build / "informe.tex"
    plantilla = entorno(base).get_template("plantilla.tex.j2")
    tex.write_text(plantilla.render(**ctx), encoding="utf-8")
    if args.solo_tex:
        print(f"LaTeX: {tex}")
        return 0
    try:
        pdf = compilar(tex)
    except subprocess.CalledProcessError:
        print(
            f"Falló la compilación. Revisa {build / 'informe.log'}",
            file=sys.stderr,
        )
        return 1
    args.out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(pdf, args.out)
    print(
        f"OK: {len(ctx['c'].items)} faltantes, {ctx['con_foto']} con foto real"
    )
    print(f"PDF: {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
