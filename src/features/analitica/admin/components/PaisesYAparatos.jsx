import PropTypes from "prop-types";
import { NOMBRE_APARATO, numero, porciento } from "../../../lib/audiencia";
import { ancla } from "../../../lib/guias/guiaAudiencia";
import { Barras, Bloque, Tabla } from "./Piezas";

const DESDE_NOVIEMBRE = "Este dato se guarda desde noviembre de 2026. Las visitas anteriores no lo traen.";

/**
 * Desde qué país se lee y con qué aparato. Dos bloques, uno al lado del otro.
 *
 * Ninguno de los dos sale de la conexión del lector: la dirección de internet no se
 * guarda. El **país** se deduce de la zona horaria que marca su aparato
 * (`analitica_origen.pais_de`) -- un venezolano en Madrid cuenta como España, y eso se
 * dice en el apunte para que nadie lea el dato como otra cosa --, y el **aparato** es
 * una de tres palabras que manda el propio navegador (`lib/llegada.js`).
 *
 * Los porcentajes son sobre las visitas que traen el dato.
 */
export const PaisesYAparatos = ({ paises, dispositivos }) => {
  const lista = paises?.lista ?? [];
  const aparatos = dispositivos ?? [];
  const nombreDe = (a) => NOMBRE_APARATO[a.dispositivo] ?? a.dispositivo;

  return (
    <div className="se-aud__par" {...ancla("paises")}>
      <Bloque
        titulo="Desde qué país"
        apunte="Por la hora que marca el aparato del lector, no por su conexión: un venezolano en Madrid cuenta como España."
        vacio={!lista.length}
        sinDatos={DESDE_NOVIEMBRE}
        tabla={
          <Tabla
            columnas={["País", "Visitas", "% de las visitas"]}
            filas={lista.map((p) => [p.nombre || p.codigo, numero(p.sesiones), porciento(p.porcentaje) ?? "—"])}
          />
        }
      >
        <Barras
          datos={lista.map((p) => ({
            clave: p.codigo,
            etiqueta: p.nombre || p.codigo,
            valor: p.sesiones,
            apunte: porciento(p.porcentaje) ?? undefined,
          }))}
        />
      </Bloque>

      <Bloque
        titulo="Con qué leen"
        apunte="El aparato de cada visita: móvil, tableta o computadora."
        vacio={!aparatos.length}
        sinDatos={DESDE_NOVIEMBRE}
        tabla={
          <Tabla
            columnas={["Aparato", "Visitas", "% de las visitas"]}
            filas={aparatos.map((a) => [nombreDe(a), numero(a.sesiones), porciento(a.porcentaje) ?? "—"])}
          />
        }
      >
        <Barras
          datos={aparatos.map((a) => ({
            clave: a.dispositivo,
            etiqueta: nombreDe(a),
            valor: a.sesiones,
            apunte: porciento(a.porcentaje) ?? undefined,
          }))}
        />
      </Bloque>
    </div>
  );
};

PaisesYAparatos.propTypes = {
  paises: PropTypes.shape({ lista: PropTypes.array }),
  dispositivos: PropTypes.array,
};
