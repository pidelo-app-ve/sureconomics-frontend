# El Analista dentro de SurEconomics — lo que falta

Octubre de 2026. Estado y plan para terminar de montar el juego en `sureconomics.com/el-analista/`.

---

## Dónde estamos

- El juego vive en su propio repo (`juega-el-analista/el-analista`) y su propio Vercel:
  <https://el-analista-delta.vercel.app/>. Lo edita Alessandro desde su rama.
- En SurEconomics hay un botón **«Jugar»** en la cabecera, junto a «Al punto», y una
  tarjeta en `/pausa`. Hoy abren esa dirección **en otra pestaña**
  (`EL_ANALISTA` en `src/components/Navbar.jsx` y en `src/pages/Pausa.jsx`).
- Del lado del juego (revisado el 5-oct-2026):
  - Existe `window.__pedir(ruta, opciones)`, que llama a nuestra API con la URL de
    `VITE_API_URL`. **El juego todavía no la usa.**
  - **`VITE_API_URL` está mal en su Vercel:** vale
    `https://sureconomics-backend.onrender.com/api`, y en `/api` el backend da 404. Debe
    ser `https://sureconomics-backend.onrender.com`, sin `/api`.
  - El registro de carreras usa tres enganches del documento: `window.__REGISTRO` (la
    lista, leída al pintar), `window.__puedeAnotar()` y `window.__anotarCarrera(entrada)`.
    Hoy los define el «puente» del artifact, que en Vercel no puede publicar: el botón
    «Anotar» dice que el registro no está disponible.
  - La partida se guarda solo en el navegador (`localStorage`, clave `el-analista-partida`).
  - El trabajador sin conexión (`sw.js`) se registra con ruta relativa y usa «primero la
    red» para la página. Servido bajo `/el-analista/` queda acotado a esa carpeta y no
    toca el resto del sitio.
- En nuestro backend **no hay nada todavía** de `/analista/*`.

---

## Cómo queda montado

```
www.sureconomics.com/el-analista/          -> api/el-analista.js (nuestra función)
                                               busca el HTML del juego, le mete el registro
                                               y nuestro puente, y lo devuelve
www.sureconomics.com/el-analista/<archivo> -> https://el-analista-delta.vercel.app/<archivo>
```

Al servirse desde nuestro dominio, el juego comparte con el sitio:

- **Las cookies**: el consentimiento (`cookie_consent`) y las de medición.
- **El `localStorage`**.
- **La sesión del lector, solo en la misma pestaña.** Vive en `sessionStorage`
  (`sureconomics_user_access_token`, `…_refresh_token`, `…_access_expires_at`), que es de
  cada pestaña. Por eso el botón «Jugar» tiene que abrir el juego **en la misma pestaña**.
  Con `target=_blank` y `noopener` el lector llega sin sesión.

CORS no hace falta tocarlo: el juego llama a Render desde `https://www.sureconomics.com`,
que ya está permitido.

---

## Lo que hacemos nosotros

### Backend (`sureconomics-backend`)

1. **Modelos y migración.**
   - `analista_carreras`: `id`, `user_id`, `nombre` (n, ≤24), `carrera` (c, ≤24),
     `edad` (e, 20–99), `patrimonio` (p), `medallas` (m, 0–12), `nota` (v, ≤60),
     `version_juego`, `idempotency_key` (única por cuenta), `oculta`, `created_at`.
   - `analista_partidas`: `user_id` (PK), `sobre` (texto ≤ 256 KB), `version` (entero, sube
     en cada guardado), `updated_at`.
2. **Rutas** (blueprint `analista`):

   | Ruta | Quién | Qué hace |
   |---|---|---|
   | `GET /analista/registro?tope=20` | Público | La mejor carrera de cada cuenta, sin las ocultas. Se cachea 60 s. |
   | `POST /analista/carreras` | Lector verificado (`user_required(require_verified=True)`) | Valida campos, exige la cabecera `Idempotency-Key`: el mismo envío dos veces no duplica. |
   | `GET /analista/mis-carreras` | Lector | Sus carreras. |
   | `GET /analista/partida` | Lector | `{sobre, version, updated_at}` o 404. |
   | `PUT /analista/partida` | Lector | `{sobre, version_base}`. Si la del servidor es más nueva, responde 409 `partida_mas_nueva` con la del servidor. |
   | `DELETE /analista/partida` | Lector | Borra la partida. |

3. **Moderación:** `GET /admin/analista/carreras` y `PATCH …/<id>` (`oculta`), más una
   página sencilla en el panel con la lista y el botón «Ocultar».
4. **Pruebas** con pytest: validación, idempotencia, lector sin verificar (403
   `email_not_verified`), 409 de la partida, ocultas fuera del registro.

### Frontend (`sureconomics-frontend`)

5. **`vercel.json`**, antes de la regla general `/(.*)`:
   - `/el-analista` redirige a `/el-analista/`.
   - `/el-analista/` va a `/api/el-analista`.
   - `/el-analista/:path*` va a `https://el-analista-delta.vercel.app/:path*`.
6. **`api/el-analista.js`**:
   - pide el HTML del juego y el registro a la API;
   - inyecta, justo antes de `<script id="motor-react">`, un script que define
     `__REGISTRO` (con el registro ya dentro), `__puedeAnotar` y `__anotarCarrera`
     usando la sesión del lector, refrescando el token si ha caducado
     (`POST /user-auth/refresh`);
   - cachea el HTML 60 s en el borde;
   - si la API cae, sirve el juego con el registro vacío: el juego tiene que poder jugarse
     siempre.

   Lector **sin cuenta** que pulsa «Anotar»: la carrera queda guardada como pendiente y el
   lector va a `/cuenta/entrar?volver=/el-analista/`. Al volver, el puente la anota sola,
   con la misma `Idempotency-Key`.

   Si aceptó las cookies, el puente registra la visita en nuestra analítica.

   Pruebas como `api/pieza.test.mjs`.
7. **`?volver=`** en `/cuenta/entrar` y `/cuenta/registro`. Solo rutas internas que empiecen
   por `/` y no por `//`, para que no sirva para mandar a otra web.
8. **Botón «Jugar» y tarjeta de `/pausa`** → `/el-analista/` en la misma pestaña.
9. Para probar en local: un enganche de desarrollo en `vite.config` que sirva
   `/el-analista/` con la misma función, en `localhost:3000/el-analista/`.

---

## Lo que hace Alessandro (en su repo)

1. Corregir `VITE_API_URL` en Vercel: `https://sureconomics-backend.onrender.com`, sin
   `/api`.
2. No mover de sitio los tres enganches (`__REGISTRO`, `__puedeAnotar`, `__anotarCarrera`)
   ni el `<script id="motor-react">`: nuestro puente se cuelga de ellos.
3. Cambiar los textos de `BotonAnotar` que ya no aplican:
   - «Anotada. La página se recarga para todo el mundo con tu carrera dentro.» →
     algo como «Anotada en el registro de SurEconomics.»
   - «El registro compartido no está disponible en esta vista…» → solo para cuando la
     API cae.
4. Si `__anotarCarrera` resuelve `"sin-sesion"`, no mostrar error: el puente ya se lleva
   al lector a entrar.
5. **Partida en la nube**, para seguir en otro dispositivo: al arrancar,
   `GET /analista/partida` y, si es más nueva que la local, ofrecer retomarla. Al guardar,
   `PUT /analista/partida` con `version_base`, y ante un 409 preguntar cuál quedarse.
   Las condiciones completas están en el artifact del contrato.

---

## Orden para cerrarlo

1. Backend (1–4) → probar en local → subir a Render.
2. Frontend (5–9) → probar en `localhost:3000/el-analista/` → subir a Vercel.
3. Comprobar en producción: jugar sin cuenta, anotar → entrar → vuelve y queda anotada;
   jugar con cuenta; ocultar una carrera desde el panel.
4. Alessandro: puntos 1–4 en cuanto pueda; el 5 cuando le toque.
