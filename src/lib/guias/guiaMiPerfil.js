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
      "Los datos de su cuenta del panel, su contraseña y la salida de todos sus aparatos. Arriba está su rol: el Editor lo hace todo menos " +
      "llevar las cuentas del equipo; el Admin, también eso. El rol no se cambia aquí: lo cambia un admin.",
  },
  {
    clave: "datos",
    titulo: "Sus datos",
    puntos: [
      "Nombre: el suyo, tal como lo verá el resto del equipo.",
      "Correo electrónico: con el que entra al panel, y adonde llega el código si olvida la contraseña.",
      "Celular: el mismo con el que usa Telegram; así le reconoce el bot de la redacción.",
      "Contraseña actual: aparece solo si cambia el correo o el celular. Con su sesión abierta nadie puede " +
        "cambiárselos sin ella, y le llega un aviso al correo de antes.",
      "Guardar cambios: guarda estos datos. Si cambia el celular, vuelva a conectar Telegram compartiendo su " +
        "contacto con el bot. La contraseña se cambia aparte, abajo.",
    ],
  },
  {
    clave: "contrasena",
    titulo: "Cambiar la contraseña",
    texto:
      "Escriba la actual y dos veces la nueva, de ocho caracteres como mínimo. Al cambiarla se cierran sus " +
      "sesiones en los demás aparatos (en este sigue dentro) y se desconecta Telegram: vuelva a compartir su " +
      "contacto con el bot.",
  },
  {
    clave: "sesiones",
    titulo: "Cerrar sesión en todos los aparatos",
    texto:
      "Si dejó el panel abierto en un ordenador ajeno o cree que alguien entra con su cuenta, pulse aquí. Le " +
      "pide confirmación y después cierra todas sus sesiones a la vez, también esta, y desconecta Telegram. " +
      "Para seguir, vuelva a entrar con su correo y su contraseña, y comparta otra vez su contacto con el bot.",
  },
  {
    clave: "guia",
    titulo: "Vuelva aquí cuando quiera",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoMiPerfil = crearRecorrido("mi-perfil", PASOS_MI_PERFIL);
