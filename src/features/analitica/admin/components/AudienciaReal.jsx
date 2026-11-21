import PropTypes from "prop-types";
import { numero, porciento, rangoCorto, tramo } from "../../../lib/audiencia";
import { Bloque, Ficha, Tabla } from "./Piezas";

/**
 * Cuántas visitas hay de verdad, contando a quien no se mide.
 *
 * El resto de la pantalla sale de quien aceptó las cookies. Esto responde a la pregunta
 * que ese resto deja abierta -- «¿y cuántos son en total?» -- con el contador de páginas,
 * que suma también las de quien dijo que no o no ha contestado, sin guardar nada de la
 * persona (`analitica_calculos.audiencia_real`).
 *
 * Va como **rango** y no como cifra porque sale de dos supuestos opuestos, y ninguno es
 * verdad del todo. Una sola cifra con ese origen sería una precisión inventada.
 *
 * `datos` llega vacío mientras el contador no tenga días en el periodo: existe desde
 * noviembre de 2026 y no hay forma de reconstruir lo anterior.
 */
export const AudienciaReal = ({ datos }) => {
  const d = datos;
  const dias = d ? `${d.dias} ${d.dias === 1 ? "día" : "días"}` : "";
  return (
    <Bloque
      titulo="Audiencia real estimada"
      apunte="Las visitas contando también a quien no aceptó las cookies. Es una estimación, y por eso va con un mínimo y un máximo."
      parada="real"
      vacio={!d}
      sinDatos="Todavía no hay con qué calcularla. El contador de páginas funciona desde noviembre de 2026 y aún no tiene datos en este periodo."
      tabla={
        d ? (
          <Tabla
            columnas={["Dato", "Valor"]}
            filas={[
              ["Días contados", `${tramo(d.desde, d.hasta)} (${dias})`],
              ["Visitas en total, mínimo", numero(d.minimo)],
              ["Visitas en total, máximo", numero(d.maximo)],
              ["Visitas medidas", numero(d.medidas)],
              ["Páginas vistas que se miden", numero(d.paginas_medidas)],
              ["Páginas vistas sin medir", numero(d.paginas_sin_medir)],
              ["De cada cien páginas, se miden", porciento(d.cobertura) ?? "—"],
            ]}
          />
        ) : null
      }
    >
      {d ? (
        <>
          <div className="se-aud__fichas">
            <Ficha
              valor={rangoCorto(d.minimo, d.maximo)}
              etiqueta="visitas en total"
              nota={`${tramo(d.desde, d.hasta)} · ${dias}`}
            />
            <Ficha
              valor={numero(d.medidas)}
              etiqueta="de ellas, medidas"
              nota="las de quien aceptó las cookies"
            />
            <Ficha
              valor={porciento(d.cobertura)}
              etiqueta="de las páginas se miden"
              nota={`${numero(d.paginas_medidas)} medidas · ${numero(d.paginas_sin_medir)} sin medir`}
            />
          </div>

          {typeof d.cobertura === "number" ? (
            <span
              className="se-aud__cobertura"
              role="img"
              aria-label={`Se miden ${d.cobertura} de cada 100 páginas vistas`}
            >
              <span style={{ width: `${Math.min(100, Math.max(0, d.cobertura))}%` }} />
            </span>
          ) : null}

          <p className="se-aud__nota">
            El mínimo supone que quien no se mide ve tantas páginas por visita como quien sí; el
            máximo, que cada vez que se abre el sitio es una visita distinta. La cifra real está
            entre los dos.
            {d.provisional
              ? " Es provisional: el contador se estrenó ese día y todavía no lleva uno completo."
              : ""}
          </p>
        </>
      ) : null}
    </Bloque>
  );
};

AudienciaReal.propTypes = {
  // `null` mientras el contador de páginas no tenga días en el periodo.
  datos: PropTypes.object,
};
