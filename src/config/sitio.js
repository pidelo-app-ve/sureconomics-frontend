/**
 * Los datos fijos del sitio: la marca, el menú, las aliadas, el contacto, las redes y
 * los servicios de consultoría. No es un «mock» (así se llamaba, `data/surEconomicsMock.js`):
 * es lo que sale publicado.
 *
 * El equipo va aparte, en `equipo.js`: solo lo usan «Quiénes somos» y el panel, y así no
 * viaja en el paquete que baja cada lector.
 */

export const BRAND = {
  name: "SurEconomics",
  tagline: "Economía, mercados e inversión con inteligencia regional.",
  // A pedido del cliente (09/2026): el mismo texto que ya dice el encabezado de
  // "Quiénes somos" (ver `INSTITUTIONAL.intro`, más abajo en este archivo), en vez
  // del párrafo largo de antes. No se deriva de `INSTITUTIONAL.intro` en código
  // porque ahí son tres líneas sueltas y aquí es un párrafo corrido -- formatos
  // distintos para el mismo contenido -- pero si una cambia, la otra tiene que
  // cambiar con ella.
  description:
    "Plataforma editorial de economía, mercados e inversión en América Latina. Grupo intergeneracional de profesionales con presencia en Miami, Caracas, Bogotá, Asunción y Buenos Aires.",
};

/**
 * Header navigation.
 *
 * `hidden: true` keeps the entry (and its route, page and any in-page links)
 * intact while dropping it from the header — the pages are still reachable by
 * URL and from the footer. Flip the flag to bring one back.
 *
 * Aquí van solo los formatos que se LEEN. Entrevistas y podcast ya no están en la
 * fila: los dos son audiovisuales y viven juntos en `/audiovisual`, a la que se
 * entra por el botón «Al punto» que el Navbar pinta al lado de ENTRAR/REGISTRARSE
 * (no sale de esta lista a propósito: es un botón con luz propia, no un enlace más).
 * Quitarlos de aquí también le devuelve a la barra de escritorio el sitio que le
 * faltaba entre 1100 y 1365 px -- ver la nota de la franja estrecha en blog.css.
 *
 * Solo Artículos e Informes tienen ruta propia; los demás apuntan al listado de
 * artículos con la pista `formato`.
 */
export const PRIMARY_NAV = [
  { id: "inicio", to: "/", labelKey: "nav.inicio" },
  { id: "noticias", to: "/articulos?formato=noticias", labelKey: "nav.noticias" },
  { id: "articulos", to: "/articulos", labelKey: "nav.articulos" },
  { id: "editorial", to: "/articulos?formato=editorial", labelKey: "nav.editorial" },
  {
    id: "informes",
    to: "/informes",
    labelKey: "nav.informesReportes",
  },
  // Despues de los formatos y no entre ellos: los de arriba son formatos, y este es
  // un corte transversal -- las mismas piezas, reunidas por ser educativas. Su ruta
  // es propia porque el criterio es un valor de la pieza y no un filtro.
  { id: "educacion", to: "/educacion", labelKey: "nav.educacion" },
  // Al final y no entre los formatos: los de arriba son sitios donde se lee, y este
  // es la casa que los publica. La pagina y su ruta ya existian desde el rediseno;
  // lo unico que faltaba era la puerta para entrar desde el encabezado.
  { id: "quienesSomos", to: "/quienes-somos", labelKey: "nav.quienesSomos" },
  // La puerta comercial, al lado de la institucional y la ultima de la fila: quien
  // entra a leer pasa por delante de las nueve secciones antes de llegar a ella, y
  // quien viene a comprar espacio la encuentra sin que nadie le pase un enlace.
  // «Anúnciate» ya no va en la navegación principal: es una página comercial, no una
  // sección para el lector, y en la barra competía por sitio con las que sí lo son.
  // Vive en el pie, junto a la política de cookies.
];

/**
 * Las unidades del grupo, con logo en vez de nombre.
 *
 * La lista sale del sitio del propio RendiGroup, que es quien la mantiene, y no
 * coincidía con la que tenía esta página: allí Rendivalores es **una** unidad
 * —Casa de Bolsa, Casa de Bolsa Agrícola y Fondos Mutuales— y aquí estaba partida
 * en dos, y «Pídelo by Alalza» allí se llama «Alalza Inversiones».
 *
 * `logo` en nulo se dibuja con el nombre, que es lo que hacía toda la sección
 * antes. Sirve de respaldo honesto mientras falte un archivo.
 */
const aliada = (nombre) => `/brand/aliadas/${nombre}`;

export const PARTNERS = [
  {
    id: "rendigroup-advisors",
    name: "RendiGroup Advisors",
    logo: aliada("advisors-logo.webp"),
    url: "https://rendigroup.com",
  },
  {
    id: "rendivalores",
    name: "Rendivalores",
    // El nombre largo va en el `title` del enlace: en una rejilla de logos el pie
    // tiene que caber en una línea.
    nameLong: "Rendivalores — Casa de Bolsa, Casa de Bolsa Agrícola y Fondos Mutuales",
    logo: aliada("rendivalores-logo.webp"),
    url: "https://rendivalores.com",
  },
  {
    id: "alalza",
    name: "Alalza Inversiones",
    logo: aliada("alalza-logo.webp"),
    url: "https://www.pidelove.com",
  },
  {
    id: "moore-capital",
    name: "Moore Capital",
    logo: aliada("moore-logo.webp"),
    url: "https://moorecapitals.com",
  },
  {
    id: "invicto-capital",
    name: "Invicto Capital",
    logo: aliada("invicto-logo.webp"),
    url: "https://capitalinvicto.com",
  },
  // LOG Consultancy Group estuvo en esta lista y ya no existe (confirmado por el
  // cliente el 21/09/2026). No se repone.
];

// Los textos institucionales (la entradilla de «Quiénes somos» y el propósito) viven en
// `src/i18n/{es,en}/paginas.json`, bajo `paginas.quienesSomos`: así existen en los dos idiomas.

export const CONTACT = {
  // El correo propio del sitio (a pedido del cliente, 15/09/2026): lo que antes
  // eran dos buzones de RendiGroup -- el principal y el de proteccion de datos --
  // ahora es uno solo, con dominio de SurEconomics. Los dos campos se quedan
  // separados porque significan cosas distintas en el codigo -- consulta general
  // contra solicitud de derechos -- aunque hoy compartan el mismo valor; si algun
  // dia vuelven a separarse, cada uno ya tiene su sitio.
  primaryEmail: "info@sureconomics.com",
  privacyEmail: "info@sureconomics.com",
  // Fuera de la pagina de Contacto (a pedido del cliente, 18/09/2026): ahi el unico
  // contacto que se publica es el buzon del sitio. Siguen aqui porque Consultoria los
  // usa, y esa pagina no entraba en el encargo.
  leadershipEmails: [
    { name: "Juan Francisco Paz", email: "jpaz@rendigroup.com" },
    { name: "Mafe Yáñez", email: "myanez@rendigroup.com" },
  ],
  // Las oficinas se quitaron enteras: las cinco decian "Direccion proximamente", que
  // es media pantalla para no decir nada. Vuelven cuando haya direcciones.
};

/**
 * Las cuentas del medio. Aquí y no dentro del pie: el enlace a una red se repite
 * en cuanto haya una segunda barra que lo pida, y dos copias de una URL se
 * desincronizan el día que cambie el nombre de usuario.
 *
 * Sin el `igsi` que trae el enlace copiado desde el aplicativo: es el
 * identificador de esa sesión de compartir, no dice nada a quien llega desde el
 * pie de la página.
 */
export const SOCIAL = [
  {
    id: "instagram",
    label: "Instagram",
    handle: "@sur_economics",
    url: "https://www.instagram.com/sur_economics",
  },
  {
    id: "x",
    label: "X",
    handle: "@Sur_economics",
    url: "https://x.com/Sur_economics",
  },
  {
    id: "tiktok",
    label: "TikTok",
    // Con cero, no con «o»: es el nombre de la cuenta tal cual.
    handle: "@surecon0mics",
    // Sin los parametros `_r` y `_t` que TikTok cuelga al compartir: son de esa
    // sesion concreta y no pintan nada en un enlace permanente del pie.
    url: "https://www.tiktok.com/@surecon0mics",
  },
];

/* Los servicios de consultoría. Aquí solo el identificador: título y descripción están en
   `src/i18n/{es,en}/paginas.json`, bajo `paginas.consultoria.servicio.<id>`. */
export const SERVICES = [
  { id: "invest-market-research" },
  { id: "global-sector-econ" },
  { id: "financial-evaluations" },
  { id: "political-reports" },
  { id: "asset-valuation" },
  { id: "investment-banking" },
];

// Lo que decía la página de suscripción (beneficios, precio, pago) está en
// `src/i18n/{es,en}/boletin.json`, bajo `boletin.suscripcion`.

