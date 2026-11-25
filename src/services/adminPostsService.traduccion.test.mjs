/**
 * «Traducir con Claude» en segundo plano (`traducirTextos`): lo que pasa con cada
 * respuesta de `POST /admin/traducciones` y de `GET /admin/traducciones/<id>`. Las
 * respuestas son las del backend, grabadas (`src/pruebas/respuestas/traducciones/`). Se
 * espera unos milisegundos entre preguntas, no los 2 s de verdad. `npm test`.
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { servidorDePrueba, grabada } from "../../scripts/pruebas/servidor.mjs";
import { adminErrorMessage } from "../lib/adminErrorMessage.js";
import { ESPERA_DE_LA_TRADUCCION, traducirTextos } from "./adminPostsService.js";

const almacen = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

const servidor = servidorDePrueba();
const CAMPOS = {
  title: "El BCV sube la tasa de encaje",
  excerpt: "<p>La medida rige desde el lunes.</p>",
  content: "<p>El Banco Central de Venezuela subió la tasa de encaje legal.</p>",
};
const ID = grabada("traducciones/en-marcha.json").cuerpo.data.id;
const POR_SU_ID = /^\/admin\/traducciones\/[^/]+$/;
const RAPIDO = { cadaMs: 5, topeMs: 2000 };
const INGLES = grabada("traducciones/lista.json").data;
const pausa = (ms) => new Promise((s) => setTimeout(s, ms));
const preguntas = () => servidor.peticiones.filter((p) => p.metodo === "GET" && POR_SU_ID.test(p.ruta));

/** Contesta a cada pregunta por el id con la siguiente de `respuestas` (la última se repite). */
const contestarPorOrden = (...respuestas) => {
  let n = 0;
  servidor.contestar("GET", POR_SU_ID, () => respuestas[Math.min(n++, respuestas.length - 1)]);
};

beforeEach(() => {
  servidor.reiniciar();
  globalThis.sessionStorage = almacen();
  sessionStorage.setItem("sureconomics_admin_access_token", "acceso-1");
  sessionStorage.setItem("sureconomics_admin_refresh_token", "renovar-1");
});

test("cada 2 s y hasta 4 minutos, si no se dice otra cosa", () => {
  assert.deepEqual(ESPERA_DE_LA_TRADUCCION, { cadaMs: 2000, topeMs: 240000 });
});

test("200 directo: la traducción, con una sola petición a la ruta nueva", async () => {
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/hecha.json"));
  const r = await traducirTextos(CAMPOS, RAPIDO);
  assert.deepEqual(r, grabada("traducciones/hecha.json").data);
  assert.deepEqual(servidor.peticiones, [{ metodo: "POST", ruta: "/admin/traducciones", consulta: {}, cuerpo: CAMPOS }]);
  assert.equal(servidor.a("/admin/posts/traducir").length, 0, "la ruta vieja es del bot de Saúl");
});

test("202 y luego 200: pregunta por su id hasta que llega la traducción", async () => {
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/en-marcha.json"));
  contestarPorOrden(grabada("traducciones/sigue.json"), grabada("traducciones/sigue.json"), grabada("traducciones/lista.json"));
  const r = await traducirTextos(CAMPOS, RAPIDO);
  assert.deepEqual(r, INGLES);
  assert.deepEqual(preguntas().map((p) => p.ruta), Array(3).fill(`/admin/traducciones/${ID}`));
});

test("202 y luego un error: el de la traducción, tal cual", async () => {
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/en-marcha.json"));
  contestarPorOrden(grabada("traducciones/sigue.json"), grabada("traducciones/fallo.json"));
  const err = await traducirTextos(CAMPOS, RAPIDO).then(() => null, (e) => e);
  assert.equal(err.status, 502);
  assert.equal(err.code, "translation_failed");
  assert.equal(adminErrorMessage(err, "No se pudo traducir."), "No se pudo traducir: Claude contestó con un error (529).");
  assert.equal(preguntas().length, 2);
});

test("404 al preguntar: ya no está (reinicio u otra pestaña), que la vuelva a pedir", async () => {
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/en-marcha.json"));
  contestarPorOrden(grabada("traducciones/se-interrumpio.json"));
  const err = await traducirTextos(CAMPOS, RAPIDO).then(() => null, (e) => e);
  assert.equal(err.code, "translation_interrupted");
  assert.equal(adminErrorMessage(err, "No se pudo traducir."), "La traducción ya no está en el servidor: se reinició o se pidió otra (quizá en otra pestaña). Vuelva a pedirla.");
  assert.equal(preguntas().length, 1, "no sigue preguntando");
});

test("409: el texto del servidor, tal cual, y no se pregunta por nada", async () => {
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/ya-hay-una.json"));
  const err = await traducirTextos(CAMPOS, RAPIDO).then(() => null, (e) => e);
  assert.equal(err.code, "translation_in_progress");
  assert.equal(adminErrorMessage(err, "No se pudo traducir."), "Ya hay una traducción en marcha. Espere a que termine.");
  assert.equal(servidor.peticiones.length, 1);
});

test("tiempo agotado: deja de preguntar y lo dice", async () => {
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/en-marcha.json"));
  contestarPorOrden(grabada("traducciones/sigue.json"));
  const err = await traducirTextos(CAMPOS, { cadaMs: 5, topeMs: 60 }).then(() => null, (e) => e);
  assert.equal(err.code, "translation_timeout");
  assert.equal(
    adminErrorMessage(err, "No se pudo traducir."),
    "La traducción tarda más de 1 minuto. Espere un momento y vuelva a pedirla.",
  );
  const hechas = preguntas().length;
  assert.ok(hechas >= 1 && hechas <= 13, `preguntó ${hechas} veces en 60 ms, cada 5 ms`);
  await pausa(40);
  assert.equal(preguntas().length, hechas, "después ya no pregunta");
});

test("con el tope de siempre, el aviso dice sus 4 minutos", async () => {
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/en-marcha.json"));
  const ahora = Date.now;
  let vez = 0;
  // La primera hora es la de empezar; la siguiente, 5 minutos después.
  Date.now = () => ahora() + (vez++ === 0 ? 0 : 5 * 60 * 1000);
  try {
    const err = await traducirTextos(CAMPOS).then(() => null, (e) => e);
    assert.equal(err.message, "La traducción tarda más de 4 minutos. Espere un momento y vuelva a pedirla.");
    assert.equal(preguntas().length, 0);
  } finally {
    Date.now = ahora;
  }
});

test("si se deja a medias (se cerró la pieza), deja de preguntar", async () => {
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/en-marcha.json"));
  contestarPorOrden(grabada("traducciones/sigue.json"));
  const control = new AbortController();
  const espera = traducirTextos(CAMPOS, { ...RAPIDO, signal: control.signal }).then(() => null, (e) => e);
  while (preguntas().length < 2) await pausa(2);
  control.abort();
  const err = await espera;
  assert.equal(err.name, "AbortError");
  const hechas = preguntas().length;
  await pausa(40);
  assert.equal(preguntas().length, hechas, "después ya no pregunta");
});

test("ya dejada antes de la primera pregunta: no pregunta", async () => {
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/en-marcha.json"));
  contestarPorOrden(grabada("traducciones/lista.json"));
  const control = new AbortController();
  control.abort();
  // El POST de mentira no mira la señal (un `fetch` de verdad ya habría parado aquí).
  const err = await traducirTextos(CAMPOS, { ...RAPIDO, signal: control.signal }).then(() => null, (e) => e);
  assert.equal(err.name, "AbortError");
  assert.equal(preguntas().length, 0);
});
