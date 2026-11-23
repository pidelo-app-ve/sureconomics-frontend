/**
 * El juez de los titulares en el panel: los nombres de sus modos y de los problemas que
 * señala, en palabras de la redacción. El juez es el mismo modelo que redacta, que lee
 * cada titular antes de publicarlo y dice si afirma algo que las notas no dicen (el
 * dominio `app/domains/titulares` del backend). Lo usan la página de Titulares y el
 * historial de cada titular. También lo puro de la lista: los filtros, las páginas y la
 * tabla de medios (con su prueba, `utils.test.mjs`).
 */

/** Los modos del juez (`JUEZ_MODOS` en el backend), en el orden en que se ofrecen. */
export const MODOS_DEL_JUEZ = {
  bloquear: {
    nombre: "Bloquear",
    texto: "Lee cada titular antes de publicarlo: si afirma algo que las notas no dicen, no sale.",
  },
  observar: {
    nombre: "Observar",
    texto: "Lo lee y anota lo que habría frenado, pero el titular sale igual.",
  },
  apagado: {
    nombre: "Apagado",
    texto: "No se usa el juez: sale lo que pase las demás reglas.",
  },
};

/** Los tipos de problema (`titulares_ia.TIPOS_DE_PROBLEMA`). */
const PROBLEMAS_DEL_JUEZ = {
  cifra: "Cifra",
  unidad: "Unidad",
  sujeto: "Sujeto",
  pais: "País",
  fecha: "Fecha",
  persona: "Persona",
  atribucion: "Atribución",
  tiempo_verbal: "Tiempo verbal",
  judicial: "Judicial",
  exageracion: "Exageración",
  otro: "Otro",
};

/** «Cifra», o el tipo tal cual si el backend trae uno nuevo. */
export const nombreDelProblema = (tipo) => PROBLEMAS_DEL_JUEZ[tipo] || tipo || "Otro";

/** Lo que pasó con un titular ante el juez (`estado` de cada veredicto). */
export const VEREDICTOS = {
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  fallo: "No pudo revisarlo: la IA no respondió",
  sin_saldo: "No lo revisó: no quedaba saldo del día",
};

/* ─── La lista del panel: filtros y páginas ─────────────────────────────────────── */

/** Las categorías de un titular (`CATEGORIAS` en el backend), con su nombre. */
export const CATEGORIAS = {
  politica: "Política",
  economia: "Economía",
  negocios: "Negocios",
  mundo: "Mundo",
  sociedad: "Sociedad",
  tecnologia: "Tecnología",
};

/** «Economía», o la clave tal cual si el backend trae una nueva. */
export const nombreDeCategoria = (clave) => CATEGORIAS[clave] || clave || "—";

/** Las horas hacia atrás que se pueden mirar (el backend no pasa de 72). */
export const VENTANAS = [24, 48, 72];

/** «Solo…» (`SOLO` en el backend). */
export const SOLO = {
  ultima_hora: "Última hora",
  editados: "Editados a mano",
  fijados: "Fijados arriba ahora",
};

/** El nivel de un medio, corto: el de la tabla de medios y el del filtro de la mejor fuente. */
export const NOMBRE_DE_NIVEL = { 1: "1 · oficial", 2: "2 · agencia", 3: "3 · medio", 4: "4 · Google News o pequeño" };

/** Cuántos titulares por página. */
export const POR_PAGINA = 20;

/** Sin filtros: las últimas 24 horas, todo. `buscar` es lo que de verdad se pide (ya con la espera). */
export const FILTROS_INICIALES = { buscar: "", pais: "", categoria: "", horas: 24, solo: "", nivel: "" };

/** Si hay algún filtro puesto (las 24 horas no cuentan: son lo de siempre). */
export const hayFiltros = (f) =>
  Boolean(String(f?.buscar ?? "").trim() || f?.pais || f?.categoria || f?.solo || f?.nivel) ||
  Number(f?.horas ?? FILTROS_INICIALES.horas) !== FILTROS_INICIALES.horas;

/**
 * Lo que se le pide al servidor (`GET /admin/headlines`): la vista, la página y solo los
 * filtros puestos. Un buscador con solo espacios no viaja.
 */
export const consultaDeTitulares = ({ vista, pagina = 1, porPagina = POR_PAGINA, filtros = FILTROS_INICIALES }) => {
  const consulta = { vista, pagina, por_pagina: porPagina, horas: Number(filtros.horas) || FILTROS_INICIALES.horas };
  const buscar = String(filtros.buscar ?? "").trim();
  if (buscar) consulta.buscar = buscar;
  for (const clave of ["pais", "categoria", "solo", "nivel"]) {
    if (filtros[clave]) consulta[clave] = filtros[clave];
  }
  return consulta;
};

/** «Página 2 de 5 — 87 en total», como en Contenido. */
export const lineaDePaginas = ({ pagina, paginas, total }) =>
  `Página ${pagina || 1} de ${Math.max(1, paginas || 0)} — ${total || 0} en total`;

/* ─── Los medios: buscar, filtrar y repartir en páginas, en el navegador ─────────── */

/** Qué medios enseña cada opción de «Enseñar». */
export const ESTADOS_DE_FUENTE = {
  todas: { texto: "Todos", pasa: () => true },
  nuevas: { texto: "Nuevos, sin activar", pasa: (f) => f.nueva },
  silenciadas: { texto: "Silenciados", pasa: (f) => f.silenciada && !f.nueva },
  cuentan: { texto: "Que cuentan", pasa: (f) => !f.silenciada },
};

/** Medios por página en la tabla de medios. */
export const FUENTES_POR_PAGINA = 25;

const sinTildes = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Los medios que pasan los filtros: el nombre (sin tildes ni mayúsculas: «ultimas» encuentra
 * «Últimas Noticias»), el estado y el nivel. Los nuevos, arriba; el resto en el orden del
 * servidor (`sort` es estable).
 */
export const filtrarFuentes = (fuentes, { buscar = "", estado = "todas", nivel = "" } = {}) => {
  const aguja = sinTildes(buscar).replace(/\s+/g, " ");
  const pasa = (ESTADOS_DE_FUENTE[estado] ?? ESTADOS_DE_FUENTE.todas).pasa;
  return (fuentes ?? [])
    .filter((f) => pasa(f) && (!nivel || Number(f.nivel) === Number(nivel)) && (!aguja || sinTildes(f.nombre).includes(aguja)))
    .sort((a, b) => Number(Boolean(b.nueva)) - Number(Boolean(a.nueva)));
};

/** Un trozo de la lista: la página `pagina` (que se ajusta si ya no existe) y cuántas hay. */
export const trozoDeLista = (lista, pagina, porPagina) => {
  const paginas = Math.max(1, Math.ceil((lista?.length ?? 0) / porPagina));
  const actual = Math.min(Math.max(1, Number(pagina) || 1), paginas);
  return { pagina: actual, paginas, filas: (lista ?? []).slice((actual - 1) * porPagina, actual * porPagina) };
};
