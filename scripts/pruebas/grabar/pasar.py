"""
Pasa lo grabado (en $GRABADAS) a src/pruebas/respuestas/<zona>/ de este repo, con su _origen.

    python scripts/pruebas/grabar/pasar.py <commit del backend> [nombre,nombre,...]

Sin nombres, pasa todos los de MAPA. Ver README.md, al lado.
"""
import json
import os
import sys
import tempfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
GRABADAS = Path(os.environ.get("GRABADAS") or Path(tempfile.gettempdir()) / "sureconomics-grabadas")
DESTINO = AQUI.parents[2] / "src" / "pruebas" / "respuestas"
COMMIT_BACKEND = sys.argv[1]

MAPA = {
    "boletin-lista": "boletin/lista.json",
    "boletin-numero": "boletin/numero.json",
    "boletin-numero-guardado": "boletin/numero-guardado.json",
    "entrar-editor": "panel/entrar-editor.json",
    "entrar-admin": "panel/entrar-admin.json",
    "titulares-resumen": "titulares/resumen.json",
    "titulares-ajustes": "titulares/ajustes.json",
    "titulares-fuentes": "titulares/fuentes.json",
    "titulares-pagina-1": "titulares/pagina-1.json",
    "titulares-pagina-2": "titulares/pagina-2.json",
    "titulares-colombia": "titulares/colombia.json",
    "titulares-buscar": "titulares/buscar.json",
    "pieza": "piezas/pieza.json",
    "pieza-no-existe": "piezas/no-existe.json",
    "panel-yo-editor": "panel/yo-editor.json",
    "panel-yo-admin": "panel/yo-admin.json",
    "lectora": "lectores/lectora.json",
    "lectora-nombre": "lectores/lectora-nombre.json",
    "formatos": "sitio/formatos.json",
    "temas": "sitio/temas.json",
    "lugares": "sitio/lugares.json",
    "monedas": "sitio/monedas.json",
    "mas-leidas": "sitio/mas-leidas.json",
    "titulares-publicos": "sitio/titulares.json",
    "publicidad-espacios": "sitio/publicidad-pieza.json",
    "portada-piezas": "portada/piezas.json",
    "canal": "portada/canal.json",
    "publicidad-portada": "portada/publicidad.json",
}
SOLO = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None

for nombre, rel in MAPA.items():
    if SOLO and nombre not in SOLO:
        continue
    g = json.loads((GRABADAS / f"{nombre}.json").read_text(encoding="utf-8"))
    origen = (f"Grabada el 23-nov-2026 del backend (integracion-2026-11d, {COMMIT_BACKEND}) con su cliente de "
              f"pruebas: {g['metodo']} {g['ruta']} -> {g['estado']}. Cómo: scripts/pruebas/grabar/.")
    if g["nota"]:
        origen += f" {g['nota']}"
    respuesta = g["cuerpo"] if g["estado"] == 200 else {"estado": g["estado"], "cuerpo": g["cuerpo"]}
    salida = DESTINO / rel
    salida.parent.mkdir(parents=True, exist_ok=True)
    texto = json.dumps({"_origen": origen, "respuesta": respuesta}, ensure_ascii=False, indent=2) + "\n"
    assert "\x00" not in texto
    salida.write_bytes(texto.encode("utf-8"))
    print(rel, len(texto))
