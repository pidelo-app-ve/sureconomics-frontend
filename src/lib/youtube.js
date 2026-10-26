/**
 * El reproductor de YouTube, siempre desde `youtube-nocookie.com` (como `PieceBody`): el
 * mismo reproductor, sin la cookie de seguimiento hasta que alguien le da a reproducir.
 *
 * Dos usos:
 *  - la vista previa de una tarjeta: muda, sin controles ni teclado, porque la tarjeta es
 *    el botón y el video solo se asoma. Sin bucle: con `loop` YouTube lo trata como una
 *    lista y enseña ⏮ ⏭ encima; la tarjeta la recoge antes de que acabe (`EnLaCalle`);
 *  - el visor: con sonido y con sus controles, que es donde se ve de verdad.
 */
const BASE = "https://www.youtube-nocookie.com/embed/";

export const urlVistaPrevia = (id) =>
  `${BASE}${encodeURIComponent(id)}?${new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    disablekb: "1",
    iv_load_policy: "3",
    fs: "0",
  })}`;

/** El id de un video en cualquier enlace de YouTube: watch, youtu.be, embed, shorts o live. */
const ID = /(?:youtube(?:-nocookie)?\.com\/(?:.*[?&]v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;
export const idDeYoutube = (url) => ID.exec(url || "")?.[1] ?? null;

/** Si el enlace es de un short: vertical, y así se enseña. */
export const esShort = (url) => /youtube\.com\/shorts\/[\w-]{11}/.test(url || "");

/**
 * El reproductor de la ventana «Nuestro canal»: con sonido y controles, y con la API de
 * mensajes encendida (`enablejsapi`) para poder pausarlo cuando otro video arranca.
 */
export const urlReproductor = (id) =>
  `${BASE}${encodeURIComponent(id)}?${new URLSearchParams({
    autoplay: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
    enablejsapi: "1",
  })}`;

/** Le pide a un reproductor de YouTube que se pause, sin cargar su script. */
export const pausar = (iframe) => {
  try {
    iframe?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
      "https://www.youtube-nocookie.com"
    );
  } catch {
    /* si el reproductor aún no está, no hay nada que pausar */
  }
};

/**
 * Un solo video sonando a la vez. Quien arranca uno lo avisa con su nombre; los demás
 * se pausan o se cierran (la ventana «Nuestro canal» y el visor de «En la calle»).
 */
export const EVENTO_MEDIO = "sureconomics:medio";
export const avisarMedio = (quien) => {
  try {
    window.dispatchEvent(new CustomEvent(EVENTO_MEDIO, { detail: quien }));
  } catch {
    /* sin eventos personalizados, cada uno suena por su cuenta */
  }
};

export const urlVisor = (id) =>
  `${BASE}${encodeURIComponent(id)}?${new URLSearchParams({
    autoplay: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
  })}`;

/** «0:54», «12:07», «1:02:30»: la duración como la marca un reproductor. */
export const duracionReloj = (segundos) => {
  if (segundos == null || Number.isNaN(Number(segundos))) return null;
  const s = Math.max(0, Math.round(Number(segundos)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
};

/** «1,2 mil», «15 mil»: las vistas en corto, en el idioma de la página. */
export const vistasCortas = (n, lang = "es") => {
  if (n == null) return null;
  try {
    return new Intl.NumberFormat(lang, { notation: "compact", maximumFractionDigits: 1 }).format(n);
  } catch {
    return String(n);
  }
};
