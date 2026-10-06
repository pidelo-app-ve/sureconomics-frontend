/**
 * Qué diccionario entra en el paquete y cuál se descarga después.
 *
 * El español se importa aquí y viaja con el sitio. El inglés se deja como un `import()`
 * que Vite separa en su propio archivo: solo lo pide quien entra en `/en`, y lo pide el
 * `loader` de esa ruta antes de pintar nada (ver `routes.jsx`).
 */
import { registrarCargador, registrarDiccionario } from "./motor";
import es from "./es/index.js";

registrarDiccionario("es", es);
registrarCargador("en", async () => (await import("./en/index.js")).default);
