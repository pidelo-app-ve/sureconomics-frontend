/**
 * El tope de peso del arte de un anuncio, antes de subirlo, y cómo se aligera el que pasa.
 * `npm test` o `npm run test:publicidad`. El que manda es el backend
 * (`rules.arte_demasiado_pesado`, con sus pruebas); esto comprueba que el panel avisa con
 * los mismos límites, y qué hace con el arte que pasa, con un lienzo de mentira (en node
 * no hay `<canvas>`). Las cuentas del convertidor, en `components/admin/aligerarImagen.test.mjs`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { GUIA_DE_FORMATO, MEDIDAS_DE_ARTE, TOPE_ARTE_IMAGEN, TOPE_ARTE_SVG, arteDemasiadoPesado, decidirAligerado } from "./utils.js";
import { prepararArte } from "./aligerarArte.js";
import { AVISO_OPTIMIZANDO } from "../../../components/admin/aligerarImagen.js";

test("los topes son los del servidor: 50 KB un SVG, 150 KB cualquier otra imagen", () => {
  assert.equal(TOPE_ARTE_SVG, 50 * 1024);
  assert.equal(TOPE_ARTE_IMAGEN, 150 * 1024);
});

test("justo en el límite vale; un byte más, no, y lo dice redondeando hacia arriba", () => {
  const svg = "image/svg+xml";
  assert.equal(arteDemasiadoPesado({ mime: svg, bytes: 50 * 1024, nombre: "a.svg" }), null);
  assert.equal(arteDemasiadoPesado({ mime: "image/webp", bytes: 150 * 1024 }), null);
  const motivo = arteDemasiadoPesado({ mime: svg, bytes: 50 * 1024 + 1, nombre: "merch.svg" });
  assert.ok(motivo.startsWith("«merch.svg» pesa 51 KB; un SVG de anuncio puede pesar hasta 50 KB"), motivo);
  assert.match(motivo, /WebP/);
  assert.ok(
    arteDemasiadoPesado({ mime: "image/png", bytes: 150 * 1024 + 1 }).startsWith(
      "La imagen pesa 151 KB; una imagen de anuncio puede pesar hasta 150 KB",
    ),
  );
});

test("un SVG sin tipo se reconoce por la extensión (algún sistema no lo da)", () => {
  assert.ok(arteDemasiadoPesado({ mime: "", bytes: 80 * 1024, nombre: "Logo.SVG" }));
  assert.equal(arteDemasiadoPesado({ mime: "", bytes: 80 * 1024, nombre: "foto.jpg" }), null);
});

test("sin peso conocido no se puede saber y se deja pasar", () => {
  assert.equal(arteDemasiadoPesado({ mime: "image/svg+xml" }), null);
  assert.equal(arteDemasiadoPesado(), null);
});


test("el consejo depende de si es un SVG o una imagen", () => {
  assert.match(arteDemasiadoPesado({ mime: "image/svg+xml", bytes: 60 * 1024 }), /si es un logo, simplifíquelo/);
  assert.match(arteDemasiadoPesado({ mime: "image/png", bytes: 200 * 1024 }), /Expórtela en WebP o en JPG/);
});

/* ─── Aligerar el arte que pesa de más ─────────────────────────────────────────────── */

const KB = 1024;

test("cada arte de cada formato dice a qué tamaño se aligera; la tira, al doble de 1456 × 180", () => {
  assert.deepEqual(MEDIDAS_DE_ARTE.cinta, { ancho: 2912, alto: 360 });
  for (const [letra, guia] of Object.entries(GUIA_DE_FORMATO)) {
    for (const arte of guia.arte ?? []) {
      assert.ok(arte.medidas?.ancho > 0 && arte.medidas?.alto > 0, `${letra} · ${arte.campo}`);
    }
  }
});

test("qué se hace con cada archivo: ligero, justo en el límite, pesado, GIF", () => {
  assert.deepEqual(decidirAligerado({ mime: "image/jpeg", bytes: 90 * KB, nombre: "ligera.jpg" }), { accion: "subir" });
  assert.deepEqual(decidirAligerado({ mime: "image/webp", bytes: 150 * KB }), { accion: "subir" });
  assert.deepEqual(decidirAligerado({ mime: "image/svg+xml", bytes: 50 * KB }), { accion: "subir" });
  assert.deepEqual(decidirAligerado({ mime: "image/svg+xml", bytes: 50 * KB + 1 }), { accion: "aligerar" });
  assert.deepEqual(decidirAligerado({ mime: "image/png", bytes: 4 * 1024 * KB }), { accion: "aligerar" });
  // Con «; charset» (como llega de una descarga) sigue siendo un SVG.
  assert.deepEqual(decidirAligerado({ mime: "image/svg+xml; charset=utf-8", bytes: 60 * KB }), { accion: "aligerar" });
  const gifPesado = decidirAligerado({ mime: "image/gif", bytes: 400 * KB, nombre: "a.gif", gifAnimado: true });
  assert.equal(gifPesado.accion, "rechazar");
  assert.match(gifPesado.motivo, /pesa 400 KB.*GIF animado/);
  assert.deepEqual(decidirAligerado({ mime: "image/gif", bytes: 400 * KB, gifAnimado: false }), { accion: "aligerar" });
});

/** Un lienzo de mentira para `prepararArte`: pesa en proporción a los píxeles y la calidad. */
const lienzoFalso = ({ cargar } = {}) => ({
  cargar:
    cargar ??
    (async () => ({ medidas: { ancho: 1456, alto: 180 }, vectorial: true, dibujable: async () => ({}), cerrar() {} })),
  exportar: async (_dibujable, { ancho, alto, tipo, calidad }) =>
    new Blob([new Uint8Array(Math.round(ancho * alto * 0.2 * calidad))], { type: tipo }),
});

/** Un GIF de dos cuadros de 1 × 1 (ver `esGifAnimado`). */
const GIF_ANIMADO = new Uint8Array([
  ..."GIF89a".split("").map((c) => c.charCodeAt(0)),
  1, 0, 1, 0, 0x80, 0, 0, 0, 0, 0, 255, 255, 255,
  0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 0x4c, 0x01, 0,
  0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 0x4c, 0x01, 0,
  0x3b,
]);

test("prepararArte: lo ligero se sube tal cual, sin avisos", async () => {
  const avisos = [];
  const archivo = new File([new Uint8Array(40 * KB)], "ligera.jpg", { type: "image/jpeg" });
  const r = await prepararArte(archivo, {
    medidas: MEDIDAS_DE_ARTE.cinta,
    onAviso: (t) => avisos.push(t),
    lienzo: lienzoFalso(),
  });
  assert.equal(r.archivo, archivo);
  assert.equal(r.nota, null);
  assert.deepEqual(avisos, []);
});

test("prepararArte: el SVG de 243 KB sale en WebP, con su nombre y el aviso", async () => {
  const avisos = [];
  const archivo = new File([new Uint8Array(243 * KB)], "merch-5fdaa2d67f4d.svg", { type: "image/svg+xml" });
  const r = await prepararArte(archivo, {
    medidas: MEDIDAS_DE_ARTE.cinta,
    onAviso: (t) => avisos.push(t),
    lienzo: lienzoFalso(),
  });
  assert.deepEqual(avisos, [AVISO_OPTIMIZANDO]);
  assert.equal(r.archivo.name, "merch-5fdaa2d67f4d.webp");
  assert.equal(r.archivo.type, "image/webp");
  assert.ok(r.archivo.size <= 150 * KB);
  assert.match(r.nota, /^Se aligeró de 243 KB a \d+ KB\.$/);
});

test("prepararArte: un GIF animado pesado no se toca ni se dibuja", async () => {
  let dibujado = false;
  const archivo = new File([GIF_ANIMADO, new Uint8Array(200 * KB)], "anim.gif", { type: "image/gif" });
  const lienzo = lienzoFalso({
    cargar: async () => {
      dibujado = true;
    },
  });
  await assert.rejects(prepararArte(archivo, { medidas: MEDIDAS_DE_ARTE.cinta, lienzo }), /GIF animado/);
  assert.equal(dibujado, false);
});

test("prepararArte: si ni achicando entra, lo dice y no devuelve nada", async () => {
  const archivo = new File([new Uint8Array(300 * KB)], "enorme.png", { type: "image/png" });
  const lienzo = {
    ...lienzoFalso({
      cargar: async () => ({ medidas: { ancho: 9000, alto: 9000 }, vectorial: false, dibujable: async () => ({}) }),
    }),
    exportar: async () => new Blob([new Uint8Array(400 * KB)], { type: "image/webp" }),
  };
  await assert.rejects(prepararArte(archivo, { medidas: MEDIDAS_DE_ARTE.logo, lienzo }), /por debajo de 150 KB/);
});
