/**
 * El logotipo de Sur Economics, en las versiones que define el brandbook.
 *
 * Extraídas del propio brandbook, que las trae en vectorial, y recortadas al
 * contenido con el fondo en transparencia. Viven en `/public/brand/v2`; la carpeta
 * `/public/brand` conserva el juego anterior mientras quede algo apuntando ahí.
 *
 * Los nombres describen la pieza y no el sitio donde se usa. El juego anterior se
 * llamaba `light` y `dark` queriendo decir "para fondo claro" y "para fondo
 * oscuro", y se leía al revés todo el tiempo: `dark` era el logo *blanco*. Cada vez
 * que una superficie cambió de color hubo que descifrarlo de nuevo.
 *
 * Medidas mínimas que fija el brandbook, por si alguien las necesita: el lockup no
 * baja de 445x57, la secundaria de 148x43 y el isotipo de 64x64. Los archivos van
 * al doble para pantallas densas.
 */

const base = `${import.meta.env.BASE_URL}brand/v2/`;

const file = (name) => `${base}${name}`;

export const BRAND = {
  /** Versión principal: isotipo verde y "SurEconomics" en negro. Sobre papel. */
  lockup: file("lockup-verde.png"),
  /** Versión principal alterna, en cobre. Para cuando el verde compite con el fondo. */
  lockupCobre: file("lockup-cobre.png"),
  /** En negativo, todo en blanco. Sobre la franja verde de la cabecera. */
  lockupNegativo: file("lockup-negativo.png"),

  /** Versión secundaria "Sur E", para cuando no cabe el lockup. */
  corta: file("sure-verde.png"),
  cortaNegativo: file("sure-negativo.png"),

  /** El isotipo solo: favicon, firma de la casa, avatar. */
  isotipo: file("isotipo-verde.png"),
  isotipoCobre: file("isotipo-cobre.png"),
  isotipoNegativo: file("isotipo-negativo.png"),
};

/**
 * El juego anterior, mientras algo siga apuntando a él.
 *
 * Se mantiene el nombre para no romper lo que aún lo importa, pero los valores ya
 * son los del brandbook nuevo: `light` sigue significando "para fondo claro" y
 * `dark` "para fondo oscuro".
 */
export const BRAND_PUBLIC_LOGO = {
  light: {
    wordmarkNoTagline: BRAND.lockup,
    isotypeWithBox: BRAND.isotipo,
  },
  dark: {
    wordmarkNoTagline: BRAND.lockupNegativo,
    wordmarkCompressed: BRAND.cortaNegativo,
    isotypeWithBox: BRAND.isotipoNegativo,
  },
};

export const BRAND_PUBLIC_FAVICON = {
  icon: BRAND.isotipo,
  appleTouch: BRAND.isotipo,
};
