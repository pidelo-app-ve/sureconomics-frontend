/**
 * El convertidor de imágenes del panel (`aligerarImagen.js`), sin navegador: las cuentas
 * y, con un lienzo de mentira (en node no hay `<canvas>`), lo que hace `convertirImagen`
 * cuando algo sale mal. `npm test` o `npm run test:aligerar`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CALIDADES_JPEG,
  CALIDADES_WEBP,
  avisoDeAligerado,
  buscarVersionLigera,
  convertirImagen,
  esGif,
  esGifAnimado,
  esSvg,
  longitudEnPx,
  medidasDeSalida,
  medidasDeSvg,
  nombreAligerado,
  notaDeConversion,
  origenDeLaImagen,
  svgConMedidas,
} from "./aligerarImagen.js";

const KB = 1024;
const TIRA = { ancho: 2912, alto: 360 };

/** Un `exportar` de mentira: pesa en proporción a los píxeles y a la calidad. */
const exportarFalso = ({ bytesPorPixel = 0.2, tipoWebp = "image/webp", llamadas = [] } = {}) =>
  async ({ ancho, alto, tipo, calidad }) => {
    llamadas.push({ ancho, alto, tipo, calidad });
    const bytes = Math.round(ancho * alto * bytesPorPixel * calidad);
    return new Blob([new Uint8Array(bytes)], { type: tipo === "image/webp" ? tipoWebp : tipo });
  };

/** Un lienzo de mentira: sin canvas, pesa lo que diga `exportarFalso`. */
const lienzoFalso = ({ medidas = { ancho: 1456, alto: 180 }, vectorial = true, cargar, exportar, pedidos = [] } = {}) => ({
  cargar: cargar ?? (async () => ({ medidas, vectorial, dibujable: async () => ({}), cerrar() {} })),
  exportar: exportar ?? ((_dibujable, pedido) => {
    pedidos.push(pedido);
    return exportarFalso()(pedido);
  }),
});

test("SVG y GIF se reconocen por el tipo (con o sin «; charset») o por la extensión", () => {
  assert.ok(esSvg({ mime: "image/svg+xml; charset=utf-8" }));
  assert.ok(esSvg({ mime: "", nombre: "Logo.SVG" }));
  assert.ok(!esSvg({ mime: "image/png", nombre: "foto.png" }));
  assert.ok(esGif({ mime: "IMAGE/GIF" }));
  assert.ok(esGif({ nombre: "anim.gif" }));
});

test("el tamaño de salida cabe en la caja sin deformar, y una foto pequeña no se agranda", () => {
  assert.deepEqual(medidasDeSalida({ ancho: 4500, alto: 600 }, TIRA), { ancho: 2700, alto: 360 });
  assert.deepEqual(medidasDeSalida({ ancho: 1456, alto: 180 }, TIRA), { ancho: 1456, alto: 180 });
  // Un SVG es vectorial: se dibuja al tamaño de la caja.
  assert.deepEqual(medidasDeSalida({ ancho: 1456, alto: 180 }, TIRA, { vectorial: true }), TIRA);
  assert.deepEqual(medidasDeSalida({ ancho: 4500, alto: 1500 }, { ancho: 1200, alto: 1200 }), { ancho: 1200, alto: 400 });
  // Sin medidas propias, la caja.
  assert.deepEqual(medidasDeSalida(null, TIRA), TIRA);
});

test("baja la calidad desde 0,82 hasta que entra y se queda con la primera que vale", async () => {
  const llamadas = [];
  // 2912 × 360 × 0,2 × q: con 0,82 son 168 KB; con 0,75, 154 KB; con 0,68, 139 KB.
  const r = await buscarVersionLigera({ medidas: TIRA, tope: 150 * KB, exportar: exportarFalso({ llamadas }) });
  assert.equal(r.tipo, "image/webp");
  assert.equal(r.calidad, 0.68);
  assert.deepEqual(llamadas.map((l) => l.calidad), [0.82, 0.75, 0.68]);
  assert.ok(r.blob.size <= 150 * KB);
});

test("sin tope, una sola vez y con 0,82", async () => {
  const llamadas = [];
  const r = await buscarVersionLigera({ medidas: TIRA, exportar: exportarFalso({ llamadas }) });
  assert.equal(r.calidad, 0.82);
  assert.equal(llamadas.length, 1);
});

test("si ni con 0,6 entra, achica un 15 % y vuelve a empezar; nunca baja de 0,6", async () => {
  const llamadas = [];
  const r = await buscarVersionLigera({
    medidas: TIRA,
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
  const r = await buscarVersionLigera({ medidas: TIRA, tope: 10, exportar: exportarFalso({ llamadas }) });
  assert.equal(r, null);
  assert.ok(llamadas.length <= CALIDADES_WEBP.length * 7);
});

test("un navegador sin WebP (Safari antiguo da un PNG) pasa a JPEG con calidad alta", async () => {
  const llamadas = [];
  const r = await buscarVersionLigera({
    medidas: TIRA,
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
  await assert.rejects(buscarVersionLigera({ medidas: TIRA, tope: 1, exportar, senal: control.signal }), {
    name: "AbortError",
  });
});

test("el nombre del convertido es el de antes con .webp (o .jpg)", () => {
  assert.equal(nombreAligerado("merch-5fdaa2d67f4d.svg", "image/webp"), "merch-5fdaa2d67f4d.webp");
  assert.equal(nombreAligerado("banner.final.PNG", "image/webp"), "banner.final.webp");
  assert.equal(nombreAligerado("foto.png", "image/jpeg"), "foto.jpg");
  assert.equal(nombreAligerado("sin-extension", "image/webp"), "sin-extension.webp");
  assert.equal(nombreAligerado("", "image/webp"), "imagen.webp");
});

test("el aviso dice de cuánto a cuánto", () => {
  assert.equal(avisoDeAligerado(243 * KB, 88 * KB), "Se aligeró de 243 KB a 88 KB.");
  assert.equal(avisoDeAligerado(200 * KB, 300), "Se aligeró de 200 KB a 1 KB.");
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

test("de dónde es una imagen: lo nuestro se puede bajar, lo de otro sitio no", () => {
  const sitio = "https://sureconomics.com";
  assert.equal(origenDeLaImagen("/media/image/2026/10/merch-5fdaa2d67f4d.svg", sitio), "propio");
  assert.equal(origenDeLaImagen("https://sureconomics.com/media/a.png", sitio), "propio");
  assert.equal(origenDeLaImagen("https://res.cloudinary.com/x/a.png", sitio), "ajeno");
  assert.equal(origenDeLaImagen("//otro.com/a.png", sitio), "ajeno");
  assert.equal(origenDeLaImagen(null, sitio), null);
});

test("convertirImagen: un SVG se dibuja al tamaño de la caja y sale en WebP con su nombre", async () => {
  const pedidos = [];
  const archivo = new File([new Uint8Array(243 * KB)], "merch.svg", { type: "image/svg+xml" });
  const nuevo = await convertirImagen(archivo, { medidas: TIRA, tope: 150 * KB, lienzo: lienzoFalso({ pedidos }) });
  assert.equal(nuevo.name, "merch.webp");
  assert.equal(nuevo.type, "image/webp");
  assert.equal(pedidos[0].ancho, 2912);
});

test("convertirImagen: un SVG que no se puede dibujar da su motivo", async () => {
  const archivo = new File([new Uint8Array(80 * KB)], "roto.svg", { type: "image/svg+xml" });
  const lienzo = lienzoFalso({
    cargar: async () => ({
      medidas: null,
      vectorial: true,
      dibujable: async () => {
        throw new Error("imagen ilegible");
      },
      cerrar() {},
    }),
  });
  await assert.rejects(convertirImagen(archivo, { medidas: TIRA, lienzo }), /No se pudo dibujar «roto\.svg»/);
});

test("convertirImagen: un lienzo «contaminado» se explica, con la alternativa", async () => {
  const archivo = new File([new Uint8Array(80 * KB)], "ajeno.svg", { type: "image/svg+xml" });
  const lienzo = lienzoFalso({
    exportar: async () => {
      const e = new Error("tainted");
      e.name = "SecurityError";
      throw e;
    },
  });
  await assert.rejects(convertirImagen(archivo, { medidas: TIRA, lienzo }), /expórtela en PNG o WebP/);
});

test("convertirImagen: cancelado antes de empezar, no lee nada", async () => {
  const control = new AbortController();
  control.abort();
  let leido = false;
  const lienzo = lienzoFalso({
    cargar: async () => {
      leido = true;
    },
  });
  const archivo = new File([new Uint8Array(300 * KB)], "foto.png", { type: "image/png" });
  await assert.rejects(convertirImagen(archivo, { medidas: TIRA, senal: control.signal, lienzo }), { name: "AbortError" });
  assert.equal(leido, false);
});

test("las longitudes de un SVG pasan a píxeles: pt, mm, in…; el % no se puede saber", () => {
  assert.equal(longitudEnPx("1456"), 1456);
  assert.equal(longitudEnPx("1456px"), 1456);
  assert.equal(longitudEnPx("546pt"), 728);
  assert.equal(longitudEnPx("67.5pt"), 90);
  assert.equal(longitudEnPx("1in"), 96);
  assert.equal(longitudEnPx("25.4mm"), 96);
  assert.equal(longitudEnPx("100%"), null);
  assert.equal(longitudEnPx(""), null);
  assert.deepEqual(medidasDeSvg('<svg width="546pt" height="67.5pt">'), { ancho: 728, alto: 90, viewBox: false });
});

test("un SVG sin viewBox escala entero, no se queda en una esquina", () => {
  // Medidas en pt: el viewBox va en px, lo que medía de verdad.
  assert.equal(
    svgConMedidas('<svg width="546pt" height="67.5pt"><g/></svg>', 2912, 360),
    '<svg viewBox="0 0 728 90" width="2912" height="360"><g/></svg>',
  );
  // Sin medidas en el archivo: las que midió el navegador (`naturalWidth`).
  assert.equal(
    svgConMedidas('<svg xmlns="http://www.w3.org/2000/svg"><rect width="300" height="150"/></svg>', 720, 360, {
      ancho: 300,
      alto: 150,
    }),
    '<svg viewBox="0 0 300 150" width="720" height="360" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="150"/></svg>',
  );
  // Si ya trae viewBox, no se toca, aunque se le pasen otras medidas.
  assert.equal(svgConMedidas('<svg viewBox="0 0 10 5"/>', 20, 10, { ancho: 99, alto: 99 }), '<svg width="20" height="10" viewBox="0 0 10 5"/>');
});

test("la nota dice la verdad: «se aligeró» solo si pesa menos, y el formato que salió", () => {
  assert.equal(notaDeConversion(243 * KB, { size: 88 * KB, type: "image/webp" }), "Se aligeró de 243 KB a 88 KB.");
  assert.equal(
    notaDeConversion(69 * KB, { size: 136 * KB, type: "image/webp" }, "vale la pena."),
    "Se convirtió a WebP (de 69 KB a 136 KB): vale la pena.",
  );
  assert.equal(notaDeConversion(3 * KB, { size: 20 * KB, type: "image/jpeg" }), "Se convirtió a JPEG (de 3 KB a 20 KB).");
});
