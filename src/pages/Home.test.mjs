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
import { aperturaEnHtml, loQuePintaLaPortada, recientesDeLaPortada } from "../../api/portada.js";
import { paraLaApertura } from "../lib/apertura.js";
import { primeraPlanaDe } from "../lib/bloquesDePortada.js";

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

/*
 * La apertura que trae el HTML de la portada (`aperturaEnHtml`, en `api/portada.js`) se ve
 * antes de que llegue React, que la reemplaza al montar. Si no es la misma que pinta la
 * página (otras clases, otra foto, otra talla, otro texto), el relevo salta a la vista.
 */
describe("la apertura del HTML es la que pinta React", () => {
  /**
   * De un trozo de HTML: las clases de cada caja, de fuera adentro, hasta la foto. Última
   * hora cuenta como una caja (lo de dentro lo compara `UltimaHoraColumna.html.test.mjs`).
   */
  const cajas = (html) => {
    const desde = html.indexOf('class="se-plana"');
    let trozo = html.slice(desde, html.indexOf("se-artcard__img", desde));
    const uh = trozo.indexOf('class="se-plana__uh"');
    if (uh !== -1) {
      const abre = trozo.lastIndexOf("<", uh);
      trozo = `${trozo.slice(0, abre)}<div class="se-plana__uh">${trozo.slice(trozo.lastIndexOf("<", trozo.indexOf('class="se-plana__centro"')))}`;
    }
    return [...trozo.matchAll(/<(div|section|article|a)\b[^>]*class="([^"]+)"/g)].map((m) => m[2]);
  };
  /** Los atributos de la foto de la apertura, con los nombres en minúsculas (React escribe `srcSet`). */
  const foto = (html) => {
    const etiqueta = /<img [^>]*class="se-artcard__img"[^>]*>/.exec(html.slice(html.indexOf("se-plana__principal")))?.[0] ?? "";
    return Object.fromEntries([...etiqueta.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)].map(([, k, v]) => [k.toLowerCase(), v.replace(/;$/, "")]));
  };
  const texto = (html, clase) => {
    const resto = html.slice(html.indexOf("se-plana__principal"));
    const desde = resto.search(new RegExp(`<(h3|p) class="${clase}[ "]`));
    if (desde === -1) return null;
    const etiqueta = resto.slice(desde + 1, resto.indexOf(" ", desde));
    const trozo = resto.slice(desde, resto.indexOf(`</${etiqueta}>`, desde));
    return textoDe(trozo).replace(/\s+/g, " ").trim();
  };
  const AHORA = Date.parse("2026-11-18T13:00:00Z");
  const apertura = (extra = {}) => ({
    id: 1,
    slug: "la-que-manda",
    format: "noticia",
    title: 'El "BCV" & los <bancos>',
    excerpt: "<p>Primera l&iacute;nea&nbsp;con &amp; y &quot;comillas&quot;</p><p>Segunda &#39;línea&#39;.</p>",
    published_at: "2026-11-18T12:00:00Z",
    image_asset: { url: "/media/image/2026/11/la-foto-1a2b3c4d5e6f.jpg", width: 1536, height: 1024 },
    imagen_foco: "30,70",
    topics: [{ id: 1, slug: "economia", name: "Economía" }],
    ...extra,
  });

  // Detrás, seis noticias más viejas y sin foto: tres bajo la apertura y tres en Última hora.
  const detras = [2, 3, 4, 5, 6, 7].map((id) => ({
    id,
    slug: `detras-${id}`,
    format: "noticia",
    title: `Detrás ${id}`,
    excerpt: "",
    published_at: `2026-11-17T1${id}:00:00Z`,
    topics: [],
  }));
  const fijada = { en_portada: true, destacada_hasta: "2099-01-01T00:00:00Z" };

  for (const [nombre, fila, direccion] of [
    ["en español, con encuadre y entidades en la entradilla", apertura(), "/"],
    ["un informe fijado (titular «a fondo») sin encuadre", apertura({ format: "informe", imagen_foco: null, unit: "Estudios", ...fijada }), "/"],
    ["en /en, traducida", apertura({ en_ingles: true, title_en: "The <BCV> & banks", excerpt_en: "<p>An English lead.</p>" }), "/en"],
    ["en /en, solo en español (con su marca «ES»)", apertura(), "/en"],
  ]) {
    test(nombre, async () => {
      conPiezas([fila, ...detras]);
      const react = await abrir(direccion);
      assert.match(react, /<section class="se-plana__uh"/);
      // Última hora, con las que no están arriba (las tres primeras de detrás van bajo la apertura).
      const ultimaHora = { items: [], recientes: detras.slice(3) };
      const previa = aperturaEnHtml(fila, { idioma: direccion === "/en" ? "en" : "es", ahora: AHORA, ultimaHora });
      assert.ok(previa, "el HTML no trae la apertura");
      // La foto del HTML va quieta (`se-plana__media--quieta`, sin el barrido de entrada), y
      // React también la pinta así al montar sobre ese HTML (`seVeiaAntesDeMontar`, en
      // `PrimeraPlana`). Aquí React pinta sin DOM y sin el HTML delante, así que sin ella.
      assert.ok(cajas(previa).includes("se-plana__media se-plana__media--quieta"));
      const sinQuieta = (lista) => lista.map((c) => c.replace(" se-plana__media--quieta", ""));
      assert.deepEqual(sinQuieta(cajas(previa)), cajas(react));
      assert.deepEqual(foto(previa), foto(react));
      assert.equal(texto(previa, "se-plana__titulo"), texto(react, "se-plana__titulo"));
      assert.equal(texto(previa, "se-plana__resumen"), texto(react, "se-plana__resumen"));
    });
  }

  // De ellas saca Última hora sus noticias cuando no hay titulares del día: si el HTML
  // eligiera otras, la columna (y la foto, debajo en el teléfono) cambiaría al montar.
  test("las «recientes» de Última hora: las mismas que elige Home", () => {
    const ahora = Date.now();
    const hace = (h) => new Date(ahora - h * 3600_000).toISOString();
    const conFoto = { image_asset: { url: "/media/image/2026/11/f.jpg", width: 1536 } };
    for (const [caso, filas] of [
      ["la más reciente con foto", [1, 2, 3, 4, 5, 6].map((id) => ({ ...apertura(), id, slug: `n-${id}`, published_at: hace(id) }))],
      ["la más reciente sin foto cede a otra", [
        { ...apertura(), id: 1, image_asset: null, published_at: hace(1) },
        ...[2, 3, 4, 5].map((id) => ({ ...apertura(), id, slug: `n-${id}`, published_at: hace(id), ...conFoto })),
      ]],
      ["una fijada de otro formato", [
        ...[1, 2, 3, 4, 5].map((id) => ({ ...apertura(), id, slug: `n-${id}`, published_at: hace(id) })),
        { ...apertura({ format: "informe", unit: "Estudios", ...fijada }), id: 9, slug: "informe", published_at: hace(30) },
      ]],
      ["mezcla de formatos", [1, 2, 3, 4, 5, 6, 7].map((id) => ({ ...apertura(), id, slug: `p-${id}`, published_at: hace(id), format: id % 2 ? "noticia" : "articulo" }))],
    ]) {
      const piezas = piezasFromApi(filas);
      const { enApertura } = primeraPlanaDe(piezas, false);
      const deHome = piezas.filter((p) => !enApertura.has(p.id)).map((p) => p.id);
      const { plana } = loQuePintaLaPortada(filas.map(paraLaApertura), ahora);
      const delHtml = recientesDeLaPortada(filas, plana).map((f) => String(f.id));
      assert.deepEqual(delHtml, deHome, caso);
    }
  });

  test("la marca «ES» de /en, la misma etiqueta", async () => {
    const fila = apertura();
    conPiezas([fila]);
    const react = await abrir("/en");
    const marca = (html) => /<abbr class="se-marca-idioma"[^>]*>[^<]*<\/abbr>/.exec(html.slice(html.indexOf("se-plana__titulo")))?.[0];
    assert.equal(marca(aperturaEnHtml(fila, { idioma: "en", ahora: AHORA })), marca(react));
  });
});
