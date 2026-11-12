import PropTypes from "prop-types";
import { numero, porciento, tramo } from "../../../lib/audiencia";
import { Barras, Bloque, Tabla } from "./Piezas";

/**
 * De quienes vinieron una semana, cuántos volvieron la siguiente.
 *
 * Es la medida de si el sitio crea costumbre, y la que la ficha «volvieron» de arriba no
 * da: esa cuenta a quien entró dos veces en el periodo, aunque fuera la misma tarde.
 *
 * Las barras van sobre **cien**, no sobre la mayor: son porcentajes, y un 18 % dibujado
 * a todo lo ancho porque es el mejor de la lista se leería como un lleno.
 *
 * La última semana puede tener la siguiente a medias: se enseña, marcada, y no entra
 * en la cifra de arriba, que solo cuenta semanas ya cerradas (`analitica_calculos`).
 */
export const CuantosVuelven = ({ retorno }) => {
  const semanas = retorno?.semanas ?? [];
  const total = porciento(retorno?.porcentaje);

  return (
    <Bloque
      titulo="Cuántos vuelven"
      apunte="De quienes vinieron una semana, cuántos volvieron la siguiente. Son las últimas semanas, sea cual sea el periodo elegido arriba."
      parada="vuelven"
      vacio={!semanas.length}
      sinDatos="Hace falta al menos una semana completa de medición."
      tabla={
        <Tabla
          columnas={["Semana", "Lectores", "Volvieron a la siguiente", "%"]}
          filas={semanas.map((s) => [
            `${tramo(s.desde, s.hasta)}${s.en_curso ? " (la siguiente, en curso)" : ""}`,
            numero(s.personas),
            numero(s.volvieron),
            porciento(s.porcentaje) ?? "—",
          ])}
        />
      }
    >
      {total ? (
        <p className="se-aud__destacado">
          <strong>{total}</strong>
          <span>
            volvió a la semana siguiente · {numero(retorno.volvieron)} de {numero(retorno.personas)}{" "}
            lectores, en las semanas ya cerradas
          </span>
        </p>
      ) : null}

      <Barras
        tope={100}
        datos={semanas.map((s) => ({
          clave: s.desde,
          etiqueta: tramo(s.desde, s.hasta),
          valor: s.porcentaje ?? 0,
          texto: porciento(s.porcentaje) ?? "—",
          apunte: `${numero(s.volvieron)} de ${numero(s.personas)}${
            s.en_curso ? " · semana siguiente en curso" : ""
          }`,
        }))}
      />

      <p className="se-aud__nota">
        Sale por debajo de la realidad: quien borra las cookies o cambia de aparato vuelve como si
        fuera nuevo.
      </p>
    </Bloque>
  );
};

CuantosVuelven.propTypes = {
  retorno: PropTypes.shape({
    semanas: PropTypes.array,
    personas: PropTypes.number,
    volvieron: PropTypes.number,
    porcentaje: PropTypes.number,
  }),
};
