---
version: 1
slug: "src-pages-home-jsx"
primary_target: "src/pages/Home.jsx"
related_targets: []
---

# Portada (src/pages/Home.jsx)

Modo: Leer. Lectores: inversionistas y ejecutivos que escanean cifras, y público general que lee análisis, por igual; mayoría en teléfono. Dirección fijada por el encargo de Ramón (24-oct-2026): prensa financiera editorial (FT, Bloomberg, WSJ, DF SUD). Sin ronda de conceptos: dirección fijada por el encargo. Construcción por código (no hay generador de imágenes).

## Direction contract

THESIS: La portada es la primera plana de un diario financiero: tres columnas de prensa separadas por filetes de 1 px (Última hora con sello de hora | la noticia que manda | opinión de la casa e indicadores). Rechaza el héroe a sangre, las bandas de color por sección y las tarjetas con caja.

OWN-WORLD: papel cálido #F9F8F6, tinta #111827, filetes #DDD8CC; verde Cardin #003318 como único tono profundo (cabecera, boletín, pie); subidas #0F7A3D y bajadas #C1272D solo en cifras. Titulares en Newsreader, cuerpo y menús en Host Grotesk, cifras en JetBrains Mono. Esquinas rectas, sin sombras.

STORY: el lector sabe en una pantalla qué manda hoy, qué está pasando ahora y cómo van las monedas; baja a Noticias densas, análisis, editoriales, informes con insignia PDF, Al punto; cierra con el boletín.

FIRST VIEWPORT: escritorio 3/6/3: izquierda pastilla «Última hora» con punto vivo y 6 titulares con hora; centro foto 16:9, titular serif de 2,5-3,25 rem, bajada, lugar · hace cuánto, y tres secundarias bajo filete; derecha editorial del día en serif, dos análisis con firma y monedas en mono. Teléfono: cabecera fija de 52 px (menú, marca, lupa), cinta deslizable debajo, pastilla Última hora, foto a lo ancho, titular de 22 px, lista con miniatura de 80 px a la derecha, barra inferior Portada/Mercados/Informes/Buscar.

FORM: dirección fijada por el encargo (sin sorteo); sin seed key.

SIGNATURE: la noticia principal rota entre las cuatro del día y la foto nueva barre a la anterior (clip-path, 900 ms, ease-out exponencial); el punto verde de Última hora late mientras la noticia tiene menos de una hora.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
