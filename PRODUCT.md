# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dos lectores por igual (confirmado por Ramón, 24-oct-2026): inversionistas y ejecutivos que revisan mercados y noticias a diario, sobre todo desde el teléfono, y quieren cifras y contexto rápido; y público general de Venezuela y América Latina que sigue la economía sin ser especialista. La portada sirve al que escanea cifras y al que se queda a leer un análisis.

## Product Purpose

SurEconomics es un medio de economía, mercados e inversión de América Latina. Publica noticias, artículos de análisis con firma, editoriales de la casa, informes y reportes de investigación, entrevistas y pódcast («Al punto»), y un boletín semanal («Entorno en Viñetas»). Éxito: que el lector entienda en segundos qué pasó hoy en la economía de la región y vuelva cada día.

## Positioning

Economía latinoamericana contada desde la región, con cifras propias en vivo: monedas de 12 países con fuentes oficiales, «Última hora» redactada cada 10 minutos, «Lo importante de hoy» a las 7:00, marcador de la LVBP y juegos propios (Vuela, guacamaya; La Clave).

## Operating Context

Sitio bilingüe (español en `/`, inglés en `/en`). Redacción con panel propio. Publicidad propia en espacios declarados por página. Aliados institucionales (casas de bolsa y firmas de investigación) con desfile de logos. Lectura mayoritaria en teléfono.

## Capabilities and Constraints

- React 18 + Vite, CSS propio (BEM `se-*` en `src/styles/blog.css`), sin Tailwind; textos en JSON por zonas (`src/i18n`). Backend Flask en Render; frontend en Vercel con CSP estricta.
- Formatos: noticia, artículo, editorial, informe, entrevista, pódcast.
- Las piezas no traen cifras clave (KPI) estructuradas: no se inventan en la portada.
- Nada se sube a producción sin el «sube» de Ramón.

## Brand Commitments

- Marca SurEconomics: verde Cardin #003318 (tono profundo de cabecera, pie y bloques destacados), rojo Cattail #b9532a, gris #6b6b6b. Letra de marca Host Grotesk para cuerpo y navegación (confirmado 24-oct-2026).
- Encargo editorial fijado por Ramón (24-oct-2026): prensa financiera sobria al estilo FT, Bloomberg, WSJ, DF SUD; titulares en serif periodística; cifras en monoespaciada o numerales tabulares; fondo papel cálido; filetes finos de 1 px entre noticias; nada de tarjetas con borde gris, sombras flotantes ni esquinas muy redondeadas.
- Lo que no se toca sin preguntar: el desfile animado de logos de aliados, TradingView solo fino en la cinta, noticias con imagen, informes con su imagen de vista previa.

## Evidence on Hand

Contenido real del sitio (piezas, monedas, LVBP, titulares). En local muchas piezas no tienen foto y salen con relleno de color. No hay testimonios ni cifras de audiencia publicables.

## Product Principles

- La noticia manda: la jerarquía tipográfica dice qué importa hoy.
- Cifras verificables y con fuente, nunca decorativas.
- Rápido en el teléfono, legible de un vistazo.
- Seriedad de prensa: lo lúdico (juegos) va discreto.
