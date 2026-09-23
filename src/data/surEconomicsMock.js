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
  // LOG Consultancy Group estuvo en esta lista y ya no existe (confirmado por el
  // cliente el 21/09/2026). No se repone.
];


/**
 * El perfil de LinkedIn de cada persona, **una sola vez**.
 *
 * Hace falta un mapa y no un campo suelto en cada ficha porque la misma persona sale en
 * varios bloques: Óscar Doval en cuatro —junta, consejo, comité y colaboradores—, Pablo
 * Quintero en otros cuatro, Alex Lund y Saúl Benarroch en dos. Con la dirección en cada
 * sitio,
 * corregir un perfil obliga a acordarse de los demás, y el día que alguien cambie su
 * vanity URL quedarían fichas apuntando a una página que ya no existe.
 *
 * Las direcciones vienen limpias de los parámetros de seguimiento (`utm_source`,
 * `utm_medium`…) que LinkedIn añade al compartir desde el móvil: no aportan nada a quien
 * pulsa y le cuentan a LinkedIn desde dónde salió cada visita.
 *
 * Las tres con acentos van codificadas en porcentajes. Un navegador moderno lo hace solo
 * si se escribe `andrés`, pero la forma codificada es la que no depende de eso — y es la
 * que sobrevive a que este archivo se abra alguna vez con otra codificación.
 */
const LINKEDIN = {
  oscarDoval: "https://www.linkedin.com/in/oscardoval",
  danielBerconsky: "https://www.linkedin.com/in/daniel-berconsky-b99b4816a",
  aknatonMatute: "https://www.linkedin.com/in/aknatonmatute",
  pabloQuintero:
    "https://www.linkedin.com/in/pablo-andr%C3%A9s-quintero-m-07a821119",
  alexLund: "https://www.linkedin.com/in/alex-lund-77ba56151",
  arianaZambrano: "https://www.linkedin.com/in/ariana-zambrano-4a3b28295",
  mariaFernanda:
    "https://www.linkedin.com/in/mar%C3%ADa-fernanda-hern%C3%A1ndez-0a0b6a280",
  ramonMarquina: "https://www.linkedin.com/in/ramon-marquina-perez-87a253340",
  ambarPrato: "https://www.linkedin.com/in/ambar-callejones-prato-604b79279",
  veronicaAcosta:
    "https://www.linkedin.com/in/ver%C3%B3nica-acosta-noguera-20088b2b9",
  saulBenarroch: "https://www.linkedin.com/in/saul-benarroch-3361bb411",
  luisOjeda: "https://www.linkedin.com/in/luisojeda-dev",
  manuelOropeza:
    "https://www.linkedin.com/in/manuel-eduardo-oropeza-perez-84072891",
  mateoRodriguez: "https://www.linkedin.com/in/mateo-r-025673219",
};

export const TEAM = {
  // Reestructurado el 15/09/2026 para calcar los seis bloques del documento del
  // cliente ("Quiénes Somos - SurE"): antes Director General, Editor en Jefe y Comité
  // Editorial vivían fusionados en un solo grupo, y no había ni Equipo ni
  // Colaboradores. El documento los separa en seis divs, y la misma persona aparece en
  // más de uno -- Óscar Doval en tres, Pablo Quintero en otros tres -- que es
  // exactamente cómo el documento lo tiene: cada bloque es un cargo o un comité, no
  // una casilla exclusiva de una sola persona.
  //
  // Sigue sin haber resumenes (el cliente los quito en 10/2026): el campo no existe
  // en los datos en vez de quedarse vacio en veinte sitios. La foto tampoco vive
  // aqui -- se sube desde el panel y se guarda por separado -- y por eso casi toda
  // ficha nueva trae `fotoId`: es la clave real bajo la que ya esta (o va a estar)
  // guardada su foto, y no siempre coincide con el `id` de esta ficha en concreto.
  // Ver `claveDeFoto`.
  board: [
    {
      id: "junta-oscar-doval",
      fotoId: "junta-oscar-doval",
      name: "Óscar Doval",
      cvUrl: "#",
      email: "",
      links: [], linkedin: LINKEDIN.oscarDoval,
    },
    {
      id: "junta-daniel-berconsky",
      name: "Daniel Berconsky",
      cvUrl: "#",
      email: "",
      links: [], linkedin: LINKEDIN.danielBerconsky,
    },
    { id: "junta-guillermo-leandro", name: "Guillermo Leandro", cvUrl: "#", email: "", links: [] },
    { id: "junta-aknaton-matute", name: "Aknatón Matute", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.aknatonMatute },
  ],
  // Antes compartia grupo con Editor en Jefe y Comite Editorial. El documento le da
  // su propio bloque, de una sola persona.
  directorGeneral: [
    {
      id: "consejo-oscar-doval",
      fotoId: "junta-oscar-doval",
      name: "Óscar Doval",
      cvUrl: "#",
      email: "",
      links: [], linkedin: LINKEDIN.oscarDoval,
    },
  ],
  // Mismo caso que Director General: bloque propio.
  editorEnJefe: [
    {
      id: "consejo-pablo-quintero",
      name: "Pablo Quintero",
      cvUrl: "https://www.pabloandresquintero.com/sobre-mi",
      email: "",
      links: [], linkedin: LINKEDIN.pabloQuintero,
    },
  ],
  // Los tres, calcados del documento.
  editorialCommittee: [
    {
      id: "comite-pablo-quintero",
      fotoId: "consejo-pablo-quintero",
      name: "Pablo Quintero",
      cvUrl: "https://www.pabloandresquintero.com/sobre-mi",
      email: "",
      links: [], linkedin: LINKEDIN.pabloQuintero,
    },
    {
      id: "comite-oscar-doval",
      fotoId: "junta-oscar-doval",
      name: "Óscar Doval",
      cvUrl: "#",
      email: "",
      links: [], linkedin: LINKEDIN.oscarDoval,
    },
    // Id sin cambiar: es su ficha original (antes vivia sola en "editorialBoard"), y
    // ese id es la clave con la que ya podria estar guardada su foto.
    { id: "consejo-alex-lund", name: "Alex Lund", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.alexLund },
  ],
  // El documento suma aqui a Pablo Quintero y Alex Lund, ademas de a quienes ya
  // estaban.
  team: [
    {
      id: "equipo-pablo-quintero",
      fotoId: "consejo-pablo-quintero",
      name: "Pablo Quintero",
      cvUrl: "https://www.pabloandresquintero.com/sobre-mi",
      email: "",
      links: [], linkedin: LINKEDIN.pabloQuintero,
    },
    { id: "equipo-alex-lund", fotoId: "consejo-alex-lund", name: "Alex Lund", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.alexLund },
    { id: "marketing-ariana-zambrano", name: "Ariana Zambrano", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.arianaZambrano },
    { id: "marketing-maria-fernanda", name: "María Fernanda Hernández", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.mariaFernanda },
    { id: "ti-ramon-marquina", name: "Ramón Marquina", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.ramonMarquina },
    { id: "marketing-ambar-prato", name: "Ámbar Prato", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.ambarPrato },
    // No esta en el documento -- se sumo despues, a pedido explicito del cliente
    // (09/2026). Va junto a Ambar y no al final: este grupo tenia orden por oficio, y
    // separar a las dos disenadoras rompia lo unico que lo ordenaba.
    { id: "diseno-veronica-acosta", name: "Verónica Acosta", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.veronicaAcosta },
    { id: "operativo-saul-benarroch", name: "Saúl Benarroch", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.saulBenarroch },
    { id: "ti-luis-ojeda", name: "Luis Ojeda", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.luisOjeda },
    { id: "operativo-manuel-oropeza", name: "Manuel Oropeza", cvUrl: "#", email: "", links: [], linkedin: LINKEDIN.manuelOropeza },
  ],
  // Vuelve (15/09/2026): se habia retirado en 10/2026 porque un titulo de seccion sin
  // nadie debajo se leeria como un hueco, y el documento la trae con gente adentro.
  // Aqui la ficha lleva `bio` -- de donde viene la persona -- en vez de `role`: no
  // tienen un cargo en la redaccion, son colaboradores externos.
  collaborators: [
    {
      id: "colaborador-mateo-rodriguez",
      name: "Mateo Rodríguez",
      bio: "Estudiante de Economía, Universidad Católica Andrés Bello, Caracas, Venezuela.",
      cvUrl: "#",
      email: "",
      links: [], linkedin: LINKEDIN.mateoRodriguez,
    },
    {
      id: "colaborador-saul-benarroch",
      fotoId: "operativo-saul-benarroch",
      name: "Saúl Benarroch",
      bio: "Estudiante de Economía, Universidad Metropolitana, Caracas, Venezuela.",
      cvUrl: "#",
      email: "",
      links: [], linkedin: LINKEDIN.saulBenarroch,
    },
    {
      id: "colaborador-oscar-doval",
      fotoId: "junta-oscar-doval",
      name: "Óscar Doval",
      bio: "Médico, MS en Economía Internacional, Caracas, Venezuela.",
      cvUrl: "#",
      email: "",
      links: [], linkedin: LINKEDIN.oscarDoval,
    },
    {
      id: "colaborador-pablo-quintero",
      fotoId: "consejo-pablo-quintero",
      name: "Pablo Quintero",
      bio: "Politólogo, Caracas, Venezuela.",
      cvUrl: "https://www.pabloandresquintero.com/sobre-mi",
      email: "",
      links: [], linkedin: LINKEDIN.pabloQuintero,
    },
  ],
};

/**
 * Con qué clave se guarda la foto de una ficha del equipo.
 *
 * Normalmente es su propio `id`. La excepción es quien aparece en más de un grupo --
 * hoy Óscar Doval (Junta Directiva, Director General, Comité Editorial y
 * Colaboradores), Pablo Quintero (Editor en Jefe, Comité Editorial, Equipo y
 * Colaboradores), Alex Lund (Comité Editorial y Equipo) y Saúl Benarroch (Equipo y
 * Colaboradores) --: todas sus fichas son la misma persona y tienen que compartir
 * retrato. Sin esto, subirle la foto en un grupo dejaba a las demás con las
 * iniciales, y habría que acordarse de subirla una vez por ficha.
 *
 * El `fotoId` compartido es el id de la ficha más antigua de esa persona -- la que
 * ya existía antes de este reparto en seis grupos --, y no un nombre más bonito, por
 * un motivo concreto: esa es la clave con la que su foto ya está guardada. Cambiarla
 * habría dejado la foto huérfana y obligado a volver a subirla.
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

