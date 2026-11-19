/**
 * La copia en este equipo de lo que no se ha guardado (`useBorradorLocal`), con sus
 * efectos corriendo de verdad. `npm test`.
 *
 * `renderToString` no corre efectos, y este hook es casi todo efectos: aquí se monta con
 * `createRoot` en un contenedor de mentira. El componente de prueba no pinta nada
 * (devuelve `null`), así que a React le basta con lo mínimo de `window` y del
 * contenedor; `localStorage` es un mapa en memoria.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const datos = new Map();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = Object.assign(new EventTarget(), {
  setTimeout,
  clearTimeout,
  HTMLIFrameElement: class {},
  localStorage: {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v)),
    removeItem: (k) => datos.delete(k),
  },
});

const { createRoot } = await import("react-dom/client");
const { act } = await import("react-dom/test-utils");
const { useBorradorLocal } = await import("./useBorradorLocal.js");

const CLAVE = "sureconomics_borrador_pieza-7";
const copia = () => JSON.parse(datos.get(CLAVE) ?? "null")?.valores ?? null;

/**
 * El hook montado como en el editor: `form` y `base` en el «padre», `aplicar` es su
 * `setForm`. `pintar({ form, base })` cambia lo que recibe; `h` es lo que devuelve.
 */
const montar = async ({ form, base }) => {
  const m = { form, base, h: null };
  const Prueba = ({ form: valores, base: deBase }) => {
    m.h = useBorradorLocal({
      clave: "pieza-7",
      valores,
      base: deBase,
      aplicar: (v) => {
        m.form = v;
      },
    });
    return null;
  };
  const contenedor = { nodeType: 1, nodeName: "DIV", tagName: "DIV", ownerDocument: { addEventListener() {}, removeEventListener() {} }, addEventListener() {}, removeEventListener() {} };
  const raiz = createRoot(contenedor);
  m.pintar = async (cambios = {}) => {
    Object.assign(m, cambios);
    await act(async () => raiz.render(createElement(Prueba, { form: m.form, base: m.base })));
  };
  m.desmontar = () => act(() => raiz.unmount());
  await m.pintar();
  return m;
};

const pieza = (extra = {}) => ({ title: "Titular", content: "<p>Texto</p>", ...extra });

beforeEach(() => datos.clear());

describe("la copia en este equipo", () => {
  test("al abrir, si hay una copia distinta de lo guardado, se pone y se avisa", async () => {
    datos.set(CLAVE, JSON.stringify({ valores: pieza({ title: "Lo que no se guardó" }), guardadoEn: 1 }));
    const m = await montar({ form: pieza(), base: pieza() });
    assert.equal(m.form.title, "Lo que no se guardó");
    assert.equal(m.h.recuperadoEn, 1);
    await m.desmontar();
  });

  test("tras guardar sin nada pendiente, `limpiar` la quita", async () => {
    datos.set(CLAVE, JSON.stringify({ valores: pieza({ title: "Nuevo" }), guardadoEn: 1 }));
    const m = await montar({ form: pieza({ title: "Nuevo" }), base: pieza({ title: "Nuevo" }) });
    await act(async () => m.h.limpiar());
    await m.pintar({ base: pieza({ title: "Nuevo" }) });
    assert.equal(copia(), null);
    await m.desmontar();
  });

  // Era un fallo (19-nov-2026): al volver la respuesta se borraba la copia aunque se
  // hubiera seguido escribiendo. Y sin borrarla era peor: la base nueva volvía a poner
  // encima la copia de hace un momento, más vieja que lo último tecleado, con el aviso
  // de «Recuperamos…».
  test("tras guardar con algo escrito mientras tanto, `conservar` deja la copia y no la vuelve a poner encima", async () => {
    // La copia se guardó antes de lo último que se tecleó (va 0,8 s por detrás).
    datos.set(CLAVE, JSON.stringify({ valores: pieza({ title: "Titular con" }), guardadoEn: 1 }));
    const m = await montar({ form: pieza({ title: "Titular con" }), base: pieza({ title: "Titular con" }) });
    m.form = pieza({ title: "Titular con más" });
    // Vuelve la respuesta: la base es lo guardado, el formulario sigue con lo último.
    const guardada = pieza({ title: "Titular" });
    await act(async () => m.h.conservar(guardada));
    await m.pintar({ base: guardada });
    assert.equal(m.form.title, "Titular con más");
    assert.equal(m.h.recuperadoEn, null);
    assert.ok(copia(), "la copia local se borró");
    await m.desmontar();
  });

  test("lo que se salta es solo esa base: al recargar la pieza, la copia vuelve a ofrecerse", async () => {
    datos.set(CLAVE, JSON.stringify({ valores: pieza({ title: "Pendiente" }), guardadoEn: 2 }));
    const m = await montar({ form: pieza({ title: "Pendiente" }), base: pieza({ title: "Pendiente" }) });
    const guardada = pieza({ title: "Titular" });
    await act(async () => m.h.conservar(guardada));
    await m.pintar({ base: guardada });
    m.form = pieza({ title: "Titular" });
    await m.pintar({ base: pieza({ title: "Titular" }) });
    assert.equal(m.form.title, "Pendiente");
    assert.equal(m.h.recuperadoEn, 2);
    await m.desmontar();
  });

  test("lo pendiente se vuelve a copiar con lo último escrito (al salir de la página)", async () => {
    const m = await montar({ form: pieza(), base: pieza() });
    const guardada = pieza();
    await act(async () => m.h.conservar(guardada));
    await m.pintar({ form: pieza({ title: "Titular con más" }), base: guardada });
    await act(async () => window.dispatchEvent(new Event("pagehide")));
    assert.equal(copia().title, "Titular con más");
    await m.desmontar();
  });
});
