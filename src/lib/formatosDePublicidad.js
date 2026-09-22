/**
 * Qué publica cada formato publicitario, y cómo se llama en cristiano.
 *
 * Vive aparte de la página porque lo usan dos pantallas: el formulario de la pieza y
 * el mural de anunciantes. Mientras estuvo dentro de `AdminPublicidad`, el mural seguía
 * enseñando el nombre crudo del servidor -- «Banner / Billboard» -- al lado del nombre
 * nuevo, y las dos cosas eran el mismo formato.
 */

/**
 * Para cada formato: cómo se llama en cristiano, dónde sale, y qué campos imprime.
 *
 * Es el reflejo de lo que hace `EspacioPublicitario`, que es quien pinta de verdad. Si
 * allí se cambia lo que un formato dibuja, hay que cambiarlo aquí: el precio de que el
 * formulario no mienta es que las dos listas tienen que ir juntas.
 *
 * `arte` va en orden de importancia y nombra el campo por su papel en *ese* formato.
 * `campo` es la columna donde se guarda —`imagen` o `cinta`—, y sólo la tarjeta nativa
 * lleva las dos. Sin `arte`, el formato no publica ninguna imagen.
 */
export const GUIA_DE_FORMATO = {
  A: {
    nombre: "Tarjeta entre las noticias",
    donde:
      "En tres sitios: la portada, los listados y dentro de un artículo. Es el único formato que viaja — por eso lleva dos artes: en la portada ocupa una celda de la rejilla, y en los otros dos se estira a todo lo ancho.",
    arte: [
      {
        campo: "imagen",
        etiqueta: "Imagen de la tarjeta",
        forma: { ancho: 16, alto: 9 },
        pista:
          "La que sale en la portada, entre las noticias. Tiene la misma forma que la foto de una noticia y va encima del titular.",
      },
      {
        campo: "cinta",
        etiqueta: "Tira ancha — 1456 × 180 px",
        forma: { ancho: 1456, alto: 180 },
        pista:
          "La misma pieza, cuando cae en un listado o dentro de un artículo. Ahí no hay celda: es una franja de lado a lado, ocho veces más ancha que alta. Los botones de la vista previa enseñan las dos.",
      },
    ],
    titular: true,
    pie: true,
  },
  B: {
    nombre: "Banner grande",
    donde: "Sólo en la portada, cruzándola de lado a lado. Es el espacio más caro del sitio y no sale en ninguna otra página.",
    arte: [
      {
        campo: "cinta",
        etiqueta: "Arte del banner — 1456 × 180 px",
        forma: { ancho: 1456, alto: 180 },
        pista:
          "Es lo único que se publica de este formato: el arte entero, sin recortar. Ni el titular ni el pie salen en ninguna parte.",
      },
    ],
  },
  C: {
    nombre: "Franja de patrocinio",
    donde: "Sólo en los listados (Noticias, Artículos, Editorial…), encabezándolos.",
    arte: [
      {
        campo: "cinta",
        etiqueta: "Arte de la franja — 1456 × 180 px",
        forma: { ancho: 1456, alto: 180 },
        pista:
          "Se recorta por arriba y por abajo para quedar más baja que un banner. No ponga texto pegado al borde.",
      },
    ],
  },
  D: {
    nombre: "Patrocinio del boletín",
    donde: "En el bloque de suscripción al boletín, que hoy sólo se pinta en la portada. No viaja dentro del correo.",
    arte: [
      {
        campo: "cinta",
        etiqueta: "Arte del boletín — 1456 × 180 px",
        forma: { ancho: 1456, alto: 180 },
        pista: "Igual que la franja: se recorta por arriba y por abajo.",
      },
    ],
  },
  F: {
    nombre: "Cintillo de cabecera",
    donde: "La línea fina sobre la cabecera.",
    // Tiene pintor, pero ninguna vista pide el espacio `cintillo`: salio de
    // `ESPACIOS_DE_SITIO` cuando el cliente lo quito de la cinta de mercado (09/2026) y
    // no se repuso en ningun sitio. Se puede guardar y no sale. Decirlo aqui es lo
    // unico que evita vender un hueco que no existe.
    sinSalida:
      "Hoy ninguna página pide este espacio, así que no se publica en ninguna parte. Se quitó de la cabecera en septiembre de 2026 y no se ha repuesto.",
  },
  I: {
    nombre: "Rail lateral",
    donde: "Sólo dentro de un artículo, en la columna estrecha de la derecha.",
    arte: [
      {
        campo: "imagen",
        etiqueta: "Imagen del rail",
        forma: { ancho: 4, alto: 3 },
        pista:
          "La columna de la derecha tiene menos de la mitad de ancho que un banner: una tira larga se ve diminuta aquí.",
      },
    ],
    titular: true,
  },
  E: {
    nombre: "Mención pre-roll",
    donde: "Antes de un vídeo.",
    sinSalida:
      "Este formato todavía no se sirve en ninguna parte del sitio. Puede guardarlo, pero no se publicará.",
  },
  H: {
    nombre: "Barra fija inferior",
    donde: "Pegada al pie de la pantalla.",
    sinSalida:
      "Este formato todavía no se sirve en ninguna parte del sitio. Puede guardarlo, pero no se publicará.",
  },
};

/** El nombre legible, con el del servidor de respaldo por si aparece un formato nuevo. */
export const nombreDeFormato = (letra, formatos) =>
  GUIA_DE_FORMATO[letra]?.nombre ?? formatos?.[letra] ?? letra;

/** Una línea que diga en qué estado está la pieza sin tener que abrirla. */
export const resumenDePieza = (pieza, guia) => {
  if (guia?.titular) return pieza.titular_corto || pieza.titular || "Sin titular";
  if (guia?.arte?.length) return pieza.cinta || pieza.imagen ? "Con arte" : "Sin arte";
  return pieza.enlace || "Sin destino";
};

