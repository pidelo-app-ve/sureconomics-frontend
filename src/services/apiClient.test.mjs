/**
 * El cliente de las lecturas públicas (`createApiClient`, `services/apiClient.js`): qué
 * dirección arma, qué manda, qué devuelve y qué error lanza. `npm test`.
 *
 * Fija el comportamiento de hoy (23-nov-2026), antes de juntar los tres clientes en
 * `src/api/`: si estas pruebas siguen en verde sin tocarlas, el cambio no se nota.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { fijarIdioma, registrarDiccionario, tActual } from "../i18n/motor.js";
import { ApiError, createApiClient } from "./apiClient.js";

const API = "https://api.prueba.invalid";
const SITIO = "https://www.sureconomics.com";

let peticiones;
let respuestas;
const contestar = (...lista) => {
  respuestas = lista;
};
const json = (status, cuerpo) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  peticiones = [];
  fijarIdioma("es");
  globalThis.window = new EventTarget();
  globalThis.fetch = async (url, init = {}) => {
    peticiones.push({ url: String(url), init });
    const r = respuestas.shift();
    if (!r) throw new Error(`fetch sin respuesta preparada: ${url}`);
    if (r instanceof Error) throw r;
    return r;
  };
});

const errorDe = async (fn) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  assert.fail("debía fallar");
};

describe("la dirección y lo que se manda", () => {
  test("sin dominio propio va directo; con él, las lecturas de la lista van por el quiosco", async () => {
    const c = createApiClient();
    contestar(json(200, { data: [] }), json(200, { data: [] }), json(200, { data: [] }));
    await c.request("/formats", { query: { a: 1, b: "", c: null } });
    globalThis.window = Object.assign(new EventTarget(), { location: { origin: SITIO } });
    await c.request("/formats");
    await c.request("/contact");
    // Sin la barra inicial no casa con la lista del quiosco: va directa (nadie llama así).
    contestar(json(200, { data: [] }));
    await c.request("formats");
    assert.deepEqual(peticiones.map((p) => p.url), [`${API}/formats?a=1`, `${SITIO}/datos/formats`, `${API}/contact`, `${API}/formats`]);
  });

  test("solo pasan método, cabeceras, el JSON y `signal`: nada más llega a fetch", async () => {
    const c = createApiClient({ defaultHeaders: { "X-Uno": "1" } });
    const signal = new AbortController().signal;
    contestar(json(201, { success: true, data: { ok: 1 } }));
    await c.request("/newsletter", {
      method: "POST",
      json: { email: "a@b.c" },
      headers: { "X-Dos": "2" },
      idempotencyKey: "k-1",
      signal,
      body: "esto no viaja",
      credentials: "include",
    });
    const { init } = peticiones[0];
    assert.deepEqual(Object.keys(init).sort(), ["body", "headers", "method", "signal"]);
    assert.equal(init.method, "POST");
    assert.equal(init.signal, signal);
    assert.equal(init.body, JSON.stringify({ email: "a@b.c" }));
    assert.deepEqual(init.headers, { "X-Uno": "1", "X-Dos": "2", "Idempotency-Key": "k-1", "Content-Type": "application/json" });
  });

  test("un GET va con método explícito y sin cuerpo", async () => {
    contestar(json(200, { data: 1 }));
    await createApiClient().request("/topics");
    assert.equal(peticiones[0].init.method, "GET");
    assert.equal(peticiones[0].init.body, undefined);
  });

  test("con la URL base vacía, no se crea: ApiError de estado 0", () => {
    assert.throws(() => createApiClient({ baseUrl: "  " }), (e) => e instanceof ApiError && e.status === 0);
  });

  test("la base se recorta y pierde la barra final", async () => {
    contestar(json(200, { data: 1 }));
    await createApiClient({ baseUrl: " https://otra.invalid/ " }).request("/x");
    assert.equal(peticiones[0].url, "https://otra.invalid/x");
  });
});

describe("lo que devuelve", () => {
  test("`data`, `{ data, meta }`, el cuerpo si no trae `data`, y null si no es JSON", async () => {
    const c = createApiClient();
    contestar(
      json(200, { success: true, data: { x: 1 } }),
      json(200, { data: [1], meta: { page: 2 } }),
      json(200, { meta: { page: 2 } }),
      json(200, { hola: 1 }),
      new Response(null, { status: 204 }),
      json(200, { data: null, meta: null })
    );
    assert.deepEqual(await c.request("/a"), { x: 1 });
    assert.deepEqual(await c.request("/b"), { data: [1], meta: { page: 2 } });
    assert.deepEqual(await c.request("/c"), { meta: { page: 2 } });
    assert.deepEqual(await c.request("/d"), { hola: 1 });
    assert.equal(await c.request("/e"), null);
    assert.equal(await c.request("/f"), null);
  });
});

describe("los errores", () => {
  test("un error HTTP: mensaje de arriba, o el de `error`, o el estado, o el de respaldo; con la URL", async () => {
    const c = createApiClient();
    contestar(
      json(400, { message: "arriba", error: { message: "dentro", code: "c1", details: { a: 1 } } }),
      json(400, { error: { message: "dentro" } }),
      new Response("<html>", { status: 502, statusText: "Bad Gateway" }),
      new Response("", { status: 500, statusText: "" })
    );
    const e1 = await errorDe(() => c.request("/a"));
    assert.ok(e1 instanceof ApiError);
    assert.equal(e1.message, "arriba");
    assert.equal(e1.status, 400);
    assert.equal(e1.code, "c1");
    assert.deepEqual(e1.details, { a: 1 });
    assert.equal(e1.url, `${API}/a`);
    assert.equal((await errorDe(() => c.request("/b"))).message, "dentro");
    const e3 = await errorDe(() => c.request("/c"));
    assert.equal(e3.message, "Bad Gateway");
    assert.equal(e3.details, null);
    assert.equal((await errorDe(() => c.request("/d"))).message, tActual("cuenta.api.errorSolicitud"));
  });

  test("`success: false` con un 200 también es un error, con el texto de respaldo en el idioma", async () => {
    registrarDiccionario("en", { cuenta: { api: { errorSolicitud: "Request failed (en)" } } });
    const c = createApiClient();
    contestar(json(200, { success: false, error: { message: "No", code: "x" } }), json(200, { success: false }));
    const e1 = await errorDe(() => c.request("/a"));
    assert.equal(e1.message, "No");
    assert.equal(e1.status, 200);
    assert.equal(e1.code, "x");
    fijarIdioma("en");
    const e2 = await errorDe(() => c.request("/b"));
    assert.equal(e2.message, "Request failed (en)");
    assert.deepEqual(e2.details, { success: false });
  });

  test("sin red, sube el error de fetch tal cual", async () => {
    contestar(new TypeError("Failed to fetch"));
    assert.ok((await errorDe(() => createApiClient().request("/a"))) instanceof TypeError);
  });
});
