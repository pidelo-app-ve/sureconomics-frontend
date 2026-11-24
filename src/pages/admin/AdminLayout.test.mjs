/**
 * Lo que deja ver el panel según quién entra, en pantalla (`scripts/pruebas/dom.mjs`):
 * el menú (`lib/menuDelPanel.js`) y la guarda de `/admin`. `npm test`.
 *
 * El rol no se inventa aquí: es el que devuelve el inicio de sesión del backend para un
 * editor y para el dueño (`src/pruebas/respuestas/panel/entrar-*.json`, grabadas). Si el
 * servidor cambiara cómo nombra un rol, o el menú leyera otro nombre (como pasó con el
 * permiso del lector, 665f0a8), el editor dejaría de ver lo suyo y esto lo diría.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";

const { pintar, pantalla, waitFor, servidor, grabada } = await import("../../../scripts/pruebas/dom.mjs");
const { AdminLayout } = await import("./AdminLayout.jsx");
const { RequireAdmin } = await import("../../components/admin/RequireAdmin.jsx");

const rolDe = (quien) => grabada(`panel/entrar-${quien}.json`).data.role;

/** El panel abierto con ese rol; devuelve los nombres de los enlaces del menú. */
const menuDe = async (quien) => {
  servidor.contestar("GET", "/admin/me", grabada(`panel/yo-${quien}.json`));
  pintar(createElement(AdminLayout), { ruta: "/admin/posts", rol: rolDe(quien) });
  const menu = await pantalla.findByRole("complementary", { name: "Navegación de administración" });
  await waitFor(() => assert.equal(servidor.a("/admin/me").length, 1));
  return [...menu.querySelectorAll("a")].map((a) => a.textContent.trim());
};

test("el editor ve la redacción, lo automático y lo comercial, pero no las cuentas del panel", async () => {
  const enlaces = await menuDe("editor");
  for (const nombre of ["Contenido", "Crear pieza", "Titulares en caliente", "Propuestas de lectores", "Publicidad", "Usuarios"]) {
    assert.ok(enlaces.includes(nombre), `falta «${nombre}» para el editor: ${enlaces.join(", ")}`);
  }
  assert.ok(!enlaces.includes("Personal"), "«Personal» (las cuentas del panel) es solo del dueño");
  // La bienvenida ya se vio (lo dice /admin/me): no salta sola.
  assert.equal(pantalla.queryByRole("dialog"), null);
  assert.deepEqual(servidor.sinRespuesta, []);
});

test("el dueño (admin) ve además «Personal»", async () => {
  const enlaces = await menuDe("admin");
  assert.ok(enlaces.includes("Personal"));
  assert.ok(enlaces.includes("Titulares en caliente"));
});

test("sin sesión, /admin manda a entrar", async () => {
  const { router } = pintar(createElement(RequireAdmin), { ruta: "/admin/posts", patron: "/admin/*" });
  await waitFor(() => assert.equal(router.state.location.pathname, "/cuenta/entrar"));
  assert.equal(servidor.peticiones.length, 0, "y sin pedir nada al servidor");
});
