/**
 * `pedirArchivoDelSitio` (`src/api/archivoDelSitio.js`): un archivo de este mismo sitio,
 * no de la API. Lo usa el panel para bajar una imagen ya subida y convertirla
 * (`components/admin/aligerarImagen.js`). `npm test`.
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { pedirArchivoDelSitio } from "./archivoDelSitio.js";

const SITIO = "https://www.sureconomics.com";

let peticiones;
let respuesta;

beforeEach(() => {
  peticiones = [];
  respuesta = () => new Response(new Blob(["GIF89a"], { type: "image/gif" }), { status: 200 });
  globalThis.fetch = async (url, init = {}) => {
    peticiones.push({ url: String(url), init });
    if (init.signal?.aborted) {
      const error = new Error("This operation was aborted");
      error.name = "AbortError";
      throw error;
    }
    return respuesta();
  };
});

const errorDe = async (promesa) => {
  try {
    await promesa;
  } catch (err) {
    return err;
  }
  return assert.fail("debía fallar");
};

test("pide /media/… a este sitio, con sus cookies y la señal, y devuelve el Blob", async () => {
  const senal = new AbortController().signal;
  const blob = await pedirArchivoDelSitio("/media/image/2026/10/arte.gif", { senal, origen: SITIO });
  assert.ok(blob instanceof Blob);
  assert.equal(blob.type, "image/gif");
  assert.equal(await blob.text(), "GIF89a");
  assert.equal(peticiones.length, 1);
  assert.equal(peticiones[0].url, `${SITIO}/media/image/2026/10/arte.gif`);
  assert.equal(peticiones[0].init.credentials, "same-origin");
  assert.equal(peticiones[0].init.signal, senal);
  assert.equal(peticiones[0].init.headers, undefined, "sin la sesión de la API");
});

test("la dirección entera vale si es de este sitio", async () => {
  await pedirArchivoDelSitio(`${SITIO}/media/a.png?v=2`, { origen: SITIO });
  assert.equal(peticiones[0].url, `${SITIO}/media/a.png?v=2`);
});

test("lo de otro sitio, o sin saber el origen, no se pide", async () => {
  for (const ruta of ["https://res.cloudinary.com/x/a.png", "//otro.com/a.png", "https://api.sureconomics.com/media/a.png"]) {
    const error = await errorDe(pedirArchivoDelSitio(ruta, { origen: SITIO }));
    assert.match(error.message, /no es un archivo de este sitio/i, ruta);
    assert.equal(error.status, undefined);
  }
  const sinOrigen = await errorDe(pedirArchivoDelSitio("/media/a.png", { origen: undefined }));
  assert.match(sinOrigen.message, /no es un archivo de este sitio/i);
  assert.equal(peticiones.length, 0);
});

test("si el servidor dice que no, el error lleva su status", async () => {
  respuesta = () => new Response("no está", { status: 404 });
  const error = await errorDe(pedirArchivoDelSitio("/media/no-esta.png", { origen: SITIO }));
  assert.equal(error.status, 404);
});

test("cancelado, sale el AbortError de fetch tal cual", async () => {
  const control = new AbortController();
  control.abort();
  const error = await errorDe(pedirArchivoDelSitio("/media/a.png", { senal: control.signal, origen: SITIO }));
  assert.equal(error.name, "AbortError");
});
