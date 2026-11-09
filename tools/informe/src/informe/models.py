"""Contrato del informe: lo que debe traer cada faltante.

Pydantic valida ``data/compras/faltantes.json`` al cargarlo: si falta
un campo o una prioridad no es 1, 2 o 3, el error sale antes de
compilar LaTeX y dice exactamente qué ítem está mal.
"""

from typing import Literal

from pydantic import BaseModel, Field, computed_field

Categoria = Literal["electronica", "energia", "laboratorio", "herramientas"]
Responsable = Literal["compras", "otra persona"]


class Precio(BaseModel):
    """Precio consultado para un ítem y cuántas unidades comprar."""

    valor: int | None = Field(description="COP por presentación.")
    presentacion: str
    compra: int = Field(ge=1, description="Cuántas presentaciones.")
    tienda: str
    url: str | None = None

    @computed_field
    @property
    def subtotal(self) -> int | None:
        """Costo estimado; ``None`` si no se encontró precio."""
        if self.valor is None:
            return None
        return self.valor * self.compra


class Item(BaseModel):
    """Un faltante con su justificación y su fuente de precio."""

    id: str = Field(pattern=r"^[a-z]\d{2}$")
    ilustracion: str
    categoria: Categoria
    nombre: str
    usos: list[str] = Field(min_length=1)
    prioridad: Literal[1, 2, 3]
    cantidad: int = Field(ge=1)
    unidad: str
    responsable: Responsable
    porque: str
    specs: list[str] = Field(min_length=1)
    donde: list[str] = Field(min_length=1)
    precio: Precio
    alternativa: str | None = None


class TiendaCali(BaseModel):
    """Tienda física en Cali."""

    nombre: str
    direccion: str
    contacto: str = ""
    nota: str = ""


class TiendaEnvio(BaseModel):
    """Tienda fuera de Cali que despacha a domicilio."""

    nombre: str
    ciudad: str
    nota: str = ""


class Catalogo(BaseModel):
    """Contenido completo de ``faltantes.json``."""

    corte: str
    titulo: str
    subtitulo: str
    tiendas_cali: list[TiendaCali]
    tiendas_envio: list[TiendaEnvio]
    items: list[Item]
    criterio: str = ""
    cambios: list[str] = []
