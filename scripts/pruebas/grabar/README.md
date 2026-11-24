# Grabar las respuestas del servidor

Las pruebas de pantalla (`scripts/pruebas/dom.mjs`) no salen a la red: contestan con
respuestas grabadas del backend de verdad, en `src/pruebas/respuestas/<zona>/`. Esta carpeta
las regenera cuando el backend cambia la forma de algo.

- `test_grabar_respuestas.py`: siembra datos en el backend en modo pruebas (SQLite en
  memoria, con su `tests/conftest.py`), hace las peticiones con su cliente de pruebas y
  deja cada respuesta en `$GRABADAS` (por omisión, `sureconomics-grabadas` en la carpeta
  temporal). Los tokens se guardan como `token-de-prueba`.
- `pasar.py`: copia lo grabado a `src/pruebas/respuestas/`, cada archivo con su `_origen`
  (qué petición, qué commit del backend).

## Cómo se corre

Contra una **copia** del backend, no sobre una rama en la que alguien esté trabajando
(por ejemplo, `git -C <backend> archive HEAD | tar -x -C <carpeta nueva>`), con sus
dependencias de desarrollo instaladas:

```sh
cd <copia del backend>
PYTHONDONTWRITEBYTECODE=1 MSYS_NO_PATHCONV=1 PYTHONPATH=. python -m pytest -p tests.conftest -p no:cacheprovider -q \
  <frontend>/scripts/pruebas/grabar/test_grabar_respuestas.py      # -k titulares: solo una parte

cd <frontend>
python scripts/pruebas/grabar/pasar.py <commit del backend>        # o: … <commit> titulares-pagina-1,pieza
npm test
```

## Qué regenera

| Grabación (`-k`) | Archivos |
|---|---|
| `boletin` | `boletin/lista`, `numero`, `numero-guardado` |
| `titulares` | `titulares/resumen`, `ajustes`, `fuentes`, `pagina-1`, `pagina-2`, `colombia`, `buscar`; `panel/entrar-editor`, `entrar-admin` |
| `panel` | `panel/yo-editor`, `yo-admin`; `lectores/lectora`, `lectora-nombre` |
| `piezas` | `piezas/pieza`, `no-existe`; `sitio/formatos`, `temas`, `lugares`, `monedas`, `mas-leidas`, `titulares`, `publicidad-pieza` |
| `portada` | `portada/piezas`, `canal`, `publicidad` |

`boletin/lote-terminado.json` va **escrita a mano**: grabarla mandaría correos.

Si una prueba falla tras regenerar, primero se mira si el backend cambió algo que la
pantalla tiene que seguir (para eso están). Las pruebas leen ids, títulos y cuentas de las
respuestas grabadas; si cambia lo que se siembra aquí, se ajustan también.
