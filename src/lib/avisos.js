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
  })),
});

/**
 * El informe de la redacción de un aviso (`services/avisos_redaccion.py`), o nada si el
 * aviso todavía no tiene pieza. `cifras`: cada cifra del borrador con los medios que la
 * dan. `quitadas`: las frases que se quitaron por traer una cifra que no está en las
 * fuentes. `nombres`: los nombres propios que no se vieron escritos igual en las fuentes.
 */
export const leerRevision = (r) => {
  if (!r || typeof r !== "object") return null;
  return {
    conIa: r.con_ia === true,
    cifras: lista(r.cifras).map((c) => ({ texto: String(c?.texto ?? ""), medios: lista(c?.medios) })),
    quitadas: lista(r.quitadas),
    nombres: lista(r.nombres),
    avisos: lista(r.avisos),
    palabras: numero(r.palabras),
    fuentes: numero(r.fuentes),
  };
};

/**
 * Lo que hay que decir de un borrador, en una línea, y si pide atención (`ojo`): se
 * quitaron frases, hay nombres por comprobar o algún aviso. Que no pida atención no
 * quiere decir que se publique sin leer: es un borrador.
 */
export const comprobacion = (revision) => {
  if (!revision) return null;
  if (!revision.conIa) {
    return { ojo: false, linea: `Borrador vacío, con el título y ${revision.fuentes === 1 ? "la fuente puesta" : `las ${revision.fuentes} fuentes puestas`}. Falta escribirla.` };
  }
  const cosas = revision.quitadas.length + revision.nombres.length + revision.avisos.length;
  const base = `Escrita por la IA con ${revision.fuentes === 1 ? "1 medio" : `${revision.fuentes} medios`}, ${revision.palabras} palabras.`;
  return cosas
    ? { ojo: true, linea: `${base} Hay ${cosas === 1 ? "1 cosa" : `${cosas} cosas`} que mirar antes de publicar.` }
    : { ojo: false, linea: `${base} Todas las cifras están en las fuentes.` };
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
 * persona, o con uno que ya terminó, nada.
 */
export const accionesDe = (aviso, miId) => {
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

/** En qué vista se abre la página: si no hay avisos de hoy, lo que se avisaría ahora. */
export const vistaInicial = ({ avisos }) => (avisos.length ? "hoy" : "ahora");
