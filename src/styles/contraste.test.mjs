/**
 * El contraste de lo que dice «aquí se escribe» y «aquí está el foco» (E-17 y E-26 de la
 * auditoría del 17-nov-2026), leído de las hojas tal como están. `npm test`.
 *
 * WCAG 1.4.11 pide que el borde de un campo se vea a **3:1** contra lo que lo rodea: si
 * no, quien ve poco no sabe dónde escribir. Y 2.4.7, que el foco del teclado se vea. Aquí
 * se calcula el contraste con la fórmula de WCAG (luminancia relativa), mezclando antes
 * el color con su fondo cuando lleva transparencia, como hace el navegador.
 *
 * Cada caso mira el borde contra los dos fondos que lo tocan: el de fuera (la tarjeta, el
 * papel, el verde del pie) y el del propio campo, que se pinta debajo del borde.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hoja = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const BLOG = hoja("./blog.css");
const ADMIN = hoja("./admin.css");
const CONTACTO = hoja("../pages/contacto.css");
const CUENTA = hoja("./cuenta.css");
const EDITOR = hoja("./editor.css");
const ACCESIBILIDAD = hoja("./accesibilidad.css");

/**
 * Lo que declaran **todas** las reglas con exactamente ese selector, en orden: si dos dicen
 * lo mismo, gana la de más abajo, como en la cascada (hay varios `:root` en `blog.css`).
 * Las reglas dentro de `@media` también cuentan; aquí ninguna de las que se miran lo está.
 */
const regla = (css, selector) => {
  const limpio = (s) => s.replace(/\s+/g, " ").trim();
  const declaraciones = {};
  let hay = false;
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (limpio(m[1]) !== selector) continue;
    hay = true;
    for (const d of m[2].split(";")) {
      const [k, ...v] = d.split(":");
      if (v.length) declaraciones[k.trim()] = v.join(":").trim();
    }
  }
  assert.ok(hay, `no está la regla «${selector}»`);
  return declaraciones;
};

/** «#rrggbb» o «rgba(r, g, b, a)» → [r, g, b, a]. */
const color = (texto) => {
  const hex = texto.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1);
  const rgba = texto.match(/^rgba?\(([^)]+)\)$/);
  assert.ok(rgba, `color que no sé leer: ${texto}`);
  const [r, g, b, a = "1"] = rgba[1].split(",").map((x) => x.trim());
  return [Number(r), Number(g), Number(b), Number(a)];
};
const sobre = ([r, g, b, a], fondo) => [r, g, b].map((c, i) => c * a + fondo[i] * (1 - a));
const luminancia = (rgb) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
};

const BLANCO = [255, 255, 255];
const PAPEL = color("#f9f8f6").slice(0, 3);
const LIENZO_DEL_PANEL = color("#f7f7f5").slice(0, 3);
const VERDE = color("#003318").slice(0, 3);

/** El borde, pintado encima del fondo del campo, contra cada fondo que lo toca. */
const minimoContra = (borde, fondoDelCampo, vecinos) => {
  const pintado = sobre(color(borde), fondoDelCampo);
  return Math.min(...[fondoDelCampo, ...vecinos].map((f) => contraste(pintado, f)));
};

test("la cuenta de contraste es la de WCAG", () => {
  assert.equal(contraste(BLANCO, [0, 0, 0]).toFixed(1), "21.0");
  // El caso que midió la auditoría en el panel: negro al 16 % sobre blanco, 1,45:1.
  assert.equal(minimoContra("rgba(0, 0, 0, 0.16)", BLANCO, []).toFixed(2), "1.45");
});

test("los campos del sitio: su borde se ve a 3:1 sobre blanco y sobre el papel (E-17)", () => {
  const raiz = regla(BLOG, ":root");
  const borde = raiz["--se-form-control-border"];
  assert.ok(minimoContra(borde, BLANCO, [PAPEL]) >= 3, borde);
  assert.equal(regla(BLOG, ".se-form-control").border, "1.5px solid var(--se-form-control-border)");
  // Al pasar el ratón, más oscuro, no más claro.
  const encima = raiz["--se-form-control-border-hover"];
  assert.ok(minimoContra(encima, BLANCO, []) > minimoContra(borde, BLANCO, []), encima);
  assert.equal(regla(BLOG, ".se-form-control:hover:not(:disabled):not(:focus)")["border-color"], "var(--se-form-control-border-hover)");
});

test("contacto usa el borde de los campos, no su negro al 16 % (E-17)", () => {
  assert.equal(regla(BLOG, ".se-contact .se-form-control")["border-color"], "var(--se-form-control-border)");
  assert.equal(
    regla(CONTACTO, ".se-contact .se-form-control:hover:not(:disabled):not(:focus)")["border-color"],
    "var(--se-form-control-border-hover)"
  );
});

test("los campos de la cuenta y de la entrada del equipo usan el borde de los campos (E-17)", () => {
  // Era el filete del papel, #ddd8cc: 1,42:1 sobre el blanco del campo.
  assert.ok(minimoContra("#ddd8cc", BLANCO, []) < 3);
  assert.equal(regla(CUENTA, ".se-campo__input").border, "1px solid var(--se-form-control-border)");
  assert.ok(minimoContra(regla(BLOG, ":root")["--se-form-control-border"], BLANCO, [PAPEL]) >= 3);
});

test("los campos del panel: 3:1 sobre blanco y sobre el lienzo (E-17)", () => {
  const panel = regla(ADMIN, ".se-admin-app");
  const borde = panel["--se-form-control-border"];
  assert.ok(minimoContra(borde, BLANCO, [LIENZO_DEL_PANEL]) >= 3, borde);
  assert.equal(regla(ADMIN, ".se-admin-app .se-form-control")["border-color"], "var(--se-form-control-border)");
  assert.equal(
    regla(ADMIN, ".se-admin-app .se-form-control:hover:not(:disabled):not(:focus)")["border-color"],
    "var(--se-form-control-border-hover)"
  );
  // El editor de texto de las piezas es un campo más.
  assert.match(regla(EDITOR, ".se-richtext").border, /var\(--se-form-control-border/);
});

test("el campo del boletín sobre el verde del pie: 3:1 contra el verde y contra su fondo (E-17)", () => {
  const campo = regla(BLOG, ".se-footer__newsletter-input");
  const fondoDelCampo = sobre(color(campo.background), VERDE);
  assert.ok(minimoContra(campo["border-color"], fondoDelCampo, [VERDE]) >= 3, campo["border-color"]);
  // Al pasar el ratón no se oscurece hasta perderse en el verde (la regla de cuando el pie era papel).
  const encima = regla(BLOG, ".se-footer__newsletter-input:hover:not(:disabled):not(:focus)")["border-color"];
  assert.ok(minimoContra(encima, fondoDelCampo, [VERDE]) >= 3, encima);
});

test("los enlaces llevan un anillo de foco de 2 px del color de su texto (E-26)", () => {
  const foco = regla(ACCESIBILIDAD, "a:focus-visible");
  assert.equal(foco.outline, "2px solid currentColor");
  assert.equal(foco["outline-offset"], "2px");
  // En la cabecera, blanco: la marca tiene el texto oscuro y su anillo se perdía en el
  // verde. El de antes del navegador también era oscuro sobre verde (#101010, 1,35:1).
  assert.equal(regla(ACCESIBILIDAD, ":where(.se-header) a:focus-visible")["outline-color"], "#ffffff");
  assert.ok(contraste(BLANCO, VERDE) >= 3);
  assert.ok(contraste(color("#101010").slice(0, 3), VERDE) < 3);
});
