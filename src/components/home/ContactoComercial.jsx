import { useEffect, useRef, useState } from "react";
import { CONTACT } from "../../data/surEconomicsMock";
import { useClaveIdempotente } from "../../hooks/useClaveIdempotente";
import { NO_PARECE_PERSONA, useVerificacionHumana } from "../../hooks/useVerificacionHumana";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { errorDeContacto } from "../../lib/formularioDeContacto";
import { contactService } from "../../services/contactService";
import { CampoDeFormulario } from "../comun/CampoDeFormulario";
import { Enlace } from "../Enlace";
import "./contactoComercial.css";

/**
 * «Anúnciese en SurEconomics»: el contacto comercial de la portada, debajo de la banda
 * de publicidad, donde se lee como «este espacio puede ser suyo».
 *
 * No tiene buzón propio: manda por el mismo camino que `/contacto` (`POST /contact`, que
 * lo pasa a n8n y llega a info@), con el mismo campo, los mismos avisos y la misma
 * clave contra el doble envío y las mismas defensas contra el spam (la trampa y
 * Turnstile). Lo único suyo es el asunto, que se escribe solo para que en el buzón se
 * sepa de un vistazo que es publicidad y de qué empresa.
 *
 * En el teléfono el formulario se abre en su sitio con un botón: cuatro campos a la
 * vista partían la portada en dos. En escritorio va siempre abierto.
 */

const VACIO = { name: "", email: "", empresa: "", message: "" };
const OBLIGATORIOS = ["name", "email", "message"];
const ID_DE_CAMPO = {
  name: "comercial-nombre",
  email: "comercial-correo",
  message: "comercial-mensaje",
};

export const ContactoComercial = () => {
  const { t } = useIdioma();
  const [form, setForm] = useState(VACIO);
  const [tocado, setTocado] = useState({});
  const [estado, setEstado] = useState({ status: "idle", message: "" });
  const [abierto, setAbierto] = useState(false);
  const { clave, renovar } = useClaveIdempotente();
  const humano = useVerificacionHumana();
  const [trampa, setTrampa] = useState("");
  const primerCampo = useRef(null);

  const enviando = estado.status === "loading";
  const revisar = (k) => errorDeContacto(k, form[k], t);
  // Como en /contacto: solo avisa de lo que ya se tocó, y al salir del campo.
  const errores = Object.fromEntries(OBLIGATORIOS.map((k) => [k, tocado[k] ? revisar(k) : null]));

  const cambiar = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));
  const alSalir = (k) => () => setTocado((prev) => ({ ...prev, [k]: true }));

  // Al abrir (solo pasa en el teléfono), el foco al primer campo: quien pulsó quiere
  // escribir, y el botón que tenía el foco desaparece.
  useEffect(() => {
    if (abierto) primerCampo.current?.querySelector("input")?.focus();
  }, [abierto]);

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    setTocado(Object.fromEntries(OBLIGATORIOS.map((k) => [k, true])));
    const falla = OBLIGATORIOS.find((k) => revisar(k));
    if (falla) {
      setEstado({ status: "error", message: t("paginas.contacto.errores.revise") });
      document.getElementById(ID_DE_CAMPO[falla])?.focus();
      return;
    }
    const empresa = form.empresa.trim();
    setEstado({ status: "loading", message: "" });
    try {
      const turnstile = await humano.pedirToken();
      if (turnstile === null) throw Object.assign(new Error("turnstile"), { code: NO_PARECE_PERSONA });
      await contactService.submitContactMessage(
        {
          name: form.name,
          email: form.email,
          subject: empresa
            ? t("portada.comercial.asuntoConEmpresa", { empresa })
            : t("portada.comercial.asunto"),
          message: empresa ? `${t("portada.comercial.empresa")}: ${empresa}\n\n${form.message}` : form.message,
          website: trampa,
        },
        { idempotencyKey: clave(), turnstile },
      );
      humano.reiniciar();
      setEstado({ status: "success", message: t("portada.comercial.gracias") });
      setForm(VACIO);
      setTocado({});
      renovar();
    } catch (err) {
      humano.reiniciar();
      let aviso = t("paginas.contacto.errores.fallo");
      if (err?.code === NO_PARECE_PERSONA) aviso = t("comun.antiBots.noPaso");
      else if (err?.status === 429) aviso = t("paginas.contacto.errores.demasiadas");
      setEstado({ status: "error", message: aviso });
    }
  };

  const correo = (
    <a href={`mailto:${CONTACT.primaryEmail}`} className="se-comercial__correo">
      {CONTACT.primaryEmail}
    </a>
  );

  return (
    <section className="se-section se-comercial" aria-labelledby="comercial-titulo">
      <div className="se-container">
        <div className="se-comercial__marco">
          <div className="se-comercial__texto">
            <h2 id="comercial-titulo" className="se-comercial__titulo">
              {t("portada.comercial.titulo")}
            </h2>
            <p className="se-comercial__bajada">{t("portada.comercial.bajada")}</p>
            <Enlace to="/anunciate" className="se-comercial__formatos">
              {t("portada.comercial.formatos")}
            </Enlace>
            {abierto ? null : (
              <button type="button" className="se-btn se-btn--primary se-comercial__abrir"
                aria-expanded="false" aria-controls="comercial-form" onClick={() => setAbierto(true)}>
                {t("portada.comercial.abrir")}
              </button>
            )}
          </div>

          <form id="comercial-form" className={`se-comercial__form${abierto ? " is-abierto" : ""}`}
            onSubmit={enviar} onFocus={humano.activar} aria-describedby="comercial-estado" noValidate>
            {/* Una sola región viva, siempre presente, que cambia de texto (como en
                /contacto: dos regiones anunciaban el mismo aviso dos veces). */}
            <p id="comercial-estado" role="status"
              className={`se-comercial__estado se-comercial__estado--${estado.status}`}>
              {estado.status === "success" ? <strong>{t("paginas.contacto.enviado")} </strong> : null}
              {estado.status === "loading" ? t("paginas.contacto.enviando") : estado.message}
            </p>
            <div className="se-comercial__campos" ref={primerCampo}>
              <CampoDeFormulario id={ID_DE_CAMPO.name} etiqueta={t("paginas.contacto.campos.nombre")}
                valor={form.name} error={errores.name} onChange={cambiar("name")} onBlur={alSalir("name")}
                bloqueado={enviando} autoComplete="name" />
              <CampoDeFormulario id={ID_DE_CAMPO.email} etiqueta={t("paginas.contacto.campos.correo")} tipo="email"
                valor={form.email} error={errores.email} onChange={cambiar("email")} onBlur={alSalir("email")}
                bloqueado={enviando} autoComplete="email" />
              <CampoDeFormulario id="comercial-empresa" etiqueta={t("portada.comercial.empresaOpcional")}
                valor={form.empresa} onChange={cambiar("empresa")} bloqueado={enviando}
                obligatorio={false} autoComplete="organization" />
            </div>
            <CampoDeFormulario id={ID_DE_CAMPO.message} etiqueta={t("portada.comercial.mensaje")} multilinea filas={2}
              valor={form.message} error={errores.message} onChange={cambiar("message")} onBlur={alSalir("message")}
              bloqueado={enviando} />
            {/* La trampa para bots, como en /contacto y el boletín: fuera del tabulador y
                de los lectores de pantalla. */}
            <input type="text" name="website" className="se-sr-only" tabIndex={-1} aria-hidden="true"
              autoComplete="off" value={trampa} onChange={(e) => setTrampa(e.target.value)} />
            {humano.control}
            <div className="se-comercial__pie">
              <button type="submit" className="se-btn se-btn--primary" disabled={enviando}>
                {enviando ? t("paginas.contacto.enviando") : t("portada.comercial.enviar")}
              </button>
              <p className="se-comercial__directo">{t("portada.comercial.directo", { correo })}</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactoComercial;
