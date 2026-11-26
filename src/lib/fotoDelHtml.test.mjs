/**
 * La espera de `main.jsx` antes de montar React (`fotoDelHtml.js`), con una ventana de
 * mentira: un `PerformanceObserver` que avisa cuando la prueba quiere, oyentes que se
 * pueden disparar a mano y relojes de verdad (con topes cortos). `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { SELECTOR_FOTO_DEL_HTML, TOPE_MS, esperarALaFotoDelHtml } from "./fotoDelHtml.js";

/** Un elemento con oyentes, como la `<img>` del HTML. */
const conOyentes = (propio = {}) => {
  const oyentes = new Map();
  return Object.assign(propio, {
    oyentes,
    addEventListener: (tipo, fn) => oyentes.set(tipo, fn),
    removeEventListener: (tipo, fn) => oyentes.get(tipo) === fn && oyentes.delete(tipo),
    disparar: (tipo) => oyentes.get(tipo)?.({ type: tipo }),
  });
};

const ventanaDePrueba = ({ tipos = ["paint", "largest-contentful-paint"], oculta = false, observarFalla = false } = {}) => {
  const ventana = conOyentes({
    document: { visibilityState: oculta ? "hidden" : "visible" },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    observadores: [],
  });
  ventana.PerformanceObserver = class {
    static supportedEntryTypes = tipos;
    constructor(avisar) {
      this.avisar = avisar;
      this.desconectado = false;
      ventana.observadores.push(this);
    }
    observe(opciones) {
      if (observarFalla) throw new TypeError("no");
      this.opciones = opciones;
    }
    disconnect() {
      this.desconectado = true;
    }
    /** Lo que haría el navegador al anotar un candidato a LCP. */
    anotar(element) {
      if (!this.desconectado) this.avisar({ getEntries: () => [{ entryType: "largest-contentful-paint", element }] });
    }
  };
  return ventana;
};

const fotoDePrueba = (propio = {}) => conOyentes({ complete: false, naturalWidth: 0, ...propio });

test("monta cuando el navegador anota la foto del HTML como LCP, y no antes", async () => {
  const ventana = ventanaDePrueba();
  const img = fotoDePrueba();
  let motivo = null;
  const espera = esperarALaFotoDelHtml({ img, ventana, tope: 5000 }).then((m) => (motivo = m));
  const [observador] = ventana.observadores;
  assert.deepEqual(observador.opciones, { type: "largest-contentful-paint", buffered: true });
  // Primero el titular (otro elemento): todavía no.
  observador.anotar({ tagName: "H3" });
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(motivo, null);
  observador.anotar(img);
  assert.equal(await espera, "lcp");
  // Al terminar no deja nada escuchando.
  assert.ok(observador.desconectado);
  assert.equal(ventana.oyentes.size, 0);
  assert.equal(img.oyentes.size, 0);
});

test("sin aviso, monta al tope", async () => {
  const ventana = ventanaDePrueba();
  const antes = Date.now();
  assert.equal(await esperarALaFotoDelHtml({ img: fotoDePrueba(), ventana, tope: 30 }), "tope");
  assert.ok(Date.now() - antes >= 25);
  assert.ok(ventana.observadores[0].desconectado);
});

test("el tope de serie es de 600 ms", () => {
  assert.equal(TOPE_MS, 600);
});

test("un toque o una tecla antes del tope montan enseguida", async () => {
  for (const tipo of ["pointerdown", "keydown"]) {
    const ventana = ventanaDePrueba();
    const espera = esperarALaFotoDelHtml({ img: fotoDePrueba(), ventana, tope: 5000 });
    ventana.disparar(tipo);
    assert.equal(await espera, "gesto", tipo);
    assert.equal(ventana.oyentes.size, 0, tipo);
    // Un aviso que llega después ya no cambia nada.
    ventana.observadores[0].anotar(null);
  }
});

test("sin la API del LCP (Safari, Firefox antiguo) o sin foto en el HTML, sin espera", async () => {
  const sinApi = { document: { visibilityState: "visible" } };
  assert.equal(await esperarALaFotoDelHtml({ img: fotoDePrueba(), ventana: sinApi }), "sin-espera");
  const sinLcp = ventanaDePrueba({ tipos: ["paint", "longtask"] });
  assert.equal(await esperarALaFotoDelHtml({ img: fotoDePrueba(), ventana: sinLcp }), "sin-espera");
  const sinLista = ventanaDePrueba({ tipos: null });
  assert.equal(await esperarALaFotoDelHtml({ img: fotoDePrueba(), ventana: sinLista }), "sin-espera");
  assert.equal(await esperarALaFotoDelHtml({ img: null, ventana: ventanaDePrueba() }), "sin-espera");
  assert.equal(await esperarALaFotoDelHtml({ img: fotoDePrueba(), ventana: undefined }), "sin-espera");
});

test("con la pestaña oculta no hay LCP que proteger: sin espera", async () => {
  const ventana = ventanaDePrueba({ oculta: true });
  assert.equal(await esperarALaFotoDelHtml({ img: fotoDePrueba(), ventana }), "sin-espera");
  assert.equal(ventana.observadores.length, 0);
});

test("una foto que falla no se espera", async () => {
  // Ya falló antes de mirar: cargada y sin tamaño.
  const rota = fotoDePrueba({ complete: true, naturalWidth: 0 });
  assert.equal(await esperarALaFotoDelHtml({ img: rota, ventana: ventanaDePrueba() }), "sin-foto");
  // Falla mientras se espera.
  const ventana = ventanaDePrueba();
  const img = fotoDePrueba();
  const espera = esperarALaFotoDelHtml({ img, ventana, tope: 5000 });
  img.disparar("error");
  assert.equal(await espera, "sin-foto");
  // Una ya cargada y buena sí se espera (el aviso puede estar en el búfer).
  const buena = fotoDePrueba({ complete: true, naturalWidth: 1200 });
  const otra = ventanaDePrueba();
  const esperaBuena = esperarALaFotoDelHtml({ img: buena, ventana: otra, tope: 5000 });
  otra.observadores[0].anotar(buena);
  assert.equal(await esperaBuena, "lcp");
});

test("si el navegador no deja observar, monta sin esperar", async () => {
  const ventana = ventanaDePrueba({ observarFalla: true });
  assert.equal(await esperarALaFotoDelHtml({ img: fotoDePrueba(), ventana, tope: 5000 }), "sin-espera");
  assert.equal(ventana.oyentes.size, 0);
});

test("el selector da con la foto que pintan api/portada.js y api/pieza.js, y con ninguna más", async () => {
  const { Window } = await import("happy-dom");
  const { aperturaEnHtml, portadaEnHtml } = await import("../../api/portada.js");
  const { piezaEnHtml } = await import("../../api/pieza.js");
  const foto = { url: "/media/image/2026/11/foto.jpg", width: 1536, height: 1024 };
  const fila = { id: 1, slug: "x", title: "Titular", excerpt: "<p>Entradilla.</p>", format: "noticia", published_at: "2026-11-18T10:00:00Z", image_asset: foto };
  const raiz = (html) => {
    const ventana = new Window();
    ventana.document.body.innerHTML = `<div id="root">${html}</div>`;
    return ventana.document;
  };
  // La portada: la lista recortada (sin fotos) y la apertura a la vista.
  const portada = raiz(portadaEnHtml({ plana: null, secciones: [], idioma: "es" }) + aperturaEnHtml(fila));
  const enPortada = portada.querySelectorAll(SELECTOR_FOTO_DEL_HTML);
  assert.equal(enPortada.length, 1);
  assert.ok(enPortada[0].closest(".se-portada-anticipo"));
  assert.equal(enPortada[0].getAttribute("fetchpriority"), "high");
  // La pieza: su foto de cabecera.
  const pieza = raiz(piezaEnHtml({ ...fila, content: '<p>Cuerpo <img src="/media/x.jpg"></p>' }, { idioma: "es" }));
  const enPieza = pieza.querySelectorAll(SELECTOR_FOTO_DEL_HTML);
  assert.equal(enPieza.length, 1, "solo la de cabecera, no las del cuerpo");
  assert.ok(enPieza[0].classList.contains("se-piece__img"));
});
