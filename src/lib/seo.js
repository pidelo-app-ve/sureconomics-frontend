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

export const applyPageMeta = ({
  title,
  description,
  canonicalUrl,
} = {}) => {
  if (title) document.title = title;
  if (description) upsertMeta("description", description);
  if (canonicalUrl) upsertLink("canonical", canonicalUrl);

  // Lightweight social tags (safe no-op if not used).
  if (title) upsertMeta("og:title", title, true);
  if (description) upsertMeta("og:description", description, true);
  if (canonicalUrl) upsertMeta("og:url", canonicalUrl, true);
};

