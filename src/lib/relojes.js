/**
 * Las ciudades del reloj de la cabecera y su hora (components/Relojes.jsx).
 *
 * Con `timeZone` de la base de datos de zonas (IANA), nunca con diferencias escritas a
 * mano: así los cambios de hora -- Madrid el último domingo de octubre, California el
 * primer domingo de noviembre -- los aplica `Intl` solo, año tras año.
 */

export const CIUDADES = [
  { clave: "caracas", zona: "America/Caracas" },
  { clave: "madrid", zona: "Europe/Madrid" },
  { clave: "buenosAires", zona: "America/Argentina/Buenos_Aires" },
  { clave: "california", zona: "America/Los_Angeles" },
];

const formatos = CIUDADES.map(
  (c) => new Intl.DateTimeFormat("es-VE", { timeZone: c.zona, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
);

/** «20:34» y «29», en piezas: los segundos se esconden por CSS en el escritorio estrecho. */
export const horaEn = (indice, fecha) => {
  const p = Object.fromEntries(formatos[indice].formatToParts(fecha).map(({ type, value }) => [type, value]));
  // Algunos motores dan «24» a medianoche con `hour12: false`.
  return { hm: `${p.hour === "24" ? "00" : p.hour}:${p.minute}`, ss: p.second };
};
