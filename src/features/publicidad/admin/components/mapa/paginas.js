/**
 * Las páginas del sitio, dibujadas: qué bloques tiene cada una y dónde van sus huecos.
 *
 * Es un dibujo, no la página real: la real cambia cada hora y dentro del panel pesa y
 * se desborda. Lo que sí es real es **el anuncio dentro de cada hueco**, que se pinta
 * con el mismo componente que el sitio (`POR_FORMATO`), y la forma de cada hueco.
 *
 * Un bloque es `{ tipo: "muestra", forma }` (contenido de relleno) o
 * `{ tipo: "hueco", espacio, variante? }`. `columnas` parte la página en dos. `solo`
 * limita un bloque a un aparato («pc» o «telefono»).
 *
 * El formato de cada hueco se copia del servidor (`ESPACIOS` en
 * `app/models/publicidad.py`), que es quien manda: aquí solo sirve para dibujar un
 * hueco vacío con su forma y para saber qué huecos admite un arte.
 */

export const FORMATO_DEL_HUECO = {
  cintillo: "F",
  "portada-nativo": "A",
  "portada-nativo-articulos": "A",
  "portada-nativo-editorial": "A",
  "portada-banner": "B",
  "portada-apertura": "B",
  "listado-patrocinio": "C",
  "pausa-patrocinio": "C",
  "lvbp-patrocinio": "C",
  "listado-nativo": "A",
  "articulo-nativo": "A",
  "articulo-rail": "I",
  "portada-tarjeta": "I",
  "articulo-apertura": "B",
  boletin: "D",
  "barra-inferior": "H",
};

/** Cómo se llama cada hueco para una persona. */
export const NOMBRE_DEL_HUECO = {
  cintillo: "Cintillo",
  "portada-banner": "Banner de portada",
  "portada-apertura": "Banner bajo la primera plana",
  "portada-tarjeta": "Tarjeta bajo las monedas",
  "portada-nativo": "Tarjeta entre las noticias",
  "portada-nativo-articulos": "Tarjeta entre los artículos",
  "portada-nativo-editorial": "Tarjeta en la editorial",
  boletin: "Bloque del boletín",
  "listado-patrocinio": "Patrocinio del listado",
  "listado-nativo": "Tarjeta en el listado",
  "articulo-apertura": "Banner bajo la foto",
  "articulo-nativo": "Tarjeta en el texto",
  "articulo-rail": "Columna de la pieza",
  "pausa-patrocinio": "Patrocinio del juego",
  "lvbp-patrocinio": "Patrocinio del béisbol",
  "barra-inferior": "Barra fija inferior",
};

const muestra = (forma, extra = {}) => ({ tipo: "muestra", forma, ...extra });
const hueco = (espacio, extra = {}) => ({ tipo: "hueco", espacio, ...extra });

export const PAGINAS = [
  {
    clave: "portada",
    nombre: "Portada",
    bloques: [
      muestra("cabecera"),
      hueco("cintillo"),
      hueco("portada-banner"),
      {
        tipo: "columnas",
        solo: "pc",
        columnas: [
          { ancho: 5, bloques: [muestra("apertura")] },
          { ancho: 4, bloques: [muestra("lista")] },
          { ancho: 3, bloques: [muestra("monedas"), hueco("portada-tarjeta")] },
        ],
      },
      muestra("apertura", { solo: "telefono" }),
      muestra("lista", { solo: "telefono" }),
      hueco("portada-apertura"),
      muestra("seccion", { texto: "Noticias" }),
      { tipo: "rejilla", bloques: [muestra("tarjeta"), muestra("tarjeta"), hueco("portada-nativo", { variante: "tarjeta" })] },
      muestra("seccion", { texto: "Artículos" }),
      { tipo: "rejilla", bloques: [muestra("tarjeta"), hueco("portada-nativo-articulos", { variante: "tarjeta" }), muestra("tarjeta")] },
      muestra("seccion", { texto: "Editorial" }),
      { tipo: "rejilla", bloques: [hueco("portada-nativo-editorial", { variante: "tarjeta" }), muestra("tarjeta"), muestra("tarjeta")] },
      hueco("boletin"),
      muestra("pie"),
      hueco("barra-inferior", { solo: "telefono", fija: true }),
    ],
  },
  {
    clave: "pieza",
    nombre: "Una pieza",
    bloques: [
      muestra("cabecera"),
      hueco("cintillo"),
      muestra("titular"),
      {
        tipo: "columnas",
        solo: "pc",
        columnas: [
          { ancho: 8, bloques: [muestra("foto"), muestra("texto"), hueco("articulo-nativo", { variante: "cuerpo" }), muestra("texto")] },
          { ancho: 4, bloques: [hueco("articulo-rail"), muestra("lista")] },
        ],
      },
      muestra("foto", { solo: "telefono" }),
      hueco("articulo-apertura", { solo: "telefono" }),
      muestra("texto", { solo: "telefono" }),
      hueco("articulo-nativo", { solo: "telefono", variante: "cuerpo" }),
      muestra("texto", { solo: "telefono" }),
      muestra("pie"),
      hueco("barra-inferior", { solo: "telefono", fija: true }),
    ],
  },
  {
    clave: "listado",
    nombre: "Un listado",
    bloques: [
      muestra("cabecera"),
      hueco("cintillo"),
      muestra("seccion", { texto: "Artículos" }),
      hueco("listado-patrocinio"),
      { tipo: "rejilla", bloques: [muestra("tarjeta"), muestra("tarjeta"), muestra("tarjeta")] },
      hueco("listado-nativo", { variante: "lista" }),
      { tipo: "rejilla", bloques: [muestra("tarjeta"), muestra("tarjeta"), muestra("tarjeta")] },
      muestra("pie"),
      hueco("barra-inferior", { solo: "telefono", fija: true }),
    ],
  },
  {
    clave: "juegos",
    nombre: "Juegos y béisbol",
    bloques: [
      muestra("cabecera"),
      muestra("seccion", { texto: "Un minuto de pausa" }),
      muestra("juego"),
      hueco("pausa-patrocinio"),
      muestra("seccion", { texto: "Béisbol LVBP" }),
      hueco("lvbp-patrocinio"),
      muestra("marcador"),
      muestra("pie"),
    ],
  },
];

/** Todos los huecos de una página, en orden, para un aparato. */
export const huecosDe = (pagina, aparato) => {
  const salida = [];
  const recorrer = (bloques) => {
    for (const b of bloques) {
      if (b.solo && b.solo !== aparato) continue;
      if (b.tipo === "hueco") salida.push(b.espacio);
      if (b.tipo === "columnas") b.columnas.forEach((c) => recorrer(c.bloques));
      if (b.tipo === "rejilla") recorrer(b.bloques);
    }
  };
  recorrer(pagina.bloques);
  return salida;
};
