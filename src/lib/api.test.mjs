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

  test("si la renovación responde 403, también se cierra la sesión", async () => {
    conSesion();
    contestar(json(401, { success: false, error: { message: "Token expired" } }), json(403, { success: false, error: { message: "Cuenta desactivada" } }));
    const err = await errorDe(() => adminRequest("/admin/posts/1"));
    assert.equal(err.status, 401);
    assert.equal(sessionStorage.tamano, 0);
    assert.ok(avisosDeSesion >= 1);
  });

  test("renovada, pero el token nuevo tampoco vale (401 otra vez): se cierra la sesión", async () => {
    conSesion();
    contestar(
      json(401, { success: false, error: { message: "Token expired" } }),
      json(200, { success: true, data: { access_token: "acceso-nuevo", refresh_token: "renovar-2", expires_in: 900 } }),
      json(401, { success: false, error: { message: "Token expired" } })
    );
    const err = await errorDe(() => adminRequest("/admin/posts/1"));
    assert.equal(err.status, 401);
    assert.equal(sessionStorage.tamano, 0);
  });

  // Era un fallo (19-nov-2026): un solo `try` envolvía la renovación **y** el reintento,
  // y cualquier error -- sin red, el limitador, el servidor reiniciando -- borraba la
  // sesión y echaba al editor aunque la sesión fuera buena. Solo un 401/403 de
  // `/auth/refresh` dice que la sesión ya no vale.
  test("sin red al renovar, la sesión no se cierra", async () => {
    conSesion();
    contestar(json(401, { success: false, error: { message: "Token expired" } }), new TypeError("Failed to fetch"));
    const err = await errorDe(() => adminRequest("/admin/posts/1"));
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-1");
    assert.equal(sessionStorage.getItem(ACCESO), "acceso-viejo");
    assert.equal(avisosDeSesion, 0, "el panel creyó que se cerró la sesión");
    // Y el editor lee lo que pasó de verdad.
    assert.equal(adminErrorMessage(err, "No se pudieron guardar los cambios."), "No se pudo contactar el servidor. Revise su conexión e inténtelo de nuevo.");
  });

  test("un 429 al renovar (el limitador): la sesión se queda y se dice que espere", async () => {
    conSesion();
    contestar(json(401, { success: false, error: { message: "Token expired" } }), json(429, { success: false, error: { message: "30 per 1 minute" } }));
    const err = await errorDe(() => adminRequest("/admin/posts/1"));
    assert.equal(err.status, 429);
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-1");
    assert.equal(avisosDeSesion, 0);
    assert.equal(adminErrorMessage(err), "Demasiadas solicitudes. Espere unos minutos e inténtelo de nuevo.");
  });

  test("un 502 al renovar (Render reiniciando): la sesión se queda", async () => {
    conSesion();
    contestar(json(401, { success: false, error: { message: "Token expired" } }), new Response("<html>Bad Gateway</html>", { status: 502, statusText: "Bad Gateway" }));
    const err = await errorDe(() => adminRequest("/admin/posts/1"));
    assert.equal(err.status, 502);
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-1");
    assert.equal(sessionStorage.getItem(ROL), "publicador");
    assert.equal(avisosDeSesion, 0);
  });

  test("renovada bien y la red se cae en el reintento: se queda el token recién emitido", async () => {
    conSesion();
    contestar(
      json(401, { success: false, error: { message: "Token expired" } }),
      json(200, { success: true, data: { access_token: "acceso-nuevo", refresh_token: "renovar-2", expires_in: 900 } }),
      new TypeError("Failed to fetch")
    );
    const err = await errorDe(() => adminRequest("/admin/posts/1", { method: "PATCH", json: { title: "Guardada" } }));
    assert.ok(err instanceof TypeError);
    assert.equal(sessionStorage.getItem(ACCESO), "acceso-nuevo");
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-2");
    // Solo el aviso de «renové»; ninguno de «cerré».
    assert.equal(avisosDeSesion, 1);
    // Y al volver la red, guardar otra vez entra con el token nuevo, sin renovar.
    contestar(json(200, { success: true, data: { id: 1 } }));
    await adminRequest("/admin/posts/1", { method: "PATCH", json: { title: "Guardada" } });
    assert.equal(peticiones.at(-1).headers.Authorization, "Bearer acceso-nuevo");
  });

  test("a punto de caducar y sin poder renovar antes: se pide igual con el token que hay", async () => {
    conSesion({ caducaEn: Date.now() + 1000 });
    contestar(json(429, { success: false, error: { message: "30 per 1 minute" } }), json(200, { success: true, data: [] }));
    await adminRequest("/admin/posts");
    assert.equal(peticiones[1].headers.Authorization, "Bearer acceso-viejo");
    assert.equal(sessionStorage.getItem(RENOVAR), "renovar-1");
  });

  // El backend (`auth_service.refresh_tokens`) emite un par nuevo en cada renovación pero
  // NO invalida el refresh viejo (los tokens no llevan lista; solo `tv`, que sube al
  // cerrar sesiones). Así que dos peticiones con 401 a la vez renuevan las dos con el
  // mismo token, y las dos cuajan: no hay carrera que cierre la sesión. Si algún día el
  // backend invalida el refresh al rotarlo, esta prueba es la que hay que cambiar (y
  // `adminRequest` tendría que compartir una sola renovación).
  test("dos 401 a la vez: las dos renuevan y siguen, sin cerrar la sesión", async () => {
    conSesion();
    let renovaciones = 0;
    globalThis.fetch = async (url, init = {}) => {
      peticiones.push({ url: String(url), ...init });
      if (String(url).endsWith("/auth/refresh")) {
        renovaciones += 1;
        assert.equal(JSON.parse(init.body).refresh_token, "renovar-1");
        return json(200, { success: true, data: { access_token: `acceso-${renovaciones}`, refresh_token: `renovar-r${renovaciones}`, expires_in: 900 } });
      }
      return init.headers.Authorization === "Bearer acceso-viejo"
        ? json(401, { success: false, error: { message: "Token expired" } })
        : json(200, { success: true, data: { ok: true } });
    };
    const [a, b] = await Promise.all([adminRequest("/admin/posts/1"), adminRequest("/admin/posts/2")]);
    assert.deepEqual([a, b], [{ ok: true }, { ok: true }]);
    assert.equal(renovaciones, 2);
    assert.ok(sessionStorage.getItem(ACCESO).startsWith("acceso-"));
    assert.ok(sessionStorage.getItem(RENOVAR).startsWith("renovar-r"));
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
