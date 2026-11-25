/**
 * El formulario del editor de piezas (`formulario.js`): cómo llega una pieza de la API,
 * qué se manda al guardar y las fechas en hora de Caracas. `npm test`.
 *
 * Lo que se vigila sobre todo es **qué se manda**: un campo que se omite en vez de
 * mandarse vacío deja la pieza como estaba (no se puede quitar una firma, un tema o la
 * portada), y uno que se manda de más pisa lo que había.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  comparable,
  destacadaHastaDe,
  emptyForm,
  fechaDeCaracas,
  idDeLaPieza,
  formToPayload,
  hastaDeCaracas,
  isoToDateTimeLocal,
  listaCorta,
  nombreDeArchivo,
  normalizarPieza,
  palabras,
  postToForm,
  recortar,
  textoPlano,
} from "./formulario.js";

const HORA = 3_600_000;
const form = (extra = {}) => ({ ...emptyForm(), format: "noticia", title: "Titular", content: "<p>Texto</p>", ...extra });

describe("las fechas, en hora de Caracas", () => {
  test("de la API al campo: en UTC-4", () => {
    assert.equal(isoToDateTimeLocal("2026-09-28T13:00:00Z"), "2026-09-28T09:00");
    // Cruza la medianoche hacia atrás.
    assert.equal(isoToDateTimeLocal("2026-01-01T02:30:00Z"), "2025-12-31T22:30");
  });

  test("una fecha vacía o ilegible deja el campo vacío", () => {
    for (const raro of ["", null, undefined, "mañana", "2026-13-45"]) assert.equal(isoToDateTimeLocal(raro), "", String(raro));
  });

  test("del campo a la API: la misma hora, en UTC", () => {
    const payload = formToPayload(form({ published_at: "2026-09-28T09:00" }));
    assert.equal(payload.published_at, "2026-09-28T13:00:00.000Z");
  });

  test("ida y vuelta no mueve la hora", () => {
    const iso = "2026-11-19T15:45:00.000Z";
    assert.equal(formToPayload(form({ published_at: isoToDateTimeLocal(iso) })).published_at, iso);
  });

  // Era un fallo (19-nov-2026): V8 lee `new Date(":00-04:00")` como el 1-ene-2000 a las
  // 4:00, y una pieza programada sin fecha decía «Programado · sábado, 1 de enero, 4:00»
  // en vez de «falta la fecha» (cabecera del editor y resumen del estado).
  test("un campo de fecha vacío no se dice como una fecha", () => {
    assert.equal(fechaDeCaracas(""), "");
    assert.equal(fechaDeCaracas(null), "");
    assert.equal(fechaDeCaracas(undefined), "");
    assert.equal(fechaDeCaracas("   "), "");
  });

  test("ni una a medias o con basura (V8 también las leía como el año 2000 o a la hora en punto)", () => {
    for (const v of ["abc", "2026-12-01T09", "2026-12-01T", "2026-12-01", "T09:00", "2026-12-01T09:00:30"]) {
      assert.equal(fechaDeCaracas(v), "", v);
    }
  });

  test("con basura en el campo no se manda una fecha inventada", () => {
    assert.equal("published_at" in formToPayload(form({ published_at: "abc" })), false);
    assert.equal(destacadaHastaDe(form({ portada: true, portada_durante: "fecha", portada_hasta: "abc" })), undefined);
  });

  test("una fecha a medio escribir no se manda", () => {
    assert.equal("published_at" in formToPayload(form({ published_at: "2026-09-" })), false);
    assert.equal("published_at" in formToPayload(form({ published_at: "   " })), false);
  });

  test("dicha en palabras, para los avisos", () => {
    assert.match(fechaDeCaracas("2026-09-28T09:00"), /lunes.*28.*septiembre.*9:00/);
    assert.equal(fechaDeCaracas("2026-09-"), "");
    assert.match(hastaDeCaracas("2026-10-05T13:00:00Z"), /^lunes, 5 de octubre a las 9:00/);
    assert.equal(hastaDeCaracas("no es fecha"), "");
  });
});

describe("de la API al formulario", () => {
  test("sin pieza (o algo que no lo es), el formulario vacío", () => {
    assert.deepEqual(postToForm(null), emptyForm());
    assert.deepEqual(postToForm("texto"), emptyForm());
  });

  test("los campos con nombre antiguo también se leen", () => {
    const f = postToForm({ summary: "Resumen viejo", body: "<p>Cuerpo viejo</p>" });
    assert.equal(f.excerpt, "Resumen viejo");
    assert.equal(f.content, "<p>Cuerpo viejo</p>");
  });

  test("temas y lugares, en su orden (el primero es el principal)", () => {
    const f = postToForm({ topics: [{ id: 9 }, { id: 2 }], places: [7, null, 3] });
    assert.deepEqual(f.topic_ids, [9, 2]);
    assert.deepEqual(f.place_ids, [7, 3]);
  });

  test("sin estado es un borrador; los interruptores, de verdad booleanos", () => {
    const f = postToForm({ is_educational: 1, sin_publicidad: null });
    assert.equal(f.status, "draft");
    assert.equal(f.is_educational, true);
    assert.equal(f.sin_publicidad, false);
    assert.equal(f.document_open_access, false);
  });

  test("fijada en portada con fecha futura: abre con la casilla marcada y su fecha", () => {
    const hasta = new Date(Date.now() + 5 * HORA).toISOString();
    const f = postToForm({ destacada_hasta: hasta, en_portada: false });
    assert.equal(f.portada, true);
    assert.equal(f.portada_durante, "fecha");
    assert.equal(f.portada_hasta, isoToDateTimeLocal(hasta));
  });

  test("una fijación ya vencida no se marca", () => {
    const f = postToForm({ destacada_hasta: new Date(Date.now() - HORA).toISOString(), en_portada: true });
    assert.equal(f.portada, false);
    assert.equal(f.portada_durante, "24");
  });

  test("ida y vuelta: lo que llega es lo que se manda", () => {
    const post = {
      format: "articulo",
      title: "Un título",
      slug: "un-titulo",
      excerpt: "<p>Resumen</p>",
      content: "<p>Cuerpo</p>",
      byline: "Ana",
      status: "published",
      published_at: "2026-11-10T12:00:00Z",
      topics: [{ id: 1 }],
      places: [{ id: 2 }],
      sources: [{ name: "BCV", url: "https://bcv.org.ve" }],
      image_asset_id: 5,
      imagen_foco: "30,70",
      juego_palabra: "dólar",
      moneda: "VES",
    };
    const p = formToPayload(postToForm(post));
    for (const k of ["format", "title", "slug", "excerpt", "content", "byline", "status", "image_asset_id", "imagen_foco", "juego_palabra", "moneda"]) {
      assert.equal(p[k], post[k], k);
    }
    assert.equal(p.published_at, "2026-11-10T12:00:00.000Z");
    assert.deepEqual(p.topic_ids, [1]);
    assert.deepEqual(p.place_ids, [2]);
    assert.deepEqual(p.sources, [{ name: "BCV", url: "https://bcv.org.ve" }]);
  });
});

describe("lo que se manda al guardar", () => {
  test("un formulario vacío no manda texto vacío, pero sí lo que borra", () => {
    const p = formToPayload(emptyForm());
    for (const k of ["format", "title", "slug", "excerpt", "content", "meta_title", "interviewee", "unit"]) {
      assert.equal(k in p, false, `${k} no debería ir`);
    }
    // Lo que sí va aunque esté vacío: es como se quita.
    assert.equal(p.byline, null);
    assert.deepEqual(p.sources, []);
    assert.deepEqual(p.topic_ids, []);
    assert.deepEqual(p.place_ids, []);
    assert.equal(p.image_asset_id, null);
    assert.equal(p.imagen_foco, null);
    assert.equal(p.juego_palabra, null);
    assert.equal(p.title_en, null);
    assert.equal(p.destacada_hasta, null);
    assert.equal(p.status, "draft");
    assert.equal(p.document_open_access, false);
  });

  test("nada sale como `undefined` (JSON lo perdería sin avisar)", () => {
    const p = formToPayload(emptyForm());
    assert.ok(Object.values(p).every((v) => v !== undefined));
  });

  test("los espacios de los bordes se quitan; un campo de solo espacios es vacío", () => {
    const p = formToPayload(form({ title: "  Titular  ", slug: "   ", byline: "   " }));
    assert.equal(p.title, "Titular");
    assert.equal("slug" in p, false);
    assert.equal(p.byline, null);
  });

  test("las fuentes sin nombre se caen; una sin enlace va sin enlace", () => {
    const p = formToPayload(
      form({ sources: [{ name: "  BCV ", url: " https://bcv.org.ve " }, { name: "   ", url: "https://x.com" }, { name: "Reuters", url: "" }] })
    );
    assert.deepEqual(p.sources, [{ name: "BCV", url: "https://bcv.org.ve" }, { name: "Reuters", url: undefined }]);
  });

  test("texto enorme: se manda entero", () => {
    const enorme = `<p>${"palabra ".repeat(300_000)}</p>`;
    const p = formToPayload(form({ content: enorme }));
    assert.equal(p.content, enorme.trim());
  });

  test("caracteres raros: emojis, eñes, escritura RTL y etiquetas pasan tal cual", () => {
    const titulo = "💸 Dólar «sube» — ñ — مرحبا <script>x</script>";
    assert.equal(formToPayload(form({ title: titulo })).title, titulo);
  });

  test("la versión en inglés: vacía es nula, es decir «sin inglés»", () => {
    const p = formToPayload(form({ title_en: "  ", content_en: "<p>Body</p>" }));
    assert.equal(p.title_en, null);
    assert.equal(p.content_en, "<p>Body</p>");
  });
});

describe("abrir la portada con esta pieza", () => {
  test("sin la casilla, null: es lo que la suelta", () => {
    assert.equal(destacadaHastaDe(form({ portada: false })), null);
  });

  test("por horas, desde que se guarda", () => {
    const antes = Date.now();
    const iso = destacadaHastaDe(form({ portada: true, portada_durante: "48" }));
    const ms = Date.parse(iso);
    assert.ok(ms >= antes + 48 * HORA && ms <= Date.now() + 48 * HORA, iso);
  });

  test("hasta una fecha, en hora de Caracas", () => {
    assert.equal(
      destacadaHastaDe(form({ portada: true, portada_durante: "fecha", portada_hasta: "2026-12-01T08:00" })),
      "2026-12-01T12:00:00.000Z"
    );
  });

  test("con «hasta una fecha» y sin fecha, no se manda (ni se suelta la portada)", () => {
    const f = form({ portada: true, portada_durante: "fecha", portada_hasta: "" });
    assert.equal(destacadaHastaDe(f), undefined);
    assert.equal("destacada_hasta" in formToPayload(f), false);
  });

  test("una duración rara no se manda", () => {
    for (const d of ["0", "-5", "abc"]) {
      assert.equal(destacadaHastaDe(form({ portada: true, portada_durante: d })), undefined, d);
    }
  });
});

describe("saber si hay cambios", () => {
  test("el párrafo vacío del editor de texto no es un cambio", () => {
    assert.equal(comparable(form({ content: "<p></p>" })), comparable(form({ content: "" })));
    assert.equal(comparable(form({ excerpt_en: "<p></p>" })), comparable(form({ excerpt_en: "" })));
  });

  test("el texto plano de una pieza vieja, reescrito como párrafos, tampoco", () => {
    assert.equal(comparable(form({ content: "Uno\n\nDos" })), comparable(form({ content: "<p>Uno</p><p>Dos</p>" })));
  });

  test("una negrita o una letra sí", () => {
    assert.notEqual(comparable(form({ content: "<p>Uno</p>" })), comparable(form({ content: "<p><strong>Uno</strong></p>" })));
    assert.notEqual(comparable(form({ title: "Titular" })), comparable(form({ title: "Titular." })));
  });

  test("normalizarPieza es lo mismo, como objeto", () => {
    assert.deepEqual(normalizarPieza(form({ content: "<p></p>" })), JSON.parse(comparable(form({ content: "" }))));
    assert.equal(normalizarPieza(null), null);
  });
});

describe("los textos de ayuda", () => {
  test("texto plano y palabras, sin etiquetas ni &nbsp;", () => {
    assert.equal(textoPlano("<p>Hola&nbsp;<b>mundo</b></p>"), "Hola mundo");
    assert.equal(palabras("<p>Hola&nbsp;<b>mundo</b> 🌎</p>"), 3);
    assert.equal(palabras("<p></p>"), 0);
    assert.equal(palabras(null), 0);
  });

  test("recortar deja el texto en el tope, con puntos suspensivos", () => {
    assert.equal(recortar("corto"), "corto");
    const r = recortar("a".repeat(100), 10);
    assert.equal(r.length, 10);
    assert.ok(r.endsWith("…"));
  });

  test("lista corta y nombre del adjunto", () => {
    assert.equal(listaCorta([], "Sin tema"), "Sin tema");
    assert.equal(listaCorta(["Economía"], "-"), "Economía");
    assert.equal(listaCorta(["Economía", "Petróleo", "Banca"], "-"), "Economía +2");
    assert.equal(nombreDeArchivo(null), "");
    assert.equal(nombreDeArchivo({}), "Adjunto");
    assert.equal(nombreDeArchivo({ original_filename: "a.pdf" }), "a.pdf");
  });
});

test("el id de la pieza: número si lo es, tal cual si no, y null sin él", () => {
  assert.equal(idDeLaPieza("7"), 7);
  assert.equal(idDeLaPieza("abc"), "abc");
  assert.equal(idDeLaPieza(undefined), null);
  assert.equal(idDeLaPieza(""), null);
});
