/**
 * Lo que se deriva del formulario para enseñarlo: cómo va la versión en inglés, qué
 * falta para publicar, el resumen del estado y la lista «Antes de publicar». Sin React.
 */
import { destacadaHastaDe, fechaDeCaracas, palabras, textoPlano } from "./formulario";

// Cómo va la versión en inglés. Sale en /en con título y cuerpo; con uno solo es una
// traducción a medias, y la pieza sigue saliendo en español: se dice aquí, no se
// descubre en el sitio.
export const estadoDelIngles = (form) => {
    const hayTituloEn = Boolean(form.title_en.trim());
    const hayCuerpoEn = Boolean(textoPlano(form.content_en));
    return (
        hayTituloEn && hayCuerpoEn
            ? {
                  resumen: form.traduccion_automatica ? "Traducción automática, sin revisar" : "Lista",
                  estado: "ok",
                  aviso: null,
              }
            : hayTituloEn || hayCuerpoEn
              ? {
                    resumen: "A medias",
                    estado: "falta",
                    aviso: hayTituloEn
                        ? "Falta el cuerpo en inglés: hasta que lo tenga, en /en la pieza sale en español."
                        : "Falta el título en inglés: hasta que lo tenga, en /en la pieza sale en español.",
                }
              : { resumen: "Sin versión en inglés", estado: undefined, aviso: null }
    );
};

/** Lo que el editor enseña sobre la pieza: faltas, resumen del estado y la comprobación. */
export const estadoDeLaPieza = ({ form, requiredMedia, canPublish, programada, legacyImage, topics, placeGroups }) => {
    /** Whether publishing would be refused for a missing file, said before trying. */
    const missingMedia =
        (requiredMedia === "video" && !form.video_asset_id) ||
        (requiredMedia === "document" && !form.document_asset_id) ||
        (requiredMedia === "audio" && !form.audio_asset_id);

    const nombresDe = (ids, lista) => {
        const porId = new Map(lista.map((x) => [String(x.id), x.name]));
        return (ids ?? []).map((i) => porId.get(String(i))).filter(Boolean);
    };
    const temasElegidos = nombresDe(form.topic_ids, topics ?? []);
    const lugaresElegidos = nombresDe(
        form.place_ids,
        (placeGroups ?? []).flatMap((g) => g.children ?? []),
    );
    const nPalabras = palabras(form.content);
    const nFuentes = (form.sources ?? []).filter((f) => (f.name ?? "").trim()).length;
    // La portada: a quien puede publicar, o a cualquiera si la pieza ya está fijada,
    // para que al menos lo vea y pueda soltarla. Decidir qué abre el sitio es del
    // mismo rango que decidir qué se publica.
    const muestraPortada = canPublish || form.portada;
    const faltaFechaDePortada = form.portada && form.portada_durante === "fecha" && !form.portada_hasta;
    // El «hasta» que se va a mandar, para decirlo antes de guardar. Con horas se cuenta
    // desde ahora, así que el texto es una estimación por unos segundos, no una promesa.
    const portadaHastaIso = form.portada ? destacadaHastaDe(form) : null;
    const resumenDeEstado = [
        form.status === "published"
            ? "Publicado"
            : programada
              ? `Programado · ${fechaDeCaracas(form.published_at) || "falta la fecha"}`
              : "Borrador",
        form.portada ? "Abre la portada" : null,
    ]
        .filter(Boolean)
        .join(" · ");
    // Lo que impediría publicar, dicho en la barra fija de abajo antes de intentarlo.
    const sinTema = !(form.topic_ids ?? []).length;
    // El texto solo se pide donde la pieza ES el texto: una entrevista o un podcast son su video o su audio.
    const sinTexto = requiredMedia === "none" && !nPalabras;
    const faltas = [
        !form.title.trim() ? "título" : null,
        sinTexto ? "texto" : null,
        sinTema ? "tema" : null,
        missingMedia
            ? requiredMedia === "video"
                ? "video"
                : requiredMedia === "audio"
                  ? "audio"
                  : "documento"
            : null,
        programada && !form.published_at ? "fecha" : null,
        faltaFechaDePortada ? "hasta cuándo abre la portada" : null,
    ].filter(Boolean);

    // «Antes de publicar»: lo que bloquea, lo que conviene y lo que ya está, de un vistazo.
    const minutosDeLectura = Math.max(1, Math.round(nPalabras / 200));
    const tieneImagen = Boolean(form.image_asset_id || legacyImage);
    const chequeo = [
        !form.title.trim()
            ? { nivel: "falta", texto: "Título" }
            : form.title.trim().length > 90
              ? { nivel: "conviene", texto: "Título", detalle: ` ${form.title.trim().length} letras: en las tarjetas se corta. Mejor menos de 90.` }
              : { nivel: "bien", texto: "Título" },
        nPalabras
            ? { nivel: "bien", texto: "Texto", detalle: ` ${nPalabras} palabras · ${minutosDeLectura} min de lectura` }
            : { nivel: sinTexto ? "falta" : "conviene", texto: "Texto" },
        missingMedia || requiredMedia !== "none"
            ? {
                  nivel: missingMedia ? "falta" : "bien",
                  texto: requiredMedia === "video" ? "Video" : requiredMedia === "audio" ? "Audio" : "Documento",
              }
            : null,
        sinTema
            ? { nivel: "falta", texto: "Tema", detalle: " Sin tema no se puede publicar." }
            : { nivel: "bien", texto: "Tema", detalle: ` ${temasElegidos.join(", ")}` },
        lugaresElegidos.length
            ? { nivel: "bien", texto: "Lugar", detalle: ` ${lugaresElegidos.join(", ")}` }
            : { nivel: "conviene", texto: "Lugar" },
        { nivel: tieneImagen ? "bien" : "conviene", texto: "Foto" },
        { nivel: nFuentes ? "bien" : "conviene", texto: "Fuente" },
    ].filter(Boolean);

    return {
        missingMedia,
        temasElegidos,
        lugaresElegidos,
        nPalabras,
        nFuentes,
        muestraPortada,
        faltaFechaDePortada,
        portadaHastaIso,
        resumenDeEstado,
        faltas,
        chequeo,
    };
};
