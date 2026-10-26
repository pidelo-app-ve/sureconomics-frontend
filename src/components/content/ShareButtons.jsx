import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconCompartir,
  IconEnlace,
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconTelegram,
  IconWhatsApp,
  IconX,
} from "../icons/social";
import { useIdioma } from "../../i18n/ProveedorIdioma";

/** Las redes que enseñan las piezas: las de siempre, en su orden. */
const REDES_DE_SIEMPRE = ["instagram", "whatsapp", "x"];

const getAbsoluteUrl = (url) => {
  if (!url) return "";
  if (typeof window === "undefined") return url;
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, window.location.origin).toString();
};

const openCenteredPopup = (href) => {
  if (typeof window === "undefined") return;
  const width = 700;
  const height = 720;
  const left = Math.max(0, Math.round((window.innerWidth - width) / 2));
  const top = Math.max(0, Math.round((window.innerHeight - height) / 2));
  window.open(
    href,
    "share",
    `popup=yes,noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`
  );
};

/** Un iPad de los últimos años se presenta como un Mac; lo delata el táctil. */
const isPhone = () => {
  if (typeof navigator === "undefined") return false;
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  return /Mac/i.test(navigator.platform || "") && navigator.maxTouchPoints > 1;
};

/**
 * El copiado a la antigua. Obsoleto y aun así el único que funciona en el
 * navegador incrustado de otra aplicación -- el de WhatsApp, por donde entra la
 * mayoría de los enlaces que reparte la redacción -- y en cualquier contexto no
 * seguro, donde `navigator.clipboard` simplemente no existe.
 *
 * Sincrónico a propósito. Es lo que permite copiar y abrir Instagram en el mismo
 * gesto: un solo `await` por delante consume la activación y el navegador bloquea
 * la ventana sin decir nada.
 */
const copyToClipboardLegacy = (text) => {
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:-1000px;left:-1000px;opacity:0";
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  } catch {
    return false;
  }
};

const copyToClipboardApi = async (text) => {
  if (typeof navigator.clipboard?.writeText !== "function") return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Permiso denegado, o el documento perdió el foco al abrirse otra ventana.
    return false;
  }
};

export const ShareButtons = ({ url, title = "", className = "", redes = REDES_DE_SIEMPRE }) => {
  const { t } = useIdioma();
  const [toast, setToast] = useState("");
  const absoluteUrl = useMemo(() => getAbsoluteUrl(url), [url]);

  const encodedUrl = useMemo(() => encodeURIComponent(absoluteUrl), [absoluteUrl]);
  const encodedText = useMemo(
    () => encodeURIComponent(title ? `${title}` : ""),
    [title]
  );

  const xHref = useMemo(() => {
    const base = `https://twitter.com/intent/tweet?url=${encodedUrl}`;
    return title ? `${base}&text=${encodedText}` : base;
  }, [encodedUrl, encodedText, title]);

  // Facebook solo lee el enlace (el texto lo pone quien comparte); Telegram, los dos.
  const facebookHref = useMemo(() => `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, [encodedUrl]);
  const telegramHref = useMemo(() => {
    const base = `https://t.me/share/url?url=${encodedUrl}`;
    return title ? `${base}&text=${encodedText}` : base;
  }, [encodedUrl, encodedText, title]);

  const linkedinHref = useMemo(
    () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    [encodedUrl]
  );

  // La hoja de compartir del sistema existe en el teléfono (y en algunos escritorios).
  // Se mira después de montar: en el servidor no hay `navigator`.
  const [hayHoja, setHayHoja] = useState(false);
  useEffect(() => {
    setHayHoja(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const whatsappHref = useMemo(() => {
    const text = title ? `${title} ${absoluteUrl}` : absoluteUrl;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [absoluteUrl, title]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2600);
  }, []);

  /**
   * Instagram no publica ninguna URL de compartir. WhatsApp funciona porque
   * existe `wa.me/?text=` y X porque existe `intent/tweet`; Instagram no tiene
   * equivalente y no acepta un enlace prellenado desde la web. Es decisión suya,
   * no algo que se pueda arreglar del lado nuestro.
   *
   * La única vía real al aplicativo es la hoja de compartir del sistema, que sí
   * lista Instagram entre sus destinos. Lo que sigue es eso, y un respaldo para
   * cuando no hay hoja.
   */
  const handleInstagram = useCallback(async () => {
    if (!absoluteUrl) return;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: title || document.title,
          text: title || undefined,
          url: absoluteUrl,
        });
        return;
      } catch (error) {
        // Cerrar la hoja es una decisión, no un fallo. Antes caía al respaldo y
        // el que cancelaba terminaba con una pestaña de Instagram que no pidió.
        if (error?.name === "AbortError") return;
      }
    }

    // Sin hoja de compartir: escritorio, o navegador incrustado en otra
    // aplicación. Se copia el enlace y en teléfono se abre Instagram -- el enlace
    // universal entra en el aplicativo -- para pegarlo en una historia o un
    // mensaje.
    //
    // El orden es el arreglo. Antes `window.open` iba detrás del `await` del
    // portapapeles: sin activación viva el navegador lo bloqueaba, y el botón
    // parecía no hacer nada en absoluto.
    const enTelefono = isPhone();
    let copiado = copyToClipboardLegacy(absoluteUrl);
    if (enTelefono) {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }
    if (!copiado) copiado = await copyToClipboardApi(absoluteUrl);

    if (!copiado) {
      showToast(t("piezas.compartir.noCopiado"));
      return;
    }
    showToast(
      enTelefono ? t("piezas.compartir.copiadoTelefono") : t("piezas.compartir.copiadoEscritorio")
    );
  }, [absoluteUrl, title, showToast, t]);

  const handlePopup = useCallback((href) => {
    if (!href) return;
    openCenteredPopup(href);
  }, []);

  /** Copiar el enlace, sin más: lo que se pega en un correo o en un chat de trabajo. */
  const handleCopiar = useCallback(async () => {
    let copiado = copyToClipboardLegacy(absoluteUrl);
    if (!copiado) copiado = await copyToClipboardApi(absoluteUrl);
    showToast(copiado ? t("piezas.compartir.copiado") : t("piezas.compartir.noCopiado"));
  }, [absoluteUrl, showToast, t]);

  /** La hoja del sistema. Cerrarla es una decisión, no un fallo: no se avisa de nada. */
  const handleHoja = useCallback(async () => {
    try {
      await navigator.share({ title: title || document.title, text: title || undefined, url: absoluteUrl });
    } catch (error) {
      if (error?.name !== "AbortError") handleCopiar();
    }
  }, [absoluteUrl, title, handleCopiar]);

  if (!absoluteUrl) return null;

  // Cada red: su icono, su nombre (para el lector de pantalla) y qué hace al pulsarla.
  const BOTONES = {
    instagram: { Icono: IconInstagram, nombre: "Instagram", etiqueta: t("piezas.compartir.instagram"), accion: handleInstagram },
    whatsapp: { Icono: IconWhatsApp, nombre: "WhatsApp", etiqueta: t("piezas.compartir.whatsapp"), accion: () => handlePopup(whatsappHref) },
    x: { Icono: IconX, nombre: "X", etiqueta: t("piezas.compartir.x"), accion: () => handlePopup(xHref) },
    facebook: { Icono: IconFacebook, nombre: "Facebook", etiqueta: t("piezas.compartir.facebook"), accion: () => handlePopup(facebookHref) },
    telegram: { Icono: IconTelegram, nombre: "Telegram", etiqueta: t("piezas.compartir.telegram"), accion: () => handlePopup(telegramHref) },
    linkedin: { Icono: IconLinkedIn, nombre: "LinkedIn", etiqueta: t("piezas.compartir.linkedin"), accion: () => handlePopup(linkedinHref) },
    copiar: { Icono: IconEnlace, nombre: t("piezas.compartir.copiarCorto"), etiqueta: t("piezas.compartir.copiar"), accion: handleCopiar },
    nativo: { Icono: IconCompartir, nombre: t("comun.compartir"), etiqueta: t("piezas.compartir.nativo"), accion: handleHoja },
  };
  const CLASE = { instagram: "ig", whatsapp: "wa", x: "x", facebook: "fb", telegram: "tg", linkedin: "li", copiar: "copiar", nativo: "nativo" };

  return (
    // `group` para que "Compartir" se oiga al entrar en los botones: sin papel, el
    // `aria-label` de un `div` no lo lee ningun lector de pantalla.
    <div className={`se-share ${className}`.trim()} role="group" aria-label={t("comun.compartir")}>
      {redes
        // La hoja del sistema solo donde existe: un botón que no hace nada no se enseña.
        .filter((red) => BOTONES[red] && (red !== "nativo" || hayHoja))
        .map((red) => {
          const { Icono, nombre, etiqueta, accion } = BOTONES[red];
          return (
            <button
              key={red}
              type="button"
              className={`se-share__btn se-share__btn--${CLASE[red]}`}
              onClick={accion}
              aria-label={etiqueta}
            >
              <span className="se-share__ico" aria-hidden="true">
                <Icono className="se-share__svg" />
              </span>
              <span className="se-sr-only">{nombre}</span>
            </button>
          );
        })}

      {toast ? (
        <div className="se-share__toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  );
};

ShareButtons.propTypes = {
  url: PropTypes.string.isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
  /**
   * Qué se ofrece, en el orden de la fila. `copiar` copia el enlace; `nativo` abre la
   * hoja de compartir del sistema y solo sale donde existe.
   */
  redes: PropTypes.arrayOf(
    PropTypes.oneOf(["instagram", "whatsapp", "x", "facebook", "telegram", "linkedin", "copiar", "nativo"])
  ),
};
