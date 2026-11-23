/**
 * Hablar con la API desde la parte del lector (`lib/userApi.js`): qué dirección se arma,
 * qué cabeceras van, qué se devuelve, qué error se lanza y cuándo se cierra la sesión.
 * `npm test`.
 *
 * Fija el comportamiento de hoy (23-nov-2026), antes de juntar los tres clientes en
 * `src/api/`: si estas pruebas siguen en verde sin tocarlas, el cambio no se nota.
 *
 * Sin red de verdad: `fetch` es un guion que contesta lo que cada prueba dice y apunta lo
 * que se le pidió; `sessionStorage` y `window`, lo mínimo.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { fijarIdioma, registrarDiccionario, tActual } from "../i18n/motor.js";
import {
  descargarArchivoDeUsuario,
  refreshUserTokens,
  userOptionalAuthRequest,
  userPublicRequest,
  userRequest,
} from "./userApi.js";
import { ApiError } from "../services/apiClient.js";

const API = "https://api.prueba.invalid";
const SITIO = "https://www.sureconomics.com";
const ACCESO = "sureconomics_user_access_token";
const RENOVAR = "sureconomics_user_refresh_token";
const CADUCA = "sureconomics_user_access_expires_at";

const almacen = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    get tamano() {
      return m.size;
    },
  };
};

let peticiones;
let respuestas;
let avisosDeSesion;

const contestar = (...lista) => {
  respuestas = lista;
};
const json = (status, cuerpo, extra = {}) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json", ...extra } });

/** `window` con o sin dirección propia: con ella, las lecturas públicas van por el quiosco. */
const ventana = ({ conDominio = false } = {}) => {
  globalThis.window = Object.assign(new EventTarget(), conDominio ? { location: { origin: SITIO } } : {});
  window.addEventListener("sureconomics-user-auth-sync", () => (avisosDeSesion += 1));
};

beforeEach(() => {
  peticiones = [];
  avisosDeSesion = 0;
  fijarIdioma("es");
  globalThis.sessionStorage = almacen();
  ventana();
  globalThis.fetch = async (url, init = {}) => {
    peticiones.push({
      url: String(url),
      ...init,
      cuerpo: typeof init.body === "string" ? JSON.parse(init.body) : init.body,
    });
    const r = respuestas.shift();
    if (!r) throw new Error(`fetch sin respuesta preparada: ${url}`);
    if (r instanceof Error) throw r;
    return r;
  };
});

const conSesion = ({ caducaEn = null } = {}) => {
  sessionStorage.setItem(ACCESO, "acceso-viejo");
  sessionStorage.setItem(RENOVAR, "renovar-1");
  if (caducaEn !== null) sessionStorage.setItem(CADUCA, String(caducaEn));
};

const errorDe = async (fn) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  assert.fail("debía fallar");
};

const caducado = () => json(401, { success: false, error: { message: "Token expired" } });
const renovado = () =>
  json(200, { success: true, data: { access_token: "acceso-nuevo", refresh_token: "renovar-2", expires_in: 900 } });

describe("lecturas públicas (userPublicRequest)", () => {
  test("sin dominio propio (pruebas, Node) va directa a la API, con la consulta sin vacíos", async () => {
    contestar(json(200, { success: true, data: [1, 2] }));
    const r = await userPublicRequest("/monedas", { query: { a: 1, b: "", c: null, d: undefined, e: "x y" } });
    assert.deepEqual(r, [1, 2]);
    assert.equal(peticiones[0].url, `${API}/monedas?a=1&e=x+y`);
    assert.equal(peticiones[0].headers.Authorization, undefined);
  });

  test("en el navegador, una lectura de la lista va por el quiosco; otra, directa", async () => {
    ventana({ conDominio: true });
    contestar(json(200, { success: true, data: [] }), json(200, { success: true, data: [] }), json(200, { success: true, data: [] }));
    await userPublicRequest("/monedas");
    await userPublicRequest("/juegos/clave/hoy/intento");
    // Una rareza de hoy: sin la barra inicial, la ruta no casa con la lista del quiosco
    // y va directa (la dirección sí se arma bien). Nadie llama así.
    await userPublicRequest("monedas");
    assert.equal(peticiones[0].url, `${SITIO}/datos/monedas`);
    assert.equal(peticiones[1].url, `${API}/juegos/clave/hoy/intento`);
    assert.equal(peticiones[2].url, `${API}/monedas`);
  });

  test("un POST con JSON nunca va por el quiosco y lleva su tipo y su clave de idempotencia", async () => {
    ventana({ conDominio: true });
    contestar(json(201, { success: true, data: { ok: 1 } }));
    await userPublicRequest("/posts", { method: "POST", json: { a: 1 }, idempotencyKey: "k-1" });
    const [p] = peticiones;
    assert.equal(p.url, `${API}/posts`);
    assert.equal(p.method, "POST");
    assert.equal(p.headers["Content-Type"], "application/json");
    assert.equal(p.headers["Idempotency-Key"], "k-1");
    assert.deepEqual(p.cuerpo, { a: 1 });
  });

  test("lo que devuelve: `data`, `{ data, meta }`, o el cuerpo entero si no hay `data`", async () => {
    contestar(
      json(200, { success: true, data: { x: 1 } }),
      json(200, { success: true, data: [1], meta: { page: 2 } }),
      json(200, { hola: "mundo" }),
      json(200, { success: true, meta: { page: 1 } }),
      new Response("no es json", { status: 200 })
    );
    assert.deepEqual(await userPublicRequest("/a"), { x: 1 });
    assert.deepEqual(await userPublicRequest("/b"), { data: [1], meta: { page: 2 } });
    assert.deepEqual(await userPublicRequest("/c"), { hola: "mundo" });
    assert.deepEqual(await userPublicRequest("/d"), { data: undefined, meta: { page: 1 } });
    assert.deepEqual(await userPublicRequest("/e"), {});
  });

  test("el error: ApiError, con estado, código y detalles; el mensaje por orden de preferencia", async () => {
    contestar(
      json(400, { success: false, error: { message: "El correo ya existe", code: "dup", details: { email: ["x"] } } }),
      json(422, { detail: [{ msg: "uno" }, "dos", { otra: 1 }] }),
      json(422, { detail: "solo texto" }),
      json(400, { success: false, error: { message: "Request failed" }, message: "arriba" }),
      json(400, { success: false, error: { message: "Request failed" } }),
      new Response("<html>", { status: 502, statusText: "Bad Gateway" }),
      json(200, { success: false, error: { message: "No se puede", code: "nope" } })
    );
    const e1 = await errorDe(() => userPublicRequest("/a"));
    assert.ok(e1 instanceof ApiError);
    assert.equal(e1.name, "ApiError");
    assert.equal(e1.message, "El correo ya existe");
    assert.equal(e1.status, 400);
    assert.equal(e1.code, "dup");
    assert.deepEqual(e1.details, { email: ["x"] });
    assert.equal(e1.url, undefined);
    assert.equal((await errorDe(() => userPublicRequest("/b"))).message, "uno dos");
    assert.equal((await errorDe(() => userPublicRequest("/c"))).message, "solo texto");
    assert.equal((await errorDe(() => userPublicRequest("/d"))).message, "arriba");
    assert.equal((await errorDe(() => userPublicRequest("/e"))).message, "Request failed");
    const e6 = await errorDe(() => userPublicRequest("/f"));
    assert.equal(e6.message, "Bad Gateway");
    assert.equal(e6.status, 502);
    assert.deepEqual(e6.details, {});
    const e7 = await errorDe(() => userPublicRequest("/g"));
    assert.equal(e7.message, "No se puede");
    assert.equal(e7.status, 200);
  });

  test("sin red, sube el error de fetch tal cual", async () => {
    contestar(new TypeError("Failed to fetch"));
    const err = await errorDe(() => userPublicRequest("/monedas"));
    assert.ok(err instanceof TypeError);
  });
});

describe("con la sesión del lector (userRequest)", () => {
  test("sin sesión, ni se intenta: 401 con el texto en el idioma de la página", async () => {
    const err = await errorDe(() => userRequest("/user/me"));
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 401);
    assert.equal(err.message, tActual("cuenta.api.debeIniciarSesion"));
    assert.equal(peticiones.length, 0);
  });

  test("en /en, los dos textos que llegan a la pantalla salen en inglés", async () => {
    registrarDiccionario("en", { cuenta: { api: { debeIniciarSesion: "Please sign in", sesionExpirada: "Session expired" } } });
    fijarIdioma("en");
    assert.equal((await errorDe(() => userRequest("/user/me"))).message, "Please sign in");
    conSesion();
    contestar(caducado(), json(401, { success: false }));
    assert.equal((await errorDe(() => userRequest("/user/me"))).message, "Session expired");
  });

  test("manda el token, y una lectura con sesión nunca va por el quiosco", async () => {
    ventana({ conDominio: true });
    conSesion();
    contestar(json(200, { success: true, data: [] }));
    await userRequest("/posts", { query: { page: 1 } });
    assert.equal(peticiones[0].url, `${API}/posts?page=1`);
    assert.equal(peticiones[0].headers.Authorization, "Bearer acceso-viejo");
  });

  test("un 401 se arregla renovando en /user-auth/refresh, y se repite la petición", async () => {
    conSesion();
    contestar(caducado(), renovado(), json(200, { success: true, data: { id: 1 } }));
    const r = await userRequest("/user/me", { method: "PATCH", json: { a: 1 } });
    assert.deepEqual(r, { id: 1 });
    assert.deepEqual(peticiones.map((p) => p.url.replace(API, "")), ["/user/me", "/user-auth/refresh", "/user/me"]);
    assert.deepEqual(peticiones[1].cuerpo, { refresh_token: "renovar-1" });
    assert.equal(peticiones[2].headers.Authorization, "Bearer acceso-nuevo");
    assert.deepEqual(peticiones[2].cuerpo, { a: 1 });
    assert.equal(sessionStorage.getItem(ACCESO), "acceso-nuevo");
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-2");
    assert.ok(Number(sessionStorage.getItem(CADUCA)) > Date.now());
    assert.equal(avisosDeSesion, 1);
  });

  test("si la renovación dice que no (401): se cierra la sesión, se avisa y se dice que caducó", async () => {
    conSesion();
    contestar(caducado(), json(401, { success: false, error: { message: "Refresh expired" } }));
    const err = await errorDe(() => userRequest("/user/me"));
    assert.equal(err.status, 401);
    assert.equal(err.message, tActual("cuenta.api.sesionExpirada"));
    assert.equal(sessionStorage.tamano, 0);
    assert.equal(avisosDeSesion, 1);
  });

  // Así es hoy, y es distinto del panel (`lib/api.test.mjs`, «sin red al renovar, la
  // sesión no se cierra»): el lector pierde la sesión ante CUALQUIER fallo al renovar,
  // también sin red, con el limitador (429), con el servidor reiniciando (502) o si la red
  // se cae en el reintento. Ver `src/api/sesion.js`.
  for (const [nombre, fallo] of [
    ["sin red al renovar", () => new TypeError("Failed to fetch")],
    ["un 429 al renovar", () => json(429, { success: false, error: { message: "30 per 1 minute" } })],
    ["un 502 al renovar", () => new Response("<html>", { status: 502, statusText: "Bad Gateway" })],
  ]) {
    test(`${nombre}: hoy también se cierra la sesión`, async () => {
      conSesion();
      contestar(caducado(), fallo());
      const err = await errorDe(() => userRequest("/user/me"));
      assert.equal(err.status, 401);
      assert.equal(err.message, tActual("cuenta.api.sesionExpirada"));
      assert.equal(sessionStorage.tamano, 0);
      assert.equal(avisosDeSesion, 1);
    });
  }

  test("renovada bien y la red se cae en el reintento: hoy también se cierra la sesión", async () => {
    conSesion();
    contestar(caducado(), renovado(), new TypeError("Failed to fetch"));
    const err = await errorDe(() => userRequest("/user/me"));
    assert.equal(err.status, 401);
    assert.equal(sessionStorage.tamano, 0);
    assert.equal(avisosDeSesion, 2); // el de «renové» y el de «cerré»
  });

  test("una renovación que responde 200 sin token también cierra la sesión", async () => {
    conSesion();
    contestar(caducado(), json(200, { success: true, data: {} }));
    const err = await errorDe(() => userRequest("/user/me"));
    assert.equal(err.message, tActual("cuenta.api.sesionExpirada"));
    assert.equal(sessionStorage.tamano, 0);
  });

  test("renovada, pero el token nuevo tampoco vale (401 otra vez): se cierra y sube el error del servidor", async () => {
    conSesion();
    contestar(caducado(), renovado(), json(401, { success: false, error: { message: "Token revoked" } }));
    const err = await errorDe(() => userRequest("/user/me"));
    assert.equal(err.status, 401);
    assert.equal(err.message, "Token revoked");
    assert.equal(sessionStorage.tamano, 0);
  });

  test("un 401 sin token de renovación: se cierra la sesión y sube el error del servidor", async () => {
    sessionStorage.setItem(ACCESO, "acceso-viejo");
    contestar(caducado());
    const err = await errorDe(() => userRequest("/user/me"));
    assert.equal(err.message, "Token expired");
    assert.equal(sessionStorage.tamano, 0);
    assert.equal(avisosDeSesion, 1);
  });

  test("un 403 no toca la sesión", async () => {
    conSesion();
    contestar(json(403, { success: false, error: { message: "Prohibido", code: "forbidden" } }));
    const err = await errorDe(() => userRequest("/user/me"));
    assert.equal(err.status, 403);
    assert.equal(err.code, "forbidden");
    assert.equal(sessionStorage.getItem(ACCESO), "acceso-viejo");
    assert.equal(avisosDeSesion, 0);
  });

  test("a punto de caducar, se renueva antes; si no se puede, se pide igual con el que hay", async () => {
    conSesion({ caducaEn: Date.now() + 1000 });
    contestar(renovado(), json(200, { success: true, data: [] }));
    await userRequest("/user/me");
    assert.match(peticiones[0].url, /\/user-auth\/refresh$/);
    assert.equal(peticiones[1].headers.Authorization, "Bearer acceso-nuevo");

    peticiones = [];
    conSesion({ caducaEn: Date.now() + 1000 });
    contestar(new TypeError("Failed to fetch"), json(200, { success: true, data: [] }));
    await userRequest("/user/me");
    assert.equal(peticiones[1].headers.Authorization, "Bearer acceso-viejo");
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-1");
  });

  test("subir un archivo: el FormData va tal cual y sin Content-Type (lo pone el navegador)", async () => {
    conSesion();
    const datos = new FormData();
    datos.append("file", new Blob(["hola"]), "a.txt");
    contestar(json(201, { success: true, data: { id: 3 } }));
    await userRequest("/user/submissions/1/files", { method: "POST", body: datos });
    assert.equal(peticiones[0].body, datos);
    assert.equal(peticiones[0].headers["Content-Type"], undefined);
  });
});

describe("sesión opcional (userOptionalAuthRequest)", () => {
  test("sin sesión, pide sin cabecera y sin cortar con un 401 propio", async () => {
    contestar(json(200, { success: true, data: { abierto: true } }));
    assert.deepEqual(await userOptionalAuthRequest("/posts/x/documents"), { abierto: true });
    assert.equal(peticiones[0].headers.Authorization, undefined);
  });

  test("con sesión manda el token; un 401 no renueva ni cierra nada", async () => {
    conSesion();
    contestar(caducado());
    const err = await errorDe(() => userOptionalAuthRequest("/posts/x/documents"));
    assert.equal(err.status, 401);
    assert.equal(peticiones.length, 1);
    assert.equal(peticiones[0].headers.Authorization, "Bearer acceso-viejo");
    assert.equal(sessionStorage.getItem(ACCESO), "acceso-viejo");
  });

  test("a punto de caducar se renueva antes, pero solo si hay token de acceso", async () => {
    sessionStorage.setItem(RENOVAR, "renovar-1");
    sessionStorage.setItem(CADUCA, String(Date.now() + 1000));
    contestar(json(200, { success: true, data: {} }));
    await userOptionalAuthRequest("/x");
    assert.equal(peticiones.length, 1);
    assert.equal(peticiones[0].url, `${API}/x`);
  });
});

describe("renovar (refreshUserTokens)", () => {
  test("sin token de renovación: ApiError 401 sin tocar la red", async () => {
    const err = await errorDe(() => refreshUserTokens());
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 401);
    assert.equal(err.message, "No hay token de renovación");
    assert.equal(peticiones.length, 0);
  });

  test("respuesta sin token: ApiError 401 «Respuesta de renovación inválida»", async () => {
    conSesion();
    contestar(json(200, { success: true, data: { otra: 1 } }));
    const err = await errorDe(() => refreshUserTokens());
    assert.equal(err.status, 401);
    assert.equal(err.message, "Respuesta de renovación inválida");
  });

  test("sin `refresh_token` nuevo se queda el de antes; sin `expires_in`, se borra la caducidad", async () => {
    conSesion({ caducaEn: Date.now() + 99999 });
    contestar(json(200, { success: true, data: { access_token: "a2" } }));
    const data = await refreshUserTokens();
    assert.deepEqual(data, { access_token: "a2" });
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-1");
    assert.equal(sessionStorage.getItem(CADUCA), null);
  });
});

describe("descargas del lector (descargarArchivoDeUsuario)", () => {
  test("sin sesión y exigiéndola: 401 sin tocar la red", async () => {
    const err = await errorDe(() => descargarArchivoDeUsuario("/posts/x/documents/1/download", { comoBlob: true }));
    assert.equal(err.status, 401);
    assert.equal(err.message, tActual("cuenta.api.debeIniciarSesion"));
    assert.equal(peticiones.length, 0);
  });

  test("abierta: sin sesión pide sin cabecera, directa a la API (nunca el quiosco)", async () => {
    ventana({ conDominio: true });
    contestar(new Response("bytes", { status: 200 }));
    const blob = await descargarArchivoDeUsuario("posts/x/documents/1/download", { exigirSesion: false, comoBlob: true });
    assert.equal(await blob.text(), "bytes");
    assert.equal(peticiones[0].url, `${API}/posts/x/documents/1/download`);
    assert.deepEqual(peticiones[0].headers, {});
  });

  test("con un 401, renueva y repite; si no puede renovar, NO cierra la sesión y sube el 401", async () => {
    conSesion();
    contestar(caducado(), renovado(), new Response("pdf", { status: 200 }));
    const blob = await descargarArchivoDeUsuario("/d", { comoBlob: true });
    assert.equal(await blob.text(), "pdf");
    assert.equal(peticiones[2].headers.Authorization, "Bearer acceso-nuevo");

    conSesion();
    contestar(caducado(), new TypeError("Failed to fetch"));
    const err = await errorDe(() => descargarArchivoDeUsuario("/d", { comoBlob: true }));
    assert.equal(err.status, 401);
    assert.equal(err.message, "Token expired");
    assert.equal(sessionStorage.getItem(ACCESO), "acceso-viejo");
  });

  test("sin `comoBlob`, entrega la descarga con el nombre de Content-Disposition", async () => {
    conSesion();
    const enlaces = [];
    globalThis.document = {
      createElement: () => {
        const a = { click() { enlaces.push({ href: a.href, download: a.download }); }, remove() {} };
        return a;
      },
      body: { appendChild() {} },
    };
    const crear = URL.createObjectURL;
    URL.createObjectURL = () => "blob:1";
    try {
      contestar(new Response("pdf", { status: 200, headers: { "Content-Disposition": "attachment; filename*=UTF-8''informe%20final.pdf" } }));
      const r = await descargarArchivoDeUsuario("/d", { nombreSugerido: "otro.pdf" });
      assert.deepEqual(r, { nombre: "informe final.pdf", bytes: 3 });
      assert.deepEqual(enlaces, [{ href: "blob:1", download: "informe final.pdf" }]);
    } finally {
      URL.createObjectURL = crear;
      delete globalThis.document;
    }
  });
});
