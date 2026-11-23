/**
 * «Titulares en caliente» en el panel, en pantalla (`scripts/pruebas/dom.mjs`): la lista
 * por páginas, los filtros y el buscador. `npm test`.
 *
 * Vigila tres cosas de la paginación (a335f1b y a371919) que solo se ven con clics y con
 * el tiempo corriendo:
 * - cambiar un filtro desde la página 2 vuelve a pedir la 1 (si no, con menos titulares
 *   se pide una página que ya no existe);
 * - el buscador espera a que se deje de escribir: una petición, no una por tecla;
 * - una respuesta que llega tarde (la de antes de cambiar el filtro) no pisa a la nueva.
 *
 * Las respuestas son del backend de verdad, grabadas con su cliente de pruebas: 45
 * titulares publicados, de 20 en 20 (`src/pruebas/respuestas/titulares/`). El rol, el
 * que devuelve su inicio de sesión para un editor.
 */
import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { pintar, pantalla, fireEvent, waitFor, within, act, pasar, servidor, grabada } = await import(
  "../../../../scripts/pruebas/dom.mjs"
);
const { AdminTitulares } = await import("./AdminTitulares.jsx");

const LISTA = "/admin/headlines";
const ROL = grabada("panel/entrar-editor.json").data.role;

/** La lista que tocaría para lo pedido, como la grabó el backend. */
const listaPara = ({ pagina, pais, buscar }) => {
  if (pais === "CO") return grabada("titulares/colombia.json");
  if (buscar === "Titular 1") return grabada("titulares/buscar.json");
  return grabada(pagina === "2" ? "titulares/pagina-2.json" : "titulares/pagina-1.json");
};

/** El panel abierto, con la primera página ya pintada. `lista` cambia cómo contesta la lista. */
const abrir = async (lista = listaPara) => {
  servidor
    .contestar("GET", `${LISTA}/resumen`, grabada("titulares/resumen.json"))
    .contestar("GET", `${LISTA}/settings`, grabada("titulares/ajustes.json"))
    .contestar("GET", `${LISTA}/fuentes`, grabada("titulares/fuentes.json"))
    .contestar("GET", LISTA, (p) => lista(p.consulta));
  pintar(createElement(AdminTitulares), { ruta: "/admin/titulares", rol: ROL });
  await pantalla.findByText("Página 1 de 3 — 45 en total");
};

const pedidas = () => servidor.a(LISTA, "GET").map((p) => p.consulta);
const siguiente = () =>
  fireEvent.click(within(pantalla.getByRole("navigation", { name: "Paginación (arriba)" })).getByRole("button", { name: "Página siguiente" }));

test("cambiar un filtro desde la página 2 vuelve a pedir la página 1", async () => {
  await abrir();
  siguiente();
  await pantalla.findByText("Página 2 de 3 — 45 en total");
  assert.equal(pedidas().at(-1).pagina, "2");

  fireEvent.change(pantalla.getByLabelText("País"), { target: { value: "CO" } });
  await pantalla.findByText("Página 1 de 1 — 9 en total");
  // Todas las peticiones con el filtro nuevo, no solo la última: el servidor corrige una
  // página que no existe y el panel la vuelve a pedir, así que pedir la 2 «se arreglaba
  // solo» aquí, con una petición de más. Con más titulares se quedaba en la página 2.
  assert.deepEqual(
    pedidas().filter((c) => c.pais === "CO").map((c) => c.pagina),
    ["1"],
    "con el filtro nuevo se pide la página 1, una vez, y nunca la 2",
  );
  assert.deepEqual(servidor.sinRespuesta, []);
});

test("el buscador espera a que se deje de escribir, y pide una sola vez", async () => {
  await abrir();
  const antes = pedidas().length;
  const buscar = pantalla.getByRole("searchbox", { name: "Buscar" });
  // Con el reloj de mentira de node:test: cuatro teclas seguidas, y el tiempo lo avanza la
  // prueba. Con el de verdad, una máquina cargada (la CI) que se parara más de lo que
  // espera el buscador entre dos teclas daría una petición de más sin que nada estuviera mal.
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    for (const texto of ["T", "Tit", "Titular", "  Titular   1  "]) {
      fireEvent.change(buscar, { target: { value: texto } });
      act(() => mock.timers.tick(100));
    }
    act(() => mock.timers.tick(140));
    assert.equal(pedidas().length, antes, "mientras se escribe no se pide nada");
    act(() => mock.timers.tick(10));
  } finally {
    mock.timers.reset();
  }

  await pantalla.findByText("Página 1 de 1 — 11 en total");
  const nuevas = pedidas().slice(antes);
  assert.equal(nuevas.length, 1, `una sola petición, no una por tecla: ${JSON.stringify(nuevas)}`);
  // Los espacios de más no cuentan, y buscar vuelve a la página 1.
  assert.deepEqual({ buscar: nuevas[0].buscar, pagina: nuevas[0].pagina }, { buscar: "Titular 1", pagina: "1" });
});

test("una respuesta que llega tarde no pisa a la de un filtro más nuevo", async () => {
  let soltarPagina2;
  await abrir((consulta) =>
    consulta.pagina === "2" && !consulta.pais
      ? new Promise((listo) => (soltarPagina2 = () => listo(listaPara(consulta))))
      : listaPara(consulta),
  );
  siguiente();
  await waitFor(() => assert.ok(soltarPagina2, "se pidió la página 2"));

  // Antes de que llegue la página 2, se elige Colombia, que llega enseguida.
  fireEvent.change(pantalla.getByLabelText("País"), { target: { value: "CO" } });
  await pantalla.findByText("Página 1 de 1 — 9 en total");

  // Ahora llega la vieja: no puede cambiar lo que se ve.
  await act(async () => soltarPagina2());
  await pasar(20);
  assert.ok(pantalla.getByText("Página 1 de 1 — 9 en total"));
  assert.equal(pantalla.queryByText("Página 2 de 3 — 45 en total"), null);
  assert.equal(pantalla.getByLabelText("País").value, "CO");
});
