/**
 * El equipo de «Quiénes somos»: quién está en cada bloque, su perfil de LinkedIn y con
 * qué clave se guarda su foto. Lo usan solo esa página (`ArbolDelEquipo.jsx`) y el panel
 * (`AdminEquipo.jsx`), que se cargan aparte: por eso no está en `sitio.js`, que va en el
 * paquete de cada lector.
 */

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
      // Sin CV a pedido del cliente (10/2026): solo LinkedIn, como los demás. Su
      // página personal era https://www.pabloandresquintero.com/sobre-mi.
      cvUrl: "#",
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
      cvUrl: "#",
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
      cvUrl: "#",
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
    // Manuel Oropeza salió del equipo a pedido del cliente (10/2026).
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
      cvUrl: "#",
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
