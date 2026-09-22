import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { BRAND, CONTACT } from "../data/surEconomicsMock";
import { MEDICION_HABILITADA, consentimiento, decidir, estado, revocar } from "../lib/analitica";

/**
 * El aviso de cookies: el documento, y el interruptor de verdad.
 *
 * Dos cosas que casi nunca van juntas y deberian. Un aviso de cookies que solo explica
 * obliga a quien quiere echarse atras a irse a la configuracion del navegador -- que es
 * una manera educada de no dejarle. Aqui la misma pagina que promete "puede revocar su
 * consentimiento" tiene el boton que lo revoca, y ademas ensena **lo que hay puesto
 * ahora mismo en su navegador**, leido de sus cookies y no de una plantilla. Si la tabla
 * dijera una cosa y el navegador tuviera otra, se veria aqui.
 *
 * Sobre la palabra que falta: en ningun sitio de esta pagina pone que los datos sean
 * "anonimos". Un identificador que dura dos anos permite reconocer al mismo navegador
 * dos anos despues, y eso es dato personal seudonimizado por mucho que no lleve nombre
 * pegado. Llamarlo anonimo es la afirmacion que tumba un aviso de cookies en cuanto
 * alguien lo mira de cerca, asi que se dice lo que es y se explica por que da igual para
 * quien lee: no se cruza con la cuenta, no sale de aqui y se puede borrar de un clic.
 */

const ACTUALIZADO = "22 de septiembre de 2026";

/** Las cinco que el sitio puede llegar a poner. Ni una mas: esta tabla se contrasta con el codigo. */
const COOKIES = [
  {
    nombre: "cookie_consent",
    tipo: "Propia · técnica necesaria",
    finalidad:
      "Recordar si usted aceptó o rechazó la medición de audiencia, para no volver a preguntárselo en cada página. Es la única que se instala aunque usted diga que no: sin ella, su negativa se olvidaría al cambiar de página.",
    duracion: "6 meses",
    consentimiento: "No requiere consentimiento",
  },
  {
    nombre: "user_id",
    tipo: "Propia · analítica",
    finalidad:
      "Identificador aleatorio que distingue a un navegador de otro, para saber cuántas personas distintas nos leen y cuántas vuelven. Se genera al azar en su equipo; no procede de su cuenta, ni de su correo, ni de ningún dato que usted nos haya dado.",
    duracion: "2 años",
    consentimiento: "Requiere su consentimiento",
  },
  {
    nombre: "session_id",
    tipo: "Propia · analítica",
    finalidad:
      "Identificador aleatorio de la visita en curso, para contar cuántas personas están leyendo en un momento dado y cuántas páginas ve cada visita.",
    duracion:
      "De sesión: se borra al cerrar el navegador y, antes de eso, se renueva tras 30 minutos sin actividad",
    consentimiento: "Requiere su consentimiento",
  },
  {
    nombre: "last_activity",
    tipo: "Propia · analítica",
    finalidad:
      "Marca de tiempo de su última actividad. Sirve para dos cosas: cerrar la visita tras 30 minutos de inactividad, y calcular cuánto tiempo estuvo realmente visible una pieza en su pantalla.",
    duracion: "De sesión",
    consentimiento: "Requiere su consentimiento",
  },
  {
    nombre: "exit_page",
    tipo: "Propia · analítica",
    finalidad:
      "La última dirección que usted vio dentro de este sitio, para saber por dónde se abandona la lectura y mejorar esas páginas.",
    duracion: "De sesión",
    consentimiento: "Requiere su consentimiento",
  },
];

const NO_SE_GUARDA = [
  "Su dirección IP. No se registra ni completa ni recortada.",
  "Su nombre, su correo electrónico ni ningún dato de su cuenta, si es que tiene una.",
  "Lo que escribe en el buscador del sitio: la dirección se guarda sin lo que va después del signo de interrogación.",
  "Su navegador, su sistema operativo, su idioma ni el tamaño de su pantalla.",
  "Ninguna categoría especial de datos: salud, ideología, religión, afiliación sindical, origen étnico, vida u orientación sexual, ni datos biométricos o genéticos.",
];

/**
 * `last_activity` se guarda en milisegundos porque es lo que el codigo compara; aqui se
 * ensena como hora. Una pagina que presume de transparencia no puede contestar con trece
 * cifras.
 */
const legible = (clave, valor) => {
  if (!valor) return <em>no está puesta</em>;
  if (clave !== "last_activity") return valor;
  const n = Number(valor);
  if (!Number.isFinite(n)) return valor;
  return new Date(n).toLocaleString("es", { dateStyle: "medium", timeStyle: "medium" });
};

/** Lo que hay puesto ahora mismo, leído del navegador de quien está mirando. */
const EstadoActual = ({
  decision,
  cookies,
  onAceptar,
  onRevocar,
  borrando,
  borrado,
  deshabilitado,
}) => {
  if (decision === "si") {
    return (
      <div className="se-legal__estado se-legal__estado--si">
        <p className="se-legal__estado-titulo">Usted aceptó la medición de audiencia.</p>
        <p className="se-legal__estado-texto">
          Esto es exactamente lo que hay guardado en su navegador ahora mismo:
        </p>
        <dl className="se-legal__valores">
          {["user_id", "session_id", "last_activity", "exit_page"].map((clave) => (
            <div key={clave} className="se-legal__valor">
              <dt>{clave}</dt>
              <dd>{legible(clave, cookies[clave])}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          className="se-legal__btn"
          onClick={onRevocar}
          disabled={borrando || deshabilitado}
          title={deshabilitado ? "En revisión: no se puede retirar por ahora." : undefined}
        >
          {borrando ? "Borrando…" : "Retirar el consentimiento y borrar mis datos"}
        </button>
        <p className="se-legal__nota">
          Al pulsar, esas cookies se borran de su navegador y se elimina del servidor todo
          lo que esté asociado a ese identificador. No hay que escribir ningún correo ni
          esperar respuesta.
        </p>
      </div>
    );
  }

  return (
    <div className="se-legal__estado se-legal__estado--no">
      <p className="se-legal__estado-titulo">
        {decision === "no"
          ? "Usted rechazó la medición de audiencia."
          : "Todavía no ha respondido al aviso."}
      </p>
      <p className="se-legal__estado-texto">
        {borrado
          ? "Sus datos de medición se han borrado. "
          : null}
        No hay ninguna cookie de analítica en su navegador. La única que tiene de este
        sitio es <code>cookie_consent</code>, que guarda esta misma decisión.
      </p>
      <button
        type="button"
        className="se-legal__btn se-legal__btn--suave"
        onClick={onAceptar}
        disabled={deshabilitado}
        title={deshabilitado ? "En revisión: no se puede aceptar por ahora." : undefined}
      >
        Aceptar la medición de audiencia
      </button>
    </div>
  );
};

EstadoActual.propTypes = {
  decision: PropTypes.oneOf(["si", "no"]),
  cookies: PropTypes.object.isRequired,
  onAceptar: PropTypes.func.isRequired,
  onRevocar: PropTypes.func.isRequired,
  borrando: PropTypes.bool,
  borrado: PropTypes.bool,
  deshabilitado: PropTypes.bool,
};

export const Cookies = () => {
  const [decision, setDecision] = useState(() => consentimiento());
  const [cookies, setCookies] = useState(() => estado());
  const [borrando, setBorrando] = useState(false);
  const [borrado, setBorrado] = useState(false);

  // Las cookies cambian por debajo de React -- el latido reescribe `last_activity` cada
  // veinte segundos --, así que se vuelven a leer cada pocos segundos mientras esta
  // pagina esta abierta. Es la unica pantalla del sitio donde ese detalle importa.
  useEffect(() => {
    if (decision !== "si") return undefined;
    const t = window.setInterval(() => setCookies(estado()), 5000);
    return () => window.clearInterval(t);
  }, [decision]);

  const aceptar = () => {
    decidir("si");
    setBorrado(false);
    setDecision("si");
    setCookies(estado());
  };

  const retirar = async () => {
    setBorrando(true);
    await revocar();
    setBorrando(false);
    setBorrado(true);
    setDecision("no");
    setCookies(estado());
  };

  return (
    /* `se-blog` pinta el papel. `main` es transparente y el fondo del documento es
       casi negro, asi que sin este envoltorio la pagina sale negro sobre negro --
       el mismo tropiezo que la franja del bloque de redes. */
    <div className="se-blog">
      <article className="se-legal">
          <header className="se-legal__cabeza">
          <p className="se-legal__kicker">Aviso legal</p>
          <h1 className="se-legal__titulo">Política de cookies</h1>
          <p className="se-legal__entrada">
            {BRAND.name} mide cuánta gente lo lee con cuatro cookies propias, y con
            nada más: ninguna empresa de terceros mide su lectura ni recibe un perfil
            suyo. Esta página explica qué guarda cada cookie, durante cuánto tiempo y
            cómo retirar su permiso en un clic.
          </p>
          <p className="se-legal__fecha">Última actualización: {ACTUALIZADO}</p>
          {!MEDICION_HABILITADA ? (
            <p className="se-legal__revision" role="note">
              Esta página está en revisión antes de activarse: el aviso todavía no
              aparece en el sitio y los botones de abajo no hacen nada por ahora. Se
              publica aquí para que el equipo legal pueda leer el texto completo antes
              de que empiece a pedirse permiso.
            </p>
          ) : null}
        </header>

        <section className="se-legal__bloque" aria-labelledby="cookies-estado">
          <h2 id="cookies-estado" className="se-legal__h2">
            Su situación ahora mismo
          </h2>
          <EstadoActual
            decision={decision}
            cookies={cookies}
            onAceptar={aceptar}
            onRevocar={retirar}
            borrando={borrando}
            borrado={borrado}
            deshabilitado={!MEDICION_HABILITADA}
          />
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-que-son">
          <h2 id="cookies-que-son" className="se-legal__h2">
            Qué son y por qué las usamos
          </h2>
          <p>
            Una cookie es un archivo diminuto que este sitio guarda en su navegador y que
            puede volver a leer después. Todas las nuestras son <strong>propias</strong>:
            las instala el dominio que usted está visitando, no un tercero, y ningún otro
            sitio puede leerlas.
          </p>
          <p>
            Las usamos con una sola finalidad: <strong>medir la audiencia</strong>. Saber
            cuánta gente nos lee, cuánta vuelve, qué piezas se leen de verdad y en cuáles se
            abandona la lectura a la mitad. Es la información con la que una redacción
            decide qué cubrir y en qué formato. No se usa para perfilar a nadie, no alimenta
            publicidad y no se toma ninguna decisión automatizada sobre usted.
          </p>
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-tabla">
          <h2 id="cookies-tabla" className="se-legal__h2">
            Tabla de cookies
          </h2>
          <div className="se-legal__tabla-caja">
            <table className="se-legal__tabla">
              <caption className="se-sr-only">
                Cookies que instala {BRAND.name}, con su tipo, finalidad y duración
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Dominio y tipo</th>
                  <th scope="col">Finalidad</th>
                  <th scope="col">Duración</th>
                  <th scope="col">Base</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c) => (
                  <tr key={c.nombre}>
                    <th scope="row">
                      <code>{c.nombre}</code>
                    </th>
                    <td>{c.tipo}</td>
                    <td>{c.finalidad}</td>
                    <td>{c.duracion}</td>
                    <td>{c.consentimiento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="se-legal__nota">
            «De sesión» significa que la cookie desaparece al cerrar el navegador.{" "}
            <code>session_id</code> además se renueva sola si pasan 30 minutos sin que usted
            haga nada, de modo que una pestaña olvidada no cuenta como una visita eterna.
          </p>
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-consentimiento">
          <h2 id="cookies-consentimiento" className="se-legal__h2">
            Cómo pedimos su permiso
          </h2>
          <p>
            La primera vez que entra verá una barra al pie de la pantalla con este texto:
          </p>
          <blockquote className="se-legal__cita">
            <p>
              <strong>Medimos cuánta gente nos lee.</strong> Con su permiso usamos cuatro
              cookies propias para saber cuántas personas nos leen, si vuelven y qué se lee
              de verdad. No llevan su nombre, no se comparten con nadie y no le siguen fuera
              de este sitio. <span className="se-legal__cita-enlace">Qué guarda cada una</span>{" "}
              · <span className="se-legal__cita-btn">Rechazar</span>{" "}
              <span className="se-legal__cita-btn">Aceptar</span>
            </p>
          </blockquote>
          <p>Cuatro cosas de ese aviso que queremos que sepa, porque son las que lo hacen válido:</p>
          <ul className="se-legal__lista">
            <li>
              <strong>Antes de que usted responda no se instala nada.</strong> Ni el
              identificador, ni la marca de tiempo, ni ninguna otra. Entrar al sitio y leer
              no equivale a aceptar.
            </li>
            <li>
              <strong>Rechazar cuesta exactamente lo mismo que aceptar:</strong> un clic, en
              un botón del mismo tamaño y del mismo color que el otro.
            </li>
            <li>
              <strong>No hay aspa para cerrar el aviso.</strong> Cerrarlo sin responder no
              puede interpretarse como un sí, así que sencillamente no se puede cerrar sin
              responder. Tampoco le impide leer mientras decide.
            </li>
            <li>
              <strong>Le volveremos a preguntar a los seis meses.</strong> Un permiso dado
              una vez no vale para siempre.
            </li>
          </ul>
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-datos">
          <h2 id="cookies-datos" className="se-legal__h2">
            Qué datos son, exactamente
          </h2>
          <p>
            Preferimos ser precisos antes que tranquilizadores:{" "}
            <strong>estos datos no son anónimos, son seudónimos</strong>. La diferencia
            importa. Un dato anónimo no permite volver a reconocer a nadie; el identificador
            que guardamos sí permite reconocer <em>al mismo navegador</em> cuando vuelve, y
            por eso sigue siendo un dato personal a efectos de la Ley de Protección de
            Datos Personales de Venezuela —y, para quien nos lee desde la Unión Europea o
            Brasil, también del RGPD y de la LGPD—, aunque no lleve su nombre. Cualquier sitio que le diga que su analítica es «totalmente
            anónima» mientras le pone un identificador de dos años le está diciendo algo que
            no es cierto.
          </p>
          <p>Dicho eso, esto es todo lo que ese identificador puede llegar a contar de usted:</p>
          <ul className="se-legal__lista">
            <li>Que un mismo navegador ha vuelto a este sitio varias veces en dos años.</li>
            <li>Qué páginas de este sitio vio en cada visita y en qué orden.</li>
            <li>Cuántos segundos estuvo cada pieza visible en su pantalla.</li>
            <li>Por qué página dejó de leer.</li>
          </ul>
          <p className="se-legal__afirmacion">Y esto es lo que no guardamos, en ningún caso:</p>
          <ul className="se-legal__lista">
            {NO_SE_GUARDA.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
          <p>
            El identificador tampoco se cruza con su cuenta si usted tiene una en este
            sitio. Son dos sistemas separados a propósito: quien lee los números de audiencia
            no puede saber qué leyó una persona con nombre y apellidos, porque ese vínculo no
            existe en ninguna parte.
          </p>
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-conservacion">
          <h2 id="cookies-conservacion" className="se-legal__h2">
            Cuánto lo conservamos
          </h2>
          <p>
            <strong>Catorce meses.</strong> Es el plazo que permite comparar un mes con el
            mismo mes del año anterior, y ni un día más. Pasado ese tiempo, los registros se
            borran de forma automática; no es una promesa de buena voluntad, es una tarea
            programada que corre sola.
          </p>
          <p>
            Los datos se guardan en servidores propios contratados a proveedores de
            alojamiento de la Unión Europea y Estados Unidos, y no se ceden, venden ni
            comparten con terceros para ninguna finalidad. No hay ninguna herramienta de
            analítica externa en este sitio.
          </p>
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-derechos">
          <h2 id="cookies-derechos" className="se-legal__h2">
            Sus derechos
          </h2>
          <p>
            Puede <strong>retirar su consentimiento cuando quiera</strong>, y retirarlo tiene
            que ser tan fácil como haberlo dado: el botón está más arriba en esta misma
            página. Al pulsarlo, las cookies se borran de su navegador y se eliminan del
            servidor todos los registros asociados a su identificador. La medición se detiene
            en ese momento.
          </p>
          <p>
            Le asisten los derechos de acceso, rectificación, cancelación y oposición
            (derechos ARCO) que reconocen el artículo 28 de la Constitución de la República
            Bolivariana de Venezuela y la Ley de Protección de Datos Personales. Si nos lee
            desde la Unión Europea o Brasil, le asisten además los derechos de limitación y
            portabilidad que reconocen el Reglamento (UE) 2016/679 (RGPD) y la Lei
            13.709/2018 (LGPD), según la norma que le resulte aplicable.
          </p>
          <p>
            Hay un detalle honesto que conviene explicar: como no
            guardamos su nombre ni su correo junto a estos datos,{" "}
            <strong>no podemos localizar «sus» registros si usted nos escribe</strong> — no
            tenemos forma de saber cuál de los identificadores es el suyo, y pedirle datos
            personales para averiguarlo sería recopilar más información de la que queríamos
            evitar. Por eso el ejercicio de esos derechos está puesto donde sí funciona: en
            el botón de esta página, que actúa sobre el identificador que tiene su navegador
            delante.
          </p>
          <p>
            También puede borrar las cookies desde la configuración de su navegador, o
            navegar en una ventana privada. Si rechaza la medición, el sitio funciona
            exactamente igual: no hay ningún contenido que dependa de que usted acepte.
          </p>
          <p>
            Para cualquier consulta sobre este aviso puede escribir a{" "}
            <a className="se-legal__enlace" href={`mailto:${CONTACT.privacyEmail}`}>
              {CONTACT.privacyEmail}
            </a>
            . Si considera que no hemos atendido su solicitud, puede reclamar ante la
            Superintendencia Nacional de Protección de Datos de Venezuela o, si nos lee
            desde otro país, ante la autoridad de control que le corresponda — en España,
            la Agencia Española de Protección de Datos; en Brasil, la ANPD.
          </p>
        </section>

        <footer className="se-legal__pie">
          <p>
            ¿Prefiere leer cómo tratamos el resto de sus datos? Escríbanos a{" "}
            <a className="se-legal__enlace" href={`mailto:${CONTACT.privacyEmail}`}>
              {CONTACT.privacyEmail}
            </a>{" "}
            o vuelva a la <Link to="/">portada</Link>.
          </p>
          </footer>
      </article>
    </div>
  );
};

export default Cookies;
