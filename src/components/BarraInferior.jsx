import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { Enlace } from "./Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { sinPrefijo } from "../i18n/motor";
import { rutaDeFormato } from "../lib/pieza";
import "./barraInferior.css";

/**
 * La barra fija de abajo en el teléfono: cuatro accesos al alcance del pulgar
 * (Portada, Mercados, Informes, Buscar). El menú lateral sigue para todo lo demás.
 *
 * «Buscar» abre el explorador de la portada como la lupa de la cabecera
 * (`/?buscar=1`), y si ya está abierto lo cierra. Solo se ve por debajo de 760 px
 * (CSS); en pantallas anchas la cabecera ya lo tiene todo a la vista.
 */

const Icono = ({ d }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONOS = {
  // Un periódico doblado.
  portada: "M4 5.5h12.5v13H6a2 2 0 0 1-2-2v-11ZM16.5 9H20v7.5a2 2 0 0 1-2 2h-1.5M7 9h6.5M7 12h6.5M7 15h4",
  // Una línea de cotización sobre su eje.
  mercados: "M3.5 19.5h17M4.5 15l4.5-4.5 3.5 3 6.5-7M15.5 6.5H19V10",
  // Un documento con la esquina doblada.
  informes: "M6.5 3.5h7.5l4 4v13h-11.5v-17ZM14 3.5v4h4M9.5 12h5M9.5 15.5h5",
  // La lupa.
  buscar: "M10.5 4.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12ZM15 15l4.5 4.5",
};

Icono.propTypes = { d: PropTypes.string.isRequired };

export const BarraInferior = () => {
  const { t } = useIdioma();
  const location = useLocation();
  const ruta = sinPrefijo(location.pathname);
  const informes = rutaDeFormato("informe");
  const buscando = ruta === "/" && new URLSearchParams(location.search).get("buscar") === "1";

  const items = [
    { id: "portada", to: "/", activo: ruta === "/" && !buscando, label: t("nav.barra.portada") },
    { id: "mercados", to: "/monedas", activo: ruta === "/monedas", label: t("nav.barra.mercados") },
    { id: "informes", to: informes, activo: ruta === informes || ruta.startsWith(`${informes}/`), label: t("nav.barra.informes") },
  ];

  return (
    <nav className="se-barra-inferior" aria-label={t("nav.barra.region")}>
      <ul className="se-barra-inferior__lista">
        {items.map((i) => (
          <li key={i.id}>
            <Enlace
              to={i.to}
              className="se-barra-inferior__enlace"
              aria-current={i.activo ? "page" : undefined}
            >
              <Icono d={ICONOS[i.id]} />
              <span>{i.label}</span>
            </Enlace>
          </li>
        ))}
        <li>
          <Enlace
            to={buscando ? "/" : "/?buscar=1"}
            replace={buscando}
            state={buscando ? undefined : { desdeLaLupa: true }}
            className="se-barra-inferior__enlace"
            aria-expanded={ruta === "/" ? buscando : undefined}
          >
            <Icono d={ICONOS.buscar} />
            <span>{t("nav.buscar")}</span>
          </Enlace>
        </li>
      </ul>
    </nav>
  );
};

export default BarraInferior;
