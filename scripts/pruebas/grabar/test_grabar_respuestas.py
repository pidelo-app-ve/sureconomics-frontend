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
    from app.services import boletin_programado as reloj

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
