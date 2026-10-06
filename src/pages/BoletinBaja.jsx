import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { unsubscribeFromNewsletter } from "../services/newsletterService";
import { BRAND } from "../data/surEconomicsMock";
import { Enlace } from "../components/Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";

/**
 * Darse de baja del boletín.
 *
 * A esta página se llega desde el enlace que va en cada boletín, con el token en la
 * dirección. No pide sesión, y eso es a propósito: sin confirmación por correo cualquiera
 * puede haber apuntado la dirección de un tercero, y ese tercero puede no tener cuenta.
 * El token es la única credencial que hay para salir.
 *
 * La baja se pide **al cargar la página** en vez de con un botón de confirmar. Las dos
 * cosas tienen un coste y este es el reparto que elegí:
 *
 *   - un botón añade fricción a algo que tiene que ser fácil. Un formulario de baja que
 *     cuesta trabajo es exactamente lo que la ley y el sentido común desaconsejan;
 *   - hacerlo al cargar depende de que el navegador ejecute JavaScript, y eso es lo que
 *     protege de los antivirus y previsualizadores de correo: abren los enlaces por su
 *     cuenta pero no ejecutan la página. Si la baja fuera un `GET` en el propio enlace,
 *     media lista se daría de baja sola sin que nadie pulsara nada.
 *
 * De ahí que el endpoint del servidor sea un `POST` y esta página sea quien lo hace.
 */
export const BoletinBaja = () => {
  const [params] = useSearchParams();

  // Una página personal (lleva el token de quien se da de baja): fuera de los buscadores.
  const { t } = useIdioma();
  useMetaPagina({ title: t("boletin.baja.meta.titulo", { marca: BRAND.name }), noindex: true });
  const token = params.get("token") || "";
  const [estado, setEstado] = useState({ status: token ? "loading" : "sin-token", email: "" });

  // React 18 en modo estricto monta cada efecto dos veces en desarrollo. La baja es
  // idempotente en el servidor, así que dos llamadas no romperían nada -- pero el
  // guardián evita el segundo viaje.
  const yaPedido = useRef(false);

  useEffect(() => {
    if (!token || yaPedido.current) return;
    yaPedido.current = true;

    // Sin bandera de "sigo montado", y es deliberado.
    //
    // La primera versión tenía una, y entre ella y el `yaPedido` de arriba la página se
    // quedaba en "Procesando la baja…" para siempre: el modo estricto desmonta el primer
    // efecto -- la bandera pasa a falsa y descarta el `setEstado` que ya venía en
    // camino -- y el segundo montaje sale por el guardián sin volver a pedir nada. Nadie
    // ponía el resultado. La baja sí se ejecutaba, así que el lector se quedaba mirando
    // un mensaje de espera creyendo que había fallado.
    //
    // Escribir estado tras desmontar es inocuo en React 18: no avisa ni gotea.
    (async () => {
      try {
        const datos = await unsubscribeFromNewsletter(token);
        setEstado({ status: "ok", email: datos?.email || "" });
      } catch (err) {
        setEstado({
          status: err?.status === 404 ? "token-malo" : "error",
          email: "",
        });
      }
    })();
  }, [token]);

  return (
    <main className="se-blog" role="main">
      <div className="se-container se-section">
        <div className="se-gate" aria-labelledby="baja-title">
          <h1 id="baja-title" className="se-gate__title">
            {t("boletin.baja.titulo")}
          </h1>

          {estado.status === "loading" ? (
            <p className="se-gate__lead">{t("boletin.baja.procesando")}</p>
          ) : null}

          {estado.status === "ok" ? (
            <>
              <p className="se-gate__lead">
                {t("boletin.baja.hecho", {
                  correo: estado.email ? <strong>{estado.email}</strong> : t("boletin.baja.eseCorreo"),
                })}
              </p>
              <p className="se-admin-meta-hint">{t("boletin.baja.sinQuerer")}</p>
            </>
          ) : null}

          {estado.status === "sin-token" ? (
            <p className="se-gate__lead">{t("boletin.baja.sinToken")}</p>
          ) : null}

          {estado.status === "token-malo" ? (
            <p className="se-gate__lead">{t("boletin.baja.tokenMalo")}</p>
          ) : null}

          {estado.status === "error" ? (
            <p className="se-gate__error" role="alert">
              {t("boletin.baja.error")}
            </p>
          ) : null}

          <div className="se-gate__actions">
            <Enlace to="/" className="se-gate__submit">
              {t("boletin.baja.irPortada")}
            </Enlace>
            <Enlace to="/contacto" className="se-link">
              {t("boletin.baja.escribirnos")}
            </Enlace>
          </div>
        </div>
      </div>
    </main>
  );
};
