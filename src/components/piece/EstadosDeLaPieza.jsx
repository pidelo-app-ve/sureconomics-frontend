import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { ErrorState, LoadingState } from "../../ui";

/**
 * Lo que enseña la página de una pieza (`pages/Pieza.jsx`) cuando no tiene pieza que
 * enseñar: mientras llega, si no existe y si no se pudo traer. Aparte de la página para
 * poder pintarlos en una prueba: la página solo llega a ellos después de pedir la pieza.
 */

/**
 * Mientras llega. Nada en absoluto la primera fracción de segundo (`cargando` falso):
 * una pieza que carga rápido debe aparecer sin más, sin una tarjeta que destelle
 * delante. Pero con una pantalla de alto desde el primer momento: sin ella el pie
 * quedaba a la vista y la pieza, al llegar, lo empujaba fuera de golpe.
 */
export const PiezaCargando = ({ cargando }) => {
  const { t } = useIdioma();
  return (
    <main className="se-blog se-articles se-cargando-pantalla" role="main">
      <section className="se-section">
        <div className="se-container">{cargando ? <LoadingState title={t("comun.cargando")} /> : null}</div>
      </section>
    </main>
  );
};
PiezaCargando.propTypes = { cargando: PropTypes.bool };

/** No se pudo traer (sin red, un 502…): es pasajero, y se puede reintentar. */
export const PiezaConError = ({ error, onRetry }) => {
  const { t } = useIdioma();
  return (
    <main className="se-blog se-articles" role="main">
      <section className="se-section">
        <div className="se-container">
          <ErrorState title={t("piezas.errorCarga")} error={error} onRetry={onRetry} />
        </div>
      </section>
    </main>
  );
};
PiezaConError.propTypes = { error: PropTypes.any, onRetry: PropTypes.func.isRequired };

/** La dirección no lleva a ninguna pieza (un 404 de la API). */
export const PiezaNoEncontrada = () => {
  const { t } = useIdioma();
  return (
    <main className="se-blog se-articles" role="main">
      <section className="se-section">
        <div className="se-container">
          <div className="se-piece">
            <h1 className="se-piece__title">{t("piezas.noEncontrada.titulo")}</h1>
            <p className="se-piece__lead">{t("piezas.noEncontrada.texto")}</p>
            <Enlace to="/" className="se-piece__back">
              {t("piezas.noEncontrada.volver")}
            </Enlace>
          </div>
        </div>
      </section>
    </main>
  );
};
