# Privacidad y términos: pendiente

Estado al 2 de octubre de 2026. Las páginas `/privacidad` y `/terminos` **no existen
todavía**. Hacen falta para que TikTok apruebe la integración (Login Kit + Display API)
en producción, y para que el registro de lectores tenga algo que aceptar. Se decidió
dejarlo para después; este documento guarda lo que ya se investigó para no repetirlo.

Hermano de `POLITICA-COOKIES-PENDIENTE.md`, que cubre lo que falta en `/cookies`.

## Lo que hay que montar

1. **`/privacidad`** con la plantilla de `/cookies` (`se-legal`, usted, tono directo).
   Secciones: quién trata los datos; qué datos y para qué (cuenta, boletín, comentarios,
   contacto, informes, compras, analítica); con quién se comparten; terceros que se
   cargan en el navegador; **la integración con TikTok** en bloque propio; cuánto se
   conserva; derechos y cómo ejercerlos; menores; cambios.
2. **`/terminos`**: el servicio, la cuenta, comentarios y colaboraciones, boletín,
   contenido y propiedad intelectual, informes y módulos de pago, publicidad, enlaces
   y contenido de terceros, lo que no se garantiza, ley aplicable.
3. Rutas en `src/routes.jsx`, enlaces en el pie junto a «Política de cookies», título
   propio con `applyPageMeta`.
4. **Casilla en el registro** («He leído la Política de privacidad y acepto los
   Términos»): hoy no existe. Cambio en `src/pages/cuenta/CuentaRegistro.jsx` y campo
   `accepted_terms_at` en el backend.

## Datos que no están en el código y hay que pedir

- **Razón social** que firma (¿RendiGroup a secas, o la empresa con RIF y dirección?).
- **Ley aplicable y fuero**: Venezuela, tribunales de Caracas, por confirmar.
- **Correo de privacidad**: `/cookies` usa `info@sureconomics.com`; un commit anterior
  mandaba las solicitudes de datos a `servicios@rendigroup.com`. Decidir uno.

## Inventario de datos personales (leído del código el 2-oct-2026)

### Cuentas de lector (`users`)
- Correo, hash de contraseña (scrypt, Werkzeug), `google_sub`, nombre y apellido;
  opcionales: edad (13–120), sexo, país, ciudad, ocupación, teléfono; foto de perfil
  (pública en R2); verificado, activo, puede colaborar; fechas.
- Verificación por código de 6 dígitos (30 min), guardado solo como HMAC. Las filas
  usadas **no se purgan**.
- Entrar con Google: solo ID token (sin alcances OAuth). Se guardan `sub`, correo y
  nombre si estaban vacíos. La foto de Google no se guarda.
- Sesión: JWT HS256 en `sessionStorage` (acceso 15 min, renovación 7 días). El cierre
  de sesión no revoca nada en el servidor.
- `login_attempts`: correo, IP y fecha; se podan a los 60 min y al entrar bien.
- **No existe ruta para borrar la cuenta** (ni lector ni admin; el admin solo
  desactiva). La política tendrá que decir «escríbanos» hasta que exista.
- No hay «olvidé mi contraseña». Política de contraseña: solo 8 caracteres mínimo.
- El registro revela si un correo ya tiene cuenta (409).

### Boletín (`newsletter_subscribers`)
- Correo, estado, token de baja, origen (home/footer/instagram), fechas.
- Sin doble opt-in (decisión explícita). La baja **no borra la fila**: queda como
  `unsubscribed`. No hay ruta para borrar suscriptores.
- Envío por SMTP con cuenta de Google. Sin píxel ni enlaces rastreados.
- Aviso al equipo por cada alta (`NEWSLETTER_NOTIFY_TO`) con el correo del suscriptor.
- Exportación CSV solo para rol `admin`.

### Comentarios (`comments`)
- Texto (≤2000), estado; moderación previa; en público solo «Nombre A.» o «Lector».
  El correo nunca sale. El lector no puede borrar su comentario.

### Contacto
- Nombre, correo, asunto, mensaje. No se guarda: va a un webhook de n8n y de ahí por
  Gmail a la redacción. La bandeja de destino está en n8n, no en el código.

### Analítica
- Cookies: `cookie_consent` (183 d), `user_id` (730 d), `session_id`, `last_activity`,
  `exit_page` (sesión). Nada se escribe sin el «sí».
- Se guarda: sesión, `user_id`, ruta sin query, formato, slug, segundos. **No** IP,
  user-agent, idioma ni resolución. `user_id` no se cruza con `users`.
- Retención 425 días; purga diaria por cron en Render (03:15 UTC) — **confirmar que
  el cron existe en el panel**. `POST /analitica/olvidar` borra por `user_id`.

### Informes y Educación
- Descargas de informes: no se registra nada. Aperturas de lecciones: agregado sin
  identificador.
- Compras: a Stripe va `customer_email`; a Mercado Pago, `payer.email`.

### Colaboraciones
- El panel ve nombre completo, correo y foto del autor; la pieza publicada lleva firma
  y foto en público.

### Publicidad
- Sin seguimiento por persona: contadores por creatividad, espacio y día. El contexto
  que se envía es el de la página, no el del lector.

### Redes sociales
- Instagram y TikTok solo leen la **cuenta propia**. Ningún dato de lectores sale
  hacia Instagram, TikTok ni X.
- TikTok: alcances `user.info.basic,video.list`; se guardan `access_token` (24 h),
  `refresh_token` (1 año), `open_id`, alcances, caducidades, nombre de la cuenta y
  quién la conectó. **En claro, sin cifrar**, en `platform_settings.tiktok_token`.
  Lo mismo para `instagram_token`. TikTok lo pregunta en la revisión: conviene cifrar.
- X: no se consulta ninguna API; las publicaciones se curan a mano.

### Terceros que se cargan en el navegador del visitante
| Tercero | Dónde | Cuándo |
|---|---|---|
| Google Fonts | `index.html` | Todas las páginas, sin consentimiento. No está en `/cookies`. |
| TradingView (script + iframe) | `MarketTicker.jsx` | Todas las páginas, sin consentimiento. No está en `/cookies`. |
| TikTok player (iframe) | `EnRedes.jsx` | Solo tras pulsar una tarjeta. |
| YouTube (nocookie), Vimeo, Cloudflare Stream | `PieceBody.jsx`, `EducacionLeccion.jsx` | Al abrir la pieza o lección, sin clic. |
| Google Identity Services | `BotonDeGoogle.jsx` | Solo en entrar y registro. |
| Stripe / Mercado Pago | — | Redirección al pagar. |

### Encargados y alojamiento
Render (API, Postgres, cron), Vercel (sitio, OG, proxy `/media`), Cloudflare R2 y
Stream, Cloudinary (archivos antiguos), n8n + Gmail (verificación y contacto), Google
SMTP (boletín), Google (login), Stripe, Mercado Pago, TradingView, Sentry
(`send_default_pii=False`, pero los `logger.error` con correos pasan como eventos).

### Registros con correos
`email_service.py`, `smtp_service.py`, `newsletter_service.py`, `contact_service.py`
escriben correos en los logs de error. `login_attempts` guarda IP.

### Seguridad declarada
- Vercel: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`,
  HSTS. **La CSP está en `Report-Only`**: no se aplica.
- Flask-Limiter en memoria por ruta; freno de login por correo e IP en base de datos;
  idempotencia 24 h; bleach para HTML; SVG saneado; arranque falla con secretos de
  relleno.

### Menores
- Sin verificación de edad ni casilla de mayoría. Edad opcional 13–120. Sin casilla
  de aceptación de términos en registro, boletín ni contacto.

## Lo que el código NO hace (con evidencia)
- No guarda IP ni user-agent en analítica; no la cruza con la cuenta.
- No carga analítica ni publicidad de terceros (ni GA, ni Vercel Analytics, ni Sentry
  en el navegador).
- No registra impresiones ni clics por persona.
- No mete píxeles en el boletín.
- No envía datos de lectores a redes sociales.
- No guarda contraseñas, códigos ni contraseñas probadas en claro.
- No publica el correo de quien comenta.
- No hay venta ni cesión de listas en el código.

## Para hacer antes o junto con las páginas
1. Ruta para borrar la cuenta (lector y admin), con borrado en cascada ya existente.
2. Cifrar `tiktok_token` e `instagram_token` en reposo.
3. Declarar TradingView y Google Fonts en `/cookies` (o cargar TradingView tras
   consentimiento).
4. Pasar la CSP de `Report-Only` a aplicada, una vez revisadas las fuentes.
5. Purgar `email_verification_codes` usados.
6. Casilla de aceptación en el registro y campo `accepted_terms_at`.
