/**
 * La LVBP en el sitio: los equipos, sus escudos y cómo se lee un juego.
 *
 * Los nombres viven aquí y no solo en el servidor porque las tarjetas se pintan antes
 * de que llegue nada, y porque un escudo es un archivo del sitio (`public/lvbp/`),
 * no un dato. Los escudos son los que da API-Sports; si alguno no carga, la tarjeta
 * enseña la sigla.
 */

export const EQUIPOS = {
  CAR: { nombre: "Leones del Caracas", corto: "Caracas", ciudad: "Caracas" },
  MAG: { nombre: "Navegantes del Magallanes", corto: "Magallanes", ciudad: "Valencia" },
  LAG: { nombre: "Tiburones de La Guaira", corto: "La Guaira", ciudad: "La Guaira" },
  ARA: { nombre: "Tigres de Aragua", corto: "Aragua", ciudad: "Maracay" },
  LAR: { nombre: "Cardenales de Lara", corto: "Lara", ciudad: "Barquisimeto" },
  ZUL: { nombre: "Águilas del Zulia", corto: "Zulia", ciudad: "Maracaibo" },
  ANZ: { nombre: "Caribes de Anzoátegui", corto: "Anzoátegui", ciudad: "Puerto La Cruz" },
  MAR: { nombre: "Bravos de Margarita", corto: "Margarita", ciudad: "Porlamar" },
};

export const equipo = (sigla) => EQUIPOS[sigla] ?? { nombre: sigla, corto: sigla, ciudad: "" };

// WebP al doble del tamaño en pantalla: el PNG de 150 px pesaba hasta 111 KB y se pintaba
// a 22. Los de `public/lvbp/64` (16-nov-2026) miden 64 px por el lado mayor: en el marcador
// se ven a 26-32 px, y los de 128 eran el cuádruple (PageSpeed los marcaba). Los de 128 y
// los PNG siguen en `public/lvbp`, por si algo de fuera los enlaza.
export const escudoDe = (sigla) => `/lvbp/64/${String(sigla || "").toLowerCase()}.webp`;
/** El logo de la liga en la página de la LVBP, donde se ve a 64 px. */
export const LOGO_LIGA = "/lvbp/liga.webp";
/** Y en el marcador de la portada, donde se ve a 32. */
export const LOGO_LIGA_PEQUENO = "/lvbp/64/liga.webp";

/** Un escudo del marcador (26-32 px) con su talla de 128 para las pantallas de 3x, donde la
 *  de 64 se quedaría corta. Son los mismos archivos de 64 y de 128 de arriba. */
export const tallasDeEscudo = (sigla) => {
  const archivo = `${String(sigla || "").toLowerCase()}.webp`;
  return `/lvbp/64/${archivo} 2x, /lvbp/${archivo} 4x`;
};
export const TALLAS_LOGO_LIGA = `${LOGO_LIGA_PEQUENO} 2x, ${LOGO_LIGA} 4x`;

/** "19:00" → "7:00 p.m." (es) o "7:00 PM" (en). Sin hora, nada. */
export const horaBonita = (hora, lang = "es") => {
  if (!hora || !/^\d{2}:\d{2}$/.test(hora)) return "";
  const [h, m] = hora.split(":").map(Number);
  const doce = h % 12 || 12;
  const tarde = h >= 12;
  if (lang === "en") return `${doce}:${String(m).padStart(2, "0")} ${tarde ? "PM" : "AM"}`;
  return `${doce}:${String(m).padStart(2, "0")} ${tarde ? "p.m." : "a.m."}`;
};

/** Si el juego está en marcha, o programado y a punto: el marcador vuelve a pedirse solo. */
export const hayJuegoVivo = (juegos = []) =>
  juegos.some((j) => j.estado === "en_vivo" || j.estado === "programado");

/** Los días que la franja de la portada enseña: hoy si hay juegos; si no, mañana. */
export const diasParaLaFranja = (dias) => {
  if (!dias) return [];
  const salida = [];
  if (dias.ayer?.length) salida.push(["ayer", dias.ayer]);
  if (dias.hoy?.length) salida.push(["hoy", dias.hoy]);
  else if (dias.manana?.length) salida.push(["manana", dias.manana]);
  return salida;
};

/** `ayer`/`hoy`/`manana` → la fecha ISO de ese día, a partir del `hoy` del servidor. */
export const fechaDelDia = (hoyIso, dia) => {
  if (!hoyIso) return null;
  const d = new Date(`${hoyIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (dia === "ayer" ? -1 : dia === "manana" ? 1 : 0));
  return d.toISOString().slice(0, 10);
};
