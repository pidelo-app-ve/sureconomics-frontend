/**
 * El tope de peso del arte de un anuncio, antes de subirlo. `npm test` o
 * `npm run test:publicidad`. El que manda es el backend (`rules.arte_demasiado_pesado`,
 * con sus pruebas); esto comprueba que el panel avisa con los mismos límites.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { TOPE_ARTE_IMAGEN, TOPE_ARTE_SVG, arteDemasiadoPesado } from "./utils.js";

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
