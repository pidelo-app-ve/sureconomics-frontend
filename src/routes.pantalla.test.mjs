/**
 * Las redirecciones de `routes.jsx` que dependen del idioma, con la ruta de verdad
 * (`rutasPublicas`) montada en un router de memoria (`scripts/pruebas/dom.mjs`): sin el
 * marco (`Layout`), que pediría a la API. `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { act, pantalla } = await import("../scripts/pruebas/dom.mjs");
const { render } = await import("@testing-library/react");
const { RouterProvider, createMemoryRouter } = await import("react-router-dom");
const { rutasPublicas } = await import("./routes.jsx");
const { ProveedorIdioma } = await import("./i18n/ProveedorIdioma.jsx");

/** La ruta `categoria/:slug` tal como la monta `routes.jsx` en `lang`. */
const rutaDeCategoria = (lang) =>
  rutasPublicas(lang)
    .flatMap((r) => r.children ?? [])
    .find((r) => r.path === "categoria/:slug");

const abrir = async (lang, direccion) => {
  const base = lang === "en" ? "/en" : "/";
  const router = createMemoryRouter(
    [
      {
        path: base,
        element: createElement(ProveedorIdioma, { lang }),
        children: [rutaDeCategoria(lang), { path: "explorar", element: createElement("h1", null, "Explorar") }],
      },
    ],
    { initialEntries: [direccion] }
  );
  await act(async () => {
    render(createElement(RouterProvider, { router }));
  });
  return router;
};

test("/en/categoria/x lleva a /en/explorar, no al español", async () => {
  const router = await abrir("en", "/en/categoria/macroeconomia");
  assert.equal(router.state.location.pathname, "/en/explorar");
  assert.ok(pantalla.getByRole("heading", { name: "Explorar" }));
  assert.equal(router.state.historyAction, "REPLACE", "sin dejar la vieja en el historial");
});

test("/categoria/x sigue llevando a /explorar", async () => {
  const router = await abrir("es", "/categoria/macroeconomia");
  assert.equal(router.state.location.pathname, "/explorar");
});
