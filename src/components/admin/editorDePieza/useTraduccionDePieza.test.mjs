/**
 * «Traducir con Claude» en el editor (`useTraduccionDePieza`), con sus efectos corriendo
 * de verdad (`scripts/pruebas/montar.mjs`) y las respuestas del backend grabadas
 * (`src/pruebas/respuestas/traducciones/`). Lo que ve quien edita: que está traduciendo
 * mientras espera, el inglés en el formulario al final, el aviso de cada error, y que al
 * cerrar la pieza (o abrir otra) se deja de preguntar y no se pisa nada. `npm test`.
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const almacen = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

const { montarGancho, act } = await import("../../../../scripts/pruebas/montar.mjs");
const { servidorDePrueba, grabada } = await import("../../../../scripts/pruebas/servidor.mjs");
const { useTraduccionDePieza } = await import("./useTraduccionDePieza.js");

const servidor = servidorDePrueba();
const POR_SU_ID = /^\/admin\/traducciones\/[^/]+$/;
const RAPIDO = { cadaMs: 5, topeMs: 2000 };
const INGLES = grabada("traducciones/lista.json").data;
const FORMULARIO = {
  title: "El BCV sube la tasa de encaje",
  excerpt: "<p>La medida rige desde el lunes.</p>",
  content: "<p>El Banco Central de Venezuela subió la tasa de encaje legal.</p>",
  title_en: "",
  excerpt_en: "",
  content_en: "",
  traduccion_automatica: false,
};

const esperar = (ms) => act(() => new Promise((s) => setTimeout(s, ms)));
const preguntas = () => servidor.peticiones.filter((p) => p.metodo === "GET" && POR_SU_ID.test(p.ruta)).length;
/** Espera (con su `act`) hasta que `listo()`; falla a los 2 s. */
const hasta = async (listo, que) => {
  for (let i = 0; i < 400 && !listo(); i += 1) await esperar(5);
  assert.ok(listo(), `no llegó: ${que}`);
};

/**
 * Pulsa «Traducir» y vuelve enseguida, sin esperar a que acabe: un `act` que esperara la
 * traducción entera no dejaría ver la espera (React pinta al final de cada `act`).
 */
const empezar = (m) =>
  act(() => {
    m.h.traducir();
  });

/**
 * El gancho montado como en el editor: `m.form` es el formulario del «padre» (lo cambia
 * `setForm`), `m.avisos` lo que salió en los avisos, `m.h` lo que devuelve el gancho.
 */
const montar = async ({ piezaId = 7 } = {}) => {
  const m = { form: { ...FORMULARIO }, avisos: [] };
  const g = await montarGancho((props) =>
    useTraduccionDePieza({
      form: m.form,
      setForm: (cambio) => {
        m.form = typeof cambio === "function" ? cambio(m.form) : cambio;
      },
      confirm: async () => true,
      toastSuccess: (texto) => m.avisos.push(["bien", texto]),
      toastError: (texto) => m.avisos.push(["mal", texto]),
      espera: RAPIDO,
      ...props,
    }),
  { piezaId });
  Object.defineProperty(m, "h", { get: () => g.valor });
  m.pintar = g.pintar;
  m.desmontar = g.desmontar;
  await hasta(() => m.h.traductorDisponible, "el botón de traducir");
  return m;
};

beforeEach(() => {
  servidor.reiniciar();
  globalThis.sessionStorage = almacen();
  sessionStorage.setItem("sureconomics_admin_access_token", "acceso-1");
  sessionStorage.setItem("sureconomics_admin_refresh_token", "renovar-1");
  servidor.contestar("GET", "/admin/posts/traducir", { success: true, data: { disponible: true, modelo: "claude" } });
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/en-marcha.json"));
  servidor.contestar("GET", POR_SU_ID, grabada("traducciones/sigue.json"));
});

test("202 y luego 200: «traduciendo» mientras espera, y el inglés al final", async () => {
  const m = await montar();
  let n = 0;
  servidor.contestar("GET", POR_SU_ID, () =>
    n++ < 2 ? grabada("traducciones/sigue.json") : grabada("traducciones/lista.json"));
  await empezar(m);
  await hasta(() => preguntas() >= 1, "la primera pregunta");
  assert.equal(m.h.traduciendo, true, "mientras espera, se ve que traduce");
  assert.equal(m.form.title_en, "", "aún no hay inglés");
  await hasta(() => !m.h.traduciendo, "el final");
  assert.equal(m.form.title_en, INGLES.title);
  assert.equal(m.form.excerpt_en, INGLES.excerpt);
  assert.equal(m.form.content_en, INGLES.content);
  assert.equal(m.form.traduccion_automatica, true);
  assert.equal(m.h.versionEn, 1, "los editores en inglés se vuelven a montar con lo nuevo");
  assert.deepEqual(m.avisos, [["bien", "Traducción lista. Revísala y guarda la pieza."]]);
  await m.desmontar();
});

test("200 directo: el inglés sin preguntar por nada", async () => {
  const m = await montar();
  servidor.contestar("POST", "/admin/traducciones", grabada("traducciones/hecha.json"));
  await act(() => m.h.traducir());
  assert.equal(m.form.title_en, grabada("traducciones/hecha.json").data.title);
  assert.equal(preguntas(), 0);
  assert.equal(m.h.traduciendo, false);
  await m.desmontar();
});

for (const [caso, archivo, ruta, texto] of [
  ["409", "ya-hay-una", "POST", "Ya hay una traducción en marcha. Espere a que termine."],
  ["404", "se-interrumpio", "GET", "La traducción ya no está en el servidor: se reinició o se pidió otra (quizá en otra pestaña). Vuelva a pedirla."],
  ["202 y luego error", "fallo", "GET", "No se pudo traducir: Claude contestó con un error (529)."],
]) {
  test(`${caso}: el aviso dice qué pasó, y el formulario queda como estaba`, async () => {
    const m = await montar();
    servidor.contestar(ruta, ruta === "POST" ? "/admin/traducciones" : POR_SU_ID, grabada(`traducciones/${archivo}.json`));
    await act(() => m.h.traducir());
    assert.deepEqual(m.avisos, [["mal", texto]]);
    assert.equal(m.h.traduciendo, false, "el botón vuelve a estar listo");
    assert.deepEqual(m.form, FORMULARIO);
    await m.desmontar();
  });
}

test("tiempo agotado: lo dice y el botón vuelve a estar listo", async () => {
  const m = await montar();
  await m.pintar({ espera: { cadaMs: 5, topeMs: 40 } });
  await act(() => m.h.traducir());
  assert.deepEqual(m.avisos, [["mal", "La traducción tarda más de 1 minuto. Espere un momento y vuelva a pedirla."]]);
  assert.equal(m.h.traduciendo, false);
  assert.deepEqual(m.form, FORMULARIO);
  await m.desmontar();
});

test("desmontar a medias (se cerró la pieza): deja de preguntar, sin avisos ni cambios", async () => {
  const m = await montar();
  await empezar(m);
  await hasta(() => preguntas() >= 2, "dos preguntas");
  await m.desmontar();
  const hechas = preguntas();
  await esperar(50);
  assert.equal(preguntas(), hechas, "ya no pregunta");
  assert.deepEqual(m.avisos, []);
  assert.deepEqual(m.form, FORMULARIO);
});

test("desmontar con una pregunta en camino: lo que llega después no se pone", async () => {
  const m = await montar();
  let soltar;
  servidor.contestar("GET", POR_SU_ID, () => new Promise((s) => {
    soltar = () => s(grabada("traducciones/lista.json"));
  }));
  await empezar(m);
  await hasta(() => typeof soltar === "function", "la pregunta en camino");
  await m.desmontar();
  soltar();
  await esperar(20);
  assert.deepEqual(m.avisos, []);
  assert.deepEqual(m.form, FORMULARIO);
});

test("abrir otra pieza a medias: se deja la traducción y no cae en la nueva", async () => {
  const m = await montar({ piezaId: 7 });
  await empezar(m);
  await hasta(() => preguntas() >= 1, "la primera pregunta");
  await m.pintar({ piezaId: 8 });
  assert.equal(m.h.traduciendo, false, "el botón de la otra pieza, listo");
  const hechas = preguntas();
  servidor.contestar("GET", POR_SU_ID, grabada("traducciones/lista.json"));
  await esperar(50);
  assert.equal(preguntas(), hechas, "ya no pregunta");
  assert.deepEqual(m.avisos, []);
  assert.deepEqual(m.form, FORMULARIO);
  await m.desmontar();
});

/** Lo que hace el editor al cargar la pieza del servidor: pisa el formulario y sube `apertura`. */
const cargarDelServidor = async (m, apertura) => {
  m.form = { ...FORMULARIO, title: "El BCV sube la tasa de encaje (guardada)" };
  await m.pintar({ apertura });
};

test("de «nueva» a la pieza que se acaba de crear: sigue, y el inglés espera a que cargue", async () => {
  const m = await montar({ piezaId: null });
  await empezar(m);
  await hasta(() => preguntas() >= 1, "la primera pregunta");
  // El guardado avisa antes de ir a la pieza nueva (`guardarPieza` → `alCrear`).
  m.h.seCreo(7);
  await m.pintar({ piezaId: 7 });
  assert.equal(m.h.traduciendo, true);
  const antes = preguntas();
  servidor.contestar("GET", POR_SU_ID, grabada("traducciones/lista.json"));
  await hasta(() => preguntas() > antes, "la pregunta que trae la traducción");
  await esperar(30);
  // Llegó antes de que el editor cargara la pieza: no se pone aún (la carga lo pisaría).
  assert.equal(m.form.title_en, "");
  assert.equal(m.h.traduciendo, true, "sigue diciendo que traduce");
  assert.deepEqual(m.avisos, []);
  await cargarDelServidor(m, 1);
  assert.equal(m.form.title, "El BCV sube la tasa de encaje (guardada)", "lo cargado se queda");
  assert.equal(m.form.title_en, INGLES.title, "y encima, el inglés");
  assert.equal(m.form.traduccion_automatica, true);
  assert.equal(m.h.traduciendo, false);
  assert.deepEqual(m.avisos, [["bien", "Traducción lista. Revísala y guarda la pieza."]]);
  await m.desmontar();
});

test("de «nueva» a la pieza creada, si llega después de cargar: se pone enseguida", async () => {
  const m = await montar({ piezaId: null });
  await empezar(m);
  await hasta(() => preguntas() >= 1, "la primera pregunta");
  m.h.seCreo(7);
  await m.pintar({ piezaId: 7 });
  await cargarDelServidor(m, 1);
  servidor.contestar("GET", POR_SU_ID, grabada("traducciones/lista.json"));
  await hasta(() => !m.h.traduciendo, "el final");
  assert.equal(m.form.title, "El BCV sube la tasa de encaje (guardada)");
  assert.equal(m.form.title_en, INGLES.title);
  await m.desmontar();
});

test("de «nueva» a OTRA pieza (el buscador, un aviso): se deja y no cae en ella", async () => {
  const m = await montar({ piezaId: null });
  await empezar(m);
  await hasta(() => preguntas() >= 1, "la primera pregunta");
  // Sin `seCreo`: la 8 no es la que se estaba creando.
  await m.pintar({ piezaId: 8 });
  assert.equal(m.h.traduciendo, false);
  const hechas = preguntas();
  servidor.contestar("GET", POR_SU_ID, grabada("traducciones/lista.json"));
  await esperar(50);
  await cargarDelServidor(m, 1);
  assert.equal(preguntas(), hechas, "ya no pregunta");
  assert.equal(m.form.title_en, "");
  assert.deepEqual(m.avisos, []);
  await m.desmontar();
});

test("creada la 7 pero se salta a la 8: tampoco cae en ella", async () => {
  const m = await montar({ piezaId: null });
  await empezar(m);
  await hasta(() => preguntas() >= 1, "la primera pregunta");
  m.h.seCreo(7);
  await m.pintar({ piezaId: 8 });
  assert.equal(m.h.traduciendo, false);
  servidor.contestar("GET", POR_SU_ID, grabada("traducciones/lista.json"));
  await esperar(50);
  assert.equal(m.form.title_en, "");
  assert.deepEqual(m.avisos, []);
  await m.desmontar();
});
