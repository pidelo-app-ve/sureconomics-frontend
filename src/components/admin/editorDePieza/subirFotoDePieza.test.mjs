/**
 * La foto de una pieza antes de subirla (`subirFotoDePieza.js`): qué se convierte y qué no,
 * con un lienzo de mentira (en node no hay `<canvas>`). `npm test` o
 * `npm run test:aligerar`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AVISO_GIF_ANIMADO,
  MEDIDAS_DE_FOTO,
  decidirFotoDePieza,
  prepararFotoDePieza,
} from "./subirFotoDePieza.js";
import { AVISO_OPTIMIZANDO } from "../aligerarImagen.js";

const KB = 1024;

/**
 * Un lienzo de mentira: apunta lo que se le pide y pesa `bytes`. Con `sinWebp`, como un
 * Safari antiguo: pedido un WebP, da un PNG.
 */
const lienzoFalso = ({ medidas = { ancho: 300, alto: 150 }, bytes = 40 * KB, pedidos = [], sinWebp = false } = {}) => ({
  cargar: async () => ({ medidas, vectorial: true, dibujable: async () => ({}), cerrar() {} }),
  exportar: async (_d, pedido) => {
    pedidos.push(pedido);
    const tipo = sinWebp && pedido.tipo === "image/webp" ? "image/png" : pedido.tipo;
    return new Blob([new Uint8Array(bytes)], { type: tipo });
  },
});

/** Un GIF de `cuadros` cuadros de 1 × 1 (ver `esGifAnimado`). */
const gif = (cuadros) => {
  const b = [..."GIF89a"].map((c) => c.charCodeAt(0));
  b.push(1, 0, 1, 0, 0x80, 0, 0, 0, 0, 0, 255, 255, 255);
  for (let i = 0; i < cuadros; i += 1) b.push(0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 0x4c, 0x01, 0);
  b.push(0x3b);
  return new Uint8Array(b);
};

test("solo se convierte el SVG; un GIF animado se avisa; JPEG, PNG y WebP no se tocan", () => {
  assert.equal(decidirFotoDePieza({ mime: "image/svg+xml", nombre: "grafico.svg" }), "convertir");
  assert.equal(decidirFotoDePieza({ mime: "", nombre: "grafico.SVG" }), "convertir");
  assert.equal(decidirFotoDePieza({ mime: "image/gif", gifAnimado: true }), "avisar");
  assert.equal(decidirFotoDePieza({ mime: "image/gif", gifAnimado: false }), "subir");
  for (const mime of ["image/jpeg", "image/png", "image/webp"]) assert.equal(decidirFotoDePieza({ mime }), "subir");
});

test("la caja es la talla más grande del sitio: 1.400 px de ancho", () => {
  assert.equal(MEDIDAS_DE_FOTO.ancho, 1400);
});

test("un SVG sale en WebP de 1.400 px, con calidad 0,82, en una sola pasada y con aviso", async () => {
  const pedidos = [];
  const avisos = [];
  const archivo = new File([new Uint8Array(243 * KB)], "grafico.svg", { type: "image/svg+xml" });
  const r = await prepararFotoDePieza(archivo, { onAviso: (t) => avisos.push(t), lienzo: lienzoFalso({ pedidos }) });
  assert.deepEqual(avisos, [AVISO_OPTIMIZANDO]);
  assert.deepEqual(pedidos, [{ ancho: 1400, alto: 700, tipo: "image/webp", calidad: 0.82 }]);
  assert.equal(r.archivo.name, "grafico.webp");
  assert.equal(r.nota, "Se aligeró de 243 KB a 40 KB.");
});

test("un SVG pequeño que sale más pesado no dice «se aligeró», y dice el formato de verdad", async () => {
  const icono = new File([new Uint8Array(3 * KB)], "icono.svg", { type: "image/svg+xml" });
  const webp = await prepararFotoDePieza(icono, { lienzo: lienzoFalso({ bytes: 20 * KB }) });
  assert.match(webp.nota, /^Se convirtió a WebP \(de 3 KB a 20 KB\): ahora el sitio prepara/);
  // En un Safari sin WebP sale JPEG, y el aviso no puede decir «WebP».
  const jpeg = await prepararFotoDePieza(icono, { lienzo: lienzoFalso({ bytes: 20 * KB, sinWebp: true }) });
  assert.equal(jpeg.archivo.name, "icono.jpg");
  assert.match(jpeg.nota, /^Se convirtió a JPEG \(de 3 KB a 20 KB\)/);
});

test("una foto JPEG pesada se sube tal cual: sus versiones las hace el servidor", async () => {
  const archivo = new File([new Uint8Array(2048 * KB)], "foto.jpg", { type: "image/jpeg" });
  const r = await prepararFotoDePieza(archivo, { lienzo: lienzoFalso() });
  assert.equal(r.archivo, archivo);
  assert.equal(r.nota, null);
});

test("un GIF animado se sube tal cual, con su aviso; uno quieto, sin aviso", async () => {
  const animado = new File([gif(2)], "anim.gif", { type: "image/gif" });
  const quieto = new File([gif(1)], "quieto.gif", { type: "image/gif" });
  assert.deepEqual(await prepararFotoDePieza(animado, { lienzo: lienzoFalso() }), { archivo: animado, nota: AVISO_GIF_ANIMADO });
  assert.deepEqual(await prepararFotoDePieza(quieto, { lienzo: lienzoFalso() }), { archivo: quieto, nota: null });
});
