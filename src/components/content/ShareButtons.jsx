import PropTypes from "prop-types";
import { useCallback, useMemo, useState } from "react";

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

const copyToClipboard = async (text) => {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const IconInstagram = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="currentColor"
      d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4Zm-4.5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5ZM17.75 6.8a1.15 1.15 0 1 1-1.15 1.15 1.15 1.15 0 0 1 1.15-1.15Z"
    />
  </svg>
);

const IconWhatsApp = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="currentColor"
      d="M12 2a9.82 9.82 0 0 0-8.45 14.83L2 22l5.34-1.4A9.88 9.88 0 0 0 12 22a10 10 0 0 0 0-20Zm0 18a7.9 7.9 0 0 1-4.02-1.1l-.29-.17-3.17.83.85-3.08-.19-.31A7.9 7.9 0 1 1 12 20Zm4.63-5.77c-.25-.12-1.47-.72-1.7-.8s-.4-.12-.57.12-.65.8-.8.97-.29.19-.54.06a6.48 6.48 0 0 1-1.9-1.17 7.17 7.17 0 0 1-1.33-1.66c-.14-.25 0-.39.1-.52.1-.1.25-.29.37-.43a1.65 1.65 0 0 0 .25-.41.49.49 0 0 0 0-.46c-.06-.12-.57-1.38-.78-1.9s-.41-.43-.57-.44h-.49a.94.94 0 0 0-.68.31 2.85 2.85 0 0 0-.9 2.1 4.94 4.94 0 0 0 1.04 2.6 11.22 11.22 0 0 0 4.3 3.8 4.9 4.9 0 0 0 2.31.73 2 2 0 0 0 1.36-1.07 1.67 1.67 0 0 0 .12-1.07c-.07-.12-.23-.19-.48-.31Z"
    />
  </svg>
);

const IconX = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="currentColor"
      d="M18.9 2H21l-6.6 7.55L22.5 22h-6.3l-4.94-6.59L5.5 22H3.4l7.1-8.13L1.5 2h6.46l4.47 5.98L18.9 2Zm-1.1 18h1.74L6.96 3.9H5.1L17.8 20Z"
    />
  </svg>
);

export const ShareButtons = ({ url, title = "", className = "" }) => {
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

  const whatsappHref = useMemo(() => {
    const text = title ? `${title} ${absoluteUrl}` : absoluteUrl;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [absoluteUrl, title]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 1800);
  }, []);

  const handleInstagram = useCallback(async () => {
    if (!absoluteUrl) return;

    // Best-effort: use Web Share on mobile if available (Instagram can be a target there).
    if (navigator.share) {
      try {
        await navigator.share({ title: title || document.title, url: absoluteUrl });
        return;
      } catch {
        // fall through
      }
    }

    const copied = await copyToClipboard(absoluteUrl);
    showToast(copied ? "Link copiado. Abra Instagram y péguelo." : "No se pudo copiar el link.");

    // Open Instagram website as a hint; mobile users can switch to app.
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }, [absoluteUrl, title, showToast]);

  const handlePopup = useCallback((href) => {
    if (!href) return;
    openCenteredPopup(href);
  }, []);

  if (!absoluteUrl) return null;

  return (
    <div className={`se-share ${className}`.trim()} aria-label="Compartir">
      <button
        type="button"
        className="se-share__btn se-share__btn--ig"
        onClick={handleInstagram}
        aria-label="Compartir en Instagram"
      >
        <span className="se-share__ico" aria-hidden="true">
          <IconInstagram className="se-share__svg" />
        </span>
        <span className="se-sr-only">Instagram</span>
      </button>

      <button
        type="button"
        className="se-share__btn se-share__btn--wa"
        onClick={() => handlePopup(whatsappHref)}
        aria-label="Compartir por WhatsApp"
      >
        <span className="se-share__ico" aria-hidden="true">
          <IconWhatsApp className="se-share__svg" />
        </span>
        <span className="se-sr-only">WhatsApp</span>
      </button>

      <button
        type="button"
        className="se-share__btn se-share__btn--x"
        onClick={() => handlePopup(xHref)}
        aria-label="Compartir en X"
      >
        <span className="se-share__ico" aria-hidden="true">
          <IconX className="se-share__svg" />
        </span>
        <span className="se-sr-only">X</span>
      </button>

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
};

