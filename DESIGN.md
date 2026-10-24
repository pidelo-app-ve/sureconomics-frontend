---
name: SurEconomics
description: Economía, mercados e inversión de América Latina, en la primera plana de un diario financiero.
colors:
  papel: "#f9f8f6"
  tinta: "#111827"
  filete: "#ddd8cc"
  filete-fuerte: "#c4bcab"
  verde-cardin: "#003318"
  rojo-cattail: "#b9532a"
  rojo-cattail-hondo: "#9d4423"
  pizarra: "#3d3d3d"
  gris-dim: "#6b6b6b"
  subida: "#0f7a3d"
  bajada: "#c1272d"
  blanco: "#ffffff"
typography:
  display:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.375rem, 0.95rem + 1.9vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.625rem, 1.25rem + 1.1vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  title-editorial:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title-columna:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.2
  title-sm:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.25
  titular-lista:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.3
  fecha:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  firma-editorial:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  firma:
    fontFamily: "Host Grotesk, Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
  body:
    fontFamily: "Host Grotesk, Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  bajada:
    fontFamily: "Host Grotesk, Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Host Grotesk, Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
  label:
    fontFamily: "Host Grotesk, Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  cifras:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  none: "0px"
  pastilla: "2px"
spacing:
  xs: "0.5rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "2rem"
  xl: "3rem"
  2xl: "4rem"
  3xl: "6rem"
  section-gap: "5rem"
  gutter: "1.5rem"
  container-max: "1440px"
components:
  boton-primario:
    backgroundColor: "{colors.rojo-cattail}"
    textColor: "{colors.blanco}"
    typography: "{typography.label}"
    rounded: "{rounded.pastilla}"
    padding: "11px 20px"
  boton-primario-hover:
    backgroundColor: "{colors.rojo-cattail-hondo}"
    textColor: "{colors.blanco}"
  pastilla-ultima-hora:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.pastilla}"
    padding: "4px 10px 4px 9px"
  pastilla-ultima-hora-hover:
    textColor: "{colors.verde-cardin}"
  insignia-pdf:
    backgroundColor: "{colors.rojo-cattail}"
    textColor: "{colors.blanco}"
    typography: "{typography.cifras}"
    rounded: "{rounded.none}"
    padding: "0 7px"
    height: "22px"
  insignia:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    padding: "0 7px"
    height: "22px"
  tarjeta-prensa:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "12px 0 0"
  barra-inferior-enlace:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.pizarra}"
    height: "56px"
  barra-inferior-enlace-activo:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.verde-cardin}"
  boletin:
    backgroundColor: "{colors.verde-cardin}"
    textColor: "{colors.blanco}"
    typography: "{typography.headline}"
---

# Design System: SurEconomics

## Overview

**Creative North Star: "La primera plana"**

La parte pública de SurEconomics se compone como la primera plana de un diario financiero (la familia de FT, Bloomberg, WSJ, DF SUD): papel cálido, tinta casi negra, titulares en serif periodística y cifras en monoespaciada. La jerarquía la dicen el cuerpo del titular y el peso de los filetes, no las cajas, los fondos de color ni las sombras. Una pieza se separa de la siguiente con un filete de 1 px; una sección empieza bajo una regla de tinta de 2 px; la edición del día se fecha sobre un doble filete de 3 px.

La densidad es de periódico: tres columnas en escritorio, listas apretadas con hora delante del titular, tablas de cifras alineadas al decimal. En el teléfono todo se apila en el mismo orden de lectura, con una cabecera fija de 52 px y una barra de cuatro accesos abajo. El verde Cardin es el único tono profundo y se reserva para la cabecera, el boletín y el pie; el resto de la página es papel.

La paleta de prensa vive solo dentro de `.se-publico` (el marco de `Layout.jsx`): ahí se redefinen `--color-paper`, `--color-ink` y `--color-hairline` hacia `--papel`, `--tinta` y `--filete`. El panel de la redacción comparte los nombres de los tokens pero conserva su aspecto propio (blanco, negro de marca, velos en `rgba`); este documento no lo describe.

**Key Characteristics:**
- Papel cálido y tinta, sin tarjetas con caja ni sombras.
- Tres pesos de regla con significado fijo: 1 px entre piezas, 2 px de tinta sobre la sección, 3 px doble bajo la fecha.
- Newsreader para titulares, Host Grotesk para cuerpo e interfaz, JetBrains Mono solo para cifras y horas.
- Verde Cardin como único tono profundo; verde y rojo de mercado solo en cifras.
- Esquinas rectas; 2 px como máximo en pastillas y botones.

## Colors

Papel y tinta con un solo tono profundo de marca y un rojo cobrizo de acento; el color de mercado se queda en las cifras.

### Primary
- **Verde Cardin** (`verde-cardin`): el tono de la casa. Fondo plano de la cabecera, del bloque del boletín y del pie; texto de la firma de la editorial del día, del estado activo de la barra inferior, del hover de la pastilla de Última hora y de los enlaces «Ver todas» al pasar el ratón; anillo de foco del módulo plegable y de la barra inferior. Su velo al 8 % rellena la foto que aún no carga, y al 16 % es el color de selección de texto.

### Secondary
- **Rojo Cattail** (`rojo-cattail`): el acento cobrizo de la marca. Relleno del botón primario (Registrarse, Únase al boletín), insignia PDF de los informes, hora de cada titular de Última hora y números grandes de «Lo más leído». **Rojo Cattail hondo** (`rojo-cattail-hondo`) es su hover.

### Tertiary
- **Subida** (`subida`) y **Bajada** (`bajada`): variación positiva y negativa en la tabla de monedas y en la cinta de mercados; además, el punto vivo de Última hora usa la subida. Nunca rellenan superficies ni tiñen titulares.

### Neutral
- **Papel** (`papel`): el fondo de toda la parte pública, de la barra inferior y de la pista de la barra de desplazamiento.
- **Tinta** (`tinta`): titulares, texto, reglas de sección de 2 px, borde de la pastilla y de las insignias.
- **Filete** (`filete`): la línea de 1 px entre piezas, columnas y filas de tabla.
- **Filete fuerte** (`filete-fuerte`): el borde superior de la barra inferior, el subrayado de los enlaces «Ver todas…» en reposo y el pulgar de la barra de desplazamiento.
- **Pizarra** (`pizarra`): bajadas, metadatos, fecha de la edición, firmas de análisis, enlaces de la barra inferior en reposo.
- **Gris Dim** (`gris-dim`): el punto de Última hora cuando no hay nada de la última hora.

### Named Rules
**La Regla del Verde Único.** El verde Cardin es la única superficie profunda: cabecera, boletín y pie. Ninguna sección se pinta de otro color de fondo.

**La Regla de las Cifras.** El verde de subida y el rojo de bajada solo pintan números de mercado (y el piloto vivo). No se usan para destacar texto, fondos ni botones.

## Typography

**Display Font:** Newsreader (con Georgia, Times New Roman)
**Body Font:** Host Grotesk (con Poppins, sistema)
**Label/Mono Font:** JetBrains Mono (con ui-monospace, SFMono-Regular, Menlo)

**Character:** Una serif de periódico, variable en peso y tamaño óptico, carga la noticia; la Grotesk de la marca lleva la lectura y la interfaz sin competir; la monoespaciada aparece solo donde un dígito debe caer en columna. Las tres se sirven desde el propio dominio (CSP de fuentes propias), con la cursiva real de Newsreader y de Host Grotesk; la cursiva marca la fecha de la edición y las firmas, nada más.

### Hierarchy
- **Display** (600, clamp 1,375–2,75 rem, 1,08, -0,02 em, `balance`): el titular de la noticia que manda en la primera plana.
- **Headline** (600, clamp 1,625–2,25 rem, 1,1, -0,015 em): el nombre de cada sección (Noticias, Artículos, Editorial, Informes…) y el título del boletín.
- **Title editorial** (600, 1,5 rem, 1,2): el titular de la editorial del día en la columna de opinión.
- **Title** (600, 1,25 rem, 1,2): titulares de tarjetas de prensa (artículos, informes, Al punto).
- **Title columna** (600, 1,125 rem, 1,2): cabeceras de columna de la primera plana (Opinión, Monedas de la región) y rótulo del módulo plegable.
- **Title sm** (600, 1,0625 rem, 1,25): las tres secundarias bajo la principal y los titulares de análisis.
- **Titular de lista** (500, 1 rem, 1,3): titulares de Última hora y de «Lo más leído».
- **Fecha** (400 cursiva, 0,9375 rem, pizarra): la fecha de la edición sobre el doble filete, en la cursiva real de Newsreader.
- **Firma** (cursiva): la firma de la editorial del día en Newsreader cursiva 0,9375 rem verde Cardin; la de los análisis («Por …») en Host Grotesk cursiva 0,8125 rem pizarra. Las dos cursivas se sirven como archivos propios.
- **Body** (400, 1,0625 rem, 1,6): lectura.
- **Bajada** (400, clamp 1–1,125 rem, 1,5, máx. 62 ch): la entrada de la principal.
- **Meta** (400, 0,8125 rem): lugar en negrita de tinta · fecha relativa · firma.
- **Label** (700, 0,75 rem, 0,06 em, mayúsculas): solo la pastilla de Última hora y los botones de la interfaz.
- **Cifras** (400, 0,8125 rem, numerales tabulares): tabla de monedas, horas de Última hora, cinta de mercados, insignia PDF.

### Named Rules
**La Regla de la Serif que Manda.** Todo lo que es un titular va en Newsreader; todo lo que es interfaz o lectura, en Host Grotesk. Un titular en la Grotesk es un error de jerarquía.

**La Regla del Decimal.** JetBrains Mono es para datos que se comparan en columna (monedas, variaciones, horas, páginas de un PDF). No se usa para rótulos ni texto pequeño decorativo.

## Layout

Contenedor de 1440 px con medianil de 1,5 rem; las columnas de lectura se acotan en `ch`. Ritmo vertical sobre la escala `xs`–`3xl` (0,5–6 rem) y 5 rem entre secciones; tras la primera plana, la sección siguiente arranca a clamp(40 px, 5 vw, 72 px).

**La primera plana** se reorganiza por áreas de rejilla:
- **≥ 1200 px:** 3/6/3. Izquierda Última hora (seis titulares); centro la principal con foto 16:9, titular, bajada, meta y tres secundarias en tres columnas entre filetes; derecha la opinión (editorial del día y dos análisis con firma) y debajo las monedas. Las columnas se separan con filetes verticales de 1 px y un hueco de clamp(20 px, 1,8 vw, 28 px) a cada lado.
- **960–1199 px:** 2/1. La principal a la izquierda; a la derecha Última hora (cuatro titulares) y monedas; la opinión debajo a todo el ancho en tres columnas entre filetes.
- **< 960 px:** una columna: Última hora (tres titulares), la principal, la opinión, las monedas. Por debajo de 760 px la foto sale a sangre del medianil y las secundarias pasan a lista.

**Teléfono (< 760 px):** cabecera fija de 52 px (menú, marca, lupa), cinta de mercados deslizable con el dedo debajo, barra inferior fija de 56 px + zona segura que el contenido reserva como relleno inferior. Los informes se deslizan de lado al 84 % con imán.

**Puntos de corte en uso:** 760, 960, 1200 (primera plana), 1024 (carril de Noticias pegajoso a 100 px), 1240 (la cabecera de escritorio sustituye al menú).

## Elevation & Depth

Plano. La profundidad no existe: la jerarquía la llevan las reglas y el cuerpo de letra. No hay `box-shadow` en el mundo público de prensa. La única superposición es el mando de rotación sobre la foto principal, un velo de tinta al 72 % que sirve de fondo legible a los indicadores y al botón de pausa, no de elevación.

### Named Rules
**La Regla del Papel Plano.** Nada flota. Si un bloque necesita separarse, gana un filete o una regla, nunca una sombra, un fondo gris o un levantamiento al pasar el ratón.

**La Regla de los Tres Pesos.** 1 px de filete entre piezas y columnas; 2 px de tinta sobre el título de una sección (1 px de tinta sobre la cabecera de una columna o de un módulo); 3 px de doble filete de tinta bajo la fecha de la edición. Cada peso significa una sola cosa; ninguna regla se dobla con otra (bajo la fecha, la primera fila no repite regla; bajo el título de sección, la lista no lleva la suya).

## Shapes

Esquinas rectas. Fotos, tarjetas, insignias, tablas, el boletín y su botón van a 0. La pastilla de Última hora y los botones de la interfaz llevan 2 px, el máximo del sistema. Los únicos círculos son el punto vivo de Última hora (7 px). Las imágenes se recortan con `object-fit: cover` a 16:9 (principal, tarjetas) o 4:3 (informes en escritorio, principal de Noticias).

## Components

### Buttons
Sobrios y escasos: una sola llamada rellena por zona.
- **Shape:** casi recto (2 px); el del boletín, recto.
- **Primary:** relleno rojo Cattail, texto blanco, Host Grotesk 13 px en mayúsculas con 0,04 em, 11 × 20 px.
- **Hover / Focus:** relleno rojo Cattail hondo; anillo de foco en el acento.
- **Texto:** en la cabecera de escritorio, Juegos, Al punto y Entrar son enlaces de texto sin mayúsculas que se subrayan al pasar; «Ver todas →» es Grotesk 600 en tinta que pasa a verde y desplaza la flecha 3 px.

### Cabecera de sección
Una regla de tinta de 2 px, 10 px de aire y el nombre en Headline; «Ver todas →» al otro extremo. Sin guion de color ni fondo.

### Tarjeta de prensa
Sin caja: filete de 1 px encima, foto, titular en Title y debajo una línea de pie «Tema · Lugar · fecha» en Grotesk 13 px separada por puntos medios. El tema nunca va encima del titular.

### Última hora (columna)
La cabecera es una pastilla con borde de tinta de 1 px, punto de 7 px y el rótulo en Label; el punto es verde de subida y late (1,8 s) solo si lo primero de la lista tiene menos de una hora; si no, gris quieto. Cada fila es una rejilla de 3,4 rem + titular: la hora en JetBrains Mono 12 px rojo Cattail, el titular en Titular de lista; filetes de 1 px entre filas. Cierra con «Toda la última hora» subrayado en filete fuerte.

### La que manda
Foto 16:9 con relleno verde al 8 % mientras carga, titular Display, bajada, y meta con el lugar en negrita de tinta. Rota entre las cuatro del día: la foto nueva barre a la anterior de izquierda a derecha (`clip-path`, 900 ms, cubic-bezier(0.16, 1, 0.3, 1)) y el texto entra 8 px desde abajo (520 ms, 120 ms de retardo). Arriba a la derecha, sobre velo de tinta, segmentos de 14 × 2 px (el actual de 26 px en blanco) y botón de pausa de 32 px. Con movimiento reducido, sin animación.

### Columna de opinión
Editorial del día en Title editorial con la firma «Editorial del día» en Newsreader cursiva verde Cardin y bajada serif recortada a cuatro líneas; dos análisis en Title sm con «Por …» en Grotesk cursiva pizarra; filetes de 1 px entre artículos.

### Tabla de monedas
JetBrains Mono 13 px tabular, código ISO en 600 a la izquierda, valor y variación alineados a la derecha (variación de 5,5 em), filas de 7 px con filete de 1 px. Variación en subida, bajada o pizarra («—» si es fija). Cierra con «Todas las monedas y su variación».

### Insignias de informe
Cajas rectas de 22 px de alto. **PDF · n págs.** en rojo Cattail con texto blanco en JetBrains Mono 11 px; **Exclusivo para registrados** con borde de tinta de 1 px en Grotesk 12 px 600. Solo lo que es verdad de esa pieza.

### Boletín
Banda a todo el ancho en verde Cardin, título en Headline blanco, texto blanco al 86 %, campo sin borde y botón rojo Cattail recto.

### Navigation (barra inferior del teléfono)
Por debajo de 760 px: cuatro accesos (Portada, Mercados, Informes, Buscar) en una rejilla de cuatro sobre papel con filete fuerte encima. Icono de trazo de 22 px (1,6; 2 en activo) sobre el rótulo en Grotesk 11 px 600 pizarra; activo en verde Cardin (`aria-current` o `aria-expanded`); al pulsar, escala 0,96 en 140 ms; foco verde por dentro. Banners fijos y aviso de cookies suben por encima.

### Módulo plegable (Béisbol y juegos)
Un `<details>` bajo un filete de tinta de 1 px: rótulo en Title columna con chevrón de 18 px que gira 180° (200 ms). Abierto en escritorio, plegado en el teléfono. Dentro, los juegos se presentan como una franja doble sobre papel: escena de 112 px y título en tinta con un enlace verde «→», sin caja, sin sombra y sin rótulo encima.

## Do's and Don'ts

### Do:
- **Do** separar piezas con un filete de 1 px en `filete` y abrir cada sección con una regla de tinta de 2 px.
- **Do** escribir cada titular en Newsreader 600 y cada cifra de mercado u hora en JetBrains Mono con numerales tabulares.
- **Do** poner el lugar y la fecha debajo del titular («Venezuela · 6 ago 2026»), con el lugar en negrita de tinta.
- **Do** reservar el verde Cardin para cabecera, boletín, pie y estados activos.
- **Do** pintar subidas y bajadas solo en las cifras, con `subida` y `bajada`.
- **Do** desactivar el barrido, la entrada del texto y el latido con `prefers-reduced-motion`.
- **Do** mantener la paleta de prensa dentro de `.se-publico`; el panel conserva su aspecto.

### Don't:
- **Don't** meter piezas en tarjetas con borde gris, fondo propio o esquinas de más de 2 px.
- **Don't** usar sombras ni levantar bloques al pasar el ratón.
- **Don't** pintar el fondo de una sección con un color propio; el verde Cardin es la única superficie profunda.
- **Don't** colocar la etiqueta del tema encima del titular.
- **Don't** poner un titular en Host Grotesk ni un rótulo en JetBrains Mono.
- **Don't** apilar dos reglas donde una ya separa.
