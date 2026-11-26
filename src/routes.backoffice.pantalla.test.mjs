/**
 * `/backoffice`, la vieja puerta del equipo, lleva a la entrada **en su idioma**: con un
 * `<Navigate>` a secas, `/en/backoffice` caía en `/cuenta/entrar`, en español. Se monta la
 * ruta de verdad, tal como la tiene el router del sitio (`router.routes` de `routes.jsx`),
 * en un router de memoria (`scripts/pruebas/dom.mjs`), sin el marco (`Layout`), que
 * pediría a la API. `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { act, pantalla } = await import("../scripts/pruebas/dom.mjs");
const { render } = await import("@testing-library/react");
const { RouterProvider, createMemoryRouter } = await import("react-router-dom");
const { router: delSitio } = await import("./routes.jsx");
const { ProveedorIdioma } = await import("./i18n/ProveedorIdioma.jsx");

/** Todas las rutas que cuelgan de `ruta`, a cualquier profundidad (van dentro de `Layout`). */
const debajo = (ruta) => (ruta.children ?? []).flatMap((hija) => [hija, ...debajo(hija)]);

/** La ruta `backoffice` tal como la monta el sitio bajo `/` o `/en`. */
const rutaDeBackoffice = (base) => {
  const rama = delSitio.routes.find((r) => r.path === base);
  const ruta = debajo(rama).find((r) => r.path === "backoffice");
  assert.ok(ruta, `no está backoffice bajo ${base}`);
  return { path: ruta.path, element: ruta.element };
};

const abrir = async (lang, direccion) => {
  const base = lang === "en" ? "/en" : "/";
  const router = createMemoryRouter(
    [
      {
        path: base,
        element: createElement(ProveedorIdioma, { lang }),
        children: [rutaDeBackoffice(base), { path: "cuenta/entrar", element: createElement("h1", null, "Entrar") }],
      },
    ],
    { initialEntries: [direccion] }
  );
  await act(async () => {
    render(createElement(RouterProvider, { router }));
  });
  return router;
};

test("/en/backoffice lleva a /en/cuenta/entrar, no a la entrada en español", async () => {
  const router = await abrir("en", "/en/backoffice");
  assert.equal(router.state.location.pathname, "/en/cuenta/entrar");
  assert.ok(pantalla.getByRole("heading", { name: "Entrar" }));
  assert.equal(router.state.historyAction, "REPLACE", "sin dejar la vieja en el historial");
});

test("/backoffice sigue llevando a /cuenta/entrar", async () => {
  const router = await abrir("es", "/backoffice");
  assert.equal(router.state.location.pathname, "/cuenta/entrar");
});
