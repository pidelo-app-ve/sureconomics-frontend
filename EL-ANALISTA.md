# El Analista dentro de SurEconomics

Octubre de 2026. Cómo está montado el juego en `sureconomics.com/el-analista`, cómo se trae
cada versión nueva y qué queda pendiente.

---

## La idea

El juego lo hace el equipo de Alessandro en su propio repo
(<https://github.com/juega-el-analista/el-analista>). **Nosotros no lo editamos: traemos su
`main` tal cual** y lo envolvemos. Es una página más del sitio, sin otro Vercel, rewrite ni
CORS, y comparte con el resto la sesión del lector, las cookies y la analítica.

- **Se juega sin cuenta.**
- **Solo suma al ranking con cuenta y el correo confirmado.** Un ranking abierto se llena de
  nombres inventados.

---

## Las piezas

| Dónde | Qué es |
|---|---|
| `src/juegos/el-analista/el-analista.jsx` | El juego, **traído, no se edita**. Un solo componente React (`export default function ElAnalista`), unas 40 000 líneas. |
| `src/juegos/el-analista/origen.json` | De qué commit de su repo vino. |
| `scripts/traer-el-analista.mjs` | El comando que lo trae: `npm run traer-analista`. |
| `src/juegos/el-analista/puente.js` | Los tres enganches que el juego lee de `window`, y la carrera pendiente. |
| `src/pages/ElAnalista.jsx` | La página `/el-analista`: barra, aviso de cuenta y montaje del juego. |
| `src/pages/admin/AdminAnalista.jsx` | Panel → Editorial → **Ranking de El Analista**: ocultar o volver a mostrar carreras. |
| Backend `app/routes/analista.py`, `app/services/analista_service.py` | El ranking y la partida. |
| Backend `app/routes/admin/analista.py` | La moderación. |

El juego queda fuera del linter (`eslint.cjs`) a propósito: «arreglarlo» aquí haría chocar la
próxima vez que se traiga.

**Peso.** El juego va en su propio paquete: 1 MB, unos 325 KB comprimido. Solo se descarga al
entrar en `/el-analista`; la portada no lleva nada de él.

**Pantalla completa.** La página va fuera del `Layout` (sin cabecera, pie ni invitación al
boletín). El juego abre pantallas `position: fixed` que taparían la cabecera. Del `Layout` solo
trae el **aviso de cookies**: quien llega directo al juego también decide. Con permiso, el juego
se mide como cualquier página: visita, tiempo jugando y salida.

---

## Traer una versión nueva

Cuando el equipo del juego une algo en su `main`:

```bash
npm run traer-analista        # clona su main por HTTPS (el repo es público)
npm run build
npm run dev                   # probar localhost:3000/el-analista
git add src/juegos/el-analista && git commit -m "El Analista: trae <commit> de main"
```

- Con `-- --desde ../../analista/el-analista` se trae desde un clon local; tiene que estar
  guardado en un commit.
- Con `-- --ref otra-rama` se trae otra rama. Lo normal es `main`.

**El comando para y no escribe nada** si el juego deja de traer el componente o alguno de los
tres enganches. Eso se habla con ellos antes de publicar.

---

## El contrato con el juego

Lo que nuestro envoltorio necesita de su código, y que no deben cambiar sin avisar:

1. **`export default function ElAnalista()`** en `src/el-analista.jsx`, sin más dependencias que
   React 18.
2. **`window.__REGISTRO`**: la lista del ranking, leída al pintar. Cada fila es
   `{ n, c, e, p, m, v }`: nombre, cargo, edad de retiro, patrimonio en USD, medallas y
   veredicto.
3. **`window.__puedeAnotar()`**: una promesa de booleano.
4. **`window.__anotarCarrera(entrada)`**: una promesa que resuelve `null` si se anotó, o un
   motivo si no:
   - `"sin-sesion"`: el lector eligió «Ahora no» en nuestro aviso de cuenta.
   - `"fallo"`: cualquier otro error.
5. **Lo que guarda en el navegador**: `el-analista-partida`, `el-analista-arbol`, etc. Ahora
   viven en el dominio del sitio; si cambian de nombre, los jugadores pierden su partida.

---

## El flujo del ranking

- **Lector con cuenta y correo confirmado:** «Anotar» manda la carrera
  (`POST /analista/carreras`, con clave de idempotencia). El ranking nuevo vuelve en la misma
  respuesta y la barra dice «Sus carreras suman al ranking».
- **Sin cuenta:** «Anotar» abre nuestro aviso «Para sumar al ranking, entre con su cuenta».
  La carrera queda guardada en el navegador con su clave.
  - Al entrar o registrarse (`/cuenta/entrar?volver=/el-analista`) el lector vuelve al juego y
    la carrera se anota sola.
  - Reintentar con la misma clave no la cuenta dos veces.
- **Con cuenta sin confirmar:** el mismo aviso, pero lleva a confirmar el correo; al confirmar,
  vuelve y se anota.
- **Una carrera pendiente caduca a las 24 horas.**
- **El ranking muestra la mejor carrera de cada cuenta.** Si la redacción oculta una, sale la
  siguiente mejor de esa cuenta.

### API

| Ruta | Quién | Qué |
|---|---|---|
| `GET /analista/registro?tope=20` | Público | Ranking: la mejor carrera visible de cada cuenta (100 como mucho). |
| `POST /analista/carreras` | Lector con correo confirmado; `Idempotency-Key` obligatoria | Anota y devuelve `{ carrera, registro }`. |
| `GET /analista/mis-carreras` | Lector | Sus carreras. |
| `GET / PUT / DELETE /analista/partida` | Lector | La partida en la nube: `sobre` de 256 KB como mucho, `version_base`, y 409 `partida_mas_nueva` con la del servidor. |
| `GET /admin/analista/carreras` | Publicador, admin | Lista paginada; filtros `oculta` y `q`. |
| `PATCH /admin/analista/carreras/<id>` | Publicador, admin | `{ "oculta": true }` |

---

## Pendiente

**Del lado del juego (Alessandro):**
1. Cuando `__anotarCarrera` resuelve `"sin-sesion"`, no enseñar «No se pudo anotar…».
   Algo como «Para sumar al ranking necesitas una cuenta».
2. Cambiar «Anotada. La página se recarga para todo el mundo con tu carrera dentro.» por
   algo como «Anotada en el ranking de SurEconomics».
3. **Partida en la nube**, para seguir en otro dispositivo. El backend ya está listo.
   - Al arrancar, `GET /analista/partida`.
   - Al guardar, `PUT` con `version_base`.
   - Ante un 409, preguntar con cuál quedarse.

   Hace falta un cuarto enganche para hablar con nuestra API desde el juego, con la sesión;
   por ejemplo `window.__nube = { leer, guardar, borrar }`, que pondríamos nosotros en
   `puente.js`. Se acuerda con ellos antes.
4. Hay claves duplicadas dentro de objetos de su código (`clave:true` dos veces, en las
   escenas 9010, 9012…). No rompe nada, pero el compilador avisa.

**Del nuestro, más adelante:**
- Una acción en su repo que, al unir algo en `main`, nos abra sola un pull request con el
  juego traído.
- Su despliegue en Vercel ya no hace falta para SurEconomics; si lo quieren para probar, es
  cosa suya.
