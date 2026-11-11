/**
 * La lógica de «Avisos de noticias» en el panel (`pages/admin/AdminAvisos.jsx`): cómo se
 * lee lo que manda el servidor y qué se dice de cada aviso. Sin React ni red, para
 * poder probarla sola (`npm run test:avisos`).
 *
 * Un aviso es un hecho que la redacción debería mirar (ver `services/avisos_service.py`
 * en el backend). Pasa por estos estados: `pendiente` → `tomado` → `redactado` →
 * `publicado`; o se queda en `descartado` (con su motivo) o en `vencido`.
 */

/** Por qué se descarta un aviso, como se dice en pantalla. */
export const NOMBRE_DE_MOTIVO = {
  ya_la_dimos: "Ya la dimos",
  no_es_nuestro_tema: "No es nuestro tema",
  poca_cosa: "Poca cosa",
};

export const nombreDeMotivo = (motivo) => NOMBRE_DE_MOTIVO[motivo] ?? motivo ?? "sin motivo";

const paises = new Intl.DisplayNames("es", { type: "region" });

/** El país por su nombre: «Venezuela» y no «VE». Si el código no es de un país, tal cual. */
export const nombreDePais = (iso) => {
  if (!iso) return "Sin país";
  // Así marcan los titulares lo que no es de un solo país.
  if (String(iso).toUpperCase() === "GLOBAL") return "Internacional";
  try {
    return paises.of(String(iso).toUpperCase()) || iso;
  } catch {
    return iso;
  }
};

const lista = (valor) => (Array.isArray(valor) ? valor : []);
const numero = (valor, porDefecto = 0) => (Number.isFinite(Number(valor)) ? Number(valor) : porDefecto);

/** Lo común a las dos respuestas: si están encendidos y cuántos quedan hoy. */
const leerDia = (data) => ({
  activos: data?.activos === true,
  silencio: data?.silencio === true,
  maxAlDia: numero(data?.max_al_dia, 10),
  quedan: numero(data?.quedan),
  motivos: lista(data?.motivos).length ? lista(data.motivos) : Object.keys(NOMBRE_DE_MOTIVO),
});

const leerFuentes = (fuentes) =>
  lista(fuentes).map((f) => ({ medio: f?.medio || "Sin nombre", titulo: f?.titulo || "", url: f?.url || null }));

/** `GET /admin/avisos`: los avisos de hoy y el estado del día. */
export const leerAvisos = (data) => ({
  ...leerDia(data),
  avisos: lista(data?.avisos).map((a) => ({
    id: a.id,
    titulo: a.titulo || "",
    pais: a.pais || null,
    calor: numero(a.calor),
    medios: numero(a.medios),
    estado: a.estado || "pendiente",
    tomadoPorId: a.tomado_por_id ?? null,
    tomadoPor: a.tomado_por || null,
    motivo: a.motivo_descarte || null,
    piezaId: a.post_id ?? null,
    creado: a.creado_en || null,
    fuentes: leerFuentes(a.fuentes),
    revision: leerRevision(a.revision),
    // Alguien lo está redactando ahora mismo (quizá uno mismo, en otra pestaña).
    redactando: a.redactando === true,
  })),
});

/** Por qué no se pudo leer el artículo de un medio, como se dice en pantalla. */
export const MOTIVO_SIN_LEER = {
  google_news: "llegó por Google News y su enlace no se puede abrir",
  bloqueado: "el sitio no deja leer a programas",
  no_respondio: "no respondió a tiempo",
  poco_texto: "la página no traía el texto (un muro de pago, por ejemplo)",
  otra_cosa: "la página no hablaba de esta noticia",
  no_es_una_pagina: "el enlace no era una página",
};

/** Por qué se quitó una frase del borrador. */
export const MOTIVO_QUITADA = {
  cifra: "traía una cifra que no está en las fuentes",
  cita: "traía una cita que no está, palabra por palabra, en ningún artículo",
};

/**
 * El informe de la redacción de un aviso (`services/avisos_redaccion.py`), o nada si el
 * aviso todavía no tiene pieza.
 *
 * - `leidos` y `sinLeer`: de qué medios se leyó el artículo entero y de cuáles no, y por qué.
 * - `cifras`: cada cifra del borrador con los medios que la dan.
 * - `quitadas`: las frases que se quitaron por traer una cifra o una cita sin respaldo.
 * - `copiadas`: las que quedaron casi iguales a las de un medio: hay que reescribirlas.
 * - `nombres`: los nombres propios que no se vieron escritos igual en las fuentes.
 */
export const leerRevision = (r) => {
  if (!r || typeof r !== "object") return null;
  return {
    conIa: r.con_ia === true,
    leidos: lista(r.leidos).map((l) => ({ medio: l?.medio || "Sin nombre", palabras: numero(l?.palabras) })),
    sinLeer: lista(r.sin_leer).map((s) => ({ medio: s?.medio || "Sin nombre", motivo: s?.motivo || "no_respondio" })),
    cifras: lista(r.cifras).map((c) => ({ texto: String(c?.texto ?? ""), medios: lista(c?.medios) })),
    // Los primeros informes guardaban solo la frase: eran todas por una cifra.
    quitadas: lista(r.quitadas).map((q) =>
      typeof q === "string" ? { frase: q, motivo: "cifra" } : { frase: q?.frase || "", motivo: q?.motivo || "cifra" },
    ),
    copiadas: lista(r.copiadas).map((c) => ({ frase: c?.frase || "", medio: c?.medio || "un medio" })),
    nombres: lista(r.nombres),
    avisos: lista(r.avisos),
    palabras: numero(r.palabras),
    fuentes: numero(r.fuentes),
  };
};

/**
 * Lo que hay que decir de un borrador, en una línea, y si pide atención (`ojo`): se
 * quitaron frases, quedaron frases copiadas, hay nombres por comprobar o algún aviso.
 * Que no pida atención no quiere decir que se publique sin leer: es un borrador.
 */
export const comprobacion = (revision) => {
  if (!revision) return null;
  if (!revision.conIa) {
    return { ojo: false, linea: `Borrador vacío, con el título y ${revision.fuentes === 1 ? "la fuente puesta" : `las ${revision.fuentes} fuentes puestas`}. Falta escribirla.` };
  }
  const leidos = revision.leidos.length;
  const con = leidos
    ? `leyendo ${leidos === 1 ? "el artículo de 1 medio" : `los artículos de ${leidos} medios`}`
    : "solo con los titulares";
  const base = `Escrita por la IA ${con}: ${revision.palabras} palabras.`;
  const cosas = revision.quitadas.length + revision.copiadas.length + revision.nombres.length + revision.avisos.length;
  return cosas
    ? { ojo: true, linea: `${base} Hay ${cosas === 1 ? "1 cosa" : `${cosas} cosas`} que mirar antes de publicar.` }
    : { ojo: false, linea: `${base} Todas las cifras y las citas están en las fuentes.` };
};

/** Lo que salió bien, en pocas palabras: «2 artículos leídos · 10 cifras comprobadas». */
export const detalleDeLoComprobado = (revision) => {
  const partes = [];
  const leidos = revision.leidos.length;
  const total = leidos + revision.sinLeer.length;
  if (total) partes.push(leidos === total ? `${leidos === 1 ? "1 artículo leído" : `${leidos} artículos leídos`}` : `${leidos} de ${total} artículos leídos`);
  const cifras = revision.cifras.length;
  if (cifras) partes.push(cifras === 1 ? "1 cifra comprobada" : `${cifras} cifras comprobadas`);
  return partes.join(" · ");
};

/** `GET /admin/avisos/candidatos`: lo que se avisaría ahora, sin crear nada. */
export const leerCandidatos = (data) => ({
  ...leerDia(data),
  candidatos: lista(data?.candidatos).map((c) => ({
    id: c.cluster_id,
    titulo: c.titulo || "",
    pais: c.pais || null,
    venezuela: c.venezuela === true,
    calor: numero(c.calor),
    medios: numero(c.medios),
    medioPrincipal: c.medio_principal || null,
    enUltimaHora: c.en_ultima_hora === true,
    enEstaPasada: c.en_esta_pasada === true,
    fuentes: leerFuentes(c.fuentes),
  })),
});

/**
 * Cómo está un aviso, para su etiqueta. `tono`: `ok` (avanzó), `mio` (lo tiene quien
 * mira), `apagado` (ya no hay nada que hacer) o nada (pendiente, o lo tiene otra persona).
 */
export const estadoDeAviso = (aviso, miId) => {
  switch (aviso.estado) {
    case "tomado":
      return miId != null && aviso.tomadoPorId === miId
        ? { texto: "Lo tomó usted", tono: "mio" }
        : { texto: `Lo tomó ${aviso.tomadoPor || "otra persona"}`, tono: null };
    case "redactado":
      return { texto: "Con borrador", tono: "ok" };
    case "publicado":
      return { texto: "Publicado", tono: "ok" };
    case "descartado":
      return { texto: `Descartado: ${nombreDeMotivo(aviso.motivo).toLowerCase()}`, tono: "apagado" };
    case "vencido":
      return { texto: "Venció sin que nadie lo tomara", tono: "apagado" };
    default:
      return { texto: "Pendiente", tono: null };
  }
};

/**
 * Qué puede hacer con un aviso quien lo mira, como en el servidor. Uno pendiente se
 * redacta (que también lo aparta), se toma o se descarta; el que uno tomó se redacta, se
 * escribe a mano, se suelta o se descarta; el que ya tiene pieza, se abre; con el de otra
 * persona, con uno que ya terminó o con uno que se está redactando, nada.
 */
export const accionesDe = (aviso, miId) => {
  // Mientras se redacta no se ofrece nada: el servidor rechazaría una segunda petición.
  if (aviso.redactando) return [];
  if (aviso.estado === "pendiente") return ["redactar", "tomar", "descartar"];
  if (aviso.estado === "tomado" && miId != null && aviso.tomadoPorId === miId) {
    return ["redactar", "escribir", "soltar", "descartar"];
  }
  if ((aviso.estado === "redactado" || aviso.estado === "publicado") && aviso.piezaId != null) return ["abrir"];
  return [];
};

/** Cuántos avisos de hoy siguen esperando a alguien. */
export const pendientes = (avisos) => avisos.filter((a) => a.estado === "pendiente").length;

/** La línea de estado de la cabecera: lo que pasa ahora con los avisos. */
export const lineaDelDia = ({ activos, silencio, quedan, maxAlDia }) => {
  if (!activos) return "Apagados: no se crea ningún aviso";
  const cupo = quedan > 0 ? `Quedan ${quedan} de ${maxAlDia} hoy` : `Ya salieron los ${maxAlDia} de hoy`;
  return silencio ? `${cupo} · En silencio hasta las 6:00` : cupo;
};

/** `GET /admin/avisos/bot`: el bot de Telegram de la redacción y quién está vinculado. */
export const leerBot = (data) => {
  const usuario = typeof data?.usuario === "string" && data.usuario ? data.usuario : null;
  return {
    configurado: data?.configurado === true,
    conectado: data?.conectado === true,
    usuario,
    enlace: usuario ? `https://t.me/${usuario}` : null,
    vinculados: lista(data?.vinculados).map((p) => ({
      id: p?.id,
      nombre: p?.nombre || "Sin nombre",
      activo: p?.activo !== false,
      recibeAvisos: p?.recibe_avisos !== false,
    })),
  };
};

/** El estado del bot en una línea. */
export const lineaDelBot = (bot) => {
  if (!bot.configurado) return "Sin configurar: falta su token en Render (REDACCION_TELEGRAM_BOT_TOKEN).";
  if (!bot.conectado) return "Configurado, pero sin conectar: Telegram todavía no sabe adónde llamar.";
  const n = bot.vinculados.filter((p) => p.activo).length;
  const quien = n ? `${n === 1 ? "1 persona vinculada" : `${n} personas vinculadas`}` : "nadie vinculado todavía";
  return `${bot.usuario ? `@${bot.usuario}` : "Conectado"} · ${quien}`;
};

/** En qué vista se abre la página: si no hay avisos de hoy, lo que se avisaría ahora. */
export const vistaInicial = ({ avisos }) => (avisos.length ? "hoy" : "ahora");
