import { useEffect, useState } from "react";
import { BRAND } from "../data/surEconomicsMock";
import { formatearFecha, formatearNumero } from "../i18n/motor";
import { porDolar } from "../lib/monedas";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { getMonedas } from "../services/monedasService";
import "./monedas.css";

/**
 * `/monedas`: cuánto vale un dólar en cada moneda de la región, según su banco central.
 *
 * Una tabla y nada más: el valor, la variación contra el día anterior, la fuente y la
 * fecha del dato. Las cifras son las que guarda el recolector cada hora
 * (`monedas_service.py`); la misma regla del cintillo manda aquí: un dato viejo se
 * enseña como «sin dato reciente», nunca como una cifra con fecha de hoy.
 */


export const Monedas = () => {
  const { t, lang } = useIdioma();
  const [state, setState] = useState({ status: "loading", datos: null });

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
                    return (
                      <tr key={m.codigo} className={sinDato ? "se-monedas__fila--sin-dato" : undefined}>
                        <th scope="row" className="se-monedas__col-moneda">
                          <span className="se-monedas__codigo">{m.codigo}</span>
                          <span className="se-monedas__nombre">
                            {t(`monedas.nombres.${m.codigo}`)}
                            <span className="se-monedas__pais"> · {t(`monedas.paises.${m.codigo}`)}</span>
                          </span>
                        </th>
                        <td className="se-monedas__valor">
                          {m.valor !== null && !m.vieja ? porDolar(m.valor, lang) : <span className="se-monedas__sin">{t("monedas.sinDato")}</span>}
                        </td>
                        <td className={`se-monedas__var se-monedas__var--${m.direccion}`}>
                          {m.fija ? (
                            <span className="se-monedas__fija">{t("monedas.fija")}</span>
                          ) : typeof m.variacion === "number" && !sinDato ? (
                            `${m.variacion > 0 ? "+" : ""}${formatearNumero(m.variacion, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
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
