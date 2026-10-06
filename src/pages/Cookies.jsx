import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Enlace } from "../components/Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { formatearFecha, tActual } from "../i18n/motor";
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

/** Fecha de la última revisión del texto. Se formatea en el idioma de la página. */
const ACTUALIZADO = "2026-10-02";

/* Las cinco cookies. Tipo, finalidad, duración y base viven en `paginas.json`
   (`paginas.cookies.tabla.<nombre>`), para los dos idiomas. */
const COOKIES = ["cookie_consent", "user_id", "session_id", "last_activity", "exit_page"];

const NO_SE_GUARDA = ["l1", "l2", "l3", "l4", "l5"];

const legible = (clave, valor) => {
  if (!valor) return <em>{tActual("paginas.cookies.estado.noPuesta")}</em>;
  if (clave !== "last_activity") return valor;
  const n = Number(valor);
  if (!Number.isFinite(n)) return valor;
  return formatearFecha(new Date(n), "conHora", undefined, { year: "numeric", second: "2-digit" });
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
  const { t } = useIdioma();
  if (decision === "si") {
    return (
      <div className="se-legal__estado se-legal__estado--si">
        <p className="se-legal__estado-titulo">{t("paginas.cookies.estado.acepto")}</p>
        <p className="se-legal__estado-texto">{t("paginas.cookies.estado.guardadoAhora")}</p>
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
          title={deshabilitado ? t("paginas.cookies.estado.enRevisionRetirar") : undefined}
        >
          {borrando ? t("paginas.cookies.estado.borrando") : t("paginas.cookies.estado.retirar")}
        </button>
        <p className="se-legal__nota">{t("paginas.cookies.estado.alPulsar")}</p>
      </div>
    );
  }

  return (
    <div className="se-legal__estado se-legal__estado--no">
      <p className="se-legal__estado-titulo">
        {decision === "no" ? t("paginas.cookies.estado.rechazo") : t("paginas.cookies.estado.sinResponder")}
      </p>
      <p className="se-legal__estado-texto">
        {borrado ? t("paginas.cookies.estado.borrados") : null}
        {t("paginas.cookies.estado.ningunaCookie", { codigo: <code>cookie_consent</code> })}
      </p>
      <button
        type="button"
        className="se-legal__btn se-legal__btn--suave"
        onClick={onAceptar}
        disabled={deshabilitado}
        title={deshabilitado ? t("paginas.cookies.estado.enRevisionAceptar") : undefined}
      >
        {t("paginas.cookies.estado.aceptar")}
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
  const { t } = useIdioma();
  useMetaPagina({
    title: t("paginas.cookies.meta.titulo", { marca: BRAND.name }),
    description: t("paginas.cookies.meta.descripcion"),
  });
  const [decision, setDecision] = useState(() => consentimiento());
  const [cookies, setCookies] = useState(() => estado());
  const [borrando, setBorrando] = useState(false);
  const [borrado, setBorrado] = useState(false);

  // Las cookies cambian por debajo de React -- el latido reescribe `last_activity` cada
  // veinte segundos --, así que se vuelven a leer cada pocos segundos mientras esta
  // pagina esta abierta. Es la unica pantalla del sitio donde ese detalle importa.
  useEffect(() => {
    if (decision !== "si") return undefined;
    const reloj = window.setInterval(() => setCookies(estado()), 5000);
    return () => window.clearInterval(reloj);
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
       el mismo tropiezo que la franja del bloque de redes. Y es `main` porque el
       envoltorio del `Layout` ya no lo es: cada vista declara su region principal. */
    <main className="se-blog" role="main">
      <article className="se-legal">
          <header className="se-legal__cabeza">
          <p className="se-legal__kicker">{t("paginas.cookies.kicker")}</p>
          <h1 className="se-legal__titulo">{t("paginas.cookies.titulo")}</h1>
          <p className="se-legal__entrada">{t("paginas.cookies.entrada", { marca: BRAND.name })}</p>
          <p className="se-legal__fecha">
            {t("paginas.cookies.actualizacion", { fecha: formatearFecha(ACTUALIZADO, "larga") })}
          </p>
          {!MEDICION_HABILITADA ? (
            <p className="se-legal__revision" role="note">
              {t("paginas.cookies.revision")}
            </p>
          ) : null}
        </header>

        <section className="se-legal__bloque" aria-labelledby="cookies-estado">
          <h2 id="cookies-estado" className="se-legal__h2">
            {t("paginas.cookies.situacion")}
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
            {t("paginas.cookies.queSon")}
          </h2>
          <p>{t("paginas.cookies.queSon1", { propias: <strong>{t("paginas.cookies.queSon1Propias")}</strong> })}</p>
          <p>{t("paginas.cookies.queSon2", { medir: <strong>{t("paginas.cookies.queSon2Medir")}</strong> })}</p>
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-tabla">
          <h2 id="cookies-tabla" className="se-legal__h2">
            {t("paginas.cookies.tablaTitulo")}
          </h2>
          <div className="se-legal__tabla-caja">
            <table className="se-legal__tabla">
              <caption className="se-sr-only">{t("paginas.cookies.tablaCaption", { marca: BRAND.name })}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("paginas.cookies.colNombre")}</th>
                  <th scope="col">{t("paginas.cookies.colTipo")}</th>
                  <th scope="col">{t("paginas.cookies.colFinalidad")}</th>
                  <th scope="col">{t("paginas.cookies.colDuracion")}</th>
                  <th scope="col">{t("paginas.cookies.colBase")}</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((nombre) => (
                  <tr key={nombre}>
                    <th scope="row">
                      <code>{nombre}</code>
                    </th>
                    <td>{t(`paginas.cookies.tabla.${nombre}.tipo`)}</td>
                    <td>{t(`paginas.cookies.tabla.${nombre}.finalidad`)}</td>
                    <td>{t(`paginas.cookies.tabla.${nombre}.duracion`)}</td>
                    <td>{t(`paginas.cookies.tabla.${nombre}.base`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="se-legal__nota">
            {t("paginas.cookies.notaSesion", { codigo: <code>session_id</code> })}
          </p>
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-consentimiento">
          <h2 id="cookies-consentimiento" className="se-legal__h2">
            {t("paginas.cookies.permiso")}
          </h2>
          <p>{t("paginas.cookies.permiso1")}</p>
          {/* La cita reproduce la barra tal cual: mismas claves que `AvisoDeCookies`. */}
          <blockquote className="se-legal__cita">
            <p>
              <strong>{t("paginas.cookies.aviso.titulo")}.</strong> {t("paginas.cookies.aviso.cuerpo")}{" "}
              <span className="se-legal__cita-enlace">{t("paginas.cookies.aviso.enlace")}</span>{" "}
              · <span className="se-legal__cita-btn">{t("paginas.cookies.aviso.rechazar")}</span>{" "}
              <span className="se-legal__cita-btn">{t("paginas.cookies.aviso.aceptar")}</span>
            </p>
          </blockquote>
          <p>{t("paginas.cookies.permiso2")}</p>
          <ul className="se-legal__lista">
            {["valido1", "valido2", "valido3", "valido4"].map((clave) => (
              <li key={clave}>
                {t(`paginas.cookies.${clave}`, { fuerte: <strong>{t(`paginas.cookies.${clave}Fuerte`)}</strong> })}
              </li>
            ))}
          </ul>
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-datos">
          <h2 id="cookies-datos" className="se-legal__h2">
            {t("paginas.cookies.datos")}
          </h2>
          <p>
            {t("paginas.cookies.datos1", {
              fuerte: <strong>{t("paginas.cookies.datos1Fuerte")}</strong>,
              enfasis: <em>{t("paginas.cookies.datos1Enfasis")}</em>,
            })}
          </p>
          <p>{t("paginas.cookies.datos2")}</p>
          <ul className="se-legal__lista">
            {["cuenta1", "cuenta2", "cuenta3", "cuenta4"].map((clave) => (
              <li key={clave}>{t(`paginas.cookies.${clave}`)}</li>
            ))}
          </ul>
          <p className="se-legal__afirmacion">{t("paginas.cookies.noGuardamos")}</p>
          <ul className="se-legal__lista">
            {NO_SE_GUARDA.map((clave) => (
              <li key={clave}>{t(`paginas.cookies.noSeGuarda.${clave}`)}</li>
            ))}
          </ul>
          <p>{t("paginas.cookies.datos3")}</p>
          {/* Lo unico que ocurre tambien cuando la respuesta es no. Va dicho aqui, en la
              seccion de los datos, y no escondido: la promesa de que un no no deja rastro
              se sostiene porque lo que se manda es un uno sin nadie detras. */}
          <p>{t("paginas.cookies.datos4")}</p>
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-conservacion">
          <h2 id="cookies-conservacion" className="se-legal__h2">
            {t("paginas.cookies.conservacion")}
          </h2>
          <p>{t("paginas.cookies.conservacion1", { fuerte: <strong>{t("paginas.cookies.conservacion1Fuerte")}</strong> })}</p>
          <p>{t("paginas.cookies.conservacion2")}</p>
        </section>

        <section className="se-legal__bloque" aria-labelledby="cookies-derechos">
          <h2 id="cookies-derechos" className="se-legal__h2">
            {t("paginas.cookies.derechos")}
          </h2>
          <p>{t("paginas.cookies.derechos1", { fuerte: <strong>{t("paginas.cookies.derechos1Fuerte")}</strong> })}</p>
          <p>{t("paginas.cookies.derechos2")}</p>
          <p>{t("paginas.cookies.derechos3", { fuerte: <strong>{t("paginas.cookies.derechos3Fuerte")}</strong> })}</p>
          <p>{t("paginas.cookies.derechos4")}</p>
          <p>
            {t("paginas.cookies.derechos5", {
              correo: (
                <a className="se-legal__enlace" href={`mailto:${CONTACT.privacyEmail}`}>
                  {CONTACT.privacyEmail}
                </a>
              ),
            })}
          </p>
        </section>

        <footer className="se-legal__pie">
          <p>
            {t("paginas.cookies.pie", {
              correo: (
                <a className="se-legal__enlace" href={`mailto:${CONTACT.privacyEmail}`}>
                  {CONTACT.privacyEmail}
                </a>
              ),
              portada: <Enlace to="/">{t("paginas.cookies.piePortada")}</Enlace>,
            })}
          </p>
          </footer>
      </article>
    </main>
  );
};

export default Cookies;
