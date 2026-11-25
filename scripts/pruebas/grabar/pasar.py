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
# La fecha y la rama de la grabación: las de la primera tanda si no se dicen.
FECHA = os.environ.get("FECHA_GRABADA", "23-nov-2026")
RAMA = os.environ.get("RAMA_BACKEND", "integracion-2026-11d")

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
    "resumen-ediciones-1": "resumen/ediciones-1.json",
    "resumen-ediciones-2": "resumen/ediciones-2.json",
    "resumen-ediciones-fallo": "resumen/ediciones-fallo.json",
    "resumen-ediciones-vacio": "resumen/ediciones-vacio.json",
    "usuarios-pagina-1": "lectores/lista-1.json",
    "usuarios-pagina-2": "lectores/lista-2.json",
    "usuarios-buscar": "lectores/lista-buscar.json",
    "usuarios-desactivados": "lectores/lista-desactivados.json",
    "usuarios-vacio": "lectores/lista-vacia.json",
    "suscriptores-pagina-1": "boletin/suscriptores-1.json",
    "suscriptores-buscar": "boletin/suscriptores-buscar.json",
    "traduccion-hecha": "traducciones/hecha.json",
    "traduccion-en-marcha": "traducciones/en-marcha.json",
    "traduccion-sigue": "traducciones/sigue.json",
    "traduccion-ya-hay-una": "traducciones/ya-hay-una.json",
    "traduccion-lista": "traducciones/lista.json",
    "traduccion-fallo": "traducciones/fallo.json",
    "traduccion-se-interrumpio": "traducciones/se-interrumpio.json",
}
SOLO = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None

for nombre, rel in MAPA.items():
    if SOLO and nombre not in SOLO:
        continue
    g = json.loads((GRABADAS / f"{nombre}.json").read_text(encoding="utf-8"))
    origen = (f"Grabada el {FECHA} del backend ({RAMA}, {COMMIT_BACKEND}) con su cliente de "
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
