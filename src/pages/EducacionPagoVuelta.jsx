import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Enlace } from "../components/Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { getEstadoDePago } from "../services/educacionService";

/**
 * A donde vuelve el comprador despues de pagar.
 *
 * Existe porque el pago se confirma por dos vias que no llegan a la vez: el comprador
 * vuelve **ya**, y el aviso de la pasarela llega cuando llega -- normalmente en segundos,
 * a veces no tan normalmente. Sin esta pantalla, quien acaba de pagar aterriza en un
 * modulo que todavia dice "bloqueado", y lo razonable desde su silla es pensar que pago
 * para nada.
 *
 * Asi que aqui se pregunta. No se da por pagado por haber vuelto -- eso lo decide el
 * webhook, que es el unico que habla con la pasarela de verdad y el unico firmado --,
 * sino que se consulta el estado y se reintenta unas cuantas veces mientras tanto.
 *
 * El reintento para: a los treinta segundos deja de preguntar y dice que el pago puede
 * tardar, con el enlace al modulo. Un sondeo infinito en una pestana olvidada es trafico
 * que no sirve para nada.
 */

const INTENTOS = 10;
const ESPERA_MS = 3000;

export const EducacionPagoVuelta = () => {
  const { t } = useIdioma();
  const [params] = useSearchParams();
  const referencia = params.get("ref") || "";
  // `error`: "" | "no-encontrada" | "fallo". La frase se elige al pintar, en el idioma de la página.
  const [estado, setEstado] = useState({ fase: "consultando", compra: null, error: "" });
  const intentos = useRef(0);

  useEffect(() => {
    if (!referencia) {
      setEstado({ fase: "sin-referencia", compra: null, error: "" });
      return undefined;
    }

    let vivo = true;
    let temporizador = null;

    const preguntar = async () => {
      try {
        const compra = await getEstadoDePago(referencia);
        if (!vivo) return;

        if (compra?.pagada) {
          setEstado({ fase: "pagado", compra, error: "" });
          return;
        }

        intentos.current += 1;
        if (intentos.current >= INTENTOS) {
          setEstado({ fase: "tardando", compra, error: "" });
          return;
        }
        temporizador = window.setTimeout(preguntar, ESPERA_MS);
      } catch (err) {
        if (!vivo) return;
        setEstado({
          fase: "error",
          compra: null,
          error: err?.status === 404 ? "no-encontrada" : "fallo",
        });
      }
    };

    preguntar();
    return () => {
      vivo = false;
      if (temporizador) window.clearTimeout(temporizador);
    };
  }, [referencia]);

  const alModulo = estado.compra?.modulo ? `/educacion/${estado.compra.modulo}` : "/educacion";

  let mensajeDeError = t("educacion.pagoVuelta.fallo.sinReferencia");
  if (estado.error === "no-encontrada") mensajeDeError = t("educacion.pagoVuelta.noEncontramos");
  else if (estado.error === "fallo") mensajeDeError = t("educacion.pagoVuelta.noSePudoConsultar");

  return (
    <main className="se-blog se-edu" role="main">
      <section className="se-section">
        <div className="se-container se-edu__vuelta">
          {estado.fase === "consultando" ? (
            <>
              <h1 className="se-edu__titulo">{t("educacion.pagoVuelta.confirmando.titulo")}</h1>
              <p className="se-text-body">{t("educacion.pagoVuelta.confirmando.texto")}</p>
            </>
          ) : null}

          {estado.fase === "pagado" ? (
            <>
              <h1 className="se-edu__titulo">{t("educacion.pagoVuelta.pagado.titulo")}</h1>
              <p className="se-text-body">{t("educacion.pagoVuelta.pagado.texto")}</p>
              <Enlace to={alModulo} className="se-btn">
                {t("educacion.pagoVuelta.pagado.irAlModulo")}
              </Enlace>
            </>
          ) : null}

          {estado.fase === "tardando" ? (
            <>
              <h1 className="se-edu__titulo">{t("educacion.pagoVuelta.tardando.titulo")}</h1>
              <p className="se-text-body">{t("educacion.pagoVuelta.tardando.texto")}</p>
              <Enlace to={alModulo} className="se-btn se-btn--secondary">
                {t("educacion.pagoVuelta.tardando.volverAlModulo")}
              </Enlace>
            </>
          ) : null}

          {estado.fase === "sin-referencia" || estado.fase === "error" ? (
            <>
              <h1 className="se-edu__titulo">{t("educacion.pagoVuelta.fallo.titulo")}</h1>
              <p className="se-text-body" role="alert">
                {mensajeDeError}
              </p>
              <Enlace to="/educacion" className="se-btn se-btn--secondary">
                {t("educacion.comun.volverAEducacion")}
              </Enlace>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export default EducacionPagoVuelta;
