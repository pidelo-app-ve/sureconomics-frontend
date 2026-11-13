/**
 * La guía de «Mi perfil» en el panel (`pages/admin/AdminMiPerfil.jsx`). No es la de la
 * cuenta del lector (`guiaPerfil.js`): por eso se llama `mi-perfil`. Anclajes:
 * `[data-tour-mi-perfil="…"]`.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_MI_PERFIL = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los datos de su cuenta del panel y su contraseña. Arriba está su rol: el Editor lo hace todo menos " +
      "llevar las cuentas del equipo; el Admin, también eso. El rol no se cambia aquí: lo cambia un admin.",
  },
  {
    clave: "datos",
    titulo: "Sus datos",
    puntos: [
      "Nombre: el suyo, tal como lo verá el resto del equipo.",
      "Correo electrónico: con el que entra al panel, y adonde llega el código si olvida la contraseña.",
      "Celular: el mismo con el que usa Telegram; así le reconoce el bot de la redacción.",
      "Guardar cambios: guarda estos tres datos. La contraseña va aparte, abajo.",
    ],
  },
  {
    clave: "contrasena",
    titulo: "Cambiar la contraseña",
    texto:
      "Escriba la actual y dos veces la nueva, de ocho caracteres como mínimo. Al cambiarla se cierran sus " +
      "sesiones en los demás aparatos; en este sigue dentro.",
  },
  {
    clave: "guia",
    titulo: "Vuelva aquí cuando quiera",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoMiPerfil = crearRecorrido("mi-perfil", PASOS_MI_PERFIL);
