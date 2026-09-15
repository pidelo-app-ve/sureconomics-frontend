/**
 * Institutional mock data for Sur Economics.
 * Keep UI and content separated so it can be replaced by CMS/API later.
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
 * The format entries mirror the five formats in the functional mockup. Only
 * Artículos and Informes have their own route today, so the rest point at the
 * article listing with a `formato` hint; the real per-format pages arrive with
 * the content-model work.
 */
export const PRIMARY_NAV = [
  { id: "inicio", to: "/", labelKey: "nav.inicio" },
  { id: "noticias", to: "/articulos?formato=noticias", labelKey: "nav.noticias" },
  { id: "articulos", to: "/articulos", labelKey: "nav.articulos" },
  { id: "editorial", to: "/articulos?formato=editorial", labelKey: "nav.editorial" },
  { id: "entrevistas", to: "/articulos?formato=entrevistas", labelKey: "nav.entrevistas" },
  {
    id: "informes",
    to: "/informes",
    labelKey: "nav.informesReportes",
  },
  { id: "podcast", to: "/articulos?formato=podcast", labelKey: "nav.podcast" },
  // Despues de los formatos y no entre ellos: los de arriba son formatos, y este es
  // un corte transversal -- las mismas piezas, reunidas por ser educativas. Su ruta
  // es propia porque el criterio es un valor de la pieza y no un filtro.
  { id: "educacion", to: "/educacion", labelKey: "nav.educacion" },
  // Al final y no entre los formatos: los de arriba son sitios donde se lee, y este
  // es la casa que los publica. La pagina y su ruta ya existian desde el rediseno;
  // lo unico que faltaba era la puerta para entrar desde el encabezado.
  { id: "quienesSomos", to: "/quienes-somos", labelKey: "nav.quienesSomos" },
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
    logo: aliada("advisors-logo.png"),
    url: "https://rendigroup.com",
  },
  {
    id: "rendivalores",
    name: "Rendivalores",
    // El nombre largo va en el `title` del enlace: en una rejilla de logos el pie
    // tiene que caber en una línea.
    nameLong: "Rendivalores — Casa de Bolsa, Casa de Bolsa Agrícola y Fondos Mutuales",
    logo: aliada("rendivalores-logo.png"),
    url: "https://rendivalores.com",
  },
  {
    id: "alalza",
    name: "Alalza Inversiones",
    logo: aliada("alalza-logo.png"),
    url: "https://www.pidelove.com",
  },
  {
    id: "moore-capital",
    name: "Moore Capital",
    logo: aliada("moore-logo.png"),
    url: "https://moorecapitals.com",
  },
  {
    id: "invicto-capital",
    name: "Invicto Capital",
    logo: aliada("invicto-logo.png"),
    url: "https://capitalinvicto.com",
  },
  // Queda LOG Consultancy Group, que estaba en esta lista pero no aparece en el
  // sitio del grupo y no tiene logo. Se dibujaría con el nombre si se repone:
  // { id: "log-consultancy", name: "LOG Consultancy Group", logo: null, url: null },
];


export const TEAM = {
  // Reestructurado a pedido del cliente (10/2026) y afinado en 09/2026: ya nadie lleva
  // resumen. El cliente pidio quitar todas las descripciones, asi que el campo se va de
  // los datos en vez de quedarse vacio en veinte sitios -- y la tarjeta deja de pintar
  // ese parrafo. La foto NO vive aqui: se sube desde el panel y se guarda por separado,
  // atada al `id` de cada quien, que por eso no se puede cambiar a la ligera.
  board: [
    {
      id: "junta-oscar-doval",
      // Misma persona que "consejo-oscar-doval": comparten foto. Ver `claveDeFoto`.
      fotoId: "junta-oscar-doval",
      name: "Óscar Doval",
      role: "Junta Directiva",
      cvUrl: "#",
      email: "odoval@rendigroup.com",
      links: [],
    },
    {
      id: "junta-daniel-berconsky",
      name: "Daniel Berconsky Da Ruos",
      role: "Junta Directiva",
      cvUrl: "#",
      email: "",
      links: [],
    },
    { id: "junta-aknaton-matute", name: "Aknatón Matute", role: "Junta Directiva", cvUrl: "#", email: "", links: [] },
    { id: "junta-guillermo-leandro", name: "Guillermo Leandro", role: "Junta Directiva", cvUrl: "#", email: "", links: [] },
  ],
  // Los dos primeros llevan su cargo real y no el nombre del grupo, a pedido del
  // cliente: aqui "Consejo Editorial" ya lo dice el titulo de la seccion, asi que
  // repetirlo en la tarjeta no anadia nada y ocultaba quien es quien.
  editorialBoard: [
    {
      id: "consejo-oscar-doval",
      // La misma foto que su ficha de Junta Directiva: es la misma persona, y
      // subirla dos veces seria pedirle a la redaccion que recuerde hacerlo.
      fotoId: "junta-oscar-doval",
      name: "Óscar Doval",
      role: "Director General",
      cvUrl: "#",
      email: "odoval@rendigroup.com",
      links: [],
    },
    {
      id: "consejo-pablo-quintero",
      name: "Pablo Quintero",
      role: "Editor en Jefe",
      cvUrl: "https://www.pabloandresquintero.com/sobre-mi",
      email: "",
      links: [],
    },
    { id: "consejo-alex-lund", name: "Alex Lund", role: "Consejo Editorial", cvUrl: "#", email: "", links: [] },
  ],
  operational: [
    { id: "marketing-ariana-zambrano", name: "Ariana Zambrano", role: "Mercadeo y diseño", cvUrl: "#", email: "", links: [] },
    { id: "marketing-maria-fernanda", name: "María Fernanda Hernández", role: "Mercadeo y diseño", cvUrl: "#", email: "", links: [] },
    { id: "ti-ramon-marquina", name: "Ramon Marquina", role: "TI", cvUrl: "#", email: "", links: [] },
    { id: "ti-luis-ojeda", name: "Luis Ojeda", role: "TI", cvUrl: "#", email: "", links: [] },
    { id: "marketing-ambar-prato", name: "Ámbar Prato", role: "Diseñadora", cvUrl: "#", email: "", links: [] },
    // Nombre nuevo (09/2026). Va junto a Ambar y no al final porque este grupo se lee
    // por oficios -- mercadeo, TI, diseno -- y separar a las dos disenadoras habria
    // roto lo unico que ordena la lista.
    { id: "diseno-veronica-acosta", name: "Verónica Acosta", role: "Diseñadora", cvUrl: "#", email: "", links: [] },
    // Estaba como "Riesgo"; el cliente corrige a Automatizaciones.
    { id: "operativo-saul-benarroch", name: "Saul Benarroch", role: "Automatizaciones", cvUrl: "#", email: "", links: [] },
    { id: "operativo-manuel-oropeza", name: "Manuel Oropeza", role: "Equipo operativo", cvUrl: "#", email: "", links: [] },
  ],
};

/**
 * Con qué clave se guarda la foto de una ficha del equipo.
 *
 * Normalmente es su propio `id`. La excepción es quien aparece en dos grupos --
 * hoy sólo Óscar Doval, en Junta Directiva y en Consejo Editorial --: las dos
 * fichas son la misma persona y tienen que compartir retrato. Sin esto, subirle la
 * foto en un grupo dejaba el otro con las iniciales, y habría que acordarse de
 * subirla dos veces.
 *
 * El `fotoId` compartido es el id de su ficha de Junta Directiva, y no un nombre
 * más bonito, por un motivo concreto: esa es la clave con la que su foto ya está
 * guardada. Cambiarla por algo más limpio habría dejado la foto huérfana y
 * obligado a volver a subirla.
 */
export const claveDeFoto = (miembro) => miembro?.fotoId ?? miembro?.id ?? "";

export const INSTITUTIONAL = {
  /**
   * Las tres líneas de la cabecera, tal como las mandó el cliente en su documento.
   *
   * Viven aquí como tres líneas sueltas -- qué es, quiénes lo hacen y desde dónde --
   * porque así vienen del documento del cliente y así se leen en esta cabecera:
   * unirlas en prosa alargaría la primera pantalla sin decir nada más.
   *
   * `BRAND.description` dice lo mismo, en prosa corrida, para el pie de página, la
   * portada y los metadatos del sitio -- el cliente pidió (09/2026) que esos tres
   * sitios dijeran lo mismo que esta cabecera. Si una cambia, la otra tiene que
   * cambiar con ella.
   */
  intro: [
    "Plataforma editorial de economía, mercados e inversión en América Latina",
    "Grupo intergeneracional de profesionales",
    "Miami, Caracas, Bogotá, Asunción, Buenos Aires",
  ],
  // Reemplaza a "Somos un grupo intergeneracional de profesionales con presencia
  // en Miami, Caracas...", que decía quiénes somos y no para qué estamos. Eso no
  // se pierde: las ciudades y el grupo intergeneracional suben a `intro`, que es
  // su sitio, y aquí queda el propósito de verdad.
  purpose:
    "Construir una plataforma sólida para informar, analizar y comprender la realidad económica y financiera de América Latina.",
  // El diagrama de cuatro pasos ("Objetivos") se quito de la pagina a pedido del
  // cliente (15/09/2026); vivia en `flow` y ya no se usa en ningun sitio.
};

export const CONTACT = {
  primaryEmail: "odoval@rendigroup.com",
  // El buzon de proteccion de datos, aparte del institucional: lo que entra por
  // el aviso de cookies son solicitudes de derechos, no consultas editoriales.
  privacyEmail: "servicios@rendigroup.com",
  leadershipEmails: [
    { name: "Juan Francisco Paz", email: "jpaz@rendigroup.com" },
    { name: "Mafe Yáñez", email: "myanez@rendigroup.com" },
  ],
  offices: [
    { city: "Miami", address: "Dirección próximamente" },
    { city: "Caracas", address: "Dirección próximamente" },
    { city: "Bogotá", address: "Dirección próximamente" },
    { city: "Asunción", address: "Dirección próximamente" },
    { city: "Buenos Aires", address: "Dirección próximamente" },
  ],
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
];

export const SERVICES = [
  {
    id: "invest-market-research",
    title: "Investigaciones de mercado",
    description:
      "Estudios con enfoque regional que transforman datos en lectura ejecutiva para decisiones de inversión y expansión.",
  },
  {
    id: "global-sector-econ",
    title: "Estudios económicos globales y sectoriales",
    description:
      "Análisis comparados de variables macro y micro, con síntesis ejecutiva y recomendaciones por horizonte.",
  },
  {
    id: "financial-evaluations",
    title: "Evaluaciones financieras",
    description:
      "Evaluaciones orientadas al riesgo y a la estructura financiera para proyectos e instrumentos en Latinoamérica.",
  },
  {
    id: "political-reports",
    title: "Informes políticos",
    description:
      "Lecturas institucionales de escenarios, marcos regulatorios y riesgos geopolíticos con claridad operativa.",
  },
  {
    id: "asset-valuation",
    title: "Valuación de activos",
    description:
      "Acompañamiento en metodología de valuación y entrega de criterios para negociación y toma de decisiones.",
  },
  {
    id: "investment-banking",
    title: "Asesoría y acompañamiento en banca de inversión",
    description:
      "Soporte analítico para rondas, estructuras y estrategia de inversión, con acompañamiento conceptual y ejecutivo.",
  },
];

export const REPORTS = [
  {
    id: "r-1",
    title: "Latinoamérica: inflación, expectativas y política monetaria",
    date: "2026-02-15",
    excerpt:
      "Un research institucional con lectura de escenarios para comprender el ciclo de precios y su impacto en tasas, rentabilidad y riesgo.",
    tier: "Acceso premium",
    imagePlaceholder: "chart",
  },
  {
    id: "r-2",
    title: "Radar de mercados: flujos, liquidez y volatilidad cambiaria",
    date: "2026-01-30",
    excerpt:
      "Síntesis de condiciones de mercado y narrativas por región para inversionistas que requieren información accionable.",
    tier: "Acceso premium",
    imagePlaceholder: "building",
  },
  {
    id: "r-3",
    title: "Energía y transición: oportunidades y riesgos sectoriales",
    date: "2025-12-20",
    excerpt:
      "Análisis sectorial con foco en oportunidades de inversión, restricciones y supuestos macro relevantes.",
    tier: "Acceso premium",
    imagePlaceholder: "growth",
  },
];

export const SUBSCRIPTION = {
  benefits: [
    "Investigaciones extensas en economía, finanzas y aspectos políticos de diferentes países y bloques latinoamericanos.",
    "Boletín mensual sobre economía, finanzas y política en la región latinoamericana.",
    "Oportunidades de inversión directa en Latinoamérica.",
    "Conexión con potenciales inversores interesados en América Latina.",
    "Cursos en economía y finanzas con orientación práctica.",
  ],
  priceLabel: "Precio próximamente",
  paymentMethodsLabel: "Métodos de pago disponibles próximamente",
  ctaLabel: "Suscribirme",
};

