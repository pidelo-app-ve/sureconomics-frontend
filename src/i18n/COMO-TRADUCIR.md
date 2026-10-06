# Cómo funciona el sitio en dos idiomas (y cómo se traduce una pantalla)

Octubre de 2026. Léelo antes de tocar un texto visible del sitio público.

## Las reglas

1. **El idioma vive en la dirección.** Español sin prefijo (`/noticias/x`), inglés bajo
   `/en` (`/en/noticias/x`). Las rutas públicas se montan dos veces en `routes.jsx`, bajo
   un `ProveedorIdioma` cada una. Nada de cookies ni `?lang=`.
2. **Ningún texto visible va escrito en el código.** Todos salen de los JSON de `es/` y
   `en/`, por zonas: `comun`, `portada`, `piezas`, `listados`, `cuenta`, `boletin`,
   `educacion`, `juegos`, `paginas`, `publicidad`. Cada JSON trae sus apartados de
   primer nivel; `es/index.js` y `en/index.js` los juntan.
3. **El español entra en el paquete; el inglés se descarga solo en `/en`**, antes de
   pintar (`loader` de la ruta). Ver `motor.js` y `diccionarios.js`.
4. **El panel (`/admin`) sigue en español** y no cuelga de ningún proveedor: los
   componentes compartidos funcionan igual allí porque el contexto por defecto es español.
5. **`npm run i18n`** comprueba que ninguna clave falte en un idioma, que las variables
   coincidan, que todas las claves se usen y que no quede texto en español suelto en los
   `.jsx` públicos. `npm run i18n -- --restos` lista lo que falta, archivo por archivo.

## Las claves

- Por nombre y por zona, en español y camelCase: `cuenta.entrar.titulo`,
  `portada.apertura.verTodas`. Nunca el texto en español como clave.
- Un apartado por pantalla o componente dentro de la zona: `piezas.pieza.*`,
  `piezas.comentarios.*`, `listados.filtros.*`.
- Variables con llaves: `"hola": "Hola, {nombre}"` → `t("x.hola", { nombre })`.
- Plurales como objeto: `"resultados": { "one": "{n} resultado", "other": "{n} resultados" }`
  → `t("x.resultados", { n: 3 })`. `{n}` sale ya formateado.
- Texto con un enlace o negrita dentro: la variable es el elemento de React y `t()`
  devuelve una lista de trozos:
  ```jsx
  // "sinCuenta": "¿No tiene cuenta? {enlace}", "crearUna": "Crear una"
  <p>{t("cuenta.entrar.sinCuenta", { enlace: <Enlace to="/cuenta/registro">{t("cuenta.entrar.crearUna")}</Enlace> })}</p>
  ```
- El español de los JSON es **exactamente** el texto que había en el código, con sus
  tildes y sus signos. No se reescribe al mover.
- El inglés es editorial y natural (inglés de EE. UU.), no literal. Tono de medio
  económico serio. «Usted» en español → trato directo y neutro en inglés.
- No se traducen: SurEconomics, «Al punto», «El Analista», nombres propios, URLs,
  correos, siglas (BCV, IBC, USD). Una línea que deba quedarse en español a propósito se
  exime con `// i18n:ignorar` al final o en la línea anterior.

## El patrón en un componente

```jsx
import { useIdioma } from "../i18n/ProveedorIdioma";
import { Enlace } from "../components/Enlace";

export const Tarjeta = ({ pieza }) => {
  const { t, lang } = useIdioma();
  return (
    <article>
      <Enlace to={rutaDePieza(pieza)} aria-label={t("piezas.tarjeta.leer", { titulo: pieza.titulo })}>…</Enlace>
      <span>{pieza.formatoNombre}</span>          {/* el formato ya viene traducido desde lib/pieza.js */}
      <time>{fechaCorta(pieza.fecha)}</time>       {/* las fechas salen en el idioma del documento */}
    </article>
  );
};
```

- `Link` → `Enlace`, `NavLink` → `EnlaceNav`, `Navigate` → `Redirigir`, `useNavigate()` →
  `useNavegar()` (todos en `components/Enlace.jsx`). Los `to` se escriben igual que
  siempre, sin `/en`: el prefijo lo pone el componente. Los `<a href>` a otros sitios no
  cambian.
- Comparar la ruta actual: `sinPrefijo(location.pathname)` (en `i18n/motor.js`), nunca
  `location.pathname` a secas.
- Fechas: `fechaCorta(iso)` (`lib/pieza.js`) o `formatearFecha(valor, "corta" | "larga" |
  "diaMes" | "diaMesLargo" | "conHora" | "hora")` (`i18n/motor.js`). Nada de
  `toLocaleDateString` ni listas de meses.
- Cifras: `formatearNumero(n)`.
- Formatos de pieza: para enseñar, `pieza.formatoNombre` o `nombreDeFormato(formatoApi)`;
  para comparar, `pieza.formatoApi === "noticia"` (la clave estable), no el nombre.
- Temas y lugares ya llegan traducidos en `pieza.temas` y `pieza.geos` cuando la redacción
  escribió su nombre en inglés; si no, en español.
- Fuera de React (un servicio que lanza un error con mensaje, un `lib/`): `tActual(clave)`
  de `i18n/motor.js`. También vale en componentes pequeños que no tienen ningún otro hook
  (los de `components/publicidad/`): una página está en un solo idioma a la vez y cambiarlo
  es navegar, que lo vuelve a montar todo.
- `npm run lint` corre también `npm run i18n`: no se puede subir con una clave que falte en
  un idioma, una que no se use o un texto suelto.

## El patrón en una página

```jsx
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";

export const Contacto = () => {
  const { t } = useIdioma();
  // Sustituye al `useEffect(() => applyPageMeta({...}))`. Pone título, descripción,
  // <html lang>, canonical y los hreflang de los dos idiomas.
  useMetaPagina({ title: t("paginas.contacto.meta.titulo"), description: t("paginas.contacto.meta.descripcion") });
  …
};
```

- Títulos con la marca: `"titulo": "Contacto — {marca}"` y `t(..., { marca: BRAND.name })`.
- Páginas cuyo **contenido** solo existe en español (una pieza, un módulo de educación):
  `useMetaPagina({ title, description, soloEspanol: true })`. En `/en` salen con
  `noindex` y el canonical al español, y la página enseña `t("idioma.soloEnEspanol")`
  arriba del contenido cuando `lang === "en"`.
- Páginas que no deben indexarse (cuenta, baja del boletín, 404): `noindex: true`, como antes.

## Lo que no se toca

- CSS, comportamiento, estructura del HTML. Esto es mover texto, no rediseñar.
- `comun.json` lo mantiene quien lleva el motor; si falta algo común, se añade en la zona
  propia y se avisa.
- `src/juegos/el-analista/el-analista.jsx` es de otro equipo y queda en español.
