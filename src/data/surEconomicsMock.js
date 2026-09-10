/**
 * Institutional mock data for Sur Economics.
 * Keep UI and content separated so it can be replaced by CMS/API later.
 */

export const BRAND = {
  name: "SurEconomics",
  tagline: "Economía, mercados e inversión con inteligencia regional.",
  description:
    "SurEconomics es una plataforma editorial e institucional dedicada al análisis económico y financiero de América Latina. Combinamos investigación profunda, noticias, contenidos sencillos, claros y una mirada estratégica para apoyar las decisiones de inversión y desarrollo en la región.",
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
  // Antes "Liderazgo / dirección editorial". Reestructurado a pedido del cliente
  // (10/2026): estos cuatro pasan a ser el organo formal, y se cae de aqui Juan
  // Francisco Paz, que no vuelve a aparecer en ningun grupo.
  board: [
    {
      id: "junta-oscar-doval",
      name: "Óscar Doval",
      role: "Junta Directiva",
      summary:
        "Lidera la dirección editorial y la línea de investigación del medio. Enfoque en rigor, claridad y mirada regional.",
      cvUrl: "#",
      email: "odoval@rendigroup.com",
      links: [],
    },
    {
      id: "junta-daniel-berconsky",
      name: "Daniel Berconsky Da Ruos",
      role: "Junta Directiva",
      summary:
        "Supervisa el marco financiero y el acompañamiento institucional. Aporta visión estratégica para proyectos de inteligencia e inversión.",
      cvUrl: "#",
      email: "",
      links: [],
    },
    // Estaba como Colaborador; el cliente lo sube a Junta Directiva.
    {
      id: "junta-aknaton-matute",
      name: "Aknatón Matute",
      role: "Junta Directiva",
      summary: "Investigación y contenido.",
      cvUrl: "#",
      email: "",
      links: [],
    },
    // Mismo caso: estaba como Colaborador.
    {
      id: "junta-guillermo-leandro",
      name: "Guillermo Leandro",
      role: "Junta Directiva",
      summary: "Visión sectorial.",
      cvUrl: "#",
      email: "",
      links: [],
    },
  ],
  editorialBoard: [
    { id: "consejo-oscar-doval", name: "Óscar Doval", role: "Consejo Editorial", summary: "Rigor y criterio editorial.", cvUrl: "#", email: "odoval@rendigroup.com", links: [] },
    {
      id: "consejo-pablo-quintero",
      name: "Pablo Quintero",
      role: "Consejo Editorial",
      summary:
        "Politólogo (Universidad Central de Venezuela). Consultor político, asesor en comunicación y asuntos corporativos. Socio director de LOG Consultancy.",
      cvUrl: "https://www.pabloandresquintero.com/sobre-mi",
      email: "",
      links: [],
    },
    // Nombre nuevo a pedido del cliente (10/2026), sin bio propia todavía -- la
    // misma línea genérica que llevaba Mafe Yáñez, que sale de este grupo.
    {
      id: "consejo-alex-lund",
      name: "Alex Lund",
      role: "Consejo Editorial",
      summary: "Aporte editorial y de gestión institucional.",
      cvUrl: "#",
      email: "",
      links: [],
    },
  ],
  operational: [
    {
      id: "marketing-ariana-zambrano",
      name: "Ariana Zambrano",
      role: "Mercadeo y diseño",
      summary: "Ejecución creativa con foco en claridad y consistencia.",
      cvUrl: "#",
      email: "",
      links: [],
    },
    {
      id: "marketing-maria-fernanda",
      name: "María Fernanda Hernández",
      role: "Mercadeo y diseño",
      summary: "Dirección de contenido y estrategia de experiencia editorial.",
      cvUrl: "#",
      email: "",
      links: [],
    },
    {
      id: "ti-ramon-marquina",
      name: "Ramon Marquina",
      role: "TI",
      summary: "Soporte tecnológico y evolución del producto.",
      cvUrl: "#",
      email: "",
      links: [],
    },
    {
      id: "ti-luis-ojeda",
      name: "Luis Ojeda",
      role: "TI",
      summary: "Soporte tecnológico y evolución del producto.",
      cvUrl: "#",
      email: "",
      links: [],
    },
    {
      id: "marketing-ambar-prato",
      name: "Ámbar Prato",
      role: "Diseñadora",
      summary: "Diseño y ejecución visual de los contenidos.",
      cvUrl: "#",
      email: "",
      links: [],
    },
    // Estaba en Equipo de investigación, que desaparece como grupo propio; su
    // función ya descrita ahí se conserva como etiqueta corta, igual que TI o
    // Diseñadora en el resto de este grupo.
    {
      id: "operativo-saul-benarroch",
      name: "Saul Benarroch",
      role: "Riesgo",
      summary: "Modelos y lecturas de riesgo.",
      cvUrl: "#",
      email: "",
      links: [],
    },
    // Nombre nuevo a pedido del cliente (10/2026). Sin cargo específico todavía
    // -- se pidió dejarlo así en vez de inventar uno -- por eso no lleva resumen:
    // el componente no imprime la línea cuando falta.
    {
      id: "operativo-manuel-oropeza",
      name: "Manuel Oropeza",
      role: "Equipo operativo",
      summary: "",
      cvUrl: "#",
      email: "",
      links: [],
    },
  ],
};

export const INSTITUTIONAL = {
  purpose:
    "Somos un grupo intergeneracional de profesionales con presencia en Miami, Caracas, Bogotá, Asunción y Buenos Aires, reunidos con la visión de crear la plataforma y el medio más robusto de información y conocimiento económico y financiero de América Latina.",
  objectives: [
    "Generar información económica y financiera de valor para distintos países y bloques económicos latinoamericanos.",
    "Integrar datos cuantitativos y cualitativos obtenidos de bases de datos confiables e investigaciones de campo exhaustivas.",
    "Brindar una comprensión profunda de la dinámica geoeconómica y geopolítica de la región.",
    "Servir a inversionistas que desean maximizar su utilidad a través de inversiones directas o instrumentos financieros.",
    "Promover oportunidades de inversión en Latinoamérica.",
  ],
};

export const CONTACT = {
  primaryEmail: "odoval@rendigroup.com",
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

