/**
 * Pruebas de pantalla: pintar un componente en un DOM de verdad, hacer clic, escribir y ver
 * qué cambia, como lo vería quien usa la página. Dentro del mismo `node --test` (`npm test`).
 *
 *     const { pintar, pantalla, fireEvent, waitFor, servidor } = await import("../../scripts/pruebas/dom.mjs");
 *     const { Pagina } = await import("./Pagina.jsx");
 *     servidor.contestar("GET", "/admin/cosas", grabada("cosas/lista.json"));
 *     pintar(createElement(Pagina), { ruta: "/admin/cosas", rol: "publicador" });
 *     fireEvent.click(await pantalla.findByRole("button", { name: "Guardar" }));
 *     await waitFor(() => assert.ok(!pantalla.getByRole("button", { name: "Enviar ahora" }).disabled));
 *
 * Lo que hay debajo:
 * - **happy-dom** pone `window`, `document` y compañía en `globalThis` (con su
 *   `@happy-dom/global-registrator`). Va **antes** de cargar `react-dom`, que mira al
 *   cargarse si hay DOM: por eso este archivo se importa con `await import()`, y después
 *   el componente (y antes de los dos, `sustituir()` de `dobles.mjs` si hace falta un doble).
 *   No carga scripts, hojas ni marcos de ninguna página: solo es el DOM.
 * - **Testing Library** (`@testing-library/react`) pinta y busca como una persona: por el
 *   papel y el nombre que se leen («el botón Guardar»), no por clases. `pantalla` es su
 *   `screen`; `fireEvent` dispara clics y cambios. Tras cada prueba se desmonta todo.
 * - **Sin red:** `fetch` es el de `servidor.mjs`, que contesta con respuestas grabadas
 *   (`src/pruebas/respuestas/`); una petición sin respuesta hace fallar la prueba
 *   siempre (lo comprueba el `afterEach` de aquí abajo).
 *   `navigator.sendBeacon` (la analítica) solo apunta.
 *
 * `pintar(elemento, { ruta, rol })` lo monta dentro de lo que pone `main.jsx` para el panel
 * y el sitio: la sesión del panel (`AuthProvider`, con `rol` si se da: entra con ese rol),
 * los avisos del panel (`AdminToastProvider`) y un router en `ruta` (por omisión `/`). El
 * idioma es el español de serie (`useIdioma` sin proveedor).
 *
 * Qué no puede: medir ni ver estilos (happy-dom no pinta: `getBoundingClientRect` da
 * ceros), ni probar el editor de texto TipTap (va con un doble). Para eso, un navegador.
 */
import { after, afterEach } from "node:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({
  url: "https://sureconomics.prueba/",
  width: 1280,
  height: 800,
  settings: {
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    disableIframePageLoading: true,
    handleDisabledFileLoadingAsSuccess: true,
    navigation: { disableMainFrameNavigation: true, disableChildFrameNavigation: true, disableChildPageNavigation: true },
  },
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { servidorDePrueba } = await import("./servidor.mjs");
export const servidor = servidorDePrueba();
export { grabada } from "./servidor.mjs";

await import("../../src/i18n/diccionarios.js");
const { createElement } = await import("react");
const { RouterProvider, createMemoryRouter } = await import("react-router-dom");
/** Las mismas opciones `future` que el router del sitio (`routes.jsx`). */
const FUTURO = { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true };
const rtl = await import("@testing-library/react");
const { AuthProvider } = await import("../../src/context/AuthContext.jsx");
const { AdminToastProvider } = await import("../../src/context/AdminToastContext.jsx");
const { persistAuth, clearStoredAuth } = await import("../../src/lib/authStorage.js");

export const { act, fireEvent, waitFor, within, screen: pantalla } = rtl;

// `findBy…` y `waitFor` esperan 1 s por omisión. Con todas las pruebas a la vez (cada
// archivo en su proceso) y en la CI, la primera carga de una página puede pasar de eso: 5 s.
// Una prueba que pasa no espera más; solo tarda más en fallar.
rtl.configure({ asyncUtilTimeout: 5000 });

const { UserAuthProvider } = await import("../../src/features/cuenta/index.js");
const { ProveedorDeMarcadores } = await import("../../src/context/MarcadoresContext.jsx");
const { ProveedorDeTemasSeguidos } = await import("../../src/context/TemasSeguidosContext.jsx");
const { ProveedorDePublicidad } = await import("../../src/features/publicidad/index.js");

/** Lo que pone `main.jsx` alrededor de todo (de fuera adentro), y los avisos del panel. */
const PROVEEDORES = [AuthProvider, UserAuthProvider, ProveedorDeMarcadores, ProveedorDeTemasSeguidos, AdminToastProvider];

/**
 * Pintar `elemento` como lo monta el sitio (ver arriba). `patron` es el de la ruta en
 * `routes.jsx` (`noticias/:slug`) para que `useParams` lo lea; por omisión, cualquiera.
 * Un router de datos, como el del sitio: `useBlocker` no funciona con otro. Con `sitio`,
 * la página va además dentro de la publicidad, como en `Layout.jsx`. Devuelve lo de
 * `render` más `router` (para ver adónde se fue: `router.state.location.pathname`).
 */
export const pintar = (elemento, { ruta = "/", patron = "*", rol = null, sitio = false } = {}) => {
  clearStoredAuth();
  if (rol) persistAuth({ accessToken: "token-de-prueba", refreshToken: "renovar-de-prueba", expiresIn: 3600, role: rol });
  const pagina = sitio ? createElement(ProveedorDePublicidad, null, elemento) : elemento;
  const router = createMemoryRouter([{ path: patron, element: pagina }, { path: "*", element: null }], {
    initialEntries: [ruta],
    future: FUTURO,
  });
  const arbol = PROVEEDORES.reduceRight((dentro, Proveedor) => createElement(Proveedor, null, dentro), createElement(RouterProvider, { router, future: { v7_startTransition: true } }));
  return { ...rtl.render(arbol), router };
};

/** Un rato de reloj de verdad (la espera de un buscador): `await pasar(300)`. */
export const pasar = (ms) => act(() => new Promise((listo) => setTimeout(listo, ms)));

/**
 * Dejar que corran los efectos que quedan tras pintar o tras una respuesta. Va justo
 * después de encontrar un campo y **antes** de escribir en él: si no, un efecto que aún
 * no corrió (el del editor del boletín que copia el número en el borrador, p. ej.) puede
 * pisar lo escrito. Con la máquina cargada pasaba de vez en cuando.
 */
export const asentar = () => act(async () => {});

afterEach(() => {
  // Toda petición sin respuesta grabada hace fallar la prueba, la mire o no ella misma.
  const sinRespuesta = [...servidor.sinRespuesta];
  rtl.cleanup();
  servidor.reiniciar();
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  if (sinRespuesta.length) {
    throw new Error(`peticiones sin respuesta grabada: ${sinRespuesta.join(", ")}`);
  }
});

// Cerrar happy-dom: si no, sus relojes dejan el proceso de la prueba abierto.
after(() => GlobalRegistrator.unregister());
