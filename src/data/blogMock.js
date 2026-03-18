/**
 * Mock data for Sur Economics blog.
 * Structured for future replacement with API/CMS.
 */

export const NAV_CATEGORIES = [
  { label: "Análisis", slug: "analisis" },
  { label: "Consejos", slug: "consejos" },
  { label: "Tendencias", slug: "tendencias" },
  { label: "Mercados", slug: "mercados" },
  { label: "Opinión", slug: "opinion" },
];

export const HERO_CLAIM =
  "Análisis y perspectiva sobre economía, mercados e inversión en la región.";

const PEXELS = {
  calculator: "https://images.pexels.com/photos/186461/pexels-photo-186461.jpeg",
  charts: "https://images.pexels.com/photos/187041/pexels-photo-187041.jpeg",
  stockBoard: "https://images.pexels.com/photos/210607/pexels-photo-210607.jpeg",
  finance: "https://images.pexels.com/photos/6289065/pexels-photo-6289065.jpeg",
  growth: "https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg",
  office: "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg",
};

export const HERO_FEATURED = {
  id: "hero-1",
  slug: "perspectivas-inflacion-latam-2025",
  category: "Análisis",
  categorySlug: "analisis",
  title: "Perspectivas de inflación en Latinoamérica para 2025",
  excerpt:
    "Un repaso por las trayectorias de precios en los principales países de la región y lo que implican para inversores y ahorristas.",
  date: "2025-03-10",
  readTime: "8 min",
  imagePlaceholder: "chart",
  imageUrl: PEXELS.calculator,
  author: "Oscar Doval",
  contentType: "Divulgación / información",
  mainTheme: "Economía",
  regionGeo: "Latinoamérica",
  sector: "Finanzas",
};

export const FEATURED_POSTS = [
  {
    id: "fp-1",
    slug: "politica-monetaria-brasil",
    category: "Mercados",
    categorySlug: "mercados",
    title: "Política monetaria en Brasil: qué esperar del próximo trimestre",
    excerpt:
      "El Banco Central de Brasil mantiene un mensaje cauteloso. Revisamos los indicadores clave y el consenso de mercado.",
    date: "2025-03-09",
    readTime: "6 min",
    imagePlaceholder: "building",
    imageUrl: PEXELS.stockBoard,
    author: "Juan Francisco Paz",
    contentType: "Noticias",
    mainTheme: "Política",
    regionGeo: "Brasil",
    sector: "Finanzas",
  },
  {
    id: "fp-2",
    slug: "ahorro-inversion-primeros-pasos",
    category: "Consejos",
    categorySlug: "consejos",
    title: "Ahorro e inversión: primeros pasos con criterio",
    excerpt:
      "Cómo estructurar un plan de ahorro y dar los primeros pasos en inversión sin asumir riesgos innecesarios.",
    date: "2025-03-08",
    readTime: "5 min",
    imagePlaceholder: "growth",
    imageUrl: PEXELS.growth,
    author: "Ariana Zambrano",
    contentType: "Divulgación / información",
    mainTheme: "Inversiones",
    regionGeo: "Latinoamérica",
    sector: "Otros",
  },
  {
    id: "fp-3",
    slug: "consumo-crecimiento-mexico",
    category: "Tendencias",
    categorySlug: "tendencias",
    title: "Consumo y crecimiento en México: señales del último trimestre",
    excerpt:
      "El consumo privado sigue siendo el pilar del PIB. Analizamos las cifras y las expectativas para el resto del año.",
    date: "2025-03-07",
    readTime: "7 min",
    imagePlaceholder: "chart",
    imageUrl: PEXELS.charts,
    author: "Pablo Quintero",
    contentType: "Noticias",
    mainTheme: "Economía",
    regionGeo: "México",
    sector: "Consumo discrecional",
  },
];

export const BLOG_FEED = [
  {
    id: "bf-1",
    slug: "sector-energia-transicion",
    category: "Tendencias",
    categorySlug: "tendencias",
    title: "El sector energía y la transición: oportunidades en la región",
    excerpt:
      "Inversiones en renovables y gas natural están reconfigurando el mapa energético latinoamericano. Dónde mirar.",
    date: "2025-03-06",
    readTime: "9 min",
    imagePlaceholder: "building",
    imageUrl: PEXELS.office,
    author: "Daniel Berconsky Da Ruos",
    contentType: "Divulgación / información",
    mainTheme: "Inversiones",
    regionGeo: "Latinoamérica",
    sector: "Energía",
  },
  {
    id: "bf-2",
    slug: "tipos-cambio-volatilidad",
    category: "Mercados",
    categorySlug: "mercados",
    title: "Tipos de cambio y volatilidad: guía para no improvisar",
    excerpt:
      "La volatilidad cambiaria afecta a empresas y ahorristas. Estrategias sencillas para gestionar el riesgo.",
    date: "2025-03-05",
    readTime: "6 min",
    imagePlaceholder: "chart",
    imageUrl: PEXELS.charts,
    author: "Juan Francisco Paz",
    contentType: "Noticias",
    mainTheme: "Finanzas",
    regionGeo: "Latinoamérica",
    sector: "Finanzas",
  },
  {
    id: "bf-3",
    slug: "opinion-crecimiento-inclusivo",
    category: "Opinión",
    categorySlug: "opinion",
    title: "Crecimiento inclusivo: más que un eslogan",
    excerpt:
      "Por qué el crecimiento económico debe medirse también por su impacto en la distribución y el empleo.",
    date: "2025-03-04",
    readTime: "5 min",
    imagePlaceholder: "growth",
    imageUrl: PEXELS.finance,
    author: "Pablo Quintero",
    contentType: "Opinión",
    mainTheme: "Política",
    regionGeo: "Latinoamérica",
    sector: "Otros",
  },
  {
    id: "bf-4",
    slug: "analisis-pib-colombia",
    category: "Análisis",
    categorySlug: "analisis",
    title: "Análisis del PIB de Colombia: fortalezas y desafíos",
    excerpt:
      "Repasamos las cifras del último reporte y las proyecciones de organismos internacionales para el país.",
    date: "2025-03-03",
    readTime: "7 min",
    imagePlaceholder: "building",
    imageUrl: PEXELS.stockBoard,
    author: "María Fernanda Hernández",
    contentType: "Divulgación / información",
    mainTheme: "Economía",
    regionGeo: "Colombia",
    sector: "Industria",
  },
  {
    id: "bf-5",
    slug: "consejos-fondo-emergencia",
    category: "Consejos",
    categorySlug: "consejos",
    title: "Fondo de emergencia: cuánto y cómo armarlo",
    excerpt:
      "Un colchón financiero es la base de cualquier plan personal. Recomendaciones prácticas según tu situación.",
    date: "2025-03-02",
    readTime: "4 min",
    imagePlaceholder: "growth",
    imageUrl: PEXELS.calculator,
    author: "Ariana Zambrano",
    contentType: "Divulgación / información",
    mainTheme: "Inversiones",
    regionGeo: "Latinoamérica",
    sector: "Otros",
  },
  {
    id: "bf-6",
    slug: "mercados-bonos-emergentes",
    category: "Mercados",
    categorySlug: "mercados",
    title: "Bonos emergentes: flujos y perspectivas de renta fija",
    excerpt:
      "Los flujos hacia deuda emergente han repuntado. Revisamos el contexto y las consideraciones de riesgo.",
    date: "2025-03-01",
    readTime: "8 min",
    imagePlaceholder: "chart",
    imageUrl: PEXELS.growth,
    author: "Daniel Berconsky Da Ruos",
    contentType: "Noticias",
    mainTheme: "Finanzas",
    regionGeo: "Cono Sur",
    sector: "Finanzas",
  },
  {
    id: "bf-7",
    slug: "telecom-tecnologia-inversion-usa",
    category: "Tendencias",
    categorySlug: "tendencias",
    title: "Telecomunicaciones y tecnología: señales para invertir en USA",
    excerpt:
      "Un mapa de expectativas para infraestructura digital: demanda, regulación y sensibilidad a tasas en el ciclo actual.",
    date: "2025-02-27",
    readTime: "7 min",
    imagePlaceholder: "building",
    imageUrl: PEXELS.office,
    author: "Oscar Doval",
    contentType: "Divulgación / información",
    mainTheme: "Inversiones",
    regionGeo: "USA",
    sector: "Telecomunicaciones",
  },
  {
    id: "bf-8",
    slug: "china-materia-prima-riesgo-volatilidad",
    category: "Mercados",
    categorySlug: "mercados",
    title: "China y materia prima: riesgo, demanda y volatilidad",
    excerpt:
      "Cómo interpretar el ciclo industrial y su impacto en precios internacionales, inventarios y expectativas de oferta.",
    date: "2025-02-25",
    readTime: "6 min",
    imagePlaceholder: "chart",
    imageUrl: PEXELS.charts,
    author: "Juan Francisco Paz",
    contentType: "Noticias",
    mainTheme: "Economía",
    regionGeo: "Asia",
    sector: "Materia prima",
  },
  {
    id: "bf-9",
    slug: "inmobiliario-construccion-mercados-argentinos",
    category: "Análisis",
    categorySlug: "analisis",
    title: "Inmobiliario y construcción: lectura de precios y demanda en la región",
    excerpt:
      "Un análisis de comportamiento del sector, con foco en financiamiento, oferta y sensibilidad a expectativas macro.",
    date: "2025-02-21",
    readTime: "8 min",
    imagePlaceholder: "building",
    imageUrl: PEXELS.stockBoard,
    author: "Pablo Quintero",
    contentType: "Divulgación / información",
    mainTheme: "Finanzas",
    regionGeo: "América del Sur",
    sector: "Construcción",
  },
];

export const SUGGESTED_READING = [
  {
    id: "sr-1",
    slug: "perspectivas-inflacion-latam-2025",
    category: "Análisis",
    title: "Perspectivas de inflación en Latinoamérica para 2025",
    readTime: "8 min",
  },
  {
    id: "sr-2",
    slug: "politica-monetaria-brasil",
    category: "Mercados",
    title: "Política monetaria en Brasil: qué esperar",
    readTime: "6 min",
  },
  {
    id: "sr-3",
    slug: "ahorro-inversion-primeros-pasos",
    category: "Consejos",
    title: "Ahorro e inversión: primeros pasos con criterio",
    readTime: "5 min",
  },
  {
    id: "sr-4",
    slug: "sector-energia-transicion",
    category: "Tendencias",
    title: "El sector energía y la transición",
    readTime: "9 min",
  },
];

export const ABOUT_TEXT = {
  name: "Sur Economics",
  tagline: "Economía, mercados e inversión con perspectiva regional.",
  description:
    "Sur Economics es un espacio editorial dedicado al análisis económico y financiero con foco en Latinoamérica. Ofrecemos contenido riguroso y accesible sobre inflación, política monetaria, mercados, ahorro e inversión, pensado para lectores que buscan claridad y criterio. Nuestro objetivo es contribuir a una comprensión más informada de la economía y las decisiones financieras.",
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/** All posts flattened for listing/filtering and lookup by slug. */
export const ALL_POSTS = [
  { ...HERO_FEATURED },
  ...FEATURED_POSTS,
  ...BLOG_FEED,
];

export const getPostBySlug = (slug) =>
  ALL_POSTS.find((p) => p.slug === slug) ?? null;
