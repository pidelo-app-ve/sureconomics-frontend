/**
 * Un `document` de mentira con solo lo que toca `applyPageMeta` (`src/lib/seo.js`): el
 * `<head>` con sus `<meta>` y `<link>`, el título y el `lang` de `<html>`.
 *
 *     const doc = documentoDePrueba();
 *     globalThis.document = doc;
 *     applyPageMeta({ ... });
 *     doc.meta("robots")      // "noindex, follow"
 *     doc.enlace("canonical") // "https://…" o null
 *
 * Los selectores que entiende son los de `seo.js` (`meta[name="robots"]`,
 * `link[rel="alternate"][hreflang]`…). Uno que no entienda **falla**, en vez de no
 * encontrar nada: así un cambio en `seo.js` no puede pasar las pruebas por accidente.
 */
class Elemento {
  constructor(etiqueta, cabeza) {
    this.tagName = etiqueta.toUpperCase();
    this.atributos = {};
    this.cabeza = cabeza;
  }
  setAttribute(k, v) {
    this.atributos[k] = String(v);
  }
  getAttribute(k) {
    return this.atributos[k] ?? null;
  }
  remove() {
    this.cabeza.hijos = this.cabeza.hijos.filter((h) => h !== this);
  }
}

const SELECTOR = /^(meta|link)((?:\[[\w:-]+(?:="[^"]*")?\])+)$/;

const filtro = (selector) => {
  const m = SELECTOR.exec(selector);
  if (!m) throw new Error(`cabeza.mjs no entiende el selector ${selector}`);
  const condiciones = [...m[2].matchAll(/\[([\w:-]+)(?:="([^"]*)")?\]/g)].map(([, k, v]) => [k, v]);
  return (e) =>
    e.tagName === m[1].toUpperCase() &&
    condiciones.every(([k, v]) => (v === undefined ? k in e.atributos : e.atributos[k] === v));
};

export const documentoDePrueba = () => {
  const head = {
    hijos: [],
    appendChild(e) {
      this.hijos.push(e);
      return e;
    },
    querySelector(s) {
      return this.hijos.find(filtro(s)) ?? null;
    },
    querySelectorAll(s) {
      return this.hijos.filter(filtro(s));
    },
  };
  return {
    head,
    title: "",
    documentElement: { lang: "" },
    createElement: (etiqueta) => new Elemento(etiqueta, head),
    /** El `content` de `<meta name|property="…">`, o null. */
    meta(nombre) {
      const e = head.hijos.find((h) => h.tagName === "META" && (h.atributos.name === nombre || h.atributos.property === nombre));
      return e ? e.atributos.content : null;
    },
    /** El `href` de `<link rel="…">`, o null. */
    enlace(rel) {
      const e = head.hijos.find((h) => h.tagName === "LINK" && h.atributos.rel === rel && !("hreflang" in h.atributos));
      return e ? e.atributos.href : null;
    },
    /** `{ es: href, en: href, "x-default": href }` de los `hreflang`. */
    alternativas() {
      return Object.fromEntries(
        head.hijos.filter((h) => h.tagName === "LINK" && "hreflang" in h.atributos).map((h) => [h.atributos.hreflang, h.atributos.href])
      );
    },
  };
};
