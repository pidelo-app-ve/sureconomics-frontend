/**
 * `desplazamiento.js`: apuntar y guardar las alturas de cada entrada del historial, y
 * restaurar una sosteniéndola mientras la página crece, hasta que el lector se mueve o
 * vence el tope. Con una ventana de mentira cuyo alto decide la prueba. `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAXIMO,
  TOPE_RESTAURAR_MS,
  apuntar,
  cargaQueRestaura,
  claveDe,
  desplazamientoBloqueado,
  guardarPosiciones,
  leerPosiciones,
  restaurando,
  restaurar,
} from "./desplazamiento.js";

/** Un almacén como `sessionStorage`. */
const almacen = (inicial = {}) => {
  const datos = new Map(Object.entries(inicial));
  return { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), datos };
};

/**
 * Una página que no puede bajar más allá de su alto (como el navegador), con un vigía de
 * tamaño que la prueba dispara al «crecer» y oyentes que se pueden disparar a mano.
 */
const ventanaDePrueba = ({ alto = 800, pantalla = 800 } = {}) => {
  const oyentes = new Map();
  const vigias = [];
  const v = {
    scrollY: 0,
    alto,
    llamadas: 0,
    scrollTo: (x, y) => {
      v.llamadas += 1;
      v.scrollY = Math.max(0, Math.min(y, v.alto - pantalla));
    },
    addEventListener: (tipo, fn) => oyentes.set(tipo, fn),
    removeEventListener: (tipo, fn) => oyentes.get(tipo) === fn && oyentes.delete(tipo),
    disparar: (tipo) => oyentes.get(tipo)?.({ type: tipo }),
    oyentes,
    document: {
      getElementById: (id) => (id === "root" ? { id, firstElementChild: { id: "marco" } } : null),
      body: { id: "body" },
      documentElement: { style: { overflowAnchor: "" } },
    },
    ResizeObserver: class {
      constructor(avisar) {
        this.avisar = avisar;
        this.observado = null;
        this.desconectado = false;
        vigias.push(this);
      }
      observe(el) {
        this.observado = el;
      }
      disconnect() {
        this.desconectado = true;
      }
    },
    /** La página crece (llegan los datos): el navegador avisa a los vigías. */
    crecer: (nuevo) => {
      v.alto = nuevo;
      vigias.filter((x) => !x.desconectado).forEach((x) => x.avisar([]));
    },
    vigias,
  };
  return v;
};

test("restaurar: si la página ya cabe, va directa a la altura", () => {
  const v = ventanaDePrueba({ alto: 5000 });
  const soltar = restaurar(1800, { ventana: v });
  assert.equal(v.scrollY, 1800);
  assert.equal(v.vigias[0].observado.id, "marco", "vigila el marco de la página, no #root (que mide una pantalla)");
  soltar();
});

test("restaurar: con los datos llegando después, la lleva a su sitio cuando la lista está pintada", () => {
  const v = ventanaDePrueba({ alto: 900 });
  const soltar = restaurar(2400, { ventana: v });
  assert.equal(v.scrollY, 100, "aún no cabe: hasta donde se puede");
  v.crecer(1500);
  assert.equal(v.scrollY, 700);
  v.crecer(6000);
  assert.equal(v.scrollY, 2400, "con la lista pintada, donde estaba");
  // Si algo más crece debajo, sigue en su sitio sin volver a moverla.
  const antes = v.llamadas;
  v.crecer(7000);
  assert.equal(v.scrollY, 2400);
  assert.equal(v.llamadas, antes);
  soltar();
});

test("restaurar: sin anclaje del navegador mientras sostiene la altura, y con él después", () => {
  const v = ventanaDePrueba({ alto: 900 });
  const soltar = restaurar(2400, { ventana: v });
  assert.equal(v.document.documentElement.style.overflowAnchor, "none");
  soltar();
  assert.equal(v.document.documentElement.style.overflowAnchor, "");
});

test("restaurar: en cuanto el lector se mueve, manda él", () => {
  for (const gesto of ["wheel", "touchstart", "pointerdown", "keydown"]) {
    const v = ventanaDePrueba({ alto: 900 });
    restaurar(2400, { ventana: v });
    v.disparar(gesto);
    assert.equal(v.oyentes.size, 0, gesto);
    assert.ok(v.vigias[0].desconectado, gesto);
    v.crecer(6000);
    assert.equal(v.scrollY, 100, `${gesto}: ya no la mueve`);
  }
});

test("restaurar: al tope deja de sostenerla, y avisa una vez", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const v = ventanaDePrueba({ alto: 900 });
  let avisos = 0;
  const soltar = restaurar(2400, { ventana: v, alSoltar: () => avisos++ });
  t.mock.timers.tick(TOPE_RESTAURAR_MS - 1);
  assert.equal(avisos, 0);
  t.mock.timers.tick(1);
  soltar();
  assert.equal(avisos, 1);
  assert.ok(v.vigias[0].desconectado);
  v.crecer(6000);
  assert.equal(v.scrollY, 100);
});

/** Una ventana que se puede bloquear (como la invitación al boletín: `overflow: hidden` en `<html>`). */
const bloqueable = (alto) => {
  const v = ventanaDePrueba({ alto });
  v.document.body.style = { overflow: "" };
  const vigiasDeEstilo = [];
  v.MutationObserver = class {
    constructor(avisar) {
      this.avisar = avisar;
      this.desconectado = false;
      vigiasDeEstilo.push(this);
    }
    observe() {}
    disconnect() {
      this.desconectado = true;
    }
  };
  /** Abre o cierra la ventana de encima: el navegador avisa del cambio de estilo. */
  v.bloquear = (si) => {
    v.document.documentElement.style.overflow = si ? "hidden" : "";
    vigiasDeEstilo.filter((x) => !x.desconectado).forEach((x) => x.avisar([]));
  };
  return v;
};

test("restaurar: con una ventana encima (página bloqueada) espera, y al cerrarse la lleva a su sitio", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const v = bloqueable(900);
  restaurar(2400, { ventana: v });
  assert.equal(v.scrollY, 100);
  // Se abre la invitación: la página ya no baja; la portada termina de crecer debajo.
  v.bloquear(true);
  const llamadas = v.llamadas;
  v.crecer(6000);
  assert.equal(v.llamadas, llamadas, "con la página bloqueada no se mueve nada");
  // Los toques dentro de la ventana y el tope no la sueltan.
  v.disparar("pointerdown");
  v.disparar("keydown");
  t.mock.timers.tick(TOPE_RESTAURAR_MS * 3);
  assert.equal(restaurando(), true);
  // Se cierra: vuelve a su sitio, y sigue sostenida hasta el siguiente gesto.
  v.bloquear(false);
  assert.equal(v.scrollY, 2400);
  v.disparar("touchstart");
  assert.equal(restaurando(), false);
});

test("restaurando: solo mientras se sostiene una altura", () => {
  const v = ventanaDePrueba({ alto: 900 });
  assert.equal(restaurando(), false);
  const soltar = restaurar(2400, { ventana: v });
  assert.equal(restaurando(), true);
  soltar();
  soltar();
  assert.equal(restaurando(), false, "soltar dos veces no descuenta dos");
});

test("desplazamientoBloqueado: overflow hidden en html o body; el overflow-x de body no cuenta", () => {
  const con = (html, body) => ({
    document: { documentElement: { style: {}, ...html }, body: { style: {}, ...body } },
    getComputedStyle: (el) => ({ overflowY: el.calculado ?? "visible" }),
  });
  assert.equal(desplazamientoBloqueado(con({ style: { overflow: "hidden" } }, {})), true);
  assert.equal(desplazamientoBloqueado(con({}, { calculado: "hidden" })), true);
  // `overflow-x: hidden` en body: el navegador calcula `overflow-y: auto`.
  assert.equal(desplazamientoBloqueado(con({}, { calculado: "auto" })), false);
  assert.equal(desplazamientoBloqueado(undefined), false);
});

test("restaurar: sin ResizeObserver, al menos el primer intento", () => {
  const v = ventanaDePrueba({ alto: 5000 });
  delete v.ResizeObserver;
  restaurar(1200, { ventana: v })();
  assert.equal(v.scrollY, 1200);
});

test("apuntar: la última de cada entrada, como la más reciente, y solo las últimas MAXIMO", () => {
  const p = new Map();
  apuntar(p, "a", 100.4);
  apuntar(p, "b", -5);
  apuntar(p, "a", 300);
  assert.deepEqual([...p], [["b", 0], ["a", 300]]);
  for (let i = 0; i < MAXIMO + 10; i++) apuntar(p, `k${i}`, i);
  assert.equal(p.size, MAXIMO);
  assert.ok(!p.has("a") && p.has(`k${MAXIMO + 9}`));
});

test("guardar y leer: sobreviven a una recarga; lo ilegible no rompe nada", () => {
  const a = almacen();
  const p = new Map([["default", 1200], ["x1", 40]]);
  guardarPosiciones(p, a);
  assert.deepEqual([...leerPosiciones(a)], [["default", 1200], ["x1", 40]]);
  assert.equal(leerPosiciones(almacen({ "se-desplazamiento": "{roto" })).size, 0);
  assert.equal(leerPosiciones(almacen({ "se-desplazamiento": '[["a", "no"], ["b", 7]]' })).size, 1);
  assert.equal(leerPosiciones(null).size, 0);
  // Un almacén que no deja guardar (modo privado, lleno): sin error.
  guardarPosiciones(p, { setItem: () => { throw new Error("lleno"); } });
});

test("claveDe: la del router tal cual; las del navegador (`default`), con su dirección", () => {
  assert.equal(claveDe({ key: "ab12cd", pathname: "/", search: "", hash: "#boletin" }), "ab12cd");
  const portada = claveDe({ key: "default", pathname: "/", search: "", hash: "" });
  const conAncla = claveDe({ key: "default", pathname: "/", search: "", hash: "#boletin" });
  assert.notEqual(portada, conAncla);
  assert.equal(portada, "default:/");
  assert.equal(claveDe({ key: "default", pathname: "/en", search: "?buscar=1", hash: "" }), "default:/en?buscar=1");
});

test("cargaQueRestaura: solo una recarga o un atrás/adelante desde fuera", () => {
  const con = (type) => ({ performance: { getEntriesByType: () => [{ type }] } });
  assert.equal(cargaQueRestaura(con("reload")), true);
  assert.equal(cargaQueRestaura(con("back_forward")), true);
  assert.equal(cargaQueRestaura(con("navigate")), false);
  assert.equal(cargaQueRestaura({}), false);
  assert.equal(cargaQueRestaura(undefined), false);
});
