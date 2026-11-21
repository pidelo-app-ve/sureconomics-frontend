import PropTypes from "prop-types";
import { useState } from "react";
import { leerComparacion, numero } from "../../../lib/audiencia";
import { enlaceWeb } from "../../../lib/enlaces";
import { ancla } from "../../../lib/guias/guiaAudiencia";

/**
 * Las piezas con que se arma la pantalla de audiencia: la ficha de una cifra, el bloque
 * con su gráfico y su tabla, las columnas y las barras.
 *
 * Vivían dentro de `pages/admin/AdminAnalitica.jsx`. Salieron de ahí cuando la pantalla
 * ganó bloques nuevos (`components/admin/audiencia/`), que usan las mismas: así todos
 * los bloques se dibujan igual y la página no carga con todo.
 */

/**
 * La variación contra el periodo anterior, y si es de fiar.
 *
 * Con `comparacion` -- lo que calcula el servidor: el cambio de la media por día y
 * cuánto se mueve el tráfico solo, de unos días a otros -- se escribe el cambio y,
 * debajo, si es un cambio de verdad o puede ser casualidad. El color solo aparece
 * cuando el cambio se sale de ese vaivén, y va siempre con su signo escrito, que es lo
 * que lo hace legible sin distinguir colores.
 *
 * Sin ella (un servidor más viejo que la pantalla, o un periodo anterior vacío) queda
 * la resta de los dos totales, como antes.
 */
export const Variacion = ({ actual, anterior, comparacion }) => {
  const leida = leerComparacion(comparacion);
  if (leida?.cambio) {
    return (
      <>
        <span className={`se-aud__delta se-aud__delta--${leida.clase}`}>{leida.cambio}</span>
        <span className="se-aud__delta se-aud__veredicto">{leida.veredicto}</span>
      </>
    );
  }
  if (!anterior) {
    return <span className="se-aud__delta se-aud__delta--nuevo">sin periodo anterior</span>;
  }
  const pct = Math.round(((actual - anterior) / anterior) * 100);
  const signo = pct > 0 ? "+" : "";
  // Si el servidor dice que aún no hay días para saberlo, la cifra va sin color: pintarla
  // de verde sería afirmar lo que la línea de debajo niega.
  const clase = leida ? "igual" : pct > 0 ? "sube" : pct < 0 ? "baja" : "igual";
  return (
    <>
      <span className={`se-aud__delta se-aud__delta--${clase}`}>
        {signo}
        {pct} % vs. periodo anterior
      </span>
      {leida ? <span className="se-aud__delta se-aud__veredicto">{leida.veredicto}</span> : null}
    </>
  );
};

Variacion.propTypes = {
  actual: PropTypes.number.isRequired,
  anterior: PropTypes.number,
  comparacion: PropTypes.object,
};

/**
 * `valor` puede llegar vacío cuando el servidor es más viejo que esta pantalla -- se
 * despliegan por separado. Entonces se dibuja una raya: «no lo sé» es una respuesta;
 * «undefined %» es un fallo escrito en la cara del lector.
 */
export const Ficha = ({ valor, etiqueta, nota, children }) => (
  <div className="se-aud__ficha">
    <span className="se-aud__ficha-valor">
      {valor === null || valor === undefined || valor === "" ? "—" : valor}
    </span>
    <span className="se-aud__ficha-etiqueta">{etiqueta}</span>
    {children}
    {nota ? <span className="se-aud__ficha-nota">{nota}</span> : null}
  </div>
);

Ficha.propTypes = {
  // Sin `isRequired`: `null` es un valor legitimo aqui -- significa "el servidor no
  // manda ese dato" -- y se dibuja como una raya.
  valor: PropTypes.node,
  etiqueta: PropTypes.string.isRequired,
  nota: PropTypes.string,
  children: PropTypes.node,
};

/**
 * Una tarjeta con su gráfico y su tabla.
 *
 * La tabla no es un extra de accesibilidad colgado al final: es la misma información sin
 * depender de la vista ni del ratón, y por eso el botón está donde se ve.
 *
 * `parada` es la clave del paso de la guía que ilumina este bloque, y `sinDatos` lo que
 * se dice cuando está vacío si «sin datos en el periodo» no es toda la verdad -- un
 * dato que solo existe desde cierta fecha, o que necesita unos días para calcularse.
 */
export const Bloque = ({ titulo, apunte, tabla, children, vacio, sinDatos, parada }) => {
  const [verTabla, setVerTabla] = useState(false);
  const id = `aud-${titulo.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section className="se-aud__bloque" aria-labelledby={id} {...ancla(parada)}>
      <div className="se-aud__bloque-cabeza">
        <div>
          <h3 id={id} className="se-aud__h3">
            {titulo}
          </h3>
          {apunte ? <p className="se-aud__apunte">{apunte}</p> : null}
        </div>
        {tabla ? (
          <button
            type="button"
            className="se-aud__ver-tabla"
            aria-pressed={verTabla}
            onClick={() => setVerTabla((v) => !v)}
          >
            {verTabla ? "Gráfico" : "Tabla"}
          </button>
        ) : null}
      </div>
      {vacio ? (
        <p className="se-admin-meta-hint">{sinDatos || "Sin datos en el periodo."}</p>
      ) : verTabla ? (
        <div className="se-aud__tabla-caja">{tabla}</div>
      ) : (
        children
      )}
    </section>
  );
};

Bloque.propTypes = {
  titulo: PropTypes.string.isRequired,
  apunte: PropTypes.string,
  tabla: PropTypes.node,
  children: PropTypes.node,
  vacio: PropTypes.bool,
  sinDatos: PropTypes.string,
  parada: PropTypes.string,
};

/**
 * Columnas verticales. `rampa` solo cuando las categorías tienen orden natural: pintar
 * más oscuro lo más grande en categorías sin orden repite con el color lo que ya dice la
 * altura, y gasta el único canal libre que quedaba.
 */
export const Columnas = ({ datos, rampa, formatoEtiqueta }) => {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <ul className={`se-aud__columnas${rampa ? " se-aud__columnas--rampa" : ""}`}>
      {datos.map((d, i) => (
        <li key={d.etiqueta} className="se-aud__columna" title={`${d.etiqueta}: ${numero(d.valor)}`}>
          <span className="se-aud__columna-caja">
            <span
              className="se-aud__columna-marca"
              data-paso={rampa ? i : undefined}
              style={{ height: `${Math.max(d.valor > 0 ? 2 : 0, (d.valor / max) * 100)}%` }}
            />
          </span>
          <span className="se-aud__columna-pie">
            {formatoEtiqueta ? formatoEtiqueta(d.etiqueta, i) : d.etiqueta}
          </span>
        </li>
      ))}
    </ul>
  );
};

Columnas.propTypes = {
  datos: PropTypes.arrayOf(PropTypes.object).isRequired,
  rampa: PropTypes.bool,
  formatoEtiqueta: PropTypes.func,
};

/**
 * Barras horizontales, una por fila: etiqueta, barra y cifra.
 *
 * `tope` fija el largo de la barra entera; sin él, la más larga es la del valor mayor.
 * Hace falta cuando los valores son porcentajes: un 18 % dibujado a todo lo ancho
 * porque es el mayor de la lista se lee como un 100 %. Y `texto`, en una fila, es lo
 * que se escribe en lugar de la cifra («18 %»).
 */
export const Barras = ({ datos, enlazar, tope }) => {
  const max = tope || Math.max(1, ...datos.map((d) => d.valor));
  return (
    <ul className="se-aud__barras">
      {datos.map((d) => (
        <li key={d.clave} className="se-aud__fila">
          {enlazar ? (
            <a
              className="se-aud__etiqueta se-aud__etiqueta--enlace"
              // La ruta la manda el navegador de cualquier visitante: solo rutas del sitio.
              href={enlaceWeb(d.clave) || undefined}
              target="_blank"
              rel="noreferrer"
              title={d.clave}
            >
              {d.etiqueta}
            </a>
          ) : (
            <span className="se-aud__etiqueta" title={d.etiqueta}>
              {d.etiqueta}
            </span>
          )}
          <span className="se-aud__pista">
            <span
              className="se-aud__marca"
              style={{ width: `${Math.max(2, (d.valor / max) * 100)}%` }}
            />
          </span>
          <span className="se-aud__valor">
            {d.texto ?? numero(d.valor)}
            {d.apunte ? <small> · {d.apunte}</small> : null}
          </span>
        </li>
      ))}
    </ul>
  );
};

Barras.propTypes = {
  datos: PropTypes.arrayOf(PropTypes.object).isRequired,
  enlazar: PropTypes.bool,
  tope: PropTypes.number,
};

export const Tabla = ({ columnas, filas }) => (
  <table className="se-aud__tabla">
    <thead>
      <tr>
        {columnas.map((c) => (
          <th key={c} scope="col">
            {c}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {filas.map((f, i) => (
        <tr key={i}>
          {f.map((celda, j) => (
            <td key={j}>{celda}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

Tabla.propTypes = {
  columnas: PropTypes.arrayOf(PropTypes.string).isRequired,
  filas: PropTypes.array.isRequired,
};
