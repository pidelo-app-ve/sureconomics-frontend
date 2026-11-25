/**
 * Lo que pide la publicidad cuando una vista declara sus huecos con la selección del
 * lector como `Set` (los listados: /articulos, /informes, /audiovisual). `npm test`.
 *
 * El fallo que vigila: `useEspacios` guardaba la declaración con `JSON.stringify` y la
 * recuperaba con `JSON.parse`; por el camino un `Set` se volvía `{}`, y la dirección salía
 * con `tema=[object Object]&pais=[object Object]` aunque no hubiera ningún filtro puesto.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import PropTypes from "prop-types";

const { pintar, waitFor, servidor } = await import("../../../../scripts/pruebas/dom.mjs");
const { useEspacios, ESPACIOS } = await import("../index.js");

/** Una vista como la de un listado: declara un hueco con temas y países como `Set`. */
const Listado = ({ temas, geos }) => {
  useEspacios({
    espacios: [ESPACIOS.LISTADO_NATIVO],
    contexto: { seccion: "articulo", formato: "articulo", tema: temas, pais: geos },
  });
  return null;
};
Listado.propTypes = { temas: PropTypes.instanceOf(Set).isRequired, geos: PropTypes.instanceOf(Set).isRequired };

const pedidoDeEspacios = async () => {
  await waitFor(() => assert.equal(servidor.a("/publicidad/espacios", "GET").length, 1));
  return servidor.a("/publicidad/espacios", "GET")[0].consulta;
};
const contestar = () => servidor.contestar("GET", "/publicidad/espacios", { success: true, data: { activa: true, espacios: {} } });

test("sin ningún filtro no manda tema ni país (y nunca [object Object])", async () => {
  contestar();
  pintar(createElement(Listado, { temas: new Set(), geos: new Set() }), { ruta: "/articulos", sitio: true });
  const consulta = await pedidoDeEspacios();
  assert.equal(consulta.tema, undefined, JSON.stringify(consulta));
  assert.equal(consulta.pais, undefined, JSON.stringify(consulta));
  assert.ok(!JSON.stringify(consulta).includes("object"), JSON.stringify(consulta));
  assert.equal(consulta.seccion, "articulo");
});

test("con temas y país elegidos los manda como lista", async () => {
  contestar();
  pintar(createElement(Listado, { temas: new Set(["mercados", "energia"]), geos: new Set(["venezuela"]) }), {
    ruta: "/articulos",
    sitio: true,
  });
  const consulta = await pedidoDeEspacios();
  assert.equal(consulta.tema, "mercados,energia");
  assert.equal(consulta.pais, "venezuela");
});
