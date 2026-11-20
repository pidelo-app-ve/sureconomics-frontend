/**
 * La copia en este equipo de lo que no se ha guardado (`useBorradorLocal`), con sus
 * efectos corriendo de verdad (`scripts/pruebas/montar.mjs`). `npm test`.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

const { montarGancho, act, almacenLocal } = await import("../../scripts/pruebas/montar.mjs");
const { useBorradorLocal } = await import("./useBorradorLocal.js");

const CLAVE = "sureconomics_borrador_pieza-7";
const copia = () => JSON.parse(almacenLocal.get(CLAVE) ?? "null")?.valores ?? null;
const ponerCopia = (valores, guardadoEn = 1) => almacenLocal.set(CLAVE, JSON.stringify({ valores, guardadoEn }));

/**
 * El hook montado como en el editor: `form` y `base` en el «padre», `aplicar` es su
 * `setForm` (cambia `m.form`). `m.pintar({ form, base, apertura })` vuelve a pintar;
 * `m.h` es lo que devuelve el hook. `apertura: null` lo monta sin señal de apertura
 * (como las páginas de propuestas del lector).
 */
const montar = async ({ form, base, apertura = 1 }) => {
  const m = { form };
  const g = await montarGancho(
    ({ valores, base: deBase, apertura: abrir }) =>
      useBorradorLocal({
        clave: "pieza-7",
        valores,
        base: deBase,
        apertura: abrir ?? undefined,
        aplicar: (v) => {
          m.form = v;
        },
      }),
    { valores: form, base, apertura }
  );
  m.pintar = async ({ form: f = m.form, ...resto } = {}) => {
    m.form = f;
    await g.pintar({ valores: m.form, ...resto });
  };
  Object.defineProperty(m, "h", { get: () => g.valor });
  m.desmontar = g.desmontar;
  // Lo que `aplicar` cambió en el primer pintado, al padre.
  await m.pintar();
  return m;
};

const pieza = (extra = {}) => ({ title: "Titular", content: "<p>Texto</p>", ...extra });

beforeEach(() => almacenLocal.clear());

describe("al abrir", () => {
  test("si hay una copia distinta de lo guardado, se pone, se avisa y no se borra", async () => {
    ponerCopia(pieza({ title: "Lo que no se guardó" }));
    const m = await montar({ form: pieza(), base: pieza() });
    assert.equal(m.form.title, "Lo que no se guardó");
    assert.equal(m.h.recuperadoEn, 1);
    assert.equal(copia().title, "Lo que no se guardó");
    await m.desmontar();
  });

  test("una carga nueva de la pieza (otra `apertura`) vuelve a ofrecer la copia", async () => {
    ponerCopia(pieza({ title: "Pendiente" }), 2);
    const m = await montar({ form: pieza({ title: "Pendiente" }), base: pieza({ title: "Pendiente" }) });
    // Se recarga del servidor (como la segunda carga de React en desarrollo).
    await m.pintar({ form: pieza(), base: pieza(), apertura: 2 });
    assert.equal(m.form.title, "Pendiente");
    assert.equal(m.h.recuperadoEn, 2);
    await m.desmontar();
  });

  test("al recargar con algo escrito, la copia no se borra por llegar el formulario igual a lo guardado", async () => {
    const m = await montar({ form: pieza(), base: pieza() });
    await m.pintar({ form: pieza({ title: "Escrito" }) });
    await act(async () => window.dispatchEvent(new Event("pagehide")));
    // Llega la pieza otra vez: formulario y base iguales, y la copia se ofrece.
    await m.pintar({ form: pieza(), base: pieza(), apertura: 2 });
    assert.equal(copia()?.title, "Escrito");
    assert.equal(m.form.title, "Escrito");
    await m.desmontar();
  });
});

describe("tras guardar", () => {
  test("sin nada pendiente, `limpiar` la quita", async () => {
    ponerCopia(pieza({ title: "Nuevo" }));
    const m = await montar({ form: pieza({ title: "Nuevo" }), base: pieza({ title: "Nuevo" }) });
    await act(async () => m.h.limpiar());
    assert.equal(copia(), null);
    await m.desmontar();
  });

  // Era un fallo (revisión del 20-nov-2026): la copia «AB»; se guarda «ABC» y mientras
  // se escribe «ABCD»; se borra la D antes de 0,8 s y la copia se quedaba en «AB». Al
  // reabrir se recuperaba «AB» y se perdía la C, que ya estaba en el servidor.
  test("con algo escrito mientras tanto, `conservar` escribe la copia en ese momento", async () => {
    ponerCopia(pieza({ title: "AB" }));
    const m = await montar({ form: pieza({ title: "AB" }), base: pieza({ title: "AB" }) });
    const guardada = pieza({ title: "ABC" });
    await m.pintar({ form: pieza({ title: "ABCD" }) });
    await act(async () => m.h.conservar(pieza({ title: "ABCD" })));
    assert.equal(copia().title, "ABCD");
    await m.pintar({ base: guardada });
    assert.equal(m.form.title, "ABCD");
    await m.desmontar();
  });

  test("si lo escrito vuelve a ser lo guardado, la copia se quita y al reabrir no sale una vieja", async () => {
    ponerCopia(pieza({ title: "AB" }));
    const m = await montar({ form: pieza({ title: "AB" }), base: pieza({ title: "AB" }) });
    await m.pintar({ form: pieza({ title: "ABCD" }), base: pieza({ title: "ABC" }) });
    // Se borra la D: igual a lo guardado.
    await m.pintar({ form: pieza({ title: "ABC" }) });
    assert.equal(copia(), null);
    await m.pintar({ form: pieza({ title: "ABC" }), base: pieza({ title: "ABC" }), apertura: 2 });
    assert.equal(m.form.title, "ABC");
    assert.equal(m.h.recuperadoEn, null);
    await m.desmontar();
  });

  test("`conservar` quita el aviso de «Recuperamos…»", async () => {
    ponerCopia(pieza({ title: "Recuperada" }), 3);
    const m = await montar({ form: pieza(), base: pieza() });
    assert.equal(m.h.recuperadoEn, 3);
    await act(async () => m.h.conservar(pieza({ title: "Recuperada y más" })));
    assert.equal(m.h.recuperadoEn, null);
    await m.desmontar();
  });

  // Era un fallo de antes (revisión del 20-nov-2026): cada base nueva -- al guardar, al
  // poner la firma del colaborador -- volvía a poner encima la copia guardada, más vieja
  // que lo último escrito.
  test("una base nueva que no es abrir (guardar, la firma) no vuelve a poner la copia encima", async () => {
    const m = await montar({ form: pieza(), base: pieza() });
    await m.pintar({ form: pieza({ title: "Escrito" }) });
    ponerCopia(pieza({ title: "Copia vieja" }));
    await m.pintar({ base: pieza({ byline: "Firma nueva" }) });
    assert.equal(m.form.title, "Escrito");
    assert.equal(m.h.recuperadoEn, null);
    await m.desmontar();
  });

  test("sin señal de apertura (las propuestas del lector), cada base nueva cuenta como abrir, como antes", async () => {
    const m = await montar({ form: pieza(), base: pieza(), apertura: null });
    ponerCopia(pieza({ title: "Copia" }), 4);
    await m.pintar({ base: pieza({ excerpt: "recargada" }) });
    assert.equal(m.form.title, "Copia");
    assert.equal(m.h.recuperadoEn, 4);
    await m.desmontar();
  });
});

describe("al salir", () => {
  test("lo pendiente se copia con lo último escrito", async () => {
    const m = await montar({ form: pieza(), base: pieza() });
    await m.pintar({ form: pieza({ title: "Titular con más" }) });
    await act(async () => window.dispatchEvent(new Event("pagehide")));
    assert.equal(copia().title, "Titular con más");
    await m.desmontar();
  });
});
