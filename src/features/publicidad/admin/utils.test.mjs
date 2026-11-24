/**
 * El tope de peso del arte de un anuncio, antes de subirlo, y cómo se aligera el que pasa.
 * `npm test` o `npm run test:publicidad`. El que manda es el backend
 * (`rules.arte_demasiado_pesado`, con sus pruebas); esto comprueba que el panel avisa con
 * los mismos límites, y las cuentas del aligerado con un lienzo de mentira (en node no
 * hay `<canvas>`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AVISO_OPTIMIZANDO,
  CALIDADES_JPEG,
  CALIDADES_WEBP,
  GUIA_DE_FORMATO,
  MEDIDAS_DE_ARTE,
  TOPE_ARTE_IMAGEN,
  TOPE_ARTE_SVG,
  arteDemasiadoPesado,
  avisoDeAligerado,
  buscarVersionLigera,
  decidirAligerado,
  esGifAnimado,
  medidasDeSalida,
  medidasDeSvg,
  nombreAligerado,
  origenDelArte,
  svgConMedidas,
} from "./utils.js";
import { prepararArte } from "./aligerarArte.js";

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

test("el tamaño de salida cabe en el hueco sin deformar, y una foto pequeña no se agranda", () => {
  const cinta = MEDIDAS_DE_ARTE.cinta;
  assert.deepEqual(medidasDeSalida({ ancho: 4500, alto: 600 }, cinta), { ancho: 2700, alto: 360 });
  assert.deepEqual(medidasDeSalida({ ancho: 1456, alto: 180 }, cinta), { ancho: 1456, alto: 180 });
  // Un SVG es vectorial: se dibuja al tamaño del hueco.
  assert.deepEqual(medidasDeSalida({ ancho: 1456, alto: 180 }, cinta, { vectorial: true }), cinta);
  // El logo de 4.500 px se queda en 1.200 por el lado largo.
  assert.deepEqual(medidasDeSalida({ ancho: 4500, alto: 1500 }, MEDIDAS_DE_ARTE.logo), { ancho: 1200, alto: 400 });
  // Sin medidas propias, la caja.
  assert.deepEqual(medidasDeSalida(null, cinta), cinta);
});

/** Un `exportar` de mentira: pesa en proporción a los píxeles y a la calidad. */
const exportarFalso = ({ bytesPorPixel = 0.2, tipoWebp = "image/webp", llamadas = [] } = {}) =>
  async ({ ancho, alto, tipo, calidad }) => {
    llamadas.push({ ancho, alto, tipo, calidad });
    const bytes = Math.round(ancho * alto * bytesPorPixel * calidad);
    return new Blob([new Uint8Array(bytes)], { type: tipo === "image/webp" ? tipoWebp : tipo });
  };

test("baja la calidad desde 0,82 hasta que entra y se queda con la primera que vale", async () => {
  const llamadas = [];
  // 2912 × 360 × 0,2 × q: con 0,82 son 168 KB; con 0,75, 154 KB; con 0,68, 139 KB.
  const r = await buscarVersionLigera({
    medidas: MEDIDAS_DE_ARTE.cinta,
    tope: 150 * KB,
    exportar: exportarFalso({ llamadas }),
  });
  assert.equal(r.tipo, "image/webp");
  assert.equal(r.calidad, 0.68);
  assert.deepEqual(llamadas.map((l) => l.calidad), [0.82, 0.75, 0.68]);
  assert.ok(r.blob.size <= 150 * KB);
});

test("si ni con 0,6 entra, achica un 15 % y vuelve a empezar; nunca baja de 0,6", async () => {
  const llamadas = [];
  const r = await buscarVersionLigera({
    medidas: { ancho: 2912, alto: 360 },
    tope: 150 * KB,
    exportar: exportarFalso({ bytesPorPixel: 0.4, llamadas }),
  });
  assert.ok(r.ancho < 2912 && r.blob.size <= 150 * KB);
  assert.equal(llamadas[4].ancho, Math.round(2912 * 0.85));
  assert.equal(llamadas[4].calidad, 0.82);
  assert.ok(llamadas.every((l) => l.calidad >= 0.6));
  assert.equal(Math.min(...CALIDADES_WEBP), 0.6);
});

test("si no hay forma de que entre, devuelve null, con tope de intentos", async () => {
  const llamadas = [];
  const r = await buscarVersionLigera({
    medidas: { ancho: 2912, alto: 360 },
    tope: 10,
    exportar: exportarFalso({ llamadas }),
  });
  assert.equal(r, null);
  assert.ok(llamadas.length <= CALIDADES_WEBP.length * 7);
});

test("un navegador sin WebP (Safari antiguo da un PNG) pasa a JPEG con calidad alta", async () => {
  const llamadas = [];
  const r = await buscarVersionLigera({
    medidas: MEDIDAS_DE_ARTE.cinta,
    tope: 150 * KB,
    exportar: exportarFalso({ tipoWebp: "image/png", llamadas }),
  });
  assert.equal(r.tipo, "image/jpeg");
  assert.equal(llamadas[0].tipo, "image/webp");
  assert.equal(llamadas[1].tipo, "image/jpeg");
  assert.equal(llamadas[1].calidad, CALIDADES_JPEG[0]);
  assert.equal(llamadas[1].ancho, 2912);
});

test("cancelar a mitad corta con AbortError", async () => {
  const control = new AbortController();
  const exportar = async (pedido) => {
    control.abort();
    return exportarFalso()(pedido);
  };
  await assert.rejects(
    buscarVersionLigera({ medidas: MEDIDAS_DE_ARTE.cinta, tope: 1, exportar, senal: control.signal }),
    { name: "AbortError" },
  );
});

test("el nombre del aligerado es el de antes con .webp (o .jpg)", () => {
  assert.equal(nombreAligerado("merch-5fdaa2d67f4d.svg", "image/webp"), "merch-5fdaa2d67f4d.webp");
  assert.equal(nombreAligerado("banner.final.PNG", "image/webp"), "banner.final.webp");
  assert.equal(nombreAligerado("foto.png", "image/jpeg"), "foto.jpg");
  assert.equal(nombreAligerado("sin-extension", "image/webp"), "sin-extension.webp");
  assert.equal(nombreAligerado("", "image/webp"), "arte.webp");
});

test("el aviso dice de cuánto a cuánto", () => {
  assert.equal(avisoDeAligerado(243 * KB, 88 * KB), "Se aligeró de 243 KB a 88 KB.");
  assert.equal(avisoDeAligerado(200 * KB, 300), "Se aligeró de 200 KB a 1 KB.");
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

/** Un GIF mínimo de `cuadros` cuadros de 1 × 1, con su extensión de control cada uno. */
const gif = (cuadros) => {
  const b = [..."GIF89a"].map((c) => c.charCodeAt(0));
  b.push(1, 0, 1, 0, 0x80, 0, 0, 0, 0, 0, 255, 255, 255); // pantalla + paleta global de 2
  for (let i = 0; i < cuadros; i += 1) {
    b.push(0x21, 0xf9, 4, 0, 10, 0, 0, 0); // control: el retardo
    b.push(0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 0x4c, 0x01, 0); // la imagen
  }
  b.push(0x3b);
  return new Uint8Array(b);
};

test("un GIF animado se reconoce por sus cuadros; uno quieto, no; uno roto se da por animado", () => {
  assert.equal(esGifAnimado(gif(1)), false);
  assert.equal(esGifAnimado(gif(3)), true);
  assert.equal(esGifAnimado(new Uint8Array([1, 2, 3])), true);
});

test("las medidas de un SVG: width y height en px, o el viewBox; stroke-width no cuenta", () => {
  assert.deepEqual(medidasDeSvg('<svg xmlns="http://www.w3.org/2000/svg" width="1456" height="180px">'), {
    ancho: 1456,
    alto: 180,
    viewBox: false,
  });
  assert.deepEqual(medidasDeSvg('<?xml version="1.0"?><svg stroke-width="3" viewBox="0 0 728 90" width="100%">'), {
    ancho: 728,
    alto: 90,
    viewBox: true,
  });
  assert.equal(medidasDeSvg("<svg>"), null);
  assert.equal(medidasDeSvg("no es un svg"), null);
});

test("el SVG con medidas fijas escala en vez de recortar", () => {
  const solo = '<svg viewBox="0 0 728 90" width="100%"><rect stroke-width="2"/></svg>';
  assert.equal(
    svgConMedidas(solo, 2912, 360),
    '<svg width="2912" height="360" viewBox="0 0 728 90"><rect stroke-width="2"/></svg>',
  );
  // Sin viewBox, se le pone uno con sus medidas de antes.
  assert.equal(
    svgConMedidas("<svg width='1456' height='180'><g/></svg>", 2912, 360),
    '<svg viewBox="0 0 1456 180" width="2912" height="360"><g/></svg>',
  );
});

test("de dónde es un arte: lo nuestro se puede bajar, lo de otro sitio no", () => {
  const sitio = "https://sureconomics.com";
  assert.equal(origenDelArte("/media/image/2026/10/merch-5fdaa2d67f4d.svg", sitio), "propio");
  assert.equal(origenDelArte("https://sureconomics.com/media/a.png", sitio), "propio");
  assert.equal(origenDelArte("https://res.cloudinary.com/x/a.png", sitio), "ajeno");
  assert.equal(origenDelArte("//otro.com/a.png", sitio), "ajeno");
  assert.equal(origenDelArte(null, sitio), null);
});

/** Un lienzo de mentira para `prepararArte`: sin canvas, pesa lo que diga `exportarFalso`. */
const lienzoFalso = ({ medidas = { ancho: 1456, alto: 180 }, vectorial = true, cargar, exportar } = {}) => ({
  cargar: cargar ?? (async () => ({ medidas, vectorial, dibujable: async () => ({}), cerrar() {} })),
  exportar: exportar ?? ((_dibujable, pedido) => exportarFalso()(pedido)),
});

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
  const archivo = new File([gif(2), new Uint8Array(200 * KB)], "anim.gif", { type: "image/gif" });
  const lienzo = lienzoFalso({
    cargar: async () => {
      dibujado = true;
    },
  });
  await assert.rejects(prepararArte(archivo, { medidas: MEDIDAS_DE_ARTE.cinta, lienzo }), /GIF animado/);
  assert.equal(dibujado, false);
});

test("prepararArte: un SVG que no se puede dibujar da su motivo y no devuelve nada", async () => {
  const archivo = new File([new Uint8Array(80 * KB)], "roto.svg", { type: "image/svg+xml" });
  const lienzo = lienzoFalso({
    cargar: async () => {
      throw new Error("No se pudo dibujar «roto.svg»");
    },
  });
  await assert.rejects(prepararArte(archivo, { medidas: MEDIDAS_DE_ARTE.cinta, lienzo }), /No se pudo dibujar «roto\.svg»/);
});

test("prepararArte: un lienzo «contaminado» se explica, con la alternativa", async () => {
  const archivo = new File([new Uint8Array(80 * KB)], "ajeno.svg", { type: "image/svg+xml" });
  const lienzo = lienzoFalso({
    exportar: async () => {
      const e = new Error("tainted");
      e.name = "SecurityError";
      throw e;
    },
  });
  await assert.rejects(prepararArte(archivo, { medidas: MEDIDAS_DE_ARTE.cinta, lienzo }), /Subir un archivo/);
});

test("prepararArte: cancelado antes de empezar, no dibuja", async () => {
  const control = new AbortController();
  control.abort();
  const archivo = new File([new Uint8Array(300 * KB)], "foto.png", { type: "image/png" });
  await assert.rejects(
    prepararArte(archivo, { medidas: MEDIDAS_DE_ARTE.cinta, senal: control.signal, lienzo: lienzoFalso() }),
    { name: "AbortError" },
  );
});
