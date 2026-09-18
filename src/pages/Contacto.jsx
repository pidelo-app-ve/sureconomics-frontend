import PropTypes from "prop-types";
import { useState } from "react";
import { CONTACT } from "../data/surEconomicsMock";
import { Link, useSearchParams } from "react-router-dom";
import { contactService } from "../services/contactService";
import { useClaveIdempotente } from "../hooks/useClaveIdempotente";

/**
 * Un campo con su aviso debajo.
 *
 * El aviso vive pegado al control y no en una lista arriba: un resumen general dice
 * que algo falla y deja a la persona buscando cuál. Y va atado con `aria-describedby`,
 * que es lo que hace que un lector de pantalla lo lea al entrar en el campo en vez de
 * tener que salir a buscarlo.
 */
const Campo = ({
  id,
  etiqueta,
  valor,
  error,
  onChange,
  onBlur,
  bloqueado,
  tipo = "text",
  multilinea = false,
  autoComplete,
}) => {
  const idDelError = `${id}-error`;
  const Control = multilinea ? "textarea" : "input";
  return (
    <div className={`se-form-field${error ? " se-form-field--mal" : ""}`}>
      <label className="se-form-label" htmlFor={id}>
        {etiqueta}
      </label>
      <Control
        id={id}
        className={`se-form-control${multilinea ? " se-form-control--textarea" : ""}`}
        type={multilinea ? undefined : tipo}
        rows={multilinea ? 6 : undefined}
        value={valor}
        onChange={onChange}
        onBlur={onBlur}
        disabled={bloqueado}
        autoComplete={autoComplete}
        // `aria-invalid` y no solo el borde rojo: el color no llega a quien no lo ve.
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? idDelError : undefined}
      />
      {error ? (
        <p className="se-form-error" id={idDelError}>
          {error}
        </p>
      ) : null}
    </div>
  );
};

Campo.propTypes = {
  id: PropTypes.string.isRequired,
  etiqueta: PropTypes.string.isRequired,
  valor: PropTypes.string,
  error: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  bloqueado: PropTypes.bool,
  tipo: PropTypes.string,
  multilinea: PropTypes.bool,
  autoComplete: PropTypes.string,
};

export const Contacto = () => {
  const [searchParams] = useSearchParams();
  const prefilledSubject = searchParams.get("asunto") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: prefilledSubject,
    message: "",
  });
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });
  // La misma clave mientras el envío no cuaje: si la respuesta se pierde y la persona
  // vuelve a pulsar, el servidor devuelve la de la primera vez en lugar de guardar el
  // mensaje dos veces. Ver `lib/idempotencia.js`.
  const { clave, renovar } = useClaveIdempotente();

  // Los errores por campo, y **solo de los campos que la persona ya tocó**. Validar
  // en cada tecla riñe con quien todavía está escribiendo su correo; validar solo al
  // enviar deja descubrir cuatro fallos de golpe al final. Al salir del campo es
  // cuando ya terminó con él.
  const [tocado, setTocado] = useState({});

  const revisar = (key, valor) => {
    const v = String(valor ?? "").trim();
    if (!v) {
      return {
        name: "Escriba su nombre.",
        email: "Escriba su correo.",
        subject: "Diga de qué se trata.",
        message: "Escriba su mensaje.",
      }[key];
    }
    // Comprobación mínima a propósito: la buena la hace el servidor, y una expresión
    // estricta aquí rechaza direcciones válidas raras y deja pasar las inventadas
    // igual. Lo que se quiere atajar es la errata, no validar el correo.
    if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      return "Ese correo no parece completo.";
    }
    if (key === "message" && v.length < 10) return "Cuéntenos un poco más.";
    return null;
  };

  const errores = Object.fromEntries(
    Object.keys(form).map((k) => [k, tocado[k] ? revisar(k, form[k]) : null])
  );

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const alSalir = (key) => () => setTocado((prev) => ({ ...prev, [key]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitState.status === "loading") return;
    // Al enviar se marcan todos: así los que nunca se tocaron también enseñan su
    // aviso, en vez de rebotar contra un mensaje general que no dice cuál falta.
    const todos = Object.fromEntries(Object.keys(form).map((k) => [k, true]));
    setTocado(todos);
    if (Object.keys(form).some((k) => revisar(k, form[k]))) {
      setSubmitState({ status: "error", message: "Revise los campos marcados." });
      return;
    }
    setSubmitState({ status: "loading", message: "" });
    try {
      await contactService.submitContactMessage(form, { idempotencyKey: clave() });
      setSubmitState({ status: "success", message: "Gracias por escribirnos. Le responderemos a la brevedad." });
      setForm({ name: "", email: "", subject: "", message: "" });
      setTocado({});
      // Cuajó: lo que venga después es un mensaje nuevo, no un reintento.
      renovar();
    } catch (err) {
      const tooMany = err?.status === 429;
      setSubmitState({
        status: "error",
        message: tooMany
          ? "Demasiadas solicitudes. Intente de nuevo en unos minutos."
          : "No se pudo enviar el mensaje. Intente de nuevo o escríbanos directamente por email.",
      });
    }
  };

  return (
    <main className="se-blog se-contact" role="main">
      <section className="se-hero se-hero--institutional se-contact__hero">
        <div className="se-container">
          <div className="se-institutional-hero">
            <h1 className="se-heading-hero">Contacto</h1>
            <p className="se-text-lead se-hero__claim">
              Contacto institucional para consultas, alianzas y proyectos de investigación/asesoría.
            </p>
          </div>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <div className="se-contact__grid">
            <div className="se-contact__panel">
              {/* Sin un «Formulario» encima: la pagina se llama Contacto y debajo hay
                  un formulario a la vista. Ese titulo con su filete no decia nada y
                  dejaba la caja 92 px por debajo de la tarjeta de al lado, que es lo
                  que hacia que las dos columnas no casaran. */}
              <form className="se-contact-form se-contact__form" onSubmit={handleSubmit} aria-describedby="contact-submit-status">
                <div id="contact-submit-status" className="se-contact__status" aria-live="polite">
                  {submitState.status === "success" ? (
                    <div className="se-contact__banner" role="status">
                      <strong>Enviado.</strong> {submitState.message}
                    </div>
                  ) : submitState.status === "loading" ? (
                    <div className="se-contact__banner se-contact__banner--loading" role="status">
                      Enviando…
                    </div>
                  ) : submitState.status === "error" ? (
                    <div className="se-contact__banner se-contact__banner--error" role="alert">
                      {submitState.message}
                    </div>
                  ) : null}
                </div>
                {/* Un componente por campo: el aviso va **debajo de su propio
                    control** y atado con `aria-describedby`, que es lo que hace que un
                    lector de pantalla lo lea al entrar en el campo. Un aviso general
                    arriba dice que algo falla pero no cuál. */}
                <div className="se-form-grid">
                  <Campo
                    id="contacto-nombre"
                    etiqueta="Nombre"
                    valor={form.name}
                    error={errores.name}
                    onChange={handleChange("name")}
                    onBlur={alSalir("name")}
                    bloqueado={submitState.status === "loading"}
                    autoComplete="name"
                  />
                  <Campo
                    id="contacto-correo"
                    etiqueta="Correo electrónico"
                    tipo="email"
                    valor={form.email}
                    error={errores.email}
                    onChange={handleChange("email")}
                    onBlur={alSalir("email")}
                    bloqueado={submitState.status === "loading"}
                    autoComplete="email"
                  />
                </div>
                <Campo
                  id="contacto-asunto"
                  etiqueta="Asunto"
                  valor={form.subject}
                  error={errores.subject}
                  onChange={handleChange("subject")}
                  onBlur={alSalir("subject")}
                  bloqueado={submitState.status === "loading"}
                />
                <Campo
                  id="contacto-mensaje"
                  etiqueta="Mensaje"
                  multilinea
                  valor={form.message}
                  error={errores.message}
                  onChange={handleChange("message")}
                  onBlur={alSalir("message")}
                  bloqueado={submitState.status === "loading"}
                />
                <button type="submit" className="se-btn" aria-label="Enviar formulario" disabled={submitState.status === "loading"}
                >
                  {submitState.status === "loading" ? "Enviando…" : "Enviar"}
                </button>
              </form>

            </div>

            <aside className="se-contact__aside">
              <section className="se-contact__tarjeta" aria-labelledby="contacto-directo">
                <h2 id="contacto-directo" className="se-contact__tarjeta-titulo">
                  Escríbanos directamente
                </h2>
                <p className="se-contact__tarjeta-texto">
                  Si prefiere su propio correo, esta es la dirección del medio.
                </p>
                <a href={`mailto:${CONTACT.primaryEmail}`} className="se-contact__correo">
                  {CONTACT.primaryEmail}
                </a>
              </section>

              {/* Los dos destinos que la gente busca desde aquí. Antes vivían sueltos
                  bajo el formulario, donde nadie los veía: quien llega a Contacto sin
                  saber a quién escribir suele venir por una de las dos cosas. */}
              <nav className="se-contact__tarjeta" aria-label="Otros caminos">
                <h2 className="se-contact__tarjeta-titulo">¿Viene por algo concreto?</h2>
                <Link to="/anunciate" className="se-contact__camino">
                  <span className="se-contact__camino-titulo">Anunciarse</span>
                  <span className="se-contact__camino-texto">
                    Formatos, espacios del sitio y medidas.
                  </span>
                </Link>
                <Link to="/consultoria" className="se-contact__camino">
                  <span className="se-contact__camino-titulo">Consultoría</span>
                  <span className="se-contact__camino-texto">
                    Investigación y asesoría por encargo.
                  </span>
                </Link>
              </nav>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

