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
