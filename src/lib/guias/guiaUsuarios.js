/**
 * Las guías de «Usuarios», las cuentas de los lectores: la lista
 * (`pages/admin/AdminUsersList.jsx`, anclajes `[data-tour-usuarios="…"]`) y la ficha de
 * un lector (`pages/admin/AdminUserDetail.jsx`, `[data-tour-ficha-usuario="…"]`). Dos
 * recorridos y no uno: cada página ilumina lo suyo, y los pasos de la ficha abiertos
 * desde la lista no tendrían nada que señalar.
 */
import { crearRecorrido } from "../recorridoVista.js";

const VUELVE = {
  clave: "guia",
  titulo: "Vuelva aquí cuando quiera",
  texto: "Este botón abre esta guía otra vez.",
};

export const PASOS_USUARIOS = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los lectores que se han abierto una cuenta en el sitio, del más reciente al más antiguo. Con ella " +
      "guardan piezas, siguen temas y mandan propuestas de artículos. No son las cuentas de la redacción " +
      "para entrar a este panel.",
  },
  {
    clave: "lista",
    titulo: "La lista",
    puntos: [
      "Nombre y correo: los que puso el lector al registrarse.",
      "Colaborador: si puede mandar propuestas de artículos desde su cuenta. Un guion quiere decir que nadie lo ha cambiado: puede, como cualquier lector.",
      "Editar: abre la ficha del lector, donde se corrige su nombre, se le deja o no mandar propuestas y se desactiva su cuenta.",
      "Páginas: la lista va de veinte en veinte; si hay más, abajo están los números para pasar de página.",
    ],
  },
  VUELVE,
];

export const PASOS_FICHA_USUARIO = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "La ficha de un lector: quién es, cómo está su cuenta y lo que se puede cambiar de ella. " +
      "«← Usuarios», arriba, vuelve a la lista.",
  },
  {
    clave: "resumen",
    titulo: "De un vistazo",
    puntos: [
      "Correo verificado: el lector confirmó que ese correo es suyo. «Sin verificar» si todavía no.",
      "Propuestas: si puede mandar propuestas de artículos a la redacción.",
      "Cuenta: activa, o desactivada si no puede entrar.",
      "Alta: el día que se registró.",
    ],
  },
  {
    clave: "datos",
    titulo: "Datos de la cuenta",
    texto:
      "Los datos de esta cuenta, uno por uno: lo que el lector contó de sí mismo y " +
      "fechas como la de su última entrada. Aquí solo se mira; lo que se puede cambiar está en «Editar».",
  },
  {
    clave: "editar",
    titulo: "Editar",
    puntos: [
      "Nombre y Apellido: para corregir cómo figura el lector.",
      "Puede enviar propuestas: quítelo y el lector ya no podrá mandar propuestas de artículos. Si la recepción está cerrada para todos (en «Propuestas de lectores»), nadie puede, esté marcado o no.",
      "Cuenta activa: quítelo y el lector no podrá entrar en su cuenta. No se borra nada: vuelva a marcarlo y podrá entrar otra vez.",
      "Guardar cambios: nada de lo anterior cuenta hasta pulsarlo.",
    ],
  },
  VUELVE,
];

export const recorridoUsuarios = crearRecorrido("usuarios", PASOS_USUARIOS);
export const recorridoFichaUsuario = crearRecorrido("ficha-usuario", PASOS_FICHA_USUARIO);
