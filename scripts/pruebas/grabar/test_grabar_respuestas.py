"""
Graba respuestas reales del backend (cliente de pruebas, SQLite en memoria) para las
pruebas de pantalla del frontend. Cómo se corre y qué regenera: README.md, al lado.

Escribe un JSON por respuesta en $GRABADAS (por omisión, `sureconomics-grabadas` en la
carpeta temporal del sistema). No toca ni el backend ni el frontend: eso lo hace `pasar.py`.
"""

from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.extensions import db

SALIDA = Path(os.environ.get("GRABADAS") or Path(tempfile.gettempdir()) / "sureconomics-grabadas")
SALIDA.mkdir(exist_ok=True)


def _guardar(nombre: str, metodo: str, ruta: str, r, nota: str = "") -> dict:
    cuerpo = r.get_json()
    # Los tokens de verdad no se guardan.
    datos = cuerpo.get("data") if isinstance(cuerpo, dict) else None
    if isinstance(datos, dict):
        for k in ("access_token", "refresh_token"):
            if k in datos:
                datos[k] = "token-de-prueba"
    (SALIDA / f"{nombre}.json").write_text(
        json.dumps({"metodo": metodo, "ruta": ruta, "estado": r.status_code, "nota": nota, "cuerpo": cuerpo},
                   ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return cuerpo


def _entrar(client, correo: str, rol: str, nombre: str | None = None):
    from app.models import AdminUser
    from app.utils.passwords import hash_password

    db.session.add(AdminUser(name=correo, email=correo, password_hash=hash_password("pw"), role=rol))
    db.session.commit()
    r = client.post("/auth/login", json={"email": correo, "password": "pw"})
    assert r.status_code == 200, r.json
    if nombre:
        _guardar(nombre, "POST", "/auth/login", r)
    return {"Authorization": f"Bearer {r.json['data']['access_token']}"}


def test_boletin(app, client):
    from app.models import MediaAsset, NewsletterIssuePage, NewsletterSubscriber
    # Los lunes del boletín viven en su dominio (antes, app.services.boletin_programado).
    from app.domains.boletin import rules as reloj

    h = _entrar(client, "editor-boletin@example.test", "publicador")
    lunes = reloj.proximo_lunes(reloj.hoy_en_caracas())
    r = client.post("/admin/boletin/numeros", headers=h,
                    json={"send_on": lunes.isoformat(), "subject": "Entorno en Viñetas · 30 de noviembre"})
    assert r.status_code == 201, r.json
    nid = r.json["data"]["id"]
    medio = MediaAsset(kind="image", storage="external", url="https://img.example.test/vineta-1.webp",
                       original_filename="vineta-1.webp", width=1080, height=1350)
    db.session.add(medio)
    db.session.commit()
    db.session.add(NewsletterIssuePage(issue_id=nid, media_id=medio.id, position=0))
    for i in range(3):
        db.session.add(NewsletterSubscriber(email=f"lectora{i}@example.test", status="subscribed",
                                            unsubscribe_token=f"baja-{i}", source="home"))
    db.session.commit()
    intro_tiptap = ('<p>Esta semana, <a target="_blank" rel="noopener noreferrer nofollow" '
                    'href="https://sureconomics.com/noticias/inflacion">la inflación en cifras</a>.</p>')
    r = client.patch(f"/admin/boletin/numeros/{nid}", headers=h, json={"body_html": intro_tiptap, "status": "ready"})
    assert r.status_code == 200, r.json

    _guardar("boletin-lista", "GET", "/admin/boletin/numeros", client.get("/admin/boletin/numeros", headers=h))
    _guardar("boletin-numero", "GET", f"/admin/boletin/numeros/{nid}",
             client.get(f"/admin/boletin/numeros/{nid}", headers=h))
    asunto = "Entorno en Viñetas · 30 de noviembre (con enlace)"
    intro2 = ('<p>Esta semana, <a target="_blank" rel="noopener noreferrer nofollow" '
              'href="https://sureconomics.com/noticias/inflacion">la inflación en cifras</a> y la cumbre.</p>')
    _guardar("boletin-numero-guardado", "PATCH", f"/admin/boletin/numeros/{nid}",
             client.patch(f"/admin/boletin/numeros/{nid}", headers=h,
                          json={"subject": asunto, "preheader": "", "body_html": intro2}),
             nota="enviado: " + json.dumps({"subject": asunto, "preheader": "", "body_html": intro2}, ensure_ascii=False))


def test_titulares(app, client):
    from app.models import HeadlineCluster

    h = _entrar(client, "editor-titulares@example.test", "publicador", nombre="entrar-editor")
    _entrar(client, "admin-titulares@example.test", "admin", nombre="entrar-admin")
    base = datetime.now(timezone.utc).replace(microsecond=0)
    paises = ["VE", "CO", "AR", "VE", "BR"]
    categorias = ["economia", "politica", "negocios", "mundo", "economia"]
    for n in range(45):
        cuando = base - timedelta(minutes=10 * n + 5)
        db.session.add(HeadlineCluster(
            status="published", title=f"Titular {n + 1}", summary=f"Resumen del titular {n + 1}.",
            title_en=f"Headline {n + 1}", summary_en=f"Summary {n + 1}.",
            category=categorias[n % 5], country=paises[n % 5], best_tier=1 + n % 4,
            heat_score=float(90 - n), sources_count=2, independent_sources=2,
            first_item_at=cuando, last_item_at=cuando, published_at=cuando,
        ))
    db.session.commit()
    for nombre, ruta in (("titulares-resumen", "/admin/headlines/resumen"),
                         ("titulares-ajustes", "/admin/headlines/settings"),
                         ("titulares-fuentes", "/admin/headlines/fuentes")):
        r = client.get(ruta, headers=h)
        assert r.status_code == 200, (ruta, r.json)
        _guardar(nombre, "GET", ruta, r)
    consulta = {"vista": "publicados", "por_pagina": 20, "horas": 24}
    for nombre, extra in (("titulares-pagina-1", {"pagina": 1}), ("titulares-pagina-2", {"pagina": 2}),
                          ("titulares-colombia", {"pagina": 1, "pais": "CO"}),
                          ("titulares-buscar", {"pagina": 1, "buscar": "Titular 1"})):
        r = client.get("/admin/headlines", headers=h, query_string={**consulta, **extra})
        assert r.status_code == 200, r.json
        _guardar(nombre, "GET", "/admin/headlines?" + "&".join(f"{k}={v}" for k, v in {**consulta, **extra}.items()), r)


def test_piezas(app, client):
    h = _entrar(client, "redaccion-piezas@example.test", "admin")
    r = client.post("/admin/posts", headers=h, json={
        "format": "noticia", "title": "El BCV sube la tasa de encaje", "excerpt": "<p>La medida rige desde el lunes.</p>",
        "content": "<p>El Banco Central de Venezuela subió la tasa de encaje legal.</p>", "status": "published",
    })
    assert r.status_code == 201, r.json
    slug = r.json["data"]["slug"]
    _guardar("pieza", "GET", f"/posts/{slug}", client.get(f"/posts/{slug}"))
    _guardar("pieza-no-existe", "GET", "/posts/no-existe", client.get("/posts/no-existe"))
    for nombre, ruta in (("formatos", "/formats"), ("temas", "/topics"), ("lugares", "/places"),
                         ("monedas", "/monedas"), ("mas-leidas", "/analitica/mas-leidas?dias=7"),
                         ("titulares-publicos", "/headlines?lang=es&limit=40"),
                         ("publicidad-espacios", "/publicidad/espacios?espacios=barra-inferior,articulo-nativo,articulo-rail&recarga=0&seccion=noticia&formato=noticia")):
        r = client.get(ruta)
        _guardar(nombre, "GET", ruta, r)


def test_portada(app, client):
    import time

    h = _entrar(client, "redaccion-portada@example.test", "admin")
    for formato, titulo in (("noticia", "El dólar oficial cierra estable"), ("articulo", "Qué deja el año para la inflación"),
                            ("noticia", "Colombia recorta su tasa de interés"), ("noticia", "El BCV sube la tasa de encaje")):
        r = client.post("/admin/posts", headers=h, json={
            "format": formato, "title": titulo, "excerpt": f"<p>Entradilla: {titulo}.</p>",
            "content": f"<p>Cuerpo de «{titulo}».</p>", "status": "published",
        })
        assert r.status_code == 201, r.json
        time.sleep(1.1)  # cada una con su segundo: el orden de la portada es por fecha
    for nombre, ruta in (("portada-piezas", "/posts?page=1&limit=100"), ("canal", "/canal"),
                         ("publicidad-portada", "/publicidad/espacios?espacios=barra-inferior,portada-banner,"
                          "portada-apertura,portada-nativo,portada-tarjeta,portada-nativo-articulos,"
                          "portada-nativo-editorial,boletin&recarga=0&seccion=portada")):
        r = client.get(ruta)
        assert r.status_code == 200, (ruta, r.json)
        _guardar(nombre, "GET", ruta, r)


def test_panel(app, client):
    from app.models import User

    for correo, rol, nombre in (("editora-panel@example.test", "publicador", "panel-yo-editor"),
                                ("duena-panel@example.test", "admin", "panel-yo-admin")):
        h = _entrar(client, correo, rol)
        assert client.put("/admin/me/recorridos/panel", headers=h, json={}).status_code == 200
        _guardar(nombre, "GET", "/admin/me", client.get("/admin/me", headers=h),
                 nota="tras PUT /admin/me/recorridos/panel (la bienvenida ya vista)")
    lectora = User(email="lectora-propone@example.test", first_name="Ana", last_name="Pérez",
                   can_submit_collaborative_articles=True)
    db.session.add(lectora)
    db.session.commit()
    _guardar("lectora", "GET", f"/admin/users/{lectora.id}", client.get(f"/admin/users/{lectora.id}", headers=h))
    _guardar("lectora-nombre", "PATCH", f"/admin/users/{lectora.id}",
             client.patch(f"/admin/users/{lectora.id}", headers=h, json={"first_name": "Ana María", "last_name": "Pérez"}),
             nota='enviado: {"first_name": "Ana María", "last_name": "Pérez"}')


def _consulta(ruta: str, consulta: dict) -> str:
    return ruta + "?" + "&".join(f"{k}={v}" for k, v in consulta.items())


def test_listas(app, client):
    """Las listas del panel con filtros y páginas (frente E, 24-nov-2026): el historial del
    resumen, los lectores y los suscriptores del boletín."""
    from app.domains.resumen import queries
    from app.domains.resumen.models import ResumenDiario
    from app.models import NewsletterSubscriber, User

    h = _entrar(client, "editor-listas@example.test", "publicador")
    # El resumen: diez días de tres ediciones (30) y una de ellas falló en WhatsApp.
    hoy = queries.ahora_en_caracas().date()
    ahora = datetime.now(timezone.utc).replace(microsecond=0)
    for atras in range(1, 11):
        for edicion in ("manana", "tarde", "noche"):
            fallo = atras == 3 and edicion == "tarde"
            db.session.add(ResumenDiario(
                fecha=hoy - timedelta(days=atras), edicion=edicion, estado="publicado",
                contenido={"secciones": [{"clave": "importante", "puntos": [{"id": "p1", "linea": "Algo"}]}]},
                desde=ahora - timedelta(days=atras, hours=6), hasta=ahora - timedelta(days=atras),
                publicado_en=ahora - timedelta(days=atras), telegram_estado="enviado",
                whatsapp_estado="fallo" if fallo else "enviado", whatsapp_error="sesión caída" if fallo else None,
            ))
    # Los lectores: 25, tres de ellos «Ana».
    for n in range(25):
        nombre = "Ana" if n % 10 == 0 else f"Lector{n}"
        db.session.add(User(email=f"lector{n}@example.test", first_name=nombre, last_name=f"Apellido{n}",
                            is_active=n != 7, is_email_verified=n % 2 == 0))
    # Los suscriptores: 25, tres de ellos «ana…».
    for n in range(25):
        correo = f"ana{n}@example.test" if n % 10 == 0 else f"persona{n}@example.test"
        db.session.add(NewsletterSubscriber(email=correo, status="subscribed", unsubscribe_token=f"baja-lista-{n}",
                                            source=("home", "footer", "instagram")[n % 3]))
    db.session.commit()

    for nombre, ruta, consulta in (
        ("resumen-ediciones-1", "/admin/resumen/ediciones", {"pagina": 1}),
        ("resumen-ediciones-2", "/admin/resumen/ediciones", {"pagina": 2}),
        ("resumen-ediciones-fallo", "/admin/resumen/ediciones", {"fallo": "whatsapp", "pagina": 1}),
        ("resumen-ediciones-vacio", "/admin/resumen/ediciones", {"estado": "retenido", "pagina": 1}),
        ("usuarios-pagina-1", "/admin/users", {"page": 1, "limit": 20}),
        ("usuarios-pagina-2", "/admin/users", {"page": 2, "limit": 20}),
        ("usuarios-buscar", "/admin/users", {"page": 1, "limit": 20, "q": "ana"}),
        ("usuarios-desactivados", "/admin/users", {"page": 1, "limit": 20, "activo": "no"}),
        ("usuarios-vacio", "/admin/users", {"page": 1, "limit": 20, "q": "nadie"}),
        ("suscriptores-pagina-1", "/admin/newsletter", {"page": 1, "limit": 20, "status": "subscribed"}),
        ("suscriptores-buscar", "/admin/newsletter", {"page": 1, "limit": 20, "status": "subscribed", "q": "ana"}),
    ):
        r = client.get(ruta, headers=h, query_string=consulta)
        assert r.status_code == 200, (ruta, r.json)
        _guardar(nombre, "GET", _consulta(ruta, consulta), r)


def test_traducciones(app, client, monkeypatch):
    """«Traducir con Claude» en el editor, en segundo plano (`/admin/traducciones`, 25-nov-2026):
    lo que lee `traducirTextos`. La IA no se llama: se sustituye. Para el 202 la tarea se deja
    «en marcha» a mano, como en `tests/test_traduccion.py` del backend, y después se corre con
    el mismo `_correr` del servidor, que la cierra con su resultado o con su error."""
    import threading

    from app.services import traduccion_service
    from app.utils import en_segundo_plano as fondo
    from app.utils.errors import ApiError

    def limpiar():
        with fondo._mutex:
            for nombre in [n for n in fondo._tareas if n.startswith("traduccion-editor:")]:
                del fondo._tareas[nombre]

    limpiar()
    h = _entrar(client, "redaccion-traduce@example.test", "escritor")
    app.config["ANTHROPIC_API_KEY"] = "sk-ant-prueba"
    formulario = {"title": "El BCV sube la tasa de encaje", "excerpt": "<p>La medida rige desde el lunes.</p>",
                  "content": "<p>El Banco Central de Venezuela subió la tasa de encaje legal.</p>"}
    traduccion = {"title": "The BCV raises the reserve requirement",
                  "excerpt": "<p>The measure takes effect on Monday.</p>",
                  "content": "<p>Venezuela's Central Bank raised the legal reserve requirement.</p>"}
    monkeypatch.setattr(traduccion_service, "_pedir_traduccion", lambda campos: dict(traduccion))
    enviado = "enviado: " + json.dumps(formulario, ensure_ascii=False)
    ruta = "/admin/traducciones"

    # Termina en los 8 s: 200 con la traducción, como la ruta vieja.
    r = client.post(ruta, headers=h, json=formulario)
    assert r.status_code == 200, r.json
    _guardar("traduccion-hecha", "POST", ruta, r, nota=enviado)

    # Tarda más: la tarea queda en marcha y se pregunta por su id.
    pendientes = {}

    def tarda(nombre, trabajo, *, datos=None, **_):
        pendientes[nombre] = trabajo
        with fondo._mutex:
            fondo._tareas[nombre] = {"estado": "en_marcha", "resultado": None, **(datos or {}),
                                     "_hecho": threading.Event()}
        return fondo.estado(nombre)

    def terminar():
        (nombre, trabajo), = pendientes.items()
        pendientes.clear()
        fondo._correr(app, nombre, trabajo, None)

    monkeypatch.setattr(fondo, "ejecutar", tarda)
    r = client.post(ruta, headers=h, json=formulario)
    assert r.status_code == 202, r.json
    pedido = r.json["data"]["id"]
    _guardar("traduccion-en-marcha", "POST", ruta, r, nota=enviado + " (la IA tarda más de 8 s)")
    r = client.get(f"{ruta}/{pedido}", headers=h)
    assert r.status_code == 202, r.json
    _guardar("traduccion-sigue", "GET", f"{ruta}/{pedido}", r)
    r = client.post(ruta, headers=h, json=formulario)
    assert r.status_code == 409, r.json
    _guardar("traduccion-ya-hay-una", "POST", ruta, r, nota=enviado + " (con otra en marcha)")
    terminar()
    r = client.get(f"{ruta}/{pedido}", headers=h)
    assert r.status_code == 200, r.json
    _guardar("traduccion-lista", "GET", f"{ruta}/{pedido}", r)

    # Tarda y después falla la IA: el error de la traducción, tal cual.
    def falla(campos):
        raise ApiError("translation_failed", "No se pudo traducir: Claude contestó con un error (529).", status=502)

    monkeypatch.setattr(traduccion_service, "_pedir_traduccion", falla)
    r = client.post(ruta, headers=h, json=formulario)
    assert r.status_code == 202, r.json
    pedido = r.json["data"]["id"]
    terminar()
    r = client.get(f"{ruta}/{pedido}", headers=h)
    assert r.status_code == 502, r.json
    _guardar("traduccion-fallo", "GET", f"{ruta}/{pedido}", r,
             nota="(la IA contestó 529; el mensaje es el de traduccion_service)")

    # Un id que el servidor ya no tiene (se reinició entretanto).
    r = client.get(f"{ruta}/de-antes-del-reinicio", headers=h)
    assert r.status_code == 404, r.json
    _guardar("traduccion-se-interrumpio", "GET", f"{ruta}/de-antes-del-reinicio", r)
    limpiar()
