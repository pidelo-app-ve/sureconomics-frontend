/**
 * El formulario del editor de piezas: su forma vacía, cómo llega de la API y cómo se
 * manda, y las fechas en hora de Caracas. Sin React: lo usan `AdminPostEditor` y sus
 * partes de `components/admin/editorDePieza/`.
 */

/**
 * Which extra fields each format asks for.
 *
 * Kept here rather than read from the API because it is a statement about the
 * *form*, not about the content: the backend already says which file a format
 * needs (`required_media`) and whether it carries a byline (`shows_author`), and
 * those are the two rules the database enforces. This map only decides which
 * inputs are worth showing.
 *
 * ``image`` is on artículo alone, and that is deliberate. Artículos are the only
 * format whose layout prints one -- `ArticleCardGrid` renders it, and the news
 * list, the editorial list, the interview grid and the report grid all do not.
 * Asking a noticia for an image is asking an editor to find a photograph the site
 * will never display.
 */
// Sources are not in here: every format can cite them. Editorial having no source
// field was reported as a bug, and there is no format for which "where did this
// come from" is the wrong question.
// Only the fields that genuinely belong to one format. The image is not among
// them: it used to be listed under `articulo` alone, on the theory that only that
// layout printed one -- which meant the newsroom had nowhere to attach the photo
// they had for a noticia, and every noticia published with a generated placeholder.
// Any piece can carry an image, so it is asked for unconditionally below.
/**
 * What the image actually does, per format, because it is not the same everywhere.
 *
 * Only the artículo listing draws a card with an image. Noticias, editorial and
 * informes list as text, so for those the image appears when the piece is opened
 * and in the front-page feature -- and the hint has to say so. A field that
 * promises a thumbnail nobody will see is how the newsroom stops trusting the
 * form.
 */
export const IMAGE_HINT = {
    articulo:
        "Opcional. Se ve en la tarjeta del listado y al abrir el artículo. Si la deja vacía, se muestra un fondo de color.",
    entrevista:
        "Opcional. Al abrir la entrevista lo primero es el video; esta imagen se usa cuando la pieza sale destacada en portada.",
    default:
        "Opcional. Se ve al abrir la pieza y cuando sale destacada en portada. En el listado, este formato se muestra como texto, sin miniatura.",
};

export const FORMAT_FIELDS = {
    // `opinion` -- el bloque "¿Qué piensa SurEconomics?" -- salió de aquí porque
    // nadie lo llenaba: estaba en nulo en las veinte noticias publicadas. Un campo
    // que ocupa espacio en el formulario y nunca se usa entrena a la redacción a
    // saltárselo. La columna sigue en la base y la vista de lectura sigue sabiendo
    // dibujarlo, así que reponerlo es volver a listarlo aquí.
    entrevista: ["interviewee"],
    informe: ["unit"],
};

/** Los formatos cuyo cuerpo admite fotos entre párrafos. */
export const FORMATOS_CON_FOTOS_EN_EL_CUERPO = new Set(["articulo", "noticia", "editorial"]);

export const emptyForm = () => ({
    format: "",
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    meta_title: "",
    seo_automatico: false,
    meta_description: "",
    canonical_url: "",
    byline: "",
    featured_image_url: "",
    status: "draft",
    published_at: "",
    topic_ids: [],
    place_ids: [],
    sources: [],
    interviewee: "",
    interviewee_role: "",
    unit: "",
    image_asset_id: null,
    // El encuadre de la foto: «x,y» o vacío (el centro). Ver `EncuadreDeFoto`.
    imagen_foco: "",
    video_asset_id: null,
    document_asset_id: null,
    audio_asset_id: null,
    byline_photo_asset_id: null,
    // Cerrado por omision: crear un informe sin decir nada lo deja pidiendo cuenta.
    // En una decision de acceso, el valor por omision tiene que ser el restrictivo.
    document_open_access: false,
    // Sin marcar por omision: una pieza nueva no entra en la seccion educativa sin
    // que alguien lo decida.
    is_educational: false,
    sin_publicidad: false,
    // La Clave al final de la pieza: vacío, no hay juego.
    juego_palabra: "",
    juego_pista: "",
    moneda: "",
    // La pieza en inglés, para /en. Vacía, la pieza sale en español con aviso.
    title_en: "",
    excerpt_en: "",
    content_en: "",
    traduccion_automatica: false,
    // «Abrir la portada con esta pieza». Tres campos del formulario para un solo campo
    // de la API (`destacada_hasta`): la casilla, cuánto dura y, si se eligió una fecha,
    // cuál. Sin marcar por omisión: fijar la portada es una decisión, no un efecto.
    portada: false,
    portada_durante: "24",
    portada_hasta: "",
});

/** Las duraciones que ofrece el selector «Durante». `fecha` abre el `datetime-local`. */
export const DURACIONES_DE_PORTADA = [
    { value: "24", label: "24 horas" },
    { value: "48", label: "48 horas" },
    { value: "72", label: "72 horas" },
    { value: "fecha", label: "Hasta una fecha" },
];

const idsFromRelation = (val) => {
    if (!Array.isArray(val)) return [];
    return val
        .map((x) => (typeof x === "object" && x != null ? x.id : x))
        .filter((x) => x !== undefined && x !== null);
};

const pickStr = (obj, keys, fallback = "") => {
    if (!obj || typeof obj !== "object") return fallback;
    for (const k of keys) {
        const v = obj[k];
        if (v !== undefined && v !== null && String(v) !== "") return String(v);
    }
    return fallback;
};

/**
 * Las fechas del editor van **en hora de Caracas**, se abra el panel desde donde se abra.
 *
 * Venezuela está fija en UTC-4 y no cambia de hora, así que basta un desfase constante.
 * Hacerlo explícito, y no dejarlo a la zona del navegador, es lo que evita que alguien de
 * viaje programe "las 9:00" y la pieza salga a las 9:00 de otro país.
 */
const DESFASE_CARACAS_MS = -4 * 60 * 60 * 1000;

/** ISO de la API -> valor de `datetime-local` en hora de Caracas. */
export const isoToDateTimeLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const c = new Date(d.getTime() + DESFASE_CARACAS_MS);
    const pad = (n) => String(n).padStart(2, "0");
    return `${c.getUTCFullYear()}-${pad(c.getUTCMonth() + 1)}-${pad(c.getUTCDate())}T${pad(c.getUTCHours())}:${pad(c.getUTCMinutes())}`;
};

/**
 * Valor de `datetime-local` (hora de Caracas) -> ISO en UTC para la API.
 *
 * Solo con la fecha y la hora completas («2026-09-28T09:00»). V8 lee lo demás a su
 * manera: `new Date(":00-04:00")` -- el campo vacío -- es el 1-ene-2000, y la pieza
 * programada sin fecha decía «sábado, 1 de enero, 4:00» en vez de «falta la fecha».
 */
const FECHA_Y_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const caracasToIso = (valor) => {
    if (!FECHA_Y_HORA.test(String(valor ?? ""))) return undefined;
    const d = new Date(`${valor}:00-04:00`);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/** «lunes 28 de septiembre, 9:00» en hora de Caracas. */
export const fechaDeCaracas = (valor) => {
    const iso = caracasToIso(valor);
    if (!iso) return "";
    return new Date(iso).toLocaleString("es", {
        timeZone: "America/Caracas",
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "numeric",
        minute: "2-digit",
    });
};

/** «lunes 5 de octubre a las 9:00», en hora de Caracas, de un ISO. Para el «hasta». */
export const hastaDeCaracas = (iso) => {
    const d = iso ? new Date(iso) : null;
    if (!d || Number.isNaN(d.getTime())) return "";
    const opciones = { timeZone: "America/Caracas" };
    const dia = d.toLocaleDateString("es", { ...opciones, weekday: "long", day: "numeric", month: "long" });
    const hora = d.toLocaleTimeString("es", { ...opciones, hour: "numeric", minute: "2-digit" });
    return `${dia} a las ${hora}`;
};

/** Si un ISO de la API está en el futuro: lo que decide si la pieza sigue fijada. */
const enElFuturo = (iso) => {
    const ms = iso ? Date.parse(iso) : NaN;
    return Number.isFinite(ms) && ms > Date.now();
};

/**
 * El `destacada_hasta` que se manda, a partir de los tres campos del formulario.
 *
 * `null` con la casilla sin marcar: es lo que suelta la portada, y un `undefined`
 * la dejaría como estaba. Con horas se cuenta desde **ahora**, no desde que se
 * marcó la casilla: lo que la redacción quiere es «un día desde que lo guardo».
 * Con fecha pero sin fecha escrita se omite el campo -- es un formulario a medias,
 * y la barra de abajo ya lo dice -- antes que mandar un nulo que se leería como
 * «quítala».
 */
export const destacadaHastaDe = (form) => {
    if (!form.portada) return null;
    if (form.portada_durante === "fecha") {
        const valor = String(form.portada_hasta ?? "").trim();
        return valor ? caracasToIso(valor) : undefined;
    }
    const horas = Number(form.portada_durante);
    if (!Number.isFinite(horas) || horas <= 0) return undefined;
    return new Date(Date.now() + horas * 60 * 60 * 1000).toISOString();
};

/** El texto de un campo del editor, sin etiquetas: para los resúmenes de las filas. */
export const textoPlano = (html) =>
    String(html ?? "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

/** El formulario, listo para comparar. El editor de texto devuelve `<p></p>` por un
    campo vacío: sin esto, abrir una pieza y no tocar nada ya contaría como cambio. Los
    cuatro campos con editor, también los de inglés (se olvidaban, y abrir el editor ya
    contaba como «sin guardar»). */
// Además, las piezas viejas guardan el cuerpo como texto plano y el editor lo reescribe
// como HTML al cargarlo (dos párrafos separados por una línea en blanco pasan a ser
// dos <p>): el mismo texto, que
// contaba como «sin guardar». Para comparar, los saltos de párrafo y de línea valen lo
// mismo que un espacio; las negritas, los enlaces o un texto distinto siguen contando.
const sinParrafosVacios = (html) =>
    String(html ?? "")
        .replace(/<\/?p>/g, " ")
        .replace(/<br\s*\/?>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
export const comparable = (f) =>
    JSON.stringify({
        ...f,
        content: sinParrafosVacios(f?.content),
        excerpt: sinParrafosVacios(f?.excerpt),
        content_en: sinParrafosVacios(f?.content_en),
        excerpt_en: sinParrafosVacios(f?.excerpt_en),
    });

/** El id de la pieza de la dirección (`:postId`): un número si lo es, `null` sin él. */
export const idDeLaPieza = (postId) => {
    if (!postId) return null;
    const n = Number(postId);
    return Number.isFinite(n) ? n : postId;
};

/** Lo mismo que `comparable`, como objeto: el borrador local compara con esto. */
export const normalizarPieza = (f) => (f ? JSON.parse(comparable(f)) : f);

/** «14:32», para decir cuándo se guardó la copia en este equipo. */
export const horaCorta = (marca) =>
    new Date(marca).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

export const recortar = (texto, max = 48) =>
    texto.length > max ? `${texto.slice(0, max - 1).trimEnd()}…` : texto;

export const palabras = (html) => {
    const t = textoPlano(html);
    return t ? t.split(" ").length : 0;
};

/** Lo que no se programa: una noticia sale cuando pasa. Igual que en el backend. */
export const FORMATOS_SIN_PROGRAMAR = new Set(["noticia"]);

/** «Economía +2»: el primero de una lista y cuántos más hay; `vacio` si no hay ninguno. */
export const listaCorta = (nombres, vacio) =>
    nombres.length ? `${nombres[0]}${nombres.length > 1 ? ` +${nombres.length - 1}` : ""}` : vacio;

/** El nombre con que se enseña un archivo adjunto en el resumen de su fila. */
export const nombreDeArchivo = (asset) =>
    asset?.label || asset?.original_filename || (asset ? "Adjunto" : "");

export const postToForm = (post) => {
    if (!post || typeof post !== "object") return emptyForm();
    const publishedAt = post.published_at ?? post.publishedAt;
    // Fijada si la fecha está en el futuro, aunque sea un borrador y `en_portada` diga
    // que no: lo que se edita aquí es lo que la redacción decidió, y una pieza fijada
    // que todavía no se publicó tiene que abrir con la casilla marcada para que se vea.
    const destacadaHasta = post.destacada_hasta ?? post.destacadaHasta ?? null;
    const fijada = typeof destacadaHasta === "string" && enElFuturo(destacadaHasta);
    return {
        ...emptyForm(),
        portada: fijada,
        portada_durante: fijada ? "fecha" : "24",
        portada_hasta: fijada ? isoToDateTimeLocal(destacadaHasta) : "",
        format: pickStr(post, ["format"]),
        title: pickStr(post, ["title"]),
        slug: pickStr(post, ["slug"]),
        excerpt: pickStr(post, ["excerpt", "summary"]),
        content: pickStr(post, ["content", "body", "html"]),
        meta_title: pickStr(post, ["meta_title"]),
        seo_automatico: post?.seo_automatico === true,
        meta_description: pickStr(post, ["meta_description"]),
        canonical_url: pickStr(post, ["canonical_url"]),
        byline: pickStr(post, ["byline"]),
        featured_image_url: pickStr(post, ["featured_image_url"]),
        status: pickStr(post, ["status"], "draft"),
        published_at: typeof publishedAt === "string" ? isoToDateTimeLocal(publishedAt) : "",
        // Order is meaning: the first of each is the principal tag, which is the
        // one the public cards print.
        topic_ids: idsFromRelation(post.topics ?? post.topic_ids),
        place_ids: idsFromRelation(post.places ?? post.place_ids),
        sources: (post?.sources ?? []).map((f) => ({ name: f.name ?? "", url: f.url ?? "" })),
        interviewee: pickStr(post, ["interviewee"]),
        interviewee_role: pickStr(post, ["interviewee_role"]),
        unit: pickStr(post, ["unit"]),
        image_asset_id: post.image_asset_id ?? null,
        imagen_foco: pickStr(post, ["imagen_foco"]),
        video_asset_id: post.video_asset_id ?? null,
        document_asset_id: post.document_asset_id ?? null,
        audio_asset_id: post.audio_asset_id ?? null,
        byline_photo_asset_id: post.byline_photo_asset_id ?? null,
        document_open_access: Boolean(post.document_open_access),
        is_educational: Boolean(post.is_educational),
        sin_publicidad: Boolean(post.sin_publicidad),
        juego_palabra: pickStr(post, ["juego_palabra"]),
        juego_pista: pickStr(post, ["juego_pista"]),
        moneda: pickStr(post, ["moneda"]),
        title_en: pickStr(post, ["title_en"]),
        excerpt_en: pickStr(post, ["excerpt_en"]),
        content_en: pickStr(post, ["content_en"]),
        traduccion_automatica: Boolean(post.traduccion_automatica),
    };
};

/**
 * Lo que se manda de un campo de texto que se puede quitar, mirando también cómo estaba
 * al abrir o al guardar por última vez (`base`, lo guardado):
 *
 * - con texto, el texto;
 * - vacío y **la base lo tenía**: `null`, que es «bórralo». El servidor lee una clave que
 *   no viene como «déjalo como está» (`piezas/edicion.py`, `_copiar_campos`), así que
 *   mandar `undefined` -- que se cae del JSON -- dejaba el valor viejo: se borraba el
 *   cargo de un entrevistado, se guardaba, el aviso decía «guardado» y el cargo volvía
 *   (M-44). Estos campos aceptan `null` al crear y al editar;
 * - vacío y **la base también**: no se manda. Quien edita no borró nada, y lo que el
 *   servidor haya puesto mientras tanto se queda. Es el caso del reloj del SEO
 *   (`seo_service.py`): se publica una pieza sin meta título, el reloj se lo pone, y un
 *   guardado posterior sin recargar mandaba `null`. El servidor lo leía como un cambio de
 *   una persona (`piezas/campos.py`, `_apply_seo`): dejaba el SEO vacío y lo marcaba
 *   como escrito a mano.
 *
 * Sin `base` (una pieza nueva) no hay nada que borrar: vacío no se manda.
 */
const textoQuitable = (form, base, campo) => {
    const valor = String(form[campo] ?? "").trim();
    if (valor) return valor;
    return String(base?.[campo] ?? "").trim() ? null : undefined;
};

/** `base`: lo guardado (ver `textoQuitable`). */
export const formToPayload = (form, base = null) => {
    let publishedAtValue;
    if (form.published_at && String(form.published_at).trim()) {
        publishedAtValue = caracasToIso(String(form.published_at).trim());
    }

    const payload = {
        format: form.format.trim() || undefined,
        title: form.title.trim() || undefined,
        slug: form.slug.trim() || undefined,
        // Vacía va como "" y no como nula: al editar, el servidor no admite `null` en la
        // entradilla (y lo vacío lo guarda igual, como ""). Así también se puede quitar.
        excerpt: (form.excerpt ?? "").trim(),
        // El cuerpo no: un `undefined` aquí solo impide vaciarlo, y mandarlo vacío por
        // error borraría una pieza entera.
        content: form.content.trim() || undefined,
        // Los del SEO, la dirección canónica y la imagen por URL de antes de la
        // biblioteca: vaciados, nulos (ver `textoQuitable`). Así funciona «Quitarla».
        meta_title: textoQuitable(form, base, "meta_title"),
        meta_description: textoQuitable(form, base, "meta_description"),
        canonical_url: textoQuitable(form, base, "canonical_url"),
        featured_image_url: textoQuitable(form, base, "featured_image_url"),
        status: form.status.trim() || undefined,
        published_at: publishedAtValue,
        // Sent even when blank so clearing a byline actually clears it.
        byline: form.byline.trim() || null,
        // Sent even when empty: an absent key means "leave them alone", and a piece
        // whose last source was just removed has to say so.
        sources: (form.sources ?? [])
            .map((f) => ({ name: (f.name ?? "").trim(), url: (f.url ?? "").trim() || undefined }))
            .filter((f) => f.name),
        // Se mandan en cualquier formato, como los trajo la pieza: el servidor no los
        // borra al cambiar de formato, y aquí tampoco.
        interviewee: textoQuitable(form, base, "interviewee"),
        interviewee_role: textoQuitable(form, base, "interviewee_role"),
        unit: textoQuitable(form, base, "unit"),
    };
    // Sent even when empty: clearing every topic is a real edit, and `undefined`
    // would read as "leave them alone".
    payload.topic_ids = form.topic_ids;
    payload.place_ids = form.place_ids;
    // Same for the three slots — null is how a file gets detached.
    payload.image_asset_id = form.image_asset_id ?? null;
    // Vacío se manda como nulo: es «al centro».
    payload.imagen_foco = (form.imagen_foco ?? "").trim() || null;
    payload.video_asset_id = form.video_asset_id ?? null;
    payload.document_asset_id = form.document_asset_id ?? null;
    payload.audio_asset_id = form.audio_asset_id ?? null;
    // Se manda siempre, aunque el formato no pida documento. La alternativa -- mandarlo
    // solo en informes -- es una condicion mas que alguien puede olvidar, y la columna
    // existe en toda pieza sin significar nada donde no hay documento. Mandarlo de mas
    // es inocuo; olvidarlo cerraria un informe abierto al guardar.
    payload.document_open_access = Boolean(form.document_open_access);
    // Se manda siempre, por el mismo motivo que el de arriba: el interruptor solo se
    // ofrece en articulo y entrevista, y condicionar el envio al formato es una
    // condicion mas que puede desincronizarse del interruptor. Se manda lo que tiene
    // el formulario, que es lo que la pieza traia si no se toco.
    payload.is_educational = Boolean(form.is_educational);
    payload.sin_publicidad = Boolean(form.sin_publicidad);
    // Se mandan siempre: vacíos quitan el juego de la pieza (null en la API).
    payload.juego_palabra = (form.juego_palabra ?? "").trim() || null;
    payload.juego_pista = (form.juego_pista ?? "").trim() || null;
    payload.moneda = (form.moneda ?? "").trim() || null;
    // La versión en inglés: vacía se manda como nulo, que es «sin inglés».
    payload.title_en = (form.title_en ?? "").trim() || null;
    payload.excerpt_en = (form.excerpt_en ?? "").trim() || null;
    payload.content_en = (form.content_en ?? "").trim() || null;
    payload.traduccion_automatica = Boolean(form.traduccion_automatica);
    payload.byline_photo_asset_id = form.byline_photo_asset_id ?? null;
    // Nulo cuando la casilla no está marcada -- se manda, porque es lo que la suelta --
    // e indefinido (se borra abajo) cuando falta la fecha. Ver `destacadaHastaDe`.
    payload.destacada_hasta = destacadaHastaDe(form);

    Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
    });
    return payload;
};
