r"""Todo lo que sabe de LaTeX: escapado, formato y plantilla.

Jinja usa por defecto ``{{ }}`` y ``{% %}``, que chocan con las llaves
de LaTeX. Aquí se cambian por ``\VAR{}`` y ``\BLOCK{}``: así la
plantilla sigue siendo LaTeX legible y compilable a mano.
"""

import re
from pathlib import Path
from urllib.parse import urlparse

from jinja2 import Environment, FileSystemLoader, StrictUndefined

_ESCAPES = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}
_PATRON = re.compile("|".join(re.escape(c) for c in _ESCAPES))


def escape(texto: object) -> str:
    """Escapar los caracteres especiales de LaTeX en un texto."""
    return _PATRON.sub(lambda m: _ESCAPES[m.group()], str(texto))


def qr(url: str) -> str:
    r"""Escapar una URL para ``\qrcode`` (exige escapar ``_%#&~``)."""
    return re.sub(r"([\\{}%#&_~^$])", r"\\\1", url)


def link(url: str) -> str:
    r"""Escapar una URL para ``\url`` y ``\href`` (``%`` y ``#``)."""
    return url.replace("%", r"\%").replace("#", r"\#")


def dominio(url: str) -> str:
    """Mostrar solo el dominio: ``www.zamux.co/x`` → ``zamux.co``."""
    host = urlparse(url).netloc
    return escape(host.removeprefix("www."))


def pesos(valor: int | None) -> str:
    """Formatear COP con punto de miles: ``18900`` → ``$18.900``."""
    if valor is None:
        return "Por confirmar"
    return "\\$" + f"{valor:,}".replace(",", ".")


def entorno(plantillas: Path) -> Environment:
    """Crear el entorno Jinja con delimitadores compatibles."""
    env = Environment(
        loader=FileSystemLoader(plantillas),
        block_start_string=r"\BLOCK{",
        block_end_string="}",
        variable_start_string=r"\VAR{",
        variable_end_string="}",
        comment_start_string=r"\#{",
        comment_end_string="}",
        line_comment_prefix="%%",
        trim_blocks=True,
        lstrip_blocks=True,
        autoescape=False,
        undefined=StrictUndefined,
    )
    env.filters["e"] = escape
    env.filters["pesos"] = pesos
    env.filters["qr"] = qr
    env.filters["link"] = link
    env.filters["dominio"] = dominio
    return env
