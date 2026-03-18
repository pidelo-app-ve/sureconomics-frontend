/**
 * Institutional mock data for Sur Economics.
 * Keep UI and content separated so it can be replaced by CMS/API later.
 */

export const BRAND = {
  name: "Sur Economics",
  tagline: "Economía, mercados e inversión con inteligencia regional.",
  description:
    "Sur Economics es una plataforma editorial e institucional dedicada al análisis económico y financiero de América Latina. Combinamos investigación, lectura clara y una mirada estratégica para apoyar decisiones de inversión, empresas e institucionalidad.",
};

export const PRIMARY_NAV = [
  { id: "inicio", to: "/", labelKey: "nav.inicio" },
  { id: "quienes-somos", to: "/quienes-somos", labelKey: "nav.quienesSomos" },
  { id: "articulos", to: "/articulos", labelKey: "nav.articulos" },
  {
    id: "informes",
    to: "/informes",
    labelKey: "nav.informesReportes",
  },
  { id: "suscripcion", to: "/suscribirse", labelKey: "nav.suscripcion" },
  { id: "consultoria", to: "/consultoria", labelKey: "nav.consultoria" },
  { id: "contacto", to: "/contacto", labelKey: "nav.contacto" },
];

export const PARTNERS = [
  { id: "rendi-avisor", name: "RendiGroup Avisor" },
  { id: "rendivalores-cb", name: "Rendivalores Casa de Bolsa C.A." },
  { id: "rendivalores-agricola", name: "Rendivalores Casa de Bolsa Agrícola C.A." },
  { id: "pidelo-alalza", name: "Pídelo by Alalza" },
  { id: "moore-capital", name: "Moore Capital SA" },
  { id: "log-consultancy", name: "LOG Consultancy Group" },
];

export const TEAM = {
  leadership: [
    {
      id: "editor-oscar-doval",
      name: "Oscar Doval",
      role: "Editor en Jefe",
      summary:
        "Lidera la dirección editorial y la línea de investigación del medio. Enfoque en rigor, claridad y mirada regional.",
      cvUrl: "#",
      email: "editor@su-reconomics.example",
      links: [],
    },
    {
      id: "director-finanzas-daniel-berconsky",
      name: "Daniel Berconsky Da Ruos",
      role: "Director de Finanzas",
      summary:
        "Supervisa el marco financiero y el acompañamiento institucional. Aporta visión estratégica para proyectos de inteligencia e inversión.",
      cvUrl: "#",
      email: "finanzas@su-reconomics.example",
      links: [],
    },
    {
      id: "director-operaciones-juan-francisco-paz",
      name: "Juan Francisco Paz",
      role: "Director de Operaciones y comercialización",
      summary:
        "Conecta la operación editorial y el componente comercial con una metodología orientada a valor para aliados e inversionistas.",
      cvUrl: "#",
      email: "operaciones@su-reconomics.example",
      links: [],
    },
  ],
  editorialBoard: [
    { id: "consejo-oscar-doval", name: "Oscar Doval", role: "Consejo Editorial", summary: "Rigor y criterio editorial.", cvUrl: "#", email: "consejo@su-reconomics.example", links: [] },
    {
      id: "consejo-pablo-quintero",
      name: "Pablo Quintero",
      role: "Consejo Editorial",
      summary:
        "Politólogo (Universidad Central de Venezuela). Consultor político, asesor en comunicación y asuntos corporativos. Socio director de LOG Consultancy.",
      cvUrl: "https://www.pabloandresquintero.com/sobre-mi",
      email: "pablo.quintero@su-reconomics.example",
      links: [],
    },
    {
      id: "consejo-juan-francisco-paz",
      name: "Juan Francisco Paz",
      role: "Consejo Editorial",
      summary:
        "Economista (Universidad Católica Andrés Bello). Consultor del Banco de Desarrollo de América Latina (CAF).",
      cvUrl: "#",
      email: "juan.paz@su-reconomics.example",
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
      email: "ariana@su-reconomics.example",
      links: [],
    },
    {
      id: "marketing-maria-fernanda",
      name: "María Fernanda Hernández",
      role: "Mercadeo y diseño",
      summary: "Dirección de contenido y estrategia de experiencia editorial.",
      cvUrl: "#",
      email: "maria.fernanda@su-reconomics.example",
      links: [],
    },
    {
      id: "ti-jose-morillo",
      name: "José Morillo",
      role: "TI",
      summary: "Soporte tecnológico y evolución del producto.",
      cvUrl: "#",
      email: "ti@su-reconomics.example",
      links: [],
    },
  ],
  collaborators: [
    { id: "col-juan-domingo-cordero", name: "Juan Domingo Cordero Osorio", role: "Colaborador", summary: "Investigación y aportes sectoriales.", cvUrl: "#", email: "", links: [] },
    { id: "col-simon-cordero-osorio", name: "Simón Cordero Osorio", role: "Colaborador", summary: "Aportes en análisis regional.", cvUrl: "#", email: "", links: [] },
    { id: "col-daniel-berconsky", name: "Daniel Berconsky Da Ruos", role: "Colaborador", summary: "Acompañamiento financiero.", cvUrl: "#", email: "", links: [] },
    { id: "col-aknatón-matute", name: "Aknatón Matute", role: "Colaborador", summary: "Investigación y contenido.", cvUrl: "#", email: "", links: [] },
    { id: "col-guillermo-leandro", name: "Guillermo Leandro", role: "Colaborador", summary: "Visión sectorial.", cvUrl: "#", email: "", links: [] },
    {
      id: "col-giulio-cellini",
      name: "Giulio Cellini",
      role: "Colaborador",
      summary:
        "Abogado (Universidad Católica Andrés Bello). Representante ante el Consejo Universitario de UCAB y Concejal del Municipio El Hatillo.",
      cvUrl:
        "https://unionradio.net/experto-ve-positivo-pero-insuficiente-la-medida-para-revisar-las-inhabilitaciones/",
      email: "",
      links: [],
    },
    {
      id: "col-leonardo-ramirez",
      name: "Leonardo Ramírez",
      role: "Colaborador",
      summary:
        "Estudios de administración y finanzas de la Universidad Católica. Director de Invicto Capital.",
      cvUrl: "#",
      email: "",
      links: [],
    },
    {
      id: "col-andres-silva",
      name: "Andres Silva Ayala",
      role: "Colaborador",
      summary:
        "Abogado (Universidad Monteávila). Máster en Comunicación y Marketing Político. Consultor político.",
      cvUrl:
        "https://www.linkedin.com/in/andr%C3%A9s-silva-ayala-543aa1142/?originalSubdomain=ve",
      email: "",
      links: [],
    },
  ],
  researchTeam: [
    { id: "res-juan-francisco-paz", name: "Juan Francisco Paz", role: "Equipo de Investigación", summary: "Líneas de investigación y coordinación.", cvUrl: "#", email: "", links: [] },
    { id: "res-sofia-venavidez", name: "Sofía Venavidez", role: "Equipo de Investigación", summary: "Análisis y recopilación de datos.", cvUrl: "#", email: "", links: [] },
    { id: "res-cesar-guillen", name: "César Guillén", role: "Equipo de Investigación", summary: "Estructuración de informes.", cvUrl: "#", email: "", links: [] },
    { id: "res-alessandro-ferrara", name: "Alessandro Ferrara", role: "Equipo de Investigación", summary: "Investigación comparada.", cvUrl: "#", email: "", links: [] },
    { id: "res-saul-benarroch", name: "Saul Benarroch", role: "Equipo de Investigación", summary: "Modelos y lecturas de riesgo.", cvUrl: "#", email: "", links: [] },
    { id: "res-mateo-rodriguez", name: "Mateo Rodríguez", role: "Equipo de Investigación", summary: "Monitoreo regional y síntesis.", cvUrl: "#", email: "", links: [] },
  ],
};

export const INSTITUTIONAL = {
  purpose:
    "Grupo intergeneracional de profesionales con presencia en Miami, Caracas, Bogotá, Asunción y Buenos Aires, reunidos con la visión de crear la plataforma y el medio más robusto de información y conocimiento económico y financiero de América Latina.",
  objectives: [
    "Generar información económica y financiera de valor para distintos países y bloques económicos latinoamericanos.",
    "Integrar datos cuantitativos y cualitativos obtenidos de bases de datos confiables e investigaciones de campo exhaustivas.",
    "Brindar una comprensión profunda de la dinámica geoeconómica y geopolítica de la región.",
    "Servir a inversionistas que desean maximizar su utilidad a través de inversiones directas o instrumentos financieros.",
    "Promover oportunidades de inversión en Latinoamérica.",
  ],
};

export const CONTACT = {
  primaryEmail: "contacto@su-reconomics.example",
  leadershipEmails: [
    { name: "Juan Francisco Paz", email: "juan.paz@su-reconomics.example" },
    { name: "Oscar Doval", email: "editor@su-reconomics.example" },
  ],
  offices: [
    { city: "Miami", address: "Dirección próximamente" },
    { city: "Caracas", address: "Dirección próximamente" },
    { city: "Bogotá", address: "Dirección próximamente" },
    { city: "Asunción", address: "Dirección próximamente" },
    { city: "Buenos Aires", address: "Dirección próximamente" },
  ],
};

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

