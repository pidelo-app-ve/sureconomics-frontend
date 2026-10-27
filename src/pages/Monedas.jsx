import { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { BRAND } from "../data/surEconomicsMock";
import { formatearFecha } from "../i18n/motor";
import { porDolar } from "../lib/monedas";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { getMonedas } from "../services/monedasService";
import { useHistoriaMoneda } from "../hooks/useMonedas";
import { GraficaDeMoneda } from "../components/monedas/GraficaDeMoneda";
import { Flecha, variacionTexto } from "../components/monedas/FichaDeMoneda";
import "./monedas.css";

/**
 * `/monedas`: cuánto vale un dólar en cada moneda de la región, según su banco central.
 *
 * Una tabla y nada más: el valor, la variación contra el día anterior, la fuente y la
 * fecha del dato. Las cifras son las que guarda el recolector cada hora
 * (`monedas_service.py`); la misma regla del cintillo manda aquí: un dato viejo se
 * enseña como «sin dato reciente», nunca como una cifra con fecha de hoy.
 *
 * Cada fila se abre con la gráfica de sus últimos 30 días (`GraficaDeMoneda`): el
 * nombre de la moneda es el botón. Las de paridad fija no tienen gráfica.
 */

/** La fila desplegada bajo una moneda: pide su historia al abrirse. */
const FilaGrafica = ({ codigo }) => {
  const { t } = useIdioma();
  const puntos = useHistoriaMoneda(codigo);
  return (
    <tr className="se-monedas__grafica">
      <td colSpan={5}>
        {puntos === null ? <p className="se-monedas__nota">{t("monedas.grafica.cargando")}</p> : <GraficaDeMoneda codigo={codigo} puntos={puntos} />}
      </td>
    </tr>
  );
};

FilaGrafica.propTypes = { codigo: PropTypes.string.isRequired };


export const Monedas = () => {
  const { t, lang } = useIdioma();
  const [state, setState] = useState({ status: "loading", datos: null });
  const [abierta, setAbierta] = useState(null);

  useMetaPagina({
    title: t("monedas.meta.titulo", { marca: BRAND.name }),
    description: t("monedas.meta.descripcion"),
  });

  useEffect(() => {
    let vivo = true;
    getMonedas()
      .then((datos) => vivo && setState({ status: "success", datos }))
      .catch(() => vivo && setState({ status: "error", datos: null }));
    return () => {
      vivo = false;
    };
  }, []);

  const monedas = state.datos?.monedas ?? [];
  const actualizado = state.datos?.actualizado ? new Date(state.datos.actualizado) : null;

  return (
    <main className="se-blog se-monedas">
      <section className="se-section">
        <div className="se-container">
          <header className="se-monedas__cabeza">
            <h1 className="se-monedas__titulo">{t("monedas.titulo")}</h1>
            <p className="se-monedas__entrada">{t("monedas.entrada")}</p>
          </header>

          {state.status === "error" ? <p className="se-monedas__nota">{t("monedas.error")}</p> : null}

          {monedas.length ? (
            <div className="se-monedas__caja">
              <table className="se-monedas__tabla">
                <thead>
                  <tr>
                    <th scope="col" className="se-monedas__col-moneda">{t("monedas.columnas.moneda")}</th>
                    <th scope="col">{t("monedas.columnas.porDolar")}</th>
                    <th scope="col">{t("monedas.columnas.variacion")}</th>
                    <th scope="col" className="se-monedas__col-fuente">{t("monedas.columnas.fuente")}</th>
                    <th scope="col">{t("monedas.columnas.fecha")}</th>
                  </tr>
                </thead>
                <tbody>
                  {monedas.map((m) => {
                    const sinDato = m.valor === null || m.vieja;
                    const conGrafica = !m.fija && !sinDato;
                    const estaAbierta = abierta === m.codigo;
                    const nombre = t(`monedas.nombres.${m.codigo}`);
                    const clases = [sinDato ? "se-monedas__fila--sin-dato" : "", estaAbierta ? "se-monedas__fila--abierta" : ""].filter(Boolean).join(" ");
                    return (
                      <Fragment key={m.codigo}>
                      <tr className={clases || undefined}>
                        <th scope="row" className="se-monedas__col-moneda">
                          {conGrafica ? (
                            <button
                              type="button"
                              className="se-monedas__abrir"
                              aria-expanded={estaAbierta}
                              aria-label={estaAbierta ? t("monedas.grafica.cerrar", { nombre }) : t("monedas.grafica.abrir", { nombre })}
                              onClick={() => setAbierta(estaAbierta ? null : m.codigo)}
                            >
                              <span className="se-monedas__codigo">{m.codigo}</span>
                              <span className="se-monedas__nombre">
                                {nombre}
                                <span className="se-monedas__pais"> · {t(`monedas.paises.${m.codigo}`)}</span>
                              </span>
                              <svg className="se-monedas__flecha" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          ) : (
                            <>
                              <span className="se-monedas__codigo">{m.codigo}</span>
                              <span className="se-monedas__nombre">
                                {nombre}
                                <span className="se-monedas__pais"> · {t(`monedas.paises.${m.codigo}`)}</span>
                              </span>
                            </>
                          )}
                        </th>
                        <td className="se-monedas__valor">
                          {m.valor !== null && !m.vieja ? porDolar(m.valor, lang) : <span className="se-monedas__sin">{t("monedas.sinDato")}</span>}
                        </td>
                        <td className={`se-monedas__var se-monedas__var--${m.direccion}`}>
                          {m.fija ? (
                            <span className="se-monedas__fija">{t("monedas.fija")}</span>
                          ) : typeof m.variacion === "number" && !sinDato ? (
                            <>
                              <Flecha direccion={m.direccion} /> {variacionTexto(m, lang)}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="se-monedas__col-fuente">{m.fuente ?? "—"}</td>
                        <td className="se-monedas__fecha">
                          {m.fecha_valor ? formatearFecha(m.fecha_valor, "diaMes") : "—"}
                          {m.vieja && m.fecha_valor ? (
                            <span className="se-visually-hidden"> {t("monedas.vieja", { fecha: formatearFecha(m.fecha_valor, "diaMes") })}</span>
                          ) : null}
                        </td>
                      </tr>
                      {estaAbierta ? <FilaGrafica codigo={m.codigo} /> : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {actualizado ? (
            <p className="se-monedas__nota">
              {t("monedas.actualizado", {
                fecha: formatearFecha(actualizado.toISOString().slice(0, 10), "diaMes"),
                hora: actualizado.toLocaleTimeString(lang === "en" ? "en-US" : "es-VE", { hour: "numeric", minute: "2-digit", timeZone: "America/Caracas" }),
              })}
            </p>
          ) : null}
          <p className="se-monedas__nota">{t("monedas.nota")}</p>
          <p className="se-monedas__nota se-monedas__nota--aviso">{t("monedas.aviso")}</p>
        </div>
      </section>
    </main>
  );
};

export default Monedas;
