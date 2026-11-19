/**
 * Lo que el editor de piezas le dice a quien escribe antes de publicar
 * (`derivadosDeLaPieza.js`): qué falta, la lista «Antes de publicar» y cómo va el
 * inglés. `npm test`.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { emptyForm } from "./formulario.js";
import { estadoDeLaPieza, estadoDelIngles } from "./derivadosDeLaPieza.js";

const TEMAS = [{ id: 1, name: "Economía" }, { id: 2, name: "Petróleo" }];
const LUGARES = [{ children: [{ id: 10, name: "Venezuela" }, { id: 11, name: "Colombia" }] }];

const lista = (extra = {}) => ({ ...emptyForm(), format: "noticia", title: "Titular", content: "<p>Uno dos tres</p>", topic_ids: [1], ...extra });
const estado = (form, opciones = {}) =>
  estadoDeLaPieza({
    form,
    requiredMedia: "none",
    canPublish: true,
    programada: form.status === "scheduled",
    legacyImage: false,
    topics: TEMAS,
    placeGroups: LUGARES,
    ...opciones,
  });
const nivel = (chequeo, texto) => chequeo.find((c) => c.texto === texto)?.nivel;

describe("qué falta para publicar", () => {
  test("una pieza lista no tiene faltas", () => {
    assert.deepEqual(estado(lista()).faltas, []);
  });

  test("el formulario recién abierto: título, texto y tema", () => {
    assert.deepEqual(estado({ ...emptyForm(), format: "noticia" }).faltas, ["título", "texto", "tema"]);
  });

  test("un título de solo espacios es un título vacío", () => {
    assert.deepEqual(estado(lista({ title: "    " })).faltas, ["título"]);
  });

  test("un cuerpo con párrafos vacíos o solo &nbsp; es un texto vacío", () => {
    assert.deepEqual(estado(lista({ content: "<p></p><p>&nbsp;</p>" })).faltas, ["texto"]);
  });

  test("una entrevista sin video: falta el video, no el texto", () => {
    const s = estado(lista({ content: "" }), { requiredMedia: "video" });
    assert.deepEqual(s.faltas, ["video"]);
    assert.equal(s.missingMedia, true);
    assert.deepEqual(estado(lista({ video_asset_id: 3 }), { requiredMedia: "video" }).faltas, []);
  });

  test("audio y documento, cada uno con su nombre", () => {
    assert.deepEqual(estado(lista(), { requiredMedia: "audio" }).faltas, ["audio"]);
    assert.deepEqual(estado(lista(), { requiredMedia: "document" }).faltas, ["documento"]);
  });

  test("programada sin fecha: falta la fecha", () => {
    assert.deepEqual(estado(lista({ status: "scheduled", published_at: "" })).faltas, ["fecha"]);
    assert.deepEqual(estado(lista({ status: "scheduled", published_at: "2026-12-01T09:00" })).faltas, []);
  });

  test("programada sin fecha: el resumen lo dice, sin inventarse el 1 de enero", () => {
    assert.equal(estado(lista({ status: "scheduled", published_at: "" })).resumenDeEstado, "Programado · falta la fecha");
  });

  test("abrir la portada «hasta una fecha» sin fecha: falta hasta cuándo", () => {
    const s = estado(lista({ portada: true, portada_durante: "fecha", portada_hasta: "" }));
    assert.deepEqual(s.faltas, ["hasta cuándo abre la portada"]);
    assert.equal(s.faltaFechaDePortada, true);
  });

  test("todo a la vez, en el orden en que se lee", () => {
    const s = estado(
      { ...emptyForm(), format: "entrevista", status: "scheduled", portada: true, portada_durante: "fecha" },
      { requiredMedia: "video" }
    );
    assert.deepEqual(s.faltas, ["título", "tema", "video", "fecha", "hasta cuándo abre la portada"]);
  });

  test("un tema que ya no existe en la lista sigue contando como tema puesto", () => {
    const s = estado(lista({ topic_ids: [99] }));
    assert.deepEqual(s.faltas, []);
    assert.deepEqual(s.temasElegidos, []);
  });
});

describe("la lista «Antes de publicar»", () => {
  test("lo que falta, lo que conviene y lo que está", () => {
    const { chequeo } = estado(lista());
    assert.equal(nivel(chequeo, "Título"), "bien");
    assert.equal(nivel(chequeo, "Texto"), "bien");
    assert.equal(nivel(chequeo, "Tema"), "bien");
    assert.equal(nivel(chequeo, "Lugar"), "conviene");
    assert.equal(nivel(chequeo, "Foto"), "conviene");
    assert.equal(nivel(chequeo, "Fuente"), "conviene");
    // Sin archivo obligatorio, no hay fila de archivo.
    assert.equal(nivel(chequeo, "Video"), undefined);
  });

  test("un título de más de 90 letras se avisa (se corta en las tarjetas), sin bloquear", () => {
    const largo = "a".repeat(91);
    const s = estado(lista({ title: largo }));
    const fila = s.chequeo.find((c) => c.texto === "Título");
    assert.equal(fila.nivel, "conviene");
    assert.match(fila.detalle, /91 letras/);
    assert.deepEqual(s.faltas, []);
    assert.equal(nivel(estado(lista({ title: "a".repeat(90) })).chequeo, "Título"), "bien");
  });

  test("un título enorme se cuenta sin espacios de los bordes", () => {
    const fila = estado(lista({ title: `  ${"x".repeat(5000)}  ` })).chequeo.find((c) => c.texto === "Título");
    assert.match(fila.detalle, / 5000 letras/);
  });

  test("las palabras y los minutos (a 200 por minuto)", () => {
    const texto = `<p>${"palabra ".repeat(1000)}</p>`;
    const fila = estado(lista({ content: texto })).chequeo.find((c) => c.texto === "Texto");
    assert.equal(fila.detalle, " 1000 palabras · 5 min de lectura");
  });

  test("temas y lugares por su nombre", () => {
    const { chequeo, temasElegidos, lugaresElegidos } = estado(lista({ topic_ids: [2, 1], place_ids: ["11"] }));
    assert.deepEqual(temasElegidos, ["Petróleo", "Economía"]);
    assert.deepEqual(lugaresElegidos, ["Colombia"]);
    assert.equal(chequeo.find((c) => c.texto === "Lugar").detalle, " Colombia");
  });

  test("la foto vale también si es una dirección de antes", () => {
    assert.equal(nivel(estado(lista(), { legacyImage: true }).chequeo, "Foto"), "bien");
    assert.equal(nivel(estado(lista({ image_asset_id: 4 })).chequeo, "Foto"), "bien");
  });

  test("solo cuentan las fuentes con nombre", () => {
    assert.equal(estado(lista({ sources: [{ name: "  ", url: "https://x" }] })).nFuentes, 0);
    assert.equal(estado(lista({ sources: [{ name: "BCV", url: "" }] })).nFuentes, 1);
  });
});

describe("el resumen del estado", () => {
  test("borrador, publicado, programado y en portada", () => {
    assert.equal(estado(lista()).resumenDeEstado, "Borrador");
    assert.equal(estado(lista({ status: "published" })).resumenDeEstado, "Publicado");
    assert.match(estado(lista({ status: "scheduled", published_at: "2026-12-01T09:00" })).resumenDeEstado, /^Programado · martes, 1 de diciembre, 9:00/);
    assert.equal(estado(lista({ portada: true })).resumenDeEstado, "Borrador · Abre la portada");
  });

  test("la portada solo se ofrece a quien puede publicar, salvo que ya esté fijada", () => {
    assert.equal(estado(lista(), { canPublish: false }).muestraPortada, false);
    assert.equal(estado(lista({ portada: true }), { canPublish: false }).muestraPortada, true);
  });
});

describe("cómo va el inglés", () => {
  const ingles = (extra) => estadoDelIngles({ ...emptyForm(), ...extra });

  test("sin nada: sin versión en inglés", () => {
    assert.deepEqual(ingles({}), { resumen: "Sin versión en inglés", estado: undefined, aviso: null });
  });

  test("título y cuerpo: lista (o automática sin revisar)", () => {
    assert.equal(ingles({ title_en: "T", content_en: "<p>B</p>" }).estado, "ok");
    assert.equal(ingles({ title_en: "T", content_en: "<p>B</p>" }).resumen, "Lista");
    assert.equal(ingles({ title_en: "T", content_en: "<p>B</p>", traduccion_automatica: true }).resumen, "Traducción automática, sin revisar");
  });

  test("a medias: dice qué falta, porque en /en sale en español", () => {
    assert.match(ingles({ title_en: "T" }).aviso, /^Falta el cuerpo/);
    assert.match(ingles({ content_en: "<p>B</p>" }).aviso, /^Falta el título/);
    // Un cuerpo de párrafos vacíos no es un cuerpo.
    assert.equal(ingles({ title_en: "T", content_en: "<p></p>" }).estado, "falta");
    // Un título de espacios no es un título.
    assert.equal(ingles({ title_en: "   ", content_en: "" }).estado, undefined);
  });
});
