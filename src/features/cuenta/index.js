/**
 * La cuenta del lector: entrar (una sola pantalla para la redacción y los lectores),
 * registrarse, confirmar el correo, recuperar la contraseña, y su espacio en `/cuenta`
 * (inicio, perfil, lo comprado, marcadores, temas y propuestas).
 *
 * **Esta es la puerta del sitio.** Lo que el resto del sitio usa de la cuenta se importa
 * de aquí (`import { useUserAuth } from "../features/cuenta"`), nunca de los archivos de
 * dentro: así lo de dentro puede cambiar de sitio sin tocar a nadie. Lo vigila
 * `src/arquitectura.test.mjs`. Sale solo la sesión del lector: el proveedor (lo monta
 * `main.jsx`) y el gancho que lee quién es y si entró (`useUserAuth`).
 *
 * Lo que hay dentro:
 * - `UserAuthContext.jsx`: la sesión del lector en React (perfil, entrar, salir y estar
 *   al día entre pestañas).
 * - `api.js`: lo que la cuenta le pide al servidor (registro, código, perfil, Google…).
 * - `unifiedAuth.js`: la entrada única (`/auth/login`, que resuelve si es de la redacción
 *   o un lector) y la recuperación de la contraseña.
 * - `pages/`: las páginas de `/cuenta/…`. Las carga `routes.jsx` con `import()`, no salen
 *   por aquí: si esta puerta las exportara, viajarían en el paquete de cada lector.
 * - `components/`: las piezas de esas páginas (campos, fuerza de la clave, botón de
 *   Google, retrato, la guarda de sesión y el formulario de una propuesta).
 * - `guia.js`: los pasos de sus nueve guías (la bienvenida y una por página); se arman en
 *   `lib/guias/` (`guiaCuenta.js`, `guiaPerfil.js`…).
 *
 * Lo que **no** está aquí, a propósito: el almacén de la sesión y el cliente HTTP del
 * lector (`lib/userAuthStorage.js`, `lib/userApi.js`, sobre `src/api/`: los usan también
 * las piezas, los juegos y la publicidad), lo que el lector guarda y sigue
 * (`services/userMeService.js`, `context/MarcadoresContext.jsx`,
 * `context/TemasSeguidosContext.jsx`: los usan la pieza y los titulares), el recorte del
 * retrato (`components/admin/RecorteDeAvatar.jsx`, compartido con el panel), la hoja de
 * sus páginas (`styles/cuenta.css`: pasa de las 1.000 líneas que deja la forma, y se
 * parte cuando se parta `blog.css`, A-7 del plan del 23-nov) y los textos
 * (`i18n/<idioma>/cuenta.json`: los diccionarios van por zonas).
 */

export { UserAuthProvider, useUserAuth } from "./UserAuthContext";
