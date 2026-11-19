/**
 * La portada pintada (`renderToString`, ver `scripts/pruebas/pintar.mjs`): con datos, sin
 * nada publicado, con la API caída y mientras carga. `npm test`.
 *
 * Las piezas y los temas llegan a la portada por dos hooks que piden en un `useEffect`
 * (`usePieces`, `useTaxonomy`), que aquí no corre: se cambian por dobles que dicen en qué
 * estado está cada uno. Lo demás es de verdad. Qué pieza va en cada sitio se prueba
 * aparte, en `lib/bloquesDePortada.test.mjs`.
 */
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { sustituir } from "../../scripts/pruebas/dobles.mjs";
import { pintarEn, textoDe } from "../../scripts/pruebas/pintar.mjs";
import { cargarIdioma, traducir } from "../i18n/motor.js";
import { piezasFromApi } from "../lib/pieza.js";

const PIEZAS = "src/hooks/usePieces.js";
const TEMAS = "src/hooks/useTaxonomy.js";

const temasListos = (estado = "success") => ({
  formats: [],
  topics: [],
  geoTop: "Mundo",
  continentes: [],
  regiones: {},
  ancestros: {},
  slugPorNombre: {},
  conteoPorNombre: {},
  status: estado,
  error: null,
  ready: estado === "success",
});

const dobles = sustituir({
  [PIEZAS]: { usePieces: () => ({ status: "loading", items: [], total: 0, truncated: false, error: null, faltan: null }) },
  [TEMAS]: { useTaxonomy: () => temasListos() },
});
const { Home } = await import("./Home.jsx");

/** Lo que devuelve `usePieces` con estas filas de la API (convertidas como de verdad). */
const conPiezas = (filas, extra = {}) => {
  dobles[PIEZAS].usePieces = () => ({
    status: "success",
    items: piezasFromApi(filas),
    total: filas.length,
    truncated: false,
    error: null,
    faltan: 0,
    ...extra,
  });
};

let n = 0;
const fila = (format, title, extra = {}) => {
  n += 1;
  return {
    id: n,
    slug: `pieza-${n}`,
    format,
    title,
    excerpt: `<p>Entradilla de la pieza ${n}.</p>`,
    published_at: new Date(Date.parse("2026-11-18T12:00:00Z") - n * 60_000).toISOString(),
    topics: [{ id: 1, slug: "economia", name: "Economía" }],
    ...extra,
  };
};

const abrir = (direccion = "/") => pintarEn(direccion, "", createElement(Home));
const es = (clave, vars) => traducir("es", clave, vars);
const en = (clave, vars) => traducir("en", clave, vars);
const contiene = (html, texto) => textoDe(html).includes(texto);

before(async () => {
  await cargarIdioma("en");
});

describe("mientras carga", () => {
  test("una pantalla de alto que lo dice, y ni plana ni secciones", async () => {
    dobles[PIEZAS].usePieces = () => ({ status: "loading", items: [], error: null, faltan: null });
    const html = await abrir();
    assert.match(html, /se-portada-cargando[^"]*" aria-busy="true"/);
    assert.ok(contiene(html, es("portada.inicio.cargando")));
    assert.doesNotMatch(html, /se-primera-plana|se-format-section/);
  });

  test("el encabezado de la página está desde el principio (para lectores de pantalla)", async () => {
    dobles[PIEZAS].usePieces = () => ({ status: "loading", items: [], error: null, faltan: null });
    const html = await abrir();
    assert.match(html, /<h1 class="se-sr-only">/);
  });
});

describe("con la API caída", () => {
  test("lo dice, sin «cargando» eterno y sin «nada publicado»", async () => {
    dobles[PIEZAS].usePieces = () => ({
      status: "error",
      items: [],
      error: Object.assign(new Error("Bad gateway"), { status: 502 }),
      faltan: 0,
    });
    const html = await abrir();
    assert.ok(contiene(html, es("portada.inicio.noSePudoCargar")));
    assert.ok(!contiene(html, es("portada.inicio.cargando")));
    assert.ok(!contiene(html, es("portada.inicio.nadaPublicado")));
  });

  test("sin red (un error sin código) también", async () => {
    dobles[PIEZAS].usePieces = () => ({ status: "error", items: [], error: new TypeError("Failed to fetch"), faltan: 0 });
    const html = await abrir();
    assert.ok(contiene(html, es("portada.inicio.noSePudoCargar")));
  });
});

describe("sin nada publicado", () => {
  test("lo dice con un estado vacío, sin secciones vacías ni el «sin resultados» del buscador", async () => {
    conPiezas([]);
    const html = await abrir();
    assert.ok(contiene(html, es("portada.inicio.nadaPublicado")));
    assert.ok(!contiene(html, es("comun.sinResultados")));
    assert.doesNotMatch(html, /se-format-section/);
  });
});

describe("con datos", () => {
  const filas = () => {
    n = 0;
    return [
      ...Array.from({ length: 14 }, (_, i) => fila("noticia", `Noticia número ${i + 1}`)),
      ...Array.from({ length: 4 }, (_, i) => fila("articulo", `Análisis ${i + 1}`)),
      fila("editorial", "La editorial de hoy"),
      fila("editorial", "La editorial de ayer"),
      // Con su unidad: sin ella `ReportGrid` se queja (ver el informe de la tanda).
      fila("informe", "Un informe", { unit: "Estudios económicos" }),
      fila("entrevista", "Una entrevista"),
      fila("podcast", "Un podcast"),
    ];
  };

  test("la primera plana abre con la noticia más reciente", async () => {
    conPiezas(filas());
    const html = await abrir();
    const titulares = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/g)].map((m) => textoDe(m[1]));
    const primera = titulares.findIndex((t) => t.startsWith("Noticia número"));
    assert.equal(titulares[primera], "Noticia número 1");
    assert.ok(!contiene(html, es("portada.inicio.cargando")));
    assert.ok(!contiene(html, es("portada.inicio.noSePudoCargar")));
  });

  test("cada pieza sale una sola vez (la editorial de arriba no se repite abajo)", async () => {
    conPiezas(filas());
    const html = await abrir();
    const veces = (titulo) => (textoDe(html).match(new RegExp(`${titulo}(?![0-9])`, "g")) ?? []).length;
    assert.equal(veces("La editorial de hoy"), 1);
    assert.equal(veces("Noticia número 1"), 1);
    assert.equal(veces("Noticia número 14"), 1);
  });

  test("las secciones, con su nombre y su enlace, y «Al punto» para entrevistas y podcast", async () => {
    conPiezas(filas());
    const html = await abrir();
    assert.match(html, /href="\/articulos\?formato=noticias"/);
    assert.match(html, /href="\/audiovisual"/);
    assert.ok(contiene(html, es("nav.alPunto")));
    assert.ok(contiene(html, "Un informe"));
    assert.ok(contiene(html, "Una entrevista"));
    assert.ok(contiene(html, "Un podcast"));
  });

  test("en español, mientras llegan los temas, las secciones esperan (la plana no)", async () => {
    conPiezas(filas());
    dobles[TEMAS].useTaxonomy = () => temasListos("loading");
    try {
      const html = await abrir();
      assert.ok(contiene(html, "Noticia número 1"), "la plana no espera a los temas");
      assert.ok(!contiene(html, "Un informe"), "las secciones esperan");
      assert.match(html, /se-portada-cargando/);
    } finally {
      dobles[TEMAS].useTaxonomy = () => temasListos();
    }
  });

  test("si los temas fallan, la portada sale igual", async () => {
    conPiezas(filas());
    dobles[TEMAS].useTaxonomy = () => temasListos("error");
    try {
      const html = await abrir();
      assert.ok(contiene(html, "Un informe"));
    } finally {
      dobles[TEMAS].useTaxonomy = () => temasListos();
    }
  });

  test("en /en, los enlaces de las secciones van a /en y «Al punto» sale en inglés", async () => {
    conPiezas(filas());
    const html = await abrir("/en");
    assert.match(html, /href="\/en\/articulos\?formato=noticias"/);
    assert.ok(contiene(html, en("nav.alPunto")));
  });

  test("títulos raros de la redacción se ven como texto", async () => {
    conPiezas([fila("noticia", `<script>alert(1)</script> 💸 «ñ» & co`)]);
    const html = await abrir();
    assert.doesNotMatch(html, /<script>alert/);
    assert.ok(contiene(html, `<script>alert(1)</script> 💸 «ñ» & co`));
  });

  test("muchas piezas: se ve la entrada de cada sección y el «Cargar más»", async () => {
    n = 0;
    conPiezas(Array.from({ length: 300 }, (_, i) => fila("noticia", `Nota ${i + 1}`)));
    const html = await abrir();
    // 1 que manda + 3 en su columna + 11 en la sección: la 15 se ve, la 16 no.
    assert.ok(contiene(html, "Nota 15 "), "falta la última de la entrada");
    assert.ok(!/Nota 16(?![0-9])/.test(textoDe(html)), "se ve más de la entrada");
    // «Cargar más» de Noticias: 11 de las 296 que hay debajo de la plana.
    const cuenta = /<p class="se-cargar-mas__cuenta"[^>]*>([\s\S]*?)<\/p>/.exec(html)?.[1];
    assert.ok(cuenta, "falta «Cargar más»");
    assert.match(textoDe(cuenta), /11/);
    assert.match(textoDe(cuenta), /296/);
  });
});
