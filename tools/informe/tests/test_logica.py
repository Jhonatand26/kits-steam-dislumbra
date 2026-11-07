"""Pruebas de la lógica propia (sin mocks)."""

from informe.latex import escape, pesos, qr
from informe.models import Item, Precio
from informe.resumen import total


def _item(valor: int | None, compra: int = 1) -> Item:
    """Construir un ítem mínimo con un precio dado."""
    return Item(
        id="e99",
        ilustracion="guva",
        categoria="electronica",
        nombre="Prueba",
        usos=["C06-P2"],
        prioridad=1,
        cantidad=compra,
        unidad="und",
        responsable="compras",
        porque="x",
        specs=["x"],
        donde=["x"],
        precio=Precio(
            valor=valor,
            presentacion="por unidad",
            compra=compra,
            tienda="x",
        ),
    )


def test_subtotal_es_precio_por_presentaciones():
    """El subtotal multiplica el precio por lo que se compra."""
    assert _item(18900, compra=2).precio.subtotal == 37800


def test_total_ignora_y_cuenta_los_sin_precio():
    """Un ítem sin precio no suma, pero queda contado aparte."""
    t = total("T", [_item(1000), _item(None)])
    assert (t.valor, t.sin_precio) == (1000, 1)


def test_escape_protege_caracteres_de_latex():
    """Los símbolos especiales salen escapados para LaTeX."""
    assert escape("50% & #1_a") == r"50\% \& \#1\_a"


def test_pesos_usa_punto_de_miles():
    """Los precios se muestran como en Colombia."""
    assert pesos(114900) == r"\$114.900"


def test_qr_escapa_guion_bajo_de_la_url():
    """El paquete qrcode exige escapar el guion bajo."""
    assert qr("https://a.co/x_y") == r"https://a.co/x\_y"
