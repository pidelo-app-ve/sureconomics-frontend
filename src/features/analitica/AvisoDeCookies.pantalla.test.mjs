/**
 * El aviso de cookies (`AvisoDeCookies`) en pantalla (`scripts/pruebas/dom.mjs`): al
 * contestar, la barra se va en el acto, y la respuesta se guarda, se avisa (a la
 * publicidad, al boletín) y se quita la reserva de `scroll-padding` justo después del
 * pintado, no dentro del toque. `npm test`.
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { traducir } from "../../i18n/motor.js";

const { pintar, pantalla, fireEvent, act, waitFor, servidor } = await import("../../../scripts/pruebas/dom.mjs");
const { AvisoDeCookies } = await import("./AvisoDeCookies.jsx");
const { EVENTO_CONSENTIMIENTO, consentimiento, parar } = await import("./medicion.js");

const es = (clave) => traducir("es", clave);
const raiz = document.documentElement;

beforeEach(() => {
  // Sin respuesta guardada: la barra sale.
  document.cookie = "cookie_consent=; max-age=0; path=/";
});

for (const [boton, valor] of [["aceptar", "si"], ["rechazar", "no"]]) {
  test(`al ${boton}: la barra se va ya y lo demás va después del pintado`, async () => {
    // Con un sí arranca la medición, que manda su primera vista.
    servidor.contestar("POST", "/analitica/eventos", {});
    const avisos = [];
    const apuntar = () => avisos.push(consentimiento());
    window.addEventListener(EVENTO_CONSENTIMIENTO, apuntar);
    try {
      pintar(createElement(AvisoDeCookies));
      const barra = pantalla.getByRole("region", { name: es("paginas.cookies.aviso.region") });
      assert.ok(barra);
      assert.ok(raiz.classList.contains("se-con-aviso-cookies"), "mientras está, reserva su alto");

      await act(async () => {
        fireEvent.click(pantalla.getByRole("button", { name: es(`paginas.cookies.aviso.${boton}`) }));
      });
      // En el acto: la barra ya no está, y nada más se ha hecho todavía.
      assert.equal(pantalla.queryByRole("region", { name: es("paginas.cookies.aviso.region") }), null);
      assert.equal(consentimiento(), null, "la respuesta aún no se escribió");
      assert.deepEqual(avisos, []);
      assert.ok(raiz.classList.contains("se-con-aviso-cookies"), "la reserva se quita después");

      // Después del pintado: guardada, avisada una vez (con la cookie ya escrita) y sin reserva.
      await waitFor(() => assert.equal(consentimiento(), valor));
      await waitFor(() => assert.deepEqual(avisos, [valor]));
      await waitFor(() => assert.ok(!raiz.classList.contains("se-con-aviso-cookies")));
      assert.equal(raiz.style.getPropertyValue("--se-aviso-cookies-alto"), "");
    } finally {
      window.removeEventListener(EVENTO_CONSENTIMIENTO, apuntar);
      parar();
    }
  });
}

test("con una respuesta ya guardada, ni barra ni reserva", async () => {
  document.cookie = "cookie_consent=no; path=/";
  pintar(createElement(AvisoDeCookies));
  assert.equal(pantalla.queryByRole("region", { name: es("paginas.cookies.aviso.region") }), null);
  assert.ok(!raiz.classList.contains("se-con-aviso-cookies"));
});
