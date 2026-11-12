# Política de cookies: lo que quedó pendiente

**Escrito el 22/09/2026, el día que se activó la medición.**

La política se activó con el texto aprobado. Lo que sigue son tres cosas (y una
cuarta, añadida el 12/11/2026: el punto 4) que el texto dice —o dejó de decir— y
que conviene resolver antes de que empiecen a importar. Ninguna
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

**Cambió el 26/10/2026: ahora uno sí puede cargarse solo, y solo con el «Aceptar».** La
portada tiene videos del canal de YouTube de la casa (la fila «En la calle», la ventana
«Nuestro canal» y, si la redacción la fija, una apertura con un short). Las fotos son
copias nuestras; el reproductor de YouTube (`youtube-nocookie.com`) se carga si el lector
pulsa, **o si aceptó las cookies**: entonces el video que tiene delante arranca solo y mudo
como vista previa (20 s, uno a la vez, nunca con «movimiento reducido» ni ahorro de datos,
con botón de pausa). Ver `hooks/useVistaPrevia.js`.

Se dijo en los dos sitios donde el lector decide: una frase al final de la barra
(`paginas.cookies.aviso.cuerpo`) y una sección nueva, «Los videos de YouTube», en
`/cookies` (qué recibe Google, que nosotros no recibimos nada, qué pasa si rechaza).
También se corrigió «si rechaza, el sitio funciona exactamente igual»: ahora cambia una
cosa, que los videos no empiezan solos.

**Para el abogado:** el mismo «Aceptar» cubre dos finalidades, la medición propia y las
vistas previas de YouTube. Está dicho en la barra, pero si se prefiere el consentimiento
separado por finalidad, el cambio es pequeño: un segundo interruptor en `/cookies`
(«Vistas previas de video») que `usePuedePrevisualizar` leería en lugar del general.

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

## 4. Desde el 12/11/2026 la medición guarda más cosas

**Añadido el 12/11/2026**, con el cambio que amplió la medición de audiencia para la
agencia de SEO. El texto de `/cookies` se puso al día el mismo día, en los dos idiomas.

| Lo nuevo | Qué se guarda de verdad | Dónde se cumple |
|---|---|---|
| Por dónde llega la visita | Un canal (buscador, redes, mensajería, IA, correo, otros, directo) y un nombre («google») o el dominio. Del navegador solo sale el nombre del sitio: nunca la dirección entera ni lo buscado | `lib/llegada.js` (`sitioDeOrigen`) y `analitica_origen.clasificar` |
| País | Dos letras. Sale de la zona horaria del aparato; la zona no se guarda y la IP no se mira | `analitica_origen.pais_de` |
| Aparato | Una palabra de tres: móvil, tableta o computadora. El agente de usuario no se guarda | `lib/llegada.js` (`aparatoDe`) |
| Altas al boletín por canal | Un contador por día y canal, sin correo y sin marca en la visita | `registrarAlta`, en `lib/analitica.js` |
| Páginas vistas sin medir | Un contador por día. Viajan dos datos: si la persona rechazó o no ha contestado, y si es la primera página de la carga. Sin cookie, sin identificador, sin la página | `contarPagina` → `POST /analitica/pagina` |

Las cuatro primeras filas solo ocurren con el «Aceptar». La última es la que hay que mirar.

**Para el abogado**, cuatro preguntas:

1. **El contador de páginas suma también de quien dijo que no y de quien aún no ha
   contestado.** No lee ni escribe cookies, no lleva identificador y no guarda la IP;
   por eso se dio por bueno, igual que el contador de «aceptaron / rechazaron» que ya
   existía. Es una lectura nuestra, no una opinión legal. Si la respuesta es que tras un
   «no» no debe sumar nada, el cambio es de una línea (`contarPagina` deja de contar
   cuando `consentimiento() === "no"`) y la «audiencia real estimada» del panel se
   calcularía solo con quien no ha contestado.
2. **El país sale de la zona horaria del navegador** (`Intl.DateTimeFormat`), y el tipo
   de aparato de lo que el navegador dice de sí mismo. Son características del aparato:
   se leen solo con consentimiento y están dichas en `/cookies`. ¿Basta así?
3. **A quien ya había aceptado no se le vuelve a preguntar.** El permiso que dio antes
   del 12/11/2026 cubría menos cosas que las que se guardan ahora. Hoy el aviso no
   tiene versión: si hay que volver a preguntar, se añade una fecha de corte y el
   permiso anterior a ella deja de valer.
4. **La barra no cambió.** Sigue diciendo «cuántas personas nos leen, si vuelven y qué
   se lee de verdad». Lo nuevo está en `/cookies`, no en la barra. Si conviene que la
   barra lo nombre, es una frase.

**Lo que se corrigió en `/cookies`:** ya no dice que el contador de la decisión sea «lo
único que un no envía» (ahora son dos contadores); la lista de lo que no se guarda
aclara qué queda del aparato, de la página de origen y de la zona horaria; y hay un
párrafo para las altas al boletín.

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
