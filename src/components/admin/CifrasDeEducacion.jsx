import PropTypes from "prop-types";

/**
 * Ingresos, ventas y el embudo de cada módulo.
 *
 * ## La cifra que importa no es «vendidos»
 *
 * El panel decía «1 vendido» y nada más. Eso es el final de la historia y no explica
 * nada: si nadie compra, con esa cifra sola no se puede distinguir «no llega gente» de
 * «llega y la clase de entrada no convence» — dos problemas opuestos, con dos
 * soluciones opuestas. El embudo de abajo es lo que los separa.
 *
 * ## Aperturas no son personas, y se dice
 *
 * El contador de aperturas es agregado y no guarda identificador de nadie, que es lo
 * que permite contar a todo el mundo sin pedir consentimiento. El precio de esa
 * decisión es que quien abre la misma clase tres veces suma tres, así que la cifra se
 * rotula «aperturas» y el porcentaje se presenta como orientación, no como una tasa de
 * conversión de manual. Rotularlo como «personas» sería cómodo y sería mentira.
 */

const dinero = (centavos, moneda) => {
  const valor = (Number(centavos) || 0) / 100;
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency: moneda || "USD",
      minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(valor);
  } catch {
    return `${valor} ${moneda || ""}`.trim();
  }
};

export const CifrasDeEducacion = ({ resumen }) => {
  const conMovimiento = (resumen.por_modulo ?? []).filter(
    (m) => m.ventas > 0 || m.aperturas_de_entrada > 0,
  );

  return (
    <section className="se-edunum" aria-label="Cifras de Educación">
      <div className="se-edunum__cifras">
        <div className="se-edunum__cifra">
          <span className="se-edunum__n">
            {dinero(resumen.ingresos_centavos, resumen.moneda)}
          </span>
          <span className="se-edunum__t">ingresos · {resumen.dias} días</span>
        </div>
        <div className="se-edunum__cifra">
          <span className="se-edunum__n">{(resumen.ventas ?? 0).toLocaleString("es")}</span>
          <span className="se-edunum__t">
            {resumen.ventas === 1 ? "módulo vendido" : "módulos vendidos"}
          </span>
        </div>
        <div className="se-edunum__cifra">
          <span className="se-edunum__n">{(resumen.aperturas ?? 0).toLocaleString("es")}</span>
          <span className="se-edunum__t">clases abiertas</span>
        </div>
      </div>

      {conMovimiento.length ? (
        <>
          <h2 className="se-edunum__h2">
            De la clase gratis a la compra
            <span className="se-edunum__nota">
              Aperturas, no personas: quien abre dos veces suma dos.
            </span>
          </h2>
          <ul className="se-edunum__embudo">
            {conMovimiento.map((m) => {
              // La barra sólo tiene sentido con un denominador: sin aperturas no hay
              // proporción que dibujar, y una barra al 0 % se lee como un fracaso
              // medido cuando lo que pasa es que nadie ha entrado todavía.
              const ancho = m.aperturas_de_entrada
                ? Math.min(100, (m.ventas * 100) / m.aperturas_de_entrada)
                : 0;
              return (
                <li key={m.id} className="se-edunum__fila">
                  <span className="se-edunum__modulo">
                    {m.titulo}
                    {m.estado !== "publicado" ? (
                      <span className="se-edunum__borrador">borrador</span>
                    ) : null}
                  </span>

                  <span className="se-edunum__barra" aria-hidden="true">
                    <span className="se-edunum__barra-llena" style={{ width: `${ancho}%` }} />
                  </span>

                  <span className="se-edunum__detalle">
                    {m.aperturas_de_entrada} abrieron la entrada · {m.ventas}{" "}
                    {m.ventas === 1 ? "compra" : "compras"}
                    {m.convierte == null ? null : (
                      <strong> · {m.convierte} %</strong>
                    )}
                    {m.ingresos_centavos ? (
                      <span className="se-edunum__ingreso">
                        {dinero(m.ingresos_centavos, resumen.moneda)}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        /* El vacío se explica en vez de dejar tres ceros sin contexto: al principio
           todo módulo pasa por aquí, y no saber si está roto o si simplemente no ha
           entrado nadie es exactamente la duda que hay que quitar. */
        <p className="se-edunum__vacio">
          Todavía no hay movimiento. En cuanto alguien abra una clase, aquí aparecerá
          cuántos entran por la puerta gratis y cuántos acaban comprando — que es lo que
          dice si el módulo engancha o si sólo falta que llegue gente.
        </p>
      )}
    </section>
  );
};

CifrasDeEducacion.propTypes = {
  resumen: PropTypes.shape({
    dias: PropTypes.number,
    ingresos_centavos: PropTypes.number,
    ventas: PropTypes.number,
    aperturas: PropTypes.number,
    moneda: PropTypes.string,
    por_modulo: PropTypes.array,
  }).isRequired,
};

export default CifrasDeEducacion;
