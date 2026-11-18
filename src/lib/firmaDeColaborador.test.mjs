import test from "node:test";
import assert from "node:assert/strict";

import { firmaDePropuesta, firmadaPorColaborador, textoFirmaDeColaborador } from "./firmaDeColaborador.js";

test("el texto de la firma lleva el nombre y la marca de colaborador", () => {
  assert.equal(textoFirmaDeColaborador("  Ana Pérez "), "Firmada por Ana Pérez (colaborador)");
  assert.equal(textoFirmaDeColaborador(""), "");
  assert.equal(textoFirmaDeColaborador(null), "");
  // Dentro de una frase: «La pieza se publicó firmada por …».
  assert.equal(firmadaPorColaborador("Ana Pérez"), "firmada por Ana Pérez (colaborador)");
  assert.equal(firmadaPorColaborador(undefined), "");
});

test("antes de aceptarla, la firma es el nombre de quien la mandó", () => {
  const firma = firmaDePropuesta({ status: "submitted", autor: { nombre: "Ana Pérez", foto_url: null } });
  assert.deepEqual(firma, { nombre: "Ana Pérez", publicada: false, tieneFoto: false });
});

test("aceptada, manda la firma con la que salió la pieza (el nombre de hoy)", () => {
  const firma = firmaDePropuesta({
    status: "approved",
    firma_publicada: "Ana María Pérez",
    autor: { nombre: "Ana Pérez", foto_url: "https://res.cloudinary.com/demo/ana.jpg" },
  });
  assert.deepEqual(firma, { nombre: "Ana María Pérez", publicada: true, tieneFoto: true });
});

test("sin datos no se inventa nada", () => {
  assert.deepEqual(firmaDePropuesta(null), { nombre: "", publicada: false, tieneFoto: false });
  assert.deepEqual(firmaDePropuesta({ autor: null, firma_publicada: "  " }), {
    nombre: "",
    publicada: false,
    tieneFoto: false,
  });
});
