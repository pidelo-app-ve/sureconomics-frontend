/**
 * La cinta del mundo (`CintaMundial`, en `MarketTicker.jsx`): TradingView va en un **marco
 * propio** que apunta a su dominio, y su script ya no corre en nuestra página (C-04 y D-22
 * de la auditoría del 17-nov-2026). Y la CSP de `vercel.json` ya no lo deja cargar.
 * `npm test`.
 *
 * Por qué importa: un script ajeno en nuestro origen corre con los mismos poderes que el
 * nuestro y puede leer la sesión del equipo, que vive en `sessionStorage`. Un marco de otro
 * dominio no ve nada de la página que lo contiene.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";

const { pintar, fireEvent, waitFor } = await import("../../../scripts/pruebas/dom.mjs");
const { CintaMundial, direccionDelMarco } = await import("./MarketTicker.jsx");

const MARCO = "https://www.tradingview-widget.com/embed-widget/ticker-tape/";

/** Los ajustes que van detrás del `#` de la dirección, ya leídos. */
const ajustesDe = (direccion) => JSON.parse(decodeURIComponent(new URL(direccion).hash.slice(1)));

const scriptsDeTradingView = () =>
  [...document.querySelectorAll("script")].filter((s) => /tradingview/i.test(s.src + s.textContent));

test("la dirección del marco: su dominio, el idioma en la consulta y los ajustes tras el #", () => {
  const simbolos = [{ proName: "TVC:UKOIL", title: "Brent" }];
  const direccion = direccionDelMarco({ simbolos, tema: "dark", lang: "en", sitio: "www.sureconomics.com" });
  const url = new URL(direccion);
  assert.equal(`${url.origin}${url.pathname}`, MARCO);
  assert.equal(url.searchParams.get("locale"), "en");
  const ajustes = ajustesDe(direccion);
  assert.deepEqual(ajustes.symbols, simbolos);
  assert.equal(ajustes.colorTheme, "dark");
  assert.equal(ajustes.displayMode, "compact");
  assert.equal(ajustes.isTransparent, true);
  // Solo el dominio: no la dirección de la pieza que se está leyendo.
  assert.equal(ajustes["page-uri"], "www.sureconomics.com/");
  assert.equal(ajustes.utm_source, "www.sureconomics.com");
});

test("antes del primer gesto no hay marco; con él llega el marco, y nunca un script de TradingView", async () => {
  const { container } = pintar(createElement(CintaMundial, { tema: "dark" }));
  assert.equal(container.querySelector("iframe"), null, "sin gesto, todavía nada");
  // La atribución está desde el principio: la exigen sus condiciones.
  assert.ok(container.querySelector('a[href="https://www.tradingview.com/"]'));

  fireEvent.pointerMove(window);
  const marco = await waitFor(() => {
    const m = container.querySelector("iframe");
    assert.ok(m, "el marco llega tras el gesto");
    return m;
  });

  assert.ok(marco.getAttribute("src").startsWith(`${MARCO}?locale=es#`), marco.getAttribute("src"));
  assert.equal(ajustesDe(marco.getAttribute("src")).symbols.length, 13, "la lista de escritorio");
  assert.equal(marco.getAttribute("title"), "Índices mundiales (TradingView)");
  assert.equal(marco.getAttribute("tabindex"), "-1", "fuera del recorrido del tabulador");
  assert.ok(marco.hasAttribute("credentialless"), "cajón de cookies de usar y tirar");

  const cerrojos = marco.getAttribute("sandbox").split(" ");
  for (const c of ["allow-scripts", "allow-same-origin", "allow-popups", "allow-popups-to-escape-sandbox"]) {
    assert.ok(cerrojos.includes(c), c);
  }
  for (const c of ["allow-top-navigation", "allow-top-navigation-by-user-activation", "allow-forms", "allow-modals"]) {
    assert.ok(!cerrojos.includes(c), `${c} no: no se lleva la pestaña del lector`);
  }

  assert.deepEqual(scriptsDeTradingView(), [], "ningún script de TradingView en la página");
});

test("la CSP de vercel.json no deja cargar scripts de TradingView, pero sí su marco", () => {
  const vercel = JSON.parse(readFileSync(new URL("../../../vercel.json", import.meta.url), "utf8"));
  const csp = vercel.headers
    .flatMap((h) => h.headers)
    .filter((h) => h.key.toLowerCase() === "content-security-policy")
    .map((h) => h.value);
  assert.ok(csp.length > 0, "hay CSP");
  for (const politica of csp) {
    const directiva = (nombre) => politica.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${nombre} `)) ?? "";
    assert.doesNotMatch(directiva("script-src"), /tradingview/i, "script-src");
    assert.doesNotMatch(directiva("connect-src"), /tradingview/i, "connect-src: nuestra página no le habla");
    assert.match(directiva("frame-src"), /https:\/\/www\.tradingview-widget\.com(\s|$)/, "frame-src");
  }
});
