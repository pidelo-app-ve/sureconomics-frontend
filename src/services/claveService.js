import { userPublicRequest } from "../lib/userApi";

/**
 * «La Clave», lo público: las categorías con palabras y la palabra del día. Sin sesión.
 */

export const getCategoriasClave = async () => {
  const datos = await userPublicRequest("/juegos/clave/categorias");
  return Array.isArray(datos?.categorias) ? datos.categorias : [];
};

/**
 * La palabra de hoy de una categoría. `dia` solo vale si es hoy o ayer (para un reto
 * abierto pasada la medianoche); el servidor lo comprueba.
 */
export const getPalabraDelDia = async (categoria, dia) =>
  userPublicRequest("/juegos/clave/hoy", { query: { categoria, ...(dia ? { dia } : {}) } });

/**
 * Una pieza publicada donde aparece la palabra, para el remate: «lee la noticia donde
 * sale». Busca en titulares y entradillas; si no hay ninguna, `null`.
 */
export const buscarPiezaConPalabra = async (palabra) => {
  try {
    const datos = await userPublicRequest("/posts", { query: { q: palabra, limit: 1 } });
    const items = Array.isArray(datos?.data) ? datos.data : Array.isArray(datos) ? datos : [];
    return items[0] ?? null;
  } catch {
    return null;
  }
};
