/**
 * Las dos descargas del panel que no son JSON: el informe de «Audiencia» en Excel
 * (`features/analitica/admin/api.js`) y la lista del boletín en CSV
 * (`newsletterService.js`). `npm test`.
 *
 * Fija lo que hacen hoy (23-nov-2026): una petición mínima por `adminRequest` (que
 * renueva el token si hace falta), y después los bytes con la cabecera de sesión, que un
 * enlace normal no mandaría.
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { descargarInforme } from "../features/analitica/admin/api.js";
import { downloadNewsletterCsv } from "./newsletterService.js";

const API = "https://api.prueba.invalid";

const almacen = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

let peticiones;
let respuestas;
let enlaces;
const json = (status, cuerpo) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  peticiones = [];
  enlaces = [];
  globalThis.sessionStorage = almacen();
  sessionStorage.setItem("sureconomics_admin_access_token", "acceso-1");
  sessionStorage.setItem("sureconomics_admin_refresh_token", "renovar-1");
  globalThis.window = new EventTarget();
  globalThis.document = {
    createElement: () => {
      const a = { click() { enlaces.push(a.download); }, remove() {} };
      return a;
    },
    body: { appendChild() {} },
  };
  URL.createObjectURL = () => "blob:1";
  URL.revokeObjectURL = () => {};
  globalThis.fetch = async (url, init = {}) => {
    peticiones.push({ url: String(url), init });
    const r = respuestas.shift();
    if (!r) throw new Error(`fetch sin respuesta preparada: ${url}`);
    if (r instanceof Error) throw r;
    return r;
  };
});

test("el informe: primero una petición mínima, después los bytes con el token", async () => {
  respuestas = [json(200, { success: true, data: {} }), new Response("xlsx", { status: 200 })];
  await descargarInforme(7);
  assert.equal(peticiones.length, 2);
  assert.equal(peticiones[0].url, `${API}/admin/analitica/en-vivo`);
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const consulta = new URLSearchParams({ dias: "7" });
  if (zona) consulta.set("zona", zona);
  assert.equal(peticiones[1].url, `${API}/admin/analitica/informe?${consulta}`);
  assert.deepEqual(peticiones[1].init, { headers: { Authorization: "Bearer acceso-1" } });
  assert.equal(enlaces.length, 1);
  assert.match(enlaces[0], /\.xlsx$/);
});

test("el informe: si el servidor dice que no, su mensaje (o uno propio)", async () => {
  respuestas = [json(200, { success: true, data: {} }), json(403, { error: { message: "Solo administradores" } })];
  await assert.rejects(() => descargarInforme(30), { message: "Solo administradores" });
  respuestas = [json(200, { success: true, data: {} }), new Response("<html>", { status: 502 })];
  await assert.rejects(() => descargarInforme(30), { message: "No se pudo descargar el informe." });
});

test("el CSV del boletín: con o sin filtro, y el token en la cabecera", async () => {
  respuestas = [json(200, { success: true, data: [] }), new Response("a,b", { status: 200 })];
  await downloadNewsletterCsv({ status: "active" });
  assert.equal(peticiones[0].url, `${API}/admin/newsletter?page=1&limit=1`);
  assert.equal(peticiones[1].url, `${API}/admin/newsletter/csv?status=active`);
  assert.deepEqual(peticiones[1].init, { headers: { Authorization: "Bearer acceso-1" } });
  assert.deepEqual(enlaces, ["boletin.csv"]);

  peticiones = [];
  respuestas = [json(200, { success: true, data: [] }), new Response("a,b", { status: 200 })];
  await downloadNewsletterCsv();
  assert.equal(peticiones[1].url, `${API}/admin/newsletter/csv`);
});

test("el CSV del boletín: si el servidor dice que no, su mensaje (o uno propio)", async () => {
  respuestas = [json(200, { success: true, data: [] }), json(403, { error: { message: "No" } })];
  await assert.rejects(() => downloadNewsletterCsv(), { message: "No" });
  respuestas = [json(200, { success: true, data: [] }), new Response("", { status: 500 })];
  await assert.rejects(() => downloadNewsletterCsv(), { message: "No se pudo descargar la lista." });
});

test("sin sesión, ninguna de las dos llega a pedir los bytes", async () => {
  sessionStorage.removeItem("sureconomics_admin_access_token");
  await assert.rejects(() => descargarInforme(30), { status: 401 });
  await assert.rejects(() => downloadNewsletterCsv(), { status: 401 });
  assert.equal(peticiones.length, 0);
});
