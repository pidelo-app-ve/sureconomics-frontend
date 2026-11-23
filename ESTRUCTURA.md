# Mapa del repo

Dónde vive cada cosa del frontend y cómo se añade un tema nuevo. Las reglas las vigila
`src/arquitectura.test.mjs` (corre con `npm test`).

## Dos zonas

- **Nueva: `src/features/<tema>/`.** Todo lo de un tema junto, con una puerta (`index.js`).
  Es donde va el código nuevo.
- **Vieja, que se va vaciando:** `src/components`, `src/pages`, `src/lib`, `src/hooks`,
  `src/services` y `src/styles`, ordenadas por tipo de archivo. Cuando se toca un tema a
  fondo, se muda a `src/features/` (como se hizo con monedas, titulares, analítica y
  publicidad), y lo que queda en la zona vieja entra por su puerta.

## Tema → carpetas

| Tema | Dónde |
| --- | --- |
| Monedas de la región (`/monedas`, la franja) | `src/features/monedas` |
| Titulares en caliente («Última hora») | `src/features/titulares` |
| Audiencia y cookies (aviso, `/cookies`, panel «Audiencia») | `src/features/analitica` |
| Publicidad (huecos, barra, patrocinios, panel) | `src/features/publicidad` |
| Portada | `pages/Home.jsx`, `components/home` |
| Pieza (artículo, video, informe) | `pages/Pieza.jsx`, `components/piece`, `lib/pieza.js` |
| Listados y búsqueda | `pages/Articulos.jsx`, `Audiovisual.jsx`, `Explorar.jsx` |
| Cuenta del lector | `pages/cuenta`, `components/cuenta` |
| Resumen diario | `pages/Resumen.jsx`, `services/resumenService.js`, `components/admin/resumen` |
| Juegos (Vuela guacamaya, La Clave) | `src/juegos` |
| El panel (`/admin`) | `pages/admin`, `components/admin` (y el `admin/` de cada feature) |
| Guías («Guía» de cada página) | `lib/guias`, `lib/recorridoVista.js`, `components/recorrido` |
| Llamadas al servidor (lo común) | `lib/api.js`, `lib/userApi.js`, `services/` |
| Vista previa para redes y sitemap (Vercel) | `api/` |

## Textos y estilos

- **Textos:** en `src/i18n/<idioma>/<zona>.json`, por **zonas** (portada, piezas,
  titulares, monedas…), no por feature: un feature usa las claves de su zona. Cómo se
  añade una clave: `src/i18n/COMO-TRADUCIR.md`. `npm run i18n` comprueba los dos idiomas.
  El panel va solo en español y no pasa por el i18n.
- **CSS:** cada hoja al lado del componente o la página que la usa (`fichaDeMoneda.css`
  junto a `FichaDeMoneda.jsx`), y lo común en `src/styles/` y `src/index.css`. Ojo: el
  orden en que entran las hojas en el CSS construido depende del orden de las
  importaciones; al mover un archivo, se comprueba que el `dist/` no cambia.

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
   - `components/`, `pages/` y `admin/` solo cuando tienen varios archivos. Ninguna
     carpeta con un solo archivo y ningún archivo de más de 1.000 líneas (la prueba lo
     vigila).
3. Cada archivo de lógica empieza con un comentario corto: qué hace.
4. Si tiene panel, va en `admin/`. Si otra página del panel necesita algo de él, se le
   abre una segunda puerta, `admin/index.js` (ver `features/monedas/admin/index.js`):
   nunca por la puerta del sitio, que viaja en el paquete de cada lector.
5. Entre features, solo por las puertas. `src/ui/` (lo compartido) no importa features.
