/**
 * «Cerrar sesión en todos los aparatos» (`lib/cerrarTodasLasSesiones.js`). `npm test`.
 *
 * Lo que importa: que solo se cierre la sesión de aquí cuando el servidor las cerró (o
 * cuando ya no valía), y que un fallo de red no la cierre ni se quede callado.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { cerrarTodasLasSesiones, esFalloDeRed, mensajeDeFallo } from "./cerrarTodasLasSesiones.js";

const TEXTOS = { red: "sin red", demasiadas: "muchas veces", otro: "otro fallo" };

/** Los tres pasos, apuntando el orden en que se llaman. */
const pasos = (pedir) => {
  const hechos = [];
  return {
    hechos,
    pedir: async () => {
      hechos.push("pedir");
      return pedir();
    },
    cerrarLocal: async () => {
      hechos.push("cerrarLocal");
    },
    irAEntrar: () => {
      hechos.push("irAEntrar");
    },
  };
};

const conEstado = (status, mensaje = "x") => Object.assign(new Error(mensaje), { status });

describe("cerrar todas las sesiones", () => {
  test("si el servidor dice que sí, cierra la sesión de aquí y lleva a entrar, en ese orden", async () => {
    const p = pasos(() => ({ logged_out_all: true }));
    await cerrarTodasLasSesiones(p);
    assert.deepEqual(p.hechos, ["pedir", "cerrarLocal", "irAEntrar"]);
  });

  test("un 401 (la sesión ya no valía) cuenta como hecho", async () => {
    const p = pasos(() => {
      throw conEstado(401);
    });
    await cerrarTodasLasSesiones(p);
    assert.deepEqual(p.hechos, ["pedir", "cerrarLocal", "irAEntrar"]);
  });

  test("sin red, la sesión de aquí se queda y el error sube", async () => {
    const p = pasos(() => {
      throw new TypeError("Failed to fetch");
    });
    await assert.rejects(cerrarTodasLasSesiones(p), TypeError);
    assert.deepEqual(p.hechos, ["pedir"]);
  });

  test("con el tope de peticiones o un 500, tampoco se cierra nada aquí", async () => {
    for (const status of [429, 500, 503]) {
      const p = pasos(() => {
        throw conEstado(status);
      });
      await assert.rejects(cerrarTodasLasSesiones(p), (err) => err.status === status);
      assert.deepEqual(p.hechos, ["pedir"]);
    }
  });

  test("si borrar la sesión de aquí falla, no lleva a entrar como si nada", async () => {
    const p = pasos(() => ({}));
    p.cerrarLocal = async () => {
      throw new Error("almacén bloqueado");
    };
    await assert.rejects(cerrarTodasLasSesiones(p), /almacén bloqueado/);
    assert.deepEqual(p.hechos, ["pedir"]);
  });
});

describe("qué se dice si falla", () => {
  test("sin red (sin status, o 0)", () => {
    assert.equal(esFalloDeRed(new TypeError("Failed to fetch")), true);
    assert.equal(esFalloDeRed(conEstado(0)), true);
    assert.equal(mensajeDeFallo(new TypeError("Failed to fetch"), TEXTOS), "sin red");
  });

  test("demasiadas veces seguidas (429)", () => {
    assert.equal(esFalloDeRed(conEstado(429)), false);
    assert.equal(mensajeDeFallo(conEstado(429), TEXTOS), "muchas veces");
  });

  test("cualquier otro fallo del servidor", () => {
    assert.equal(mensajeDeFallo(conEstado(500, "An unexpected error occurred."), TEXTOS), "otro fallo");
  });
});
