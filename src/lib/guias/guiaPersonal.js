/**
 * La guía de «Personal», las cuentas del panel (`pages/admin/AdminStaffList.jsx`). Solo
 * la ve el admin. Anclajes: `[data-tour-personal="…"]`.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_PERSONAL = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Las cuentas de la redacción para entrar a este panel: quién entra, con qué rol, y cómo dar o " +
      "quitar el acceso a alguien. Solo el admin ve esta página.",
  },
  {
    clave: "crear",
    titulo: "Crear una cuenta",
    puntos: [
      "Nombre y Correo electrónico: con ese correo y la contraseña, la persona entra al panel.",
      "Contraseña: la primera, de ocho caracteres como mínimo. Hágasela llegar por un medio seguro; después ella puede cambiarla en «Mi perfil».",
      "Celular: el mismo con el que usa Telegram; así la reconoce el bot de la redacción. Se puede dejar vacío.",
      "Rol: Editor o Admin. El Editor lo hace todo en el panel menos llevar estas cuentas; el Admin, también esto.",
    ],
  },
  {
    clave: "lista",
    titulo: "Las cuentas",
    puntos: [
      "Rol: se cambia en el desplegable de cada fila, y antes pide confirmación.",
      "Desactivar: la persona deja de poder entrar y se le cierra la sesión que tenga abierta. La cuenta y lo que firmó se quedan; «Reactivar» le devuelve el acceso.",
      "Eliminar: borra la cuenta para siempre. No se deja si la cuenta escribió piezas (aunque sean borradores) o notas en propuestas: en ese caso, desactívela.",
      "Su propia cuenta: nadie se cambia el rol, se desactiva ni se elimina a sí mismo; eso lo hace otro admin.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelva aquí cuando quiera",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoPersonal = crearRecorrido("personal", PASOS_PERSONAL);
