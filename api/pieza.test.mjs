/**
 * Las meta etiquetas de una pieza, con la API y el shell simulados.
 *
 * Sin runtime de pruebas: `node api/pieza.test.mjs`, o `npm run test:og`.
 *
 * Existe porque una `<head>` equivocada se ve perfecta para una persona y es
 * invisible para todo rastreador. Los casos que importan no son los del camino
 * feliz sino los de fallo: la función tiene que devolver la aplicación intacta
 * cuando la API no responde, porque estas rutas antes eran archivos estáticos que
 * no podían fallar.
 */
import handler, {
  ENTORNO,
  IMAGEN_DE_MARCA,
  descripcionDe,
  descripcionDelResumen,
  enSuIngles,
  esNuestroShell,
  imagenParaCompartir,
  inyectar,
  tituloParaBuscadores,
} from "./pieza.js";
import { fotoDePortada } from "../src/lib/fotoDePieza.js";

const SHELL = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <title>Sur Economics — Economía, mercados e inversión</title>
    <!-- og:generico -->
    <meta property="og:image" content="https://www.sureconomics.com/brand/og-default.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
    <!-- /og:generico -->
  </head>
  <body><div id="root"></div><script src="/assets/index-abc123.js"></script></body>
</html>`;

let fallos = 0;
const check = (nombre, ok, detalle) => {
  console.log(`  ${ok ? "ok " : "X  "} ${nombre}${detalle ? "  → " + detalle : ""}`);
  if (!ok) fallos++;
};

const respuestaFalsa = () => {
  const r = { headers: {}, code: 0, body: "" };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.send = (b) => { r.body = b; return r; };
  r.redirect = (c, destino) => { r.code = c; r.location = destino; return r; };
  return r;
};

const conFetch = async (impl, fn) => {
  const previo = globalThis.fetch;
  globalThis.fetch = impl;
  try { return await fn(); } finally { globalThis.fetch = previo; }
};

const fetchNormal = (pieza) => async (url) => {
  if (String(url).endsWith("/index.html")) {
    return { ok: true, status: 200, text: async () => SHELL };
  }
  return { ok: true, status: 200, json: async () => ({ data: pieza }) };
};

const PIEZA = {
  title: 'Concertación "tripartita" & el salario real en Uruguay',
  excerpt: "<p>Los <strong>consejos de salarios</strong> cerraron con un reajuste real del 1,8&nbsp;% sin trasladarse a precios, lo que reabre la discusión sobre indexación en un año electoral y sobre el margen que deja la meta de inflación del banco central para sostener el poder de compra.</p>",
  image_asset: { url: "https://res.cloudinary.com/pjr7bqzt/image/upload/v1787613820/sureconomics/foto.jpg" },
  published_at: "2026-08-25T15:00:00+00:00",
  topics: [{ name: "Trabajo y Migración" }],
};

// —— 1. El camino feliz ——
await conFetch(fetchNormal(PIEZA), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "articulos", slug: "concertacion-tripartita" } }, res);
  const h = res.body;
  check("responde 200", res.code === 200);
  check("el título es el de la pieza",
    /<title>Concertación &quot;tripartita&quot; &amp; el salario real en Uruguay — SurEconomics<\/title>/.test(h),
    (h.match(/<title>.*?<\/title>/) || [])[0]);
  check("og:title escapado",
    h.includes('property="og:title" content="Concertación &quot;tripartita&quot; &amp; el salario real en Uruguay"'));
  check("og:description sin etiquetas HTML",
    /og:description" content="Los consejos de salarios cerraron con un reajuste real del 1,8 %/.test(h),
    (h.match(/og:description" content="([^"]{0,60})/) || [])[1]);
  check("la descripción se recorta con puntos suspensivos",
    (h.match(/og:description" content="([^"]*)"/) || [])[1]?.endsWith("…"));
  check("og:image a 1200x630 y en jpg fijo, no f_auto",
    h.includes("f_jpg,q_auto,c_fill,w_1200,h_630/v1787613820/sureconomics/foto.jpg")
    // Ninguna etiqueta: la foto del HTML previo sí lleva `f_auto`, porque esa la pide
    // un navegador, que es quien elige el formato.
    && !/<meta [^>]*f_auto/.test(h));
  check("secure_url y type declarados",
    h.includes('og:image:secure_url') && h.includes('content="image/jpeg"'));
  check("tarjeta grande cuando hay foto", h.includes('name="twitter:card" content="summary_large_image"'));
  check("og:url canónica al dominio real",
    h.includes('property="og:url" content="https://www.sureconomics.com/articulos/concertacion-tripartita"'));
  check("canonical presente", h.includes('rel="canonical" href="https://www.sureconomics.com/articulos/concertacion-tripartita"'));
  check("fecha de publicación", h.includes('article:published_time" content="2026-08-25T15:00:00+00:00"'));
  check("sección tomada del tema", h.includes('article:section" content="Trabajo y Migración"'));
  check("sin firma, firma la casa (para el modo lectura)", h.includes('<meta name="author" content="SurEconomics" />'));
  check("el bundle sigue intacto", h.includes('src="/assets/index-abc123.js"'));
  check("una sola etiqueta title", (h.match(/<title>/g) || []).length === 1);
  check("se cachea en el borde", /s-maxage=600/.test(res.headers["Cache-Control"]));
});

// —— 2. Sin fotografía: la tarjeta de marca, nunca una tarjeta sin imagen ——
//
// X guarda la tarjeta durante días, también la fallida. Una vista previa que salió
// sin imagen se queda así mucho después de arreglar la causa.
await conFetch(fetchNormal({ ...PIEZA, image_asset: null }), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "noticias", slug: "sin-foto" } }, res);
  check("sin foto sale la tarjeta de marca",
    res.body.includes(`property="og:image" content="${IMAGEN_DE_MARCA.url}"`));
  check("y en grande, con medidas", res.body.includes("summary_large_image")
    && res.body.includes('og:image:width" content="1200"'));
});

// —— 2c. Una sola og:image: el bloque genérico del shell se quita ——
await conFetch(fetchNormal(PIEZA), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "articulos", slug: "concertacion-tripartita" } }, res);
  check("una sola og:image", (res.body.match(/property="og:image"/g) || []).length === 1);
  check("sin el bloque genérico", !res.body.includes("og:generico"));
});

// —— 2d. Los podcasts también tienen vista previa ——
await conFetch(fetchNormal(PIEZA), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "podcast", slug: "un-episodio" } }, res);
  check("podcast arma sus etiquetas",
    res.body.includes('og:url" content="https://www.sureconomics.com/podcast/un-episodio"'),
    res.headers["X-Pieza-Meta"]);
});

// —— 3. Falla abierto: la página funciona aunque la API no ——
const casos = [
  ["la API no responde", async (url) => {
    if (String(url).endsWith("/index.html")) return { ok: true, text: async () => SHELL };
    throw new Error("ECONNREFUSED");
  }, "api-sin-respuesta"],
  ["la API devuelve 500", async (url) => {
    if (String(url).endsWith("/index.html")) return { ok: true, text: async () => SHELL };
    return { ok: false, status: 500 };
  }, "api-500"],
];
for (const [nombre, impl, marca] of casos) {
  await conFetch(impl, async () => {
    const res = respuestaFalsa();
    await handler({ query: { seccion: "noticias", slug: "x" } }, res);
    check(`${nombre}: 200 con la app intacta`,
      res.code === 200 && res.body.includes('id="root"') && res.headers["X-Pieza-Meta"] === marca,
      res.headers["X-Pieza-Meta"]);
    check(`${nombre}: no se cachea largo`, res.headers["Cache-Control"] === "public, s-maxage=30");
    check(`${nombre}: aun así lleva imagen, la de marca`,
      res.body.includes(`property="og:image" content="${IMAGEN_DE_MARCA.url}"`));
  });
}

// —— 3b. Una pieza que no existe: 404 de verdad, con noindex ——
//
// Antes respondía 200 con la portada, y para un buscador eso es una página más igual a
// todas. La aplicación sigue intacta: es ella la que dice «No encontramos esta pieza».
await conFetch(async (url) => {
  if (String(url).endsWith("/index.html")) return { ok: true, text: async () => SHELL };
  return { ok: false, status: 404 };
}, async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "noticias", slug: "no-existe" } }, res);
  check("pieza inexistente: 404", res.code === 404, String(res.code));
  check("pieza inexistente: la app intacta", res.body.includes('id="root"') && res.body.includes('src="/assets/index-abc123.js"'));
  check("pieza inexistente: noindex", res.body.includes('name="robots" content="noindex, follow"'));
  check("pieza inexistente: una sola etiqueta robots", (res.body.match(/name="robots"/g) || []).length === 1);
  check("pieza inexistente: cache corta", res.headers["Cache-Control"] === "public, s-maxage=60");
});

// —— 3c. Lo que ve un buscador: la pieza dentro del HTML y su ficha ——
const CON_CUERPO = {
  ...PIEZA,
  slug: "concertacion-tripartita",
  format: "articulo",
  byline: "Pablo Quintero",
  updated_at: "2026-08-25T16:00:00+00:00",
  content: '<p>Primer párrafo con <strong>datos</strong>.</p><p onclick="robar()">Segundo.</p><script>alert(1)</script>',
};
await conFetch(fetchNormal(CON_CUERPO), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "articulos", slug: "concertacion-tripartita" } }, res);
  const h = res.body;
  const raiz = (h.match(/<div id="root">([\s\S]*?)<\/div><script/) || [])[1] || "";
  check("el titular va en un h1 dentro del root", /<h1 class="se-piece__title">Concertación &quot;tripartita&quot;/.test(raiz));
  check("el cuerpo va en el HTML", raiz.includes("Primer párrafo con <strong>datos</strong>"));
  check("la firma y la fecha también", raiz.includes("Por Pablo Quintero") && raiz.includes('datetime="2026-08-25T15:00:00+00:00"'));
  // En el HTML visible no queda nada ejecutable. (En `se-pieza` el cuerpo viaja
  // escapado como texto JSON, igual que llegaba antes de la API a la página.)
  check("sin scripts ni manejadores del cuerpo", !raiz.includes("<script") && !raiz.includes("onclick") && !raiz.includes("alert(1)"));
  const ld = (h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  let ficha = null;
  try { ficha = JSON.parse(ld); } catch { /* falla abajo */ }
  check("ficha NewsArticle válida", ficha?.["@type"] === "NewsArticle", ld?.slice(0, 80));
  check("ficha con titular, fechas, imagen, autor y medio",
    ficha?.headline?.startsWith("Concertación") && ficha?.datePublished && ficha?.dateModified
    && ficha?.image?.[0]?.includes("w_1200") && ficha?.author?.name === "Pablo Quintero"
    && ficha?.publisher?.name === "SurEconomics" && ficha?.publisher?.logo?.url);
  check("la URL de la ficha es la canónica", ficha?.mainEntityOfPage?.["@id"] === "https://www.sureconomics.com/articulos/concertacion-tripartita");
  const datosPieza = (h.match(/<script type="application\/json" id="se-pieza">([\s\S]*?)<\/script>/) || [])[1];
  let piezaLeida = null;
  try { piezaLeida = JSON.parse(datosPieza); } catch { /* falla abajo */ }
  check("los datos para React viajan escapados y como JSON que no se ejecuta",
    piezaLeida?.slug === "concertacion-tripartita" && !h.includes("window.__SE_PIEZA__") && datosPieza.includes("\\u003cscript"),
    datosPieza?.slice(0, 80));
});

// Una firma de la redacción sale como el medio, no como una persona llamada «Redacción».
await conFetch(fetchNormal({ ...CON_CUERPO, byline: "Redacción SurEconomics" }), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "noticias", slug: "x" } }, res);
  const ld = (res.body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  check("la redacción firma como organización", JSON.parse(ld).author["@type"] === "Organization");
});

// —— 2b. La descripción sale de donde la haya ——
//
// Tres de ochenta y cuatro piezas en producción tenían resumen. Sin respaldo, la
// previsualización de las otras ochenta y una va sin descripción, que es la
// versión que un teléfono es más propenso a no dibujar.
check("usa el resumen cuando lo hay",
  descripcionDe({ excerpt: "<p>El resumen.</p>", content: "<p>El cuerpo.</p>" }) === "El resumen.");
check("un resumen vacío no cuenta como resumen",
  descripcionDe({ excerpt: "<p></p>", content: "<p>El cuerpo.</p>" }) === "El cuerpo.");
check("cae al cuerpo cuando no hay nada más",
  descripcionDe({ content: "<p>La coyuntura política actual tiene un diagnóstico revelador.</p>" })
    === "La coyuntura política actual tiene un diagnóstico revelador.");
check("prefiere meta_description al resumen: se escribió para los buscadores",
  descripcionDe({ meta_description: "Para buscadores.", excerpt: "<p>El resumen.</p>" }) === "Para buscadores.");
check("el título de la pestaña es el meta título si lo hay, y si no el titular",
  tituloParaBuscadores({ meta_title: "Corto para Google", title: "El titular entero" }) === "Corto para Google" &&
    tituloParaBuscadores({ meta_title: "  ", title: "El titular entero" }) === "El titular entero");
check("en inglés no se usa el SEO en español",
  tituloParaBuscadores(enSuIngles({ meta_title: "Corto", title: "x", title_en: "The headline" })) === "The headline");
{
  const pagina = inyectar("<html lang=\"es\"><head><title>x</title></head><body><div id=\"root\"></div></body></html>",
    { titulo: "El titular entero de la pieza", tituloDePestana: "Corto para Google", url: "https://x.test/a" });
  check("la pestaña lleva el meta título y la tarjeta de las redes, el titular",
    pagina.includes("<title>Corto para Google — SurEconomics</title>") &&
      pagina.includes('property="og:title" content="El titular entero de la pieza"'), pagina.slice(0, 400));
}
check("prefiere meta_description al cuerpo",
  descripcionDe({ meta_description: "Para buscadores.", content: "<p>Cuerpo.</p>" }) === "Para buscadores.");
check("sin nada devuelve nulo", descripcionDe({}) === null);
check("el cuerpo largo se recorta",
  descripcionDe({ content: "<p>" + "palabra ".repeat(80) + "</p>" }).endsWith("…"));

await conFetch(fetchNormal({ ...PIEZA, excerpt: "<p></p>", content: "<p>El cuerpo entra como descripción.</p>" }), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "noticias", slug: "sin-resumen" } }, res);
  check("una pieza sin resumen sí emite og:description",
    res.body.includes('og:description" content="El cuerpo entra como descripción."'));
});

// —— 3b. El shell: lo que rompió esto en producción ——
//
// La primera versión pedía el shell a VERCEL_URL, que tiene protección de
// despliegue, así que recibía la página de autenticación de Vercel —487 KB de
// HTML ajeno— y la servía con nuestras etiquetas encima. Ahora se comprueba que
// lo recibido sea esta aplicación, y si no, se devuelve al archivo estático.
const LOGIN_DE_VERCEL = `<!DOCTYPE html><html lang="en-US"><head><title>Login</title>` +
  `</head><body>${"x".repeat(500)}<script src="/_next/static/chunks/a.js"></script></body></html>`;

const shells = [
  ["el shell no responde", async () => { throw new Error("ECONNREFUSED"); }, "shell-sin-respuesta"],
  ["llega la página de Vercel", async () => ({ ok: true, text: async () => LOGIN_DE_VERCEL }), "shell-no-reconocido"],
  ["llega algo vacío", async () => ({ ok: true, text: async () => "" }), "shell-no-reconocido"],
  ["llega un HTML enorme", async () => ({ ok: true, text: async () => "y".repeat(200000) }), "shell-no-reconocido"],
];
for (const [nombre, impl, marca] of shells) {
  await conFetch(impl, async () => {
    const res = respuestaFalsa();
    await handler({ query: { seccion: "noticias", slug: "x" } }, res);
    check(`${nombre}: redirige al estático, no lo sirve`,
      res.code === 307 && res.location === "/noticias/x?_s=1" && res.headers["X-Pieza-Meta"] === marca,
      `${res.code} ${res.location ?? ""} ${res.headers["X-Pieza-Meta"] ?? ""}`);
    check(`${nombre}: nunca devuelve HTML ajeno`, !res.body);
  });
}

check("el shell propio se reconoce", esNuestroShell(SHELL));
check("el de Vercel no", !esNuestroShell(LOGIN_DE_VERCEL));

// —— 4. Una sección que no existe no inventa etiquetas ——
await conFetch(fetchNormal(PIEZA), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "recetas", slug: "x" } }, res);
  check("sección desconocida no inventa la pieza",
    res.code === 200 && !res.body.includes("tripartita"), res.headers["X-Pieza-Meta"]);
});

// —— 5. Inyección de HTML por el título ——
const sucio = inyectar(SHELL, {
  titulo: '</title><script>alert(1)</script>',
  descripcion: '" onload="alert(2)',
  url: "https://www.sureconomics.com/noticias/x",
});
check("no se puede cerrar el title desde el contenido", !sucio.includes("<script>alert(1)"));
check("no se puede escapar de un atributo", !sucio.includes('onload="alert(2)"'));

// Los símbolos que `String.prototype.replace` interpreta en una cadena de sustitución
// («$&», «$'», «$`», «$$»): en producción «US$&nbsp;36,5» llegaba como «USnbsp;36,5».
const conDolares = inyectar(SHELL, {
  titulo: "El dólar: US$& y $' en el titular",
  html: "<p>Cuesta US$&nbsp;36,5 y $$ de más.</p>",
  datos: { titulo: "a$`b" },
});
check("«$&» y «$'» del título llegan tal cual",
  conDolares.includes("<title>El dólar: US$&amp; y $' en el titular — SurEconomics</title>"));
check("«$&nbsp;» y «$$» del cuerpo llegan tal cual",
  conDolares.includes("<p>Cuesta US$&nbsp;36,5 y $$ de más.</p>"));
check("«$`» del JSON de la pieza llega tal cual", conDolares.includes('"titulo":"a$`b"'));

// --- 6. La imagen: absoluta siempre ---
//
// El fallo que tuvo esto en produccion. La API devuelve `/media/image/...` para lo
// que vive en R2, y una `og:image` relativa no la resuelve nadie: WhatsApp, X,
// Facebook y Telegram la descartan. La etiqueta estaba, se veia bien, y no valia
// nada -- que es el modo exacto en que esto falla sin que nadie lo note.
check(
  "una ruta de /media sale absoluta, y en su versión para compartir",
  imagenParaCompartir("/media/image/2026/09/foto-abc.png").url ===
    "https://www.sureconomics.com/media/image/2026/09/foto-abc-og.jpg"
);
check("la versión para compartir se declara medida",
  imagenParaCompartir("/media/image/2026/09/foto-abc.png").medido === true);
check("un SVG no se manda a X: tarjeta de marca",
  imagenParaCompartir("/media/image/2026/09/logo-abc.svg") === IMAGEN_DE_MARCA);
check(
  "una direccion completa se respeta",
  imagenParaCompartir("https://otro.example/foto.jpg").url === "https://otro.example/foto.jpg"
);
check("sin imagen, nada", imagenParaCompartir(null) === null);

// --- 7. Las medidas solo se declaran cuando se conocen ---
//
// Se anunciaba 1200x630 sobre fotografias de 679x452. Quien confia en esos numeros
// recorta a un tamano que no existe; quien los comprueba concluye que las etiquetas
// no son de fiar.
const sinMedir = inyectar(SHELL, {
  titulo: "Una pieza",
  url: "https://www.sureconomics.com/noticias/x",
  imagen: imagenParaCompartir("https://otro.example/foto.jpg"),
});
check("una imagen servida tal cual no declara tamano", !sinMedir.includes("og:image:width"));
check("pero si sale en og:image", sinMedir.includes('property="og:image"'));

const medida = inyectar(SHELL, {
  titulo: "Una pieza",
  url: "https://www.sureconomics.com/noticias/x",
  imagen: imagenParaCompartir("https://res.cloudinary.com/x/image/upload/v1/foto.jpg"),
});
check("una recortada por nosotros si lo declara", medida.includes('content="1200"'));
check("y pide tarjeta grande", medida.includes("summary_large_image"));

// --- 8. /entorno: la puerta del boletín, con su propia tarjeta ---
await conFetch(async (url) => {
  if (String(url).endsWith("/index.html")) return { ok: true, status: 200, text: async () => SHELL };
  throw new Error("no debería pedir la API");
}, async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "entorno" } }, res);
  check("entorno responde 200 sin tocar la API", res.code === 200, res.headers["X-Pieza-Meta"]);
  check("entorno lleva su tarjeta", res.body.includes(`property="og:image" content="${ENTORNO.imagen.url}"`));
  check("entorno es un sitio, no un artículo", res.body.includes('og:type" content="website"'));
  check("entorno con una sola og:image", (res.body.match(/property="og:image"/g) || []).length === 1);
  check("entorno se cachea", /s-maxage=3600/.test(res.headers["Cache-Control"]));
});

// —— 9. El resumen diario: la tarjeta que WhatsApp pinta bajo el mensaje del canal ——
const RESUMEN = {
  fecha: "2026-11-09",
  edicion: "manana",
  nombre: "SurEconomics · Lo importante de esta mañana",
  fecha_larga: "Lunes 9 de noviembre",
  secciones: [
    { clave: "importante", puntos: [{ linea: "PDVSA designa juntas para Citgo" }, { linea: "El BCV sube la tasa" }] },
    { clave: "region", puntos: [{ linea: "Chile investiga a las AFP" }, { linea: "Un cuarto que no entra" }] },
  ],
  imagen: { url: "/media/image/2026/11/puerto-a1b2c3d4.png", alt: "Puerto", credito: null },
  publicado_en: "2026-11-09T11:00:00+00:00",
};
check("resumen: la descripción son los tres primeros puntos",
  descripcionDelResumen(RESUMEN) === "PDVSA designa juntas para Citgo · El BCV sube la tasa · Chile investiga a las AFP");
check("resumen sin puntos: sin descripción", descripcionDelResumen({ secciones: [] }) === null);
await conFetch(fetchNormal(RESUMEN), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "resumen", fecha: "2026-11-09", edicion: "manana" } }, res);
  const h = res.body;
  check("resumen: 200 con la app intacta", res.code === 200 && h.includes('id="root"') && res.headers["X-Pieza-Meta"] === "resumen",
    res.headers["X-Pieza-Meta"]);
  check("resumen: el nombre de la edición y el día",
    h.includes('property="og:title" content="SurEconomics · Lo importante de esta mañana · Lunes 9 de noviembre"'));
  check("resumen: la foto del día, en su versión para compartir",
    h.includes('property="og:image" content="https://www.sureconomics.com/media/image/2026/11/puerto-a1b2c3d4-og.jpg"'));
  check("resumen: una sola og:image", (h.match(/property="og:image"/g) || []).length === 1);
  check("resumen: los primeros puntos como descripción",
    h.includes('property="og:description" content="PDVSA designa juntas para Citgo · El BCV sube la tasa · Chile investiga a las AFP"'));
  check("resumen: la dirección del canal como canónica",
    h.includes('rel="canonical" href="https://www.sureconomics.com/resumen/2026-11-09/manana"'));
  check("resumen: se cachea", /s-maxage=600/.test(res.headers["Cache-Control"]));
});
await conFetch(fetchNormal({ ...RESUMEN, imagen: null }), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "resumen", fecha: "2026-11-09", edicion: "tarde" } }, res);
  check("resumen sin foto: la tarjeta de marca", res.body.includes(`property="og:image" content="${IMAGEN_DE_MARCA.url}"`));
});
await conFetch(async (url) => {
  if (String(url).endsWith("/index.html")) return { ok: true, text: async () => SHELL };
  return { ok: false, status: 404 };
}, async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "resumen", fecha: "2026-11-09", edicion: "noche" } }, res);
  check("resumen que no salió: 404 con noindex y la app intacta",
    res.code === 404 && res.body.includes('name="robots" content="noindex, follow"') && res.body.includes('id="root"'));
});
await conFetch(fetchNormal(RESUMEN), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "resumen", fecha: "ayer", edicion: "manana" } }, res);
  check("resumen con fecha rara: la tarjeta genérica, sin preguntar a la API",
    res.code === 200 && res.headers["X-Pieza-Meta"] === "ruta-desconocida", res.headers["X-Pieza-Meta"]);
});
await conFetch(async (url) => {
  if (String(url).endsWith("/index.html")) return { ok: true, text: async () => "no es nuestro" };
  return { ok: true, status: 200, json: async () => ({ data: RESUMEN }) };
}, async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "resumen", fecha: "2026-11-09", edicion: "manana" } }, res);
  check("resumen: si el shell falla, vuelve a su dirección", res.location === "/resumen/2026-11-09/manana?_s=1", res.location);
});

// —— 7. Las piezas en inglés ——
//
// Con versión en inglés, `/en/...` es una página propia: titular y texto en inglés, el
// documento en inglés, canónica en `/en` y las dos versiones enlazadas. Sin ella, `/en`
// enseña el original: canónica al español y `noindex`.
const EN_INGLES = {
  ...PIEZA,
  format: "articulo",
  content: "<p>Texto en español.</p>",
  en_ingles: true,
  title_en: 'Tripartite "agreement" and real wages in Uruguay',
  excerpt_en: "<p>Wage councils closed with a real raise of 1.8%.</p>",
  content_en: "<p>English body.</p>",
};
await conFetch(fetchNormal(EN_INGLES), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "articulos", slug: "concertacion-tripartita", lang: "en" } }, res);
  const h = res.body;
  check("en: 200", res.code === 200, String(res.code));
  check("en: titular en inglés", h.includes("<title>Tripartite &quot;agreement&quot; and real wages in Uruguay — SurEconomics</title>"));
  check("en: descripción en inglés", h.includes('name="description" content="Wage councils closed with a real raise of 1.8%."'));
  check("en: documento en inglés", h.includes('<html lang="en">'));
  check("en: og:locale en inglés", h.includes('property="og:locale" content="en_US"'));
  check("en: canónica propia", h.includes('rel="canonical" href="https://www.sureconomics.com/en/articulos/concertacion-tripartita"'));
  check("en: las dos versiones enlazadas",
    h.includes('hreflang="es" href="https://www.sureconomics.com/articulos/concertacion-tripartita"') &&
    h.includes('hreflang="en" href="https://www.sureconomics.com/en/articulos/concertacion-tripartita"'));
  // El HTML previo, en inglés. (La pieza entera, con su español, viaja aparte en
  // `window.__SE_PIEZA__` para que la página no la pida otra vez: eso no se mira aquí.)
  check("en: el cuerpo en inglés dentro", h.includes('<div class="se-piece__body"><p>English body.</p></div>'));
  check("en: kicker y firma en inglés", h.includes(">Articles<") && h.includes(">By "));
  check("en: la ficha dice inglés", h.includes('"inLanguage":"en"'));
  check("en: se indexa", !h.includes('content="noindex'));
});
await conFetch(fetchNormal(EN_INGLES), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "articulos", slug: "concertacion-tripartita" } }, res);
  const h = res.body;
  check("es con inglés: sigue en español", h.includes('<html lang="es">') && h.includes("Texto en español"));
  check("es con inglés: también declara la versión inglesa",
    h.includes('hreflang="en" href="https://www.sureconomics.com/en/articulos/concertacion-tripartita"'));
});
await conFetch(fetchNormal({ ...PIEZA, format: "articulo", en_ingles: false, title_en: "Half done" }), async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "articulos", slug: "concertacion-tripartita", lang: "en" } }, res);
  const h = res.body;
  check("en sin traducción: el original en español", h.includes('<html lang="es">') && h.includes("Concertación"));
  check("en sin traducción: canónica al español", h.includes('rel="canonical" href="https://www.sureconomics.com/articulos/concertacion-tripartita"'));
  check("en sin traducción: noindex", h.includes('name="robots" content="noindex, follow"'));
  check("en sin traducción: sin hreflang", !h.includes("hreflang="));
});
await conFetch(async (url) => {
  if (String(url).endsWith("/index.html")) return { ok: true, text: async () => "no es nuestro" };
  return { ok: true, status: 200, json: async () => ({ data: EN_INGLES }) };
}, async () => {
  const res = respuestaFalsa();
  await handler({ query: { seccion: "articulos", slug: "x", lang: "en" } }, res);
  check("en: si falla, vuelve a la dirección en inglés", res.location === "/en/articulos/x?_s=1", res.location);
});

// —— El encuadre de la foto (9-nov-2026) ——
{
  const { imagenParaCompartir: ipc } = await import("./pieza.js");
  const base = "/media/image/2026/11/foto-abc.png";
  check("sin encuadre, la de siempre", ipc(base)?.url?.endsWith("/media/image/2026/11/foto-abc-og.jpg"));
  check("con encuadre, su propio nombre", ipc(base, "30,70")?.url?.endsWith("/media/image/2026/11/foto-abc-og-30-70.jpg"));
  check("al centro es la de siempre", ipc(base, "50,50")?.url?.endsWith("-og.jpg"));
  check("fuera de los pasos de 5 se ignora", ipc(base, "33,70")?.url?.endsWith("-og.jpg"));
}

// —— La foto de cabecera del HTML previo (13-nov-2026) ——
//
// La misma `<img>` que pinta la página (`fotoDePortada`), en la cabecera y no después de
// la firma. Antes era la original (un PNG de 1,9 MB) sin medidas: el navegador bajaba un
// archivo que React no usaba, React pintaba otra foto más tarde -- y Google medía esa
// (LCP) --, y su hueco medía cero hasta que llegaba, así que empujaba el texto (CLS).
const raizDe = (h) => (h.match(/<div id="root">([\s\S]*?)<\/div><script/) || [])[1] || "";
const imgDe = (h) => (raizDe(h).match(/<img [^>]*>/) || [])[0] || "";
const pedir = async (pieza, seccion = "articulos") => {
  const res = respuestaFalsa();
  await conFetch(fetchNormal(pieza), () => handler({ query: { seccion, slug: "x" } }, res));
  return res.body;
};
const EN_R2 = "/media/image/2026/11/recurso-33285c7f7d61.png";
const CON_FOTO = { ...CON_CUERPO, image_asset: { url: EN_R2, width: 1733, height: 907 }, imagen_foco: "60,10" };
{
  const h = await pedir(CON_FOTO);
  const img = imgDe(h);
  const igual = fotoDePortada(EN_R2, 1733, 907);
  check("foto previa: la clase de la página", img.startsWith('<img class="se-piece__img" '), img);
  check("foto previa: las tallas y el sizes de la página, no la original",
    img.includes(`srcset="${igual.srcSet}"`) && igual.srcSet.includes("recurso-33285c7f7d61-1400.png 1400w")
      && img.includes(`sizes="${igual.sizes}"`));
  check("foto previa: con su proporción", img.includes('width="1733" height="907"'));
  check("foto previa: se pide ya y primero", img.includes('loading="eager"') && img.includes('fetchpriority="high"'));
  check("foto previa: con su encuadre", img.includes('style="object-position:60% 10%"'));
  check("foto previa: el titular de texto alternativo", img.includes('alt="Concertación &quot;tripartita&quot; &amp; el salario real en Uruguay"'));
  const raiz = raizDe(h);
  check("foto previa: en la cabecera, antes de la firma, como en la página",
    /<header class="se-piece__head se-piece__head--media"><div class="se-piece__head-text"><h1 [\s\S]*<\/div><div class="se-piece__head-media"><img /.test(raiz)
      && raiz.indexOf("se-piece__img") < raiz.indexOf("se-piece__meta"));
  check("foto previa: la de compartir no cambia",
    h.includes('property="og:image" content="https://www.sureconomics.com/media/image/2026/11/recurso-33285c7f7d61-og-60-10.jpg"'));
}
{
  const img = imgDe(await pedir({ ...CON_FOTO, image_asset: { url: "/media/image/2026/10/vieja-abc.jpg" }, imagen_foco: null }));
  check("foto previa sin medidas (pieza vieja): sale, sin inventarse proporción ni encuadre",
    img.includes('src="/media/image/2026/10/vieja-abc.jpg"') && !img.includes("width=") && !img.includes("style="));
}
{
  const img = imgDe(await pedir({ ...CON_FOTO, image_asset: { url: "/media/image/2026/11/chica-abc.jpg", width: 588, height: 393 } }));
  check("foto previa más chica que las tallas: la original, sin srcset",
    img.includes('src="/media/image/2026/11/chica-abc.jpg"') && !img.includes("srcset=") && img.includes('width="588" height="393"'));
}
{
  const h = await pedir(CON_CUERPO);
  check("foto previa de Cloudinary: la talla de la página",
    imgDe(h).includes('src="https://res.cloudinary.com/pjr7bqzt/image/upload/f_auto,q_auto,c_fill,w_1400/v1787613820/sureconomics/foto.jpg"'));
}
{
  const h = await pedir({ ...CON_FOTO, image_asset: { url: "/media/image/2026/11/grafico-abc.svg", width: 1200, height: 800 } });
  check("foto previa en SVG: se pinta sin tallas, que no existen",
    imgDe(h).includes('src="/media/image/2026/11/grafico-abc.svg"') && !imgDe(h).includes("srcset="));
  check("foto previa en SVG: la tarjeta de compartir sigue siendo la de marca", h.includes(`property="og:image" content="${IMAGEN_DE_MARCA.url}"`));
}
{
  const h = await pedir({ ...CON_FOTO, format: "entrevista" }, "entrevistas");
  check("entrevista: sin foto arriba, como la página (su portada es el video)",
    !raizDe(h).includes("<img") && raizDe(h).includes('<header class="se-piece__head"><div class="se-piece__head-text">'));
}
{
  const h = await pedir({ ...CON_FOTO, image_asset: null, featured_image_url: null });
  check("sin foto: cabecera de una columna y ninguna img", !raizDe(h).includes("<img") && raizDe(h).includes('<header class="se-piece__head">'));
}
{
  const h = await pedir({ ...CON_FOTO, image_asset: { url: "javascript:alert(1)", width: 10, height: 10 } });
  check("una dirección que no es web no se pinta, como en la página", !raizDe(h).includes("<img") && !raizDe(h).includes("javascript:"));
}
{
  const res = respuestaFalsa();
  await conFetch(fetchNormal({ ...EN_INGLES, image_asset: { url: EN_R2, width: 1733, height: 907 } }),
    () => handler({ query: { seccion: "articulos", slug: "x", lang: "en" } }, res));
  check("en: la foto lleva de texto alternativo el titular en inglés, como la página",
    imgDe(res.body).includes('alt="Tripartite &quot;agreement&quot; and real wages in Uruguay"'));
}
check("fotoDePortada: medidas raras no se ponen",
  [[0, 400], [800, null], ["800", "600"], [Number.NaN, 3], [1.5, 2], [-4, 3]]
    .every(([w, h]) => fotoDePortada(EN_R2, w, h).width === undefined && fotoDePortada(EN_R2, w, h).height === undefined));

console.log(fallos ? `\n  ${fallos} fallo(s)` : "\n  todo verde");
process.exit(fallos ? 1 : 0);
