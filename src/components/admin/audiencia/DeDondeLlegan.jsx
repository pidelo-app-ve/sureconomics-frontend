import PropTypes from "prop-types";
import {
  canalesConAltas,
  nombreDeCanal,
  nombreDeFuente,
  numero,
  porciento,
} from "../../../lib/audiencia";
import { Barras, Bloque, Tabla } from "./Piezas";

const altasEnPalabras = (n) => (n === 1 ? "1 alta al boletín" : `${numero(n)} altas al boletín`);
const visitasEnPalabras = (n) => (n === 1 ? "1 visita" : `${numero(n)} visitas`);

/**
 * Por dónde entró cada visita, y cuántas altas al boletín dejó cada canal.
 *
 * Dos listas: los **canales** -- siete palabras fijas, las mismas del informe -- y,
 * debajo, los **sitios concretos** de donde más se llega. Del sitio de origen el
 * servidor solo guarda un nombre («google», «whatsapp») o su dominio; nunca lo que la
 * persona buscó ni la dirección completa (`analitica_origen.py`).
 *
 * Los porcentajes son sobre las visitas que traen el dato. Las anteriores a nov-2026
 * no lo traen y se dicen aparte: contarlas como «directo» sería inventarse por dónde
 * llegaron. Lo mismo con las altas al boletín de visitas sin origen guardado.
 */
export const DeDondeLlegan = ({ origen, boletin }) => {
  const { filas, altasSinDato } = canalesConAltas(origen?.canales, boletin?.por_canal);
  const fuentes = (origen?.fuentes ?? []).filter((f) => f.fuente);
  const sinDato = origen?.sin_dato ?? 0;
  const altas = boletin?.altas ?? 0;
  const medidas = boletin?.medidas ?? 0;

  return (
    <Bloque
      titulo="De dónde llegan"
      apunte="Por dónde entró cada visita y cuántas altas al boletín dejó cada canal. Del sitio anterior solo se guarda el nombre."
      parada="origen"
      vacio={!filas.length}
      sinDatos="Este dato se guarda desde noviembre de 2026. Las visitas anteriores no lo traen."
      tabla={
        <Tabla
          columnas={["Canal", "Visitas", "% de las visitas", "Altas al boletín"]}
          filas={filas.map((f) => [
            nombreDeCanal(f.canal),
            numero(f.sesiones),
            porciento(f.porcentaje) ?? "—",
            numero(f.altas),
          ])}
        />
      }
    >
      <Barras
        datos={filas.map((f) => ({
          clave: f.canal,
          etiqueta: nombreDeCanal(f.canal),
          valor: f.sesiones,
          apunte:
            [porciento(f.porcentaje), f.altas ? altasEnPalabras(f.altas) : null]
              .filter(Boolean)
              .join(" · ") || undefined,
        }))}
      />

      {fuentes.length ? (
        <>
          <h4 className="se-aud__subtitulo">Los sitios concretos</h4>
          <Barras
            datos={fuentes.map((f) => ({
              clave: `${f.canal}/${f.fuente}`,
              etiqueta: nombreDeFuente(f.fuente, f.canal),
              valor: f.sesiones,
              apunte: nombreDeCanal(f.canal),
            }))}
          />
        </>
      ) : null}

      {sinDato ? (
        <p className="se-aud__nota">
          {visitasEnPalabras(sinDato)} del periodo {sinDato === 1 ? "es anterior" : "son anteriores"} a
          que se guardara este dato y no {sinDato === 1 ? "entra" : "entran"} en el reparto.
        </p>
      ) : null}

      {altas || medidas ? (
        <p className="se-aud__nota">
          En el periodo hubo {altasEnPalabras(altas)}. Por canal se reparten las {numero(medidas)} que
          llegaron de visitas que se estaban midiendo
          {altasSinDato ? `; ${numero(altasSinDato)} de ellas, de visitas sin origen guardado` : ""}. Quien
          no aceptó las cookies se apunta igual, pero no se sabe por dónde llegó.
        </p>
      ) : null}
    </Bloque>
  );
};

DeDondeLlegan.propTypes = {
  origen: PropTypes.shape({
    sin_dato: PropTypes.number,
    canales: PropTypes.array,
    fuentes: PropTypes.array,
  }),
  boletin: PropTypes.shape({
    altas: PropTypes.number,
    medidas: PropTypes.number,
    por_canal: PropTypes.array,
  }),
};
