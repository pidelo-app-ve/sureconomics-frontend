/**
 * Hablar con la API desde el panel (`adminRequest`, `lib/api.js`) cuando las cosas van
 * mal -- sesión caducada, sin red, el servidor caído, un formulario rechazado -- y lo
 * que el editor lee entonces (`adminErrorMessage`). `npm test`.
 *
 * Sin red de verdad: `fetch` es un guion que contesta lo que cada prueba dice y apunta
 * lo que se le pidió; `sessionStorage` y `window`, lo mínimo que usa `lib/api.js`.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { adminRequest } from "./api.js";
import { adminErrorMessage } from "./adminErrorMessage.js";
import { createAdminPost } from "../services/adminPostsService.js";

const ACCESO = "sureconomics_admin_access_token";
const RENOVAR = "sureconomics_admin_refresh_token";
const CADUCA = "sureconomics_admin_access_expires_at";
const ROL = "sureconomics_admin_role";

/** `sessionStorage` en memoria. */
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

/** Lo que contesta `fetch`, por orden. Un `Error` es «la petición no salió». */
const contestar = (...lista) => {
  respuestas = lista;
};
const json = (status, cuerpo) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  peticiones = [];
  avisosDeSesion = 0;
  globalThis.sessionStorage = almacen();
  globalThis.window = new EventTarget();
  window.addEventListener("sureconomics-admin-auth-sync", () => (avisosDeSesion += 1));
  globalThis.fetch = async (url, init = {}) => {
    peticiones.push({ url: String(url), ...init, cuerpo: init.body ? JSON.parse(init.body) : undefined });
    const r = respuestas.shift();
    if (!r) throw new Error(`fetch sin respuesta preparada: ${url}`);
    if (r instanceof Error) throw r;
    return r;
  };
});

const conSesion = ({ caducaEn = null } = {}) => {
  sessionStorage.setItem(ACCESO, "acceso-viejo");
  sessionStorage.setItem(RENOVAR, "renovar-1");
  sessionStorage.setItem(ROL, "publicador");
  if (caducaEn !== null) sessionStorage.setItem(CADUCA, String(caducaEn));
};

/** El error que lanza `fn`, o falla si no lanza. */
const errorDe = async (fn) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  assert.fail("debía fallar");
};

describe("con la sesión en orden", () => {
  test("manda el token, el JSON y la clave de idempotencia, y devuelve `data`", async () => {
    conSesion();
    contestar(json(201, { success: true, data: { id: 9 } }));
    const pieza = await createAdminPost({ title: "Hola" }, "clave-1");
    assert.deepEqual(pieza, { id: 9 });
    const [p] = peticiones;
    assert.equal(p.url, "https://api.prueba.invalid/admin/posts");
    assert.equal(p.method, "POST");
    assert.equal(p.headers.Authorization, "Bearer acceso-viejo");
    assert.equal(p.headers["Idempotency-Key"], "clave-1");
    assert.equal(p.headers["Content-Type"], "application/json");
    assert.deepEqual(p.cuerpo, { title: "Hola" });
  });

  test("el servicio reenvía la clave de idempotencia que recibe", async () => {
    conSesion();
    contestar(new TypeError("Failed to fetch"), json(201, { success: true, data: { id: 9 } }));
    await errorDe(() => createAdminPost({ title: "Hola" }, "clave-1"));
    await createAdminPost({ title: "Hola" }, "clave-1");
    assert.deepEqual(peticiones.map((p) => p.headers["Idempotency-Key"]), ["clave-1", "clave-1"]);
  });
});

describe("sesión caducada", () => {
  test("sin sesión, ni se intenta: 401 y el editor lee que tiene que entrar", async () => {
    const err = await errorDe(() => adminRequest("/admin/posts/1"));
    assert.equal(err.status, 401);
    assert.equal(peticiones.length, 0);
    // El 401 no está entre los que se tapan siempre: se lee el texto de `lib/api.js`.
    assert.equal(adminErrorMessage(err), "Debe iniciar sesión");
  });

  test("un 401 se arregla solo renovando la sesión, y se repite la petición", async () => {
    conSesion();
    contestar(
      json(401, { success: false, error: { message: "Token expired" } }),
      json(200, { success: true, data: { access_token: "acceso-nuevo", refresh_token: "renovar-2", expires_in: 900 } }),
      json(200, { success: true, data: { id: 1, title: "Guardada" } })
    );
    const r = await adminRequest("/admin/posts/1", { method: "PATCH", json: { title: "Guardada" } });
    assert.deepEqual(r, { id: 1, title: "Guardada" });
    assert.deepEqual(peticiones.map((p) => p.url.replace("https://api.prueba.invalid", "")), ["/admin/posts/1", "/auth/refresh", "/admin/posts/1"]);
    assert.equal(peticiones[2].headers.Authorization, "Bearer acceso-nuevo");
    // Lo que se guardaba se manda igual la segunda vez.
    assert.deepEqual(peticiones[2].cuerpo, { title: "Guardada" });
    assert.equal(sessionStorage.getItem(ACCESO), "acceso-nuevo");
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-2");
    // El rol no se pierde al renovar.
    assert.equal(sessionStorage.getItem(ROL), "publicador");
  });

  test("si tampoco se puede renovar: se cierra la sesión, se avisa y el editor lo lee", async () => {
    conSesion();
    contestar(json(401, { success: false, error: { message: "Token expired" } }), json(401, { success: false, error: { message: "Refresh expired" } }));
    const err = await errorDe(() => adminRequest("/admin/posts/1", { method: "PATCH", json: {} }));
    assert.equal(err.status, 401);
    assert.equal(sessionStorage.tamano, 0);
    assert.ok(avisosDeSesion >= 1, "el panel no se enteró de que se cerró la sesión");
    assert.equal(adminErrorMessage(err, "No se pudieron guardar los cambios."), "Sesión expirada");
  });

  test("a punto de caducar, se renueva antes de pedir", async () => {
    conSesion({ caducaEn: Date.now() + 1000 });
    contestar(
      json(200, { success: true, data: { access_token: "acceso-nuevo", expires_in: 900 } }),
      json(200, { success: true, data: [] })
    );
    await adminRequest("/admin/posts");
    assert.match(peticiones[0].url, /\/auth\/refresh$/);
    assert.equal(peticiones[1].headers.Authorization, "Bearer acceso-nuevo");
    // Sin `refresh_token` nuevo se queda el de antes.
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-1");
  });

  // FALLO CONOCIDO (19-nov-2026, sin arreglar: cambia el comportamiento). Si tras un
  // 401 la red se cae justo al renovar, `adminRequest` lo trata igual que una sesión
  // caducada: borra la sesión y echa al editor, aunque la sesión fuera buena (lo escrito
  // se salva en la copia local). Debería decir «sin red» y dejar la sesión.
  // Al arreglarlo, quitar el `todo` y dejarla como prueba normal: entonces vigila que el fallo no vuelva.
  test("sin red al renovar, la sesión no se cierra", { todo: "un fallo de red al renovar cierra la sesión" }, async () => {
    conSesion();
    contestar(json(401, { success: false, error: { message: "Token expired" } }), new TypeError("Failed to fetch"));
    await errorDe(() => adminRequest("/admin/posts/1"));
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-1");
  });
});

describe("sin red y con el servidor mal", () => {
  test("sin red: el error sube y el editor lee que revise su conexión", async () => {
    conSesion();
    contestar(new TypeError("Failed to fetch"));
    const err = await errorDe(() => adminRequest("/admin/posts/1", { method: "PATCH", json: {} }));
    assert.equal(adminErrorMessage(err, "No se pudieron guardar los cambios."), "No se pudo contactar el servidor. Revise su conexión e inténtelo de nuevo.");
    // Y la sesión sigue: no tiene la culpa.
    assert.equal(sessionStorage.getItem(ACCESO), "acceso-viejo");
  });

  test("un 502 con una página HTML en vez de JSON (Render reiniciando)", async () => {
    conSesion();
    contestar(new Response("<html>Bad Gateway</html>", { status: 502, statusText: "Bad Gateway" }));
    const err = await errorDe(() => adminRequest("/admin/posts/1"));
    assert.equal(err.status, 502);
    assert.equal(adminErrorMessage(err), "El servidor no respondió correctamente. Inténtelo de nuevo en unos momentos.");
  });

  test("un formulario rechazado (422): dice qué campos", async () => {
    conSesion();
    contestar(
      json(422, { success: false, error: { message: "Validation failed.", code: "validation_error", details: { title: ["Demasiado largo."], slug: ["Ya existe.", "Solo minúsculas."] } } })
    );
    const err = await errorDe(() => adminRequest("/admin/posts/1", { method: "PATCH", json: {} }));
    assert.equal(adminErrorMessage(err), "Hay campos inválidos — title: Demasiado largo. · slug: Ya existe. Solo minúsculas.");
  });

  test("`success: false` con un 200 también es un error", async () => {
    conSesion();
    contestar(json(200, { success: false, error: { message: "Los escritores guardan como borrador.", code: "forbidden" } }));
    const err = await errorDe(() => adminRequest("/admin/posts/1/publish", { method: "POST" }));
    assert.equal(adminErrorMessage(err), "Los escritores guardan como borrador.");
  });
});

describe("lo que lee el editor (adminErrorMessage)", () => {
  const con = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });

  test("sin error, el texto de respaldo", () => {
    assert.equal(adminErrorMessage(null, "No se pudo."), "No se pudo.");
    assert.equal(adminErrorMessage(undefined), "No se pudo completar la acción.");
  });

  test("el mensaje del servidor, si dice algo útil", () => {
    assert.equal(adminErrorMessage(con(400, "El slug no puede llevar espacios.")), "El slug no puede llevar espacios.");
  });

  test("los genéricos del servidor se cambian por el del código", () => {
    assert.equal(adminErrorMessage(con(403, "You do not have permission to perform this action.")), "No tiene permisos para realizar esta acción.");
    assert.equal(adminErrorMessage(con(404, "Resource not found.")), "El recurso ya no existe. Es posible que alguien más lo haya eliminado.");
    assert.equal(adminErrorMessage(con(401, "Authentication required.")), "Su sesión expiró. Vuelva a iniciar sesión para continuar.");
  });

  test("429 y 5xx: siempre el texto propio (la regla cruda del limitador no sirve)", () => {
    assert.equal(adminErrorMessage(con(429, "20 per 1 minute")), "Demasiadas solicitudes. Espere unos minutos e inténtelo de nuevo.");
    assert.equal(adminErrorMessage(con(500, "Traceback ...")), "El servidor tuvo un error inesperado. Inténtelo de nuevo en unos momentos.");
    assert.equal(adminErrorMessage(con(504, "")), "El servidor tardó demasiado en responder. Inténtelo de nuevo.");
  });

  test("el traductor y el redactor sí dicen su propio motivo, aunque sea un 502", () => {
    assert.equal(adminErrorMessage(con(502, "Sin crédito en la clave.", { code: "translation_failed" })), "Sin crédito en la clave.");
    assert.equal(adminErrorMessage(con(502, "No se pudo comprobar.", { code: "redaccion_invalida" })), "No se pudo comprobar.");
  });

  test("un 422 sin detalles pide revisar el formulario", () => {
    assert.equal(adminErrorMessage(con(422, "Validation failed.")), "Hay campos inválidos. Revise el formulario e inténtelo de nuevo.");
  });

  test("un código desconocido sin mensaje: el respaldo", () => {
    assert.equal(adminErrorMessage(con(418, ""), "No se pudo guardar."), "No se pudo guardar.");
  });
});
