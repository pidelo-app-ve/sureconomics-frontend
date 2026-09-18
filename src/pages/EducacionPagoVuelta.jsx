import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  const [params] = useSearchParams();
  const referencia = params.get("ref") || "";
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
          error:
            err?.status === 404
              ? "No encontramos esa compra en su cuenta."
              : "No se pudo consultar el pago.",
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

  return (
    <main className="se-blog se-edu" role="main">
      <section className="se-section">
        <div className="se-container se-edu__vuelta">
          {estado.fase === "consultando" ? (
            <>
              <h1 className="se-edu__titulo">Confirmando su pago…</h1>
              <p className="se-text-body">
                Un momento: estamos esperando la confirmación de la pasarela. No cierre
                esta página.
              </p>
            </>
          ) : null}

          {estado.fase === "pagado" ? (
            <>
              <h1 className="se-edu__titulo">Listo, el módulo es suyo</h1>
              <p className="se-text-body">
                El acceso ya está activo y no caduca. Puede empezar cuando quiera.
              </p>
              <Link to={alModulo} className="se-btn">
                Ir al módulo
              </Link>
            </>
          ) : null}

          {estado.fase === "tardando" ? (
            <>
              <h1 className="se-edu__titulo">El pago está en camino</h1>
              <p className="se-text-body">
                La pasarela todavía no nos ha confirmado. Suele ser cuestión de minutos;
                el acceso se abre solo en cuanto llegue, sin que tenga que hacer nada.
              </p>
              <Link to={alModulo} className="se-btn se-btn--secondary">
                Volver al módulo
              </Link>
            </>
          ) : null}

          {estado.fase === "sin-referencia" || estado.fase === "error" ? (
            <>
              <h1 className="se-edu__titulo">No pudimos seguirle la pista a ese pago</h1>
              <p className="se-text-body" role="alert">
                {estado.error ||
                  "Volvió sin la referencia del pago. Si ya pagó, el acceso se abre solo en cuanto la pasarela confirme."}
              </p>
              <Link to="/educacion" className="se-btn se-btn--secondary">
                Volver a Educación
              </Link>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export default EducacionPagoVuelta;
