# Mapa del repo

Dónde vive cada cosa del frontend y cómo se añade un tema nuevo. Las reglas las vigila
`src/arquitectura.test.mjs` (corre con `npm test`), y el tamaño de los componentes,
`src/componentes.test.mjs`: uno nuevo no pasa de 200 líneas y los que ya pasaban tienen
un tope que solo baja.

## Dos zonas

- **Nueva: `src/features/<tema>/`.** Todo lo de un tema junto, con una puerta (`index.js`).
  Es donde va el código nuevo.
- **Vieja, que se va vaciando:** `src/components`, `src/pages`, `src/lib`, `src/hooks`,
  `src/services` y `src/styles`, ordenadas por tipo de archivo. Cuando se toca un tema a
  fondo, se muda a `src/features/` (como se hizo con monedas, titulares, analítica,
  publicidad y el boletín), y lo que queda en la zona vieja entra por su puerta.
- **Compartida, por debajo de todo:** `src/api/` (el cliente HTTP) y `src/config/` (los
  datos fijos del sitio). No importan nada del sitio ni del panel: son los demás los que
  las usan.

## Tema → carpetas

| Tema | Dónde |
| --- | --- |
| Monedas de la región (`/monedas`, la franja) | `src/features/monedas` |
| Titulares en caliente («Última hora») | `src/features/titulares` |
| Audiencia y cookies (aviso, `/cookies`, panel «Audiencia») | `src/features/analitica` |
| Publicidad (huecos, barra, patrocinios, panel) | `src/features/publicidad` |
| Boletín «Entorno en Viñetas» (alta, invitación, baja, `/entorno`, panel de números y suscriptores) | `src/features/boletin` |
| Portada | `pages/Home.jsx`, `components/home` |
| Pieza (artículo, video, informe) | `pages/Pieza.jsx`, `components/piece`, `lib/pieza.js` |
| Listados y búsqueda | `pages/Articulos.jsx`, `Audiovisual.jsx`, `Explorar.jsx` |
| Cuenta del lector | `pages/cuenta`, `components/cuenta` |
| Resumen diario | `pages/Resumen.jsx`, `services/resumenService.js`, `components/admin/resumen` |
| Juegos (Vuela guacamaya, La Clave) | `src/juegos` |
| El panel (`/admin`) | `pages/admin`, `components/admin` (y el `admin/` de cada feature) |
| Lo común de las listas del panel (buscador con espera, páginas, turno) | `lib/listasDelPanel.js`, `hooks/useBuscadorConEspera.js`, `hooks/useListaDelServidor.js`, `components/admin/PaginasDeLaLista.jsx` |
| Guías («Guía» de cada página) | `lib/guias`, `lib/recorridoVista.js`, `components/recorrido`; los pasos de las guías de monedas, titulares, audiencia, publicidad y el boletín viven en `features/*/guia.js` |
| Llamadas al servidor (lo común) | `src/api/`: el núcleo (`nucleo.js`), la sesión (`sesion.js`), el quiosco y los archivos del propio sitio (`archivoDelSitio.js`). Se entra por los envoltorios de siempre: `lib/api.js` (panel), `lib/userApi.js` (lector), `services/apiClient.js` (lo público) |
| Datos fijos del sitio (marca, menú, aliadas, contacto, redes, consultoría) | `src/config/sitio.js`; el equipo de «Quiénes somos», aparte, en `src/config/equipo.js` (no viaja en el paquete de cada lector) |
| Vista previa para redes y sitemap (Vercel) | `api/` de la raíz (no confundir con `src/api/`, el cliente) |

## Llamadas al servidor

- Todo pasa por `src/api/`: `nucleo.js` arma la dirección (la API o el quiosco), pone
  las cabeceras, lee el JSON y el error; `sesion.js` guarda y renueva la sesión;
  `quiosco.js` dice qué lecturas salen por el borde; `archivoDelSitio.js` baja un archivo
  de este mismo sitio (`/media/…`, para el convertidor de imágenes del panel). Se entra por los envoltorios de
  siempre: `lib/api.js` (`adminRequest`, el panel), `lib/userApi.js` (`userRequest`,
  `userPublicRequest`…, el lector) y `services/apiClient.js` (`createApiClient`, lo
  público).
- Nadie llama a `fetch`, `sendBeacon` o `XMLHttpRequest` por su cuenta fuera de
  `src/api/`. Los cuatro que tienen motivo (la medición y las impresiones, que van sin
  credenciales y sin esperar respuesta; el clasificador de caras, que es un archivo del
  propio sitio; la subida de video a Cloudflare, con su barra de progreso) están en
  `RED_FUERA_DEL_CLIENTE`, en la prueba de arquitectura, con cuántas llamadas cada uno:
  el número solo puede bajar.
- Si renovar la sesión falla, el panel y el lector solo la cierran cuando el servidor dice
  que ya no vale: sin red, la sesión se queda (`CERRAR_SI_LA_SESION_NO_VALE`, en
  `src/api/sesion.js`).

## Textos y estilos

- **Textos:** en `src/i18n/<idioma>/<zona>.json`, por **zonas** (portada, piezas,
  titulares, monedas…), no por feature: un feature usa las claves de su zona. Cómo se
  añade una clave: `src/i18n/COMO-TRADUCIR.md`. `npm run i18n` comprueba los dos idiomas.
  El panel va solo en español y no pasa por el i18n.
- **CSS:** cada hoja al lado del componente o la página que la usa (`fichaDeMoneda.css`
  junto a `FichaDeMoneda.jsx`), y lo común en `src/styles/` y `src/index.css`. Ojo: el
  orden en que entran las hojas en el CSS construido depende del orden de las
  importaciones; al mover un archivo, se comprueba que el `dist/` no cambia.

## Pruebas

Junto a lo que prueban (`X.test.mjs`), y todas corren con `npm test`. El banco está en
`scripts/pruebas/`: `pintar.mjs` (lo que se ve al cargar, sin navegador), `montar.mjs`
(un gancho con sus efectos) y `dom.mjs` (**pruebas de pantalla**: clics, escribir y ver qué
cambia, con happy-dom y Testing Library). Sin red: las respuestas del servidor son copias
grabadas del backend, en `src/pruebas/respuestas/<zona>/`, cada una con su `_origen`.

## Fachadas que quedan

Dos archivos de la zona vieja reexportan algo de un feature para quien aún lo importa
de allí. La prueba solo deja importarlas a los de su lista (`FACHADAS`); lo nuevo entra
por la puerta del feature.

- `src/lib/analitica.js` (la medición): la usan la vista previa, la api del boletín y
  la barra de la publicidad. Se cargan antes que el aviso de cookies; por la puerta, Vite
  reordenaría el paquete principal (mismo código, otro orden).
- `src/hooks/useHeadlines.js` (`haceCuanto`): la usa la fecha de cada pieza en la
  portada. Por la puerta de titulares, su hoja de estilos entraría antes en el CSS.

## Qué no se toca

- `src/juegos/el-analista/el-analista.jsx`: el juego está en pausa y su código se trae
  tal cual de su repositorio (`npm run traer-analista`, ver `docs/EL-ANALISTA.md`).

## Cómo se añade un feature

1. Carpeta `src/features/<tema>/` con su `index.js`: lo único que el resto del sitio
   importa de él. Las páginas no salen por la puerta: las carga `routes.jsx` con `import()`.
2. Dentro, pocos archivos y bien explicados (uno puede tener 700-1.000 líneas; se parte
   por lógica de negocio, no por tipo):
   - en la raíz: `api.js` (lo que se le pide al servidor), `utils.js` (lógica pura, con
     `utils.test.mjs` al lado), `useX.js` si hay un gancho, `guia.js` (los pasos de su
     guía: solo datos), y las páginas o componentes sueltos;
   - `components/`, `pages/` y `admin/` solo cuando tienen varios archivos de código.
     Ninguna carpeta con un solo `.js`/`.jsx` (una página con su `.css` cuenta como uno)
     y ningún archivo de más de 1.000 líneas (la prueba lo vigila).
3. Cada archivo de lógica empieza con un comentario corto: qué hace.
4. Si tiene panel, va en `admin/`. Si otra página del panel necesita algo de él, se le
   abre una segunda puerta, `admin/index.js` (ver `features/monedas/admin/index.js`):
   nunca por la puerta del sitio, que viaja en el paquete de cada lector.
5. Entre features, solo por las puertas. `src/ui/` (lo compartido: botones, tablas,
   diálogos), cuando exista, no importará features: son ellos los que lo usan.
