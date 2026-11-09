import PropTypes from "prop-types";
import { useEffect, useState } from "react";

import { FORMATO_DEL_HUECO, NOMBRE_DEL_HUECO } from "./mapa/paginas";
import { getOcupacion } from "../../services/adminPublicidadService";

/**
 * Las plazas fijas de una pieza, en la ficha de la pieza: una casilla por hueco que
 * admite su formato, con cuántas plazas quedan en las fechas de la campaña y quién las
 * tiene. El mapa hace lo mismo con dibujo; esto es la versión de lista para corregir
 * una pieza ya guardada sin salir de su ficha.
 */
export const PlazasFijas = ({ formato, campana, valor, onChange, deshabilitado }) => {
  const [ocupacion, setOcupacion] = useState(null);
  const huecos = Object.keys(FORMATO_DEL_HUECO).filter((e) => FORMATO_DEL_HUECO[e] === formato);
  const desde = campana?.desde ?? null;
  const hasta = campana?.hasta ?? null;

  useEffect(() => {
    let vivo = true;
    getOcupacion({ desde, hasta })
      .then((o) => vivo && setOcupacion(o))
      .catch(() => vivo && setOcupacion({}));
    return () => {
      vivo = false;
    };
  }, [desde, hasta]);

  if (!huecos.length) return null;
  const elegidos = valor ?? [];
  const alternar = (espacio) =>
    onChange(elegidos.includes(espacio) ? elegidos.filter((e) => e !== espacio) : [...elegidos, espacio]);

  return (
    <fieldset className="se-plazas">
      <legend className="se-form-label">Plaza fija</legend>
      <p className="se-admin-meta-hint" style={{ marginTop: 0 }}>
        Una plaza fija es una de las tres de ese hueco, durante las fechas de la campaña: la
        pieza sale ahí siempre, y la escalera llena las otras dos. Sin plaza fija, la pieza
        va solo por la escalera.
        {!hasta ? " Para fijar una plaza, la campaña necesita fecha de fin." : ""}
      </p>
      <ul className="se-plazas__lista">
        {huecos.map((espacio) => {
          const o = ocupacion?.[espacio];
          const elegido = elegidos.includes(espacio);
          const libres = o ? o.libres : null;
          const lleno = !elegido && libres === 0;
          const quienes = (o?.fijas ?? []).map((f) => `${f.anunciante} hasta ${f.hasta ?? "sin fin"}`).join(", ");
          return (
            <li key={espacio} className={`se-plazas__item${elegido ? " is-elegido" : ""}${lleno ? " is-lleno" : ""}`}>
              <label>
                <input
                  type="checkbox"
                  checked={elegido}
                  disabled={deshabilitado || lleno || !hasta}
                  onChange={() => alternar(espacio)}
                />
                <span className="se-plazas__nombre">{NOMBRE_DEL_HUECO[espacio] ?? espacio}</span>
                <span className="se-plazas__estado">
                  {o == null
                    ? "…"
                    : lleno
                      ? `Lleno${o.libre_desde ? ` hasta el ${o.libre_desde}` : ""}`
                      : `${libres} de ${o.plazas} libres`}
                </span>
              </label>
              {quienes ? <small className="se-plazas__quienes">{quienes}</small> : null}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
};

PlazasFijas.propTypes = {
  formato: PropTypes.string.isRequired,
  campana: PropTypes.object,
  valor: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  deshabilitado: PropTypes.bool,
};

export default PlazasFijas;
