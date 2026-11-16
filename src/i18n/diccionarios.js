/**
 * Qué diccionario entra en el paquete y cuál se descarga después.
 *
 * Con el sitio viaja solo el español de lo que se carga siempre (`es/index.js`: cabecera,
 * pie, portada, pieza). El inglés de eso mismo se deja como un `import()` que Vite separa
 * en su propio archivo: solo lo pide quien entra en `/en`, y lo pide el `loader` de esa
 * ruta antes de pintar nada (ver `routes.jsx`).
 *
 * Las zonas -- los textos de una sección: la cuenta, educación, los juegos… -- van un
 * archivo por zona y por idioma, y las pide el `lazy` de cada ruta junto con el código de
 * la página (ver `routes.jsx`). `npm run i18n` comprueba que cada página pida las zonas
 * que usa y que lo que va siempre esté en `es/index.js`.
 */
import { registrarCargador, registrarDiccionario, registrarZonas } from "./motor";
import es from "./es/index.js";

registrarDiccionario("es", es);
registrarCargador("en", async () => (await import("./en/index.js")).default);

const zona = (cargarEs, cargarEn) => ({
  es: async () => (await cargarEs()).default,
  en: async () => (await cargarEn()).default,
});

registrarZonas({
  boletin: zona(() => import("./es/boletin.json"), () => import("./en/boletin.json")),
  cuenta: zona(() => import("./es/cuenta.json"), () => import("./en/cuenta.json")),
  educacion: zona(() => import("./es/educacion.json"), () => import("./en/educacion.json")),
  juegos: zona(() => import("./es/juegos.json"), () => import("./en/juegos.json")),
  listados: zona(() => import("./es/listados.json"), () => import("./en/listados.json")),
  lvbp: zona(() => import("./es/lvbp.json"), () => import("./en/lvbp.json")),
  monedas: zona(() => import("./es/monedas.json"), () => import("./en/monedas.json")),
  paginas: zona(() => import("./es/paginas.json"), () => import("./en/paginas.json")),
  resumen: zona(() => import("./es/resumen.json"), () => import("./en/resumen.json")),
  titulares: zona(() => import("./es/titulares.json"), () => import("./en/titulares.json")),
});
