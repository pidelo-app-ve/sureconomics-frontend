/** La dirección pública del sitio, para canónicos y alternativas por idioma. */
export const SITIO = "https://www.sureconomics.com";

const OG_LOCALE = { es: "es_ES", en: "en_US" };

/** Reescribe los `<link rel="alternate" hreflang>`: una por idioma más `x-default`. */
const ponerAlternativas = (alternativas) => {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => l.remove());
  if (!alternativas) return;
  for (const [hreflang, href] of Object.entries(alternativas)) {
    if (!href) continue;
    const tag = document.createElement("link");
    tag.setAttribute("rel", "alternate");
    tag.setAttribute("hreflang", hreflang);
    tag.setAttribute("href", href);
    document.head.appendChild(tag);
  }
};

const upsertMeta = (nameOrProperty, value, isProperty = false) => {
  if (!value) return;
  const key = isProperty ? "property" : "name";
  const selector = `meta[${key}="${nameOrProperty}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(key, nameOrProperty);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
};

const upsertLink = (rel, href) => {
  if (!href) return;
  const selector = `link[rel="${rel}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};

/**
 * Las páginas bilingües no llaman a esto directamente: usan `useMetaPagina`, que ya
 * calcula el canónico y las alternativas de cada idioma. `lang` y `alternates` son
 * opcionales para que el panel y los scripts de siempre sigan igual.
 */
export const applyPageMeta = ({
  title,
  description,
  canonicalUrl,
  noindex = false,
  lang,
  alternates,
} = {}) => {
  if (title) document.title = title;
  if (description) upsertMeta("description", description);
  if (canonicalUrl) upsertLink("canonical", canonicalUrl);
  if (lang) {
    document.documentElement.lang = lang;
    upsertMeta("og:locale", OG_LOCALE[lang] ?? lang, true);
  }
  if (alternates !== undefined) ponerAlternativas(alternates);

  // Lightweight social tags (safe no-op if not used).
  if (title) upsertMeta("og:title", title, true);
  if (description) upsertMeta("og:description", description, true);
  if (canonicalUrl) upsertMeta("og:url", canonicalUrl, true);

  if (noindex) {
    upsertMeta("robots", "noindex, nofollow");
  } else {
    // Imagen grande y fragmento sin límite: sin `max-image-preview:large`, Google no
    // usa la foto en grande en Noticias destacadas ni en Discover.
    upsertMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1");
  }
};

