import PropTypes from "prop-types";

const looksLikeHtml = (value) => {
  if (!value) return false;
  const s = String(value).trim();
  if (!s) return false;
  return /<([a-z][\s\S]*?)>/i.test(s);
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const textToHtml = (text) => {
  const safe = escapeHtml(text);
  const paragraphs = safe
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replaceAll("\n", "<br />")}</p>`);
  return paragraphs.join("");
};

export const ArticleBody = ({ content }) => {
  const raw = typeof content === "string" ? content : "";
  const html = looksLikeHtml(raw) ? raw : textToHtml(raw);

  return (
    <div
      className="se-article__prose se-text-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

ArticleBody.propTypes = {
  content: PropTypes.string,
};

