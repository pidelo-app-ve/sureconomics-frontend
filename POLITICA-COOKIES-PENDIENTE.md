# Política de cookies: lo que quedó pendiente

**Escrito el 22/09/2026, el día que se activó la medición.**

La política se activó con el texto aprobado. Lo que sigue son tres cosas que el texto
dice —o dejó de decir— y que conviene resolver antes de que empiecen a importar. Ninguna
es urgente hoy; las tres lo serán en cuanto se encienda lo que está apagado.

## De dónde sale esto

Antes de activar se contrastó el texto contra el código, afirmación por afirmación.
Salió bien en casi todo:

| Lo que promete el aviso | Dónde se cumple |
|---|---|
| Cuatro cookies de medición, propias | `lib/analitica.js` — `SameSite=Lax`, en el dominio del sitio |
| «Rechazar» pesa lo mismo que «Aceptar», sin aspa | `components/AvisoDeCookies.jsx` — sólo dos botones |
| Se vuelve a preguntar a los seis meses | `SEIS_MESES = 183 días` |
| Catorce meses de retención, borrado automático | `RETENCION = 425 días` + cron diario 03:15 en `render.yaml` |
| Al retirar, se borra del servidor | `analitica_service.olvidar()` borra filas, no las marca |
| El identificador no se cruza con la cuenta | `analitica_sesiones.user_id` es `String(64)` sin clave ajena |

La página declara **cinco** cookies —la de consentimiento incluida—, aunque la entradilla
hable de cuatro. Es correcto: mide con cuatro, la quinta guarda la decisión.

Lo que no salió bien son los tres puntos de abajo.

---

## 1. TradingView carga en todas las páginas, sin esperar al consentimiento

`components/home/MarketTicker.jsx` inyecta un `<script>` de `s3.tradingview.com` para
dibujar la cinta de índices. Ese componente se monta en `pages/Layout.jsx`, así que está
en **todas** las páginas del sitio. El archivo no menciona el consentimiento en ninguna
línea: se carga acepte o no acepte el visitante.

**Lo que no hace:** no mide nada nuestro. No pone identificador, no cuenta lectores, no
alimenta ninguna analítica de audiencia. Los números los dibuja su widget y nosotros ni
siquiera los vemos.

**Lo que sí hace:** pedir un archivo a un servidor ajeno le manda a ese servidor la IP
del visitante, su navegador y la URL de la página. Eso ocurre antes de que la barra de
cookies aparezca siquiera.

Por eso la entradilla del aviso se cambió al activarlo. Decía:

> No hay publicidad, no hay redes sociales incrustadas y no hay ninguna empresa de
> terceros recibiendo su navegación.

Ahora dice:

> ninguna empresa de terceros **mide su lectura** ni recibe un perfil suyo.

La frase nueva es cierta. La vieja no lo era.

**Qué decidir:** o se declara TradingView en la tabla con su finalidad, o se carga sólo
tras el consentimiento. Lo segundo mantiene la promesa intacta pero deja la cinta de
mercado en blanco a quien rechace, que es una decisión de producto y no técnica.

## 2. Los vídeos incrustados son terceros

El sitio monta iframes de `tiktok.com` (bloque «En redes»), `player.vimeo.com` y
YouTube. Un iframe de esos dominios puede poner su propio almacenamiento dentro de su
marco, y de nuevo recibe IP y URL.

Tres matices, todos a favor:

- Son iframes y no guiones. El contenido ajeno queda encerrado en su propio marco en vez
  de ejecutarse dentro de nuestra página — es la técnica que ya se eligió a propósito
  frente a cargar el `embed.js` de TikTok.
- El vídeo de TikTok sólo se monta cuando alguien pulsa para verlo. Hasta entonces no hay
  iframe.
- **Resuelto el 22/09/2026:** YouTube se incrustaba desde `youtube.com`, que escribe las
  cookies de seguimiento de Google. Ahora se incrusta desde `youtube-nocookie.com`
  (`components/piece/PieceBody.jsx`). El CSP ya permitía los dos; el código usaba el
  equivocado. Mismo reproductor, mismo vídeo, una línea.

**Qué queda por decidir:** declarar los iframes de vídeo en la tabla de cookies, o pedir
un clic previo con aviso. Puede esperar, porque hoy ninguno se carga solo.

## 3. La publicidad ya existe

Cuando se escribió la primera versión del aviso, el sitio no tenía publicidad. Ahora sí:
anunciantes, campañas, piezas, y un contador de impresiones y clics.

Es **publicidad propia**: servidor propio, sin red de terceros, sin cookies publicitarias
y sin perfilado. El espíritu del aviso se sostiene. Pero la frase «no hay publicidad» era
literalmente falsa, y por eso salió de la entradilla.

Hay una cosa que sí habrá que mirar cuando empiece a servirse de verdad: el contador de
impresiones (`POST /publicidad/visto`) y el de clics registran actividad del visitante.
Conviene comprobar si eso guarda algo que identifique al navegador, y si guarda algo,
declararlo.

**Hoy no corre prisa** porque no hay campañas sirviéndose a lectores reales.

---

## Lo que no pudo verificarse desde el código

**Dónde están los servidores.** El aviso dice «servidores propios en la Unión Europea y
Estados Unidos». `render.yaml` no fija región, así que la decide el panel de Render, y
Vercel igual. Hay que mirarlo en los dos paneles antes de dejarlo por escrito.

**El estado de la ley venezolana.** El documento de partida ya lo marcaba y sigue sin
resolverse: no se confirmó por fuente independiente que la Ley de Protección de Datos
Personales de Venezuela esté sancionada y la Superintendencia operativa. El texto las
cita como vigentes. Hace falta que el abogado lo confirme en una línea.

**El domicilio fiscal.** El modelo legal lo dejaba como marcador de posición y sigue sin
rellenarse. Si la página tiene que identificar al responsable del tratamiento con su
dirección, falta ese dato.
