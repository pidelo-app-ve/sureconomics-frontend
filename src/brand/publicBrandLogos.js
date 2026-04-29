/**
 * Public brand assets served from /public/brand (see index.html favicon too).
 * Full PNG kit remains in docs/ for print and future UI; the repo only ships
 * files referenced by the live site.
 */

const base = `${import.meta.env.BASE_URL}brand/`;

const file = (name) => `${base}${name}`;

export const BRAND_PUBLIC_LOGO = {
  light: {
    wordmarkNoTagline: file("positivo-sin-tagline-300.png"),
    isotypeWithBox: file("positivo-isotipo-con-box-300.png"),
  },
  dark: {
    wordmarkNoTagline: file("negativo-sin-tagline-300.png"),
    wordmarkCompressed: file("negativo-comprimido-300.png"),
    isotypeWithBox: file("negativo-isotipo-con-box-300.png"),
  },
};

export const BRAND_PUBLIC_FAVICON = {
  icon: BRAND_PUBLIC_LOGO.light.isotypeWithBox,
  appleTouch: BRAND_PUBLIC_LOGO.light.isotypeWithBox,
};
