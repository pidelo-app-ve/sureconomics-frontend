import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { BRAND } from "../data/surEconomicsMock";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import { Enlace } from "../components/Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { getResumen } from "../services/resumenService";
import "../styles/resumen.css";

/**
 * «Lo importante de hoy»: el resumen de la mañana. Es la página a la que llevan los
 * mensajes de Telegram y WhatsApp («Todo con enlaces»).
 *
 * `/resumen` enseña el último publicado y `/resumen/<AAAA-MM-DD>` el de ese día. Cada
 * punto enlaza a su pieza o a su titular de «Última hora», dentro del sitio y en el
 * idioma de la página; los titulares llevan su fuente. Todo se pinta como texto.
 */

/** La dirección del backend es absoluta; dentro del sitio se navega con la ruta. */
const rutaInterna = (url) => {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.hash}`;
  } catch {
    return url;
  }
};

const fechaLarga = (fecha, lang) =>
  new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-VE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${fecha}T12:00:00Z`));

const variacion = (v, lang) => {
  if (typeof v !== "number" || Math.abs(v) < 0.005) return "";
  const n = new Intl.NumberFormat(lang === "en" ? "en-US" : "es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Math.abs(v));
  return ` (${v > 0 ? "+" : "−"}${n} %)`;
};

const Punto = ({ punto, lang }) => (
  <li className="se-res-punto">
    <Enlace to={rutaInterna(punto.url)} className="se-res-punto__enlace">
      {lang === "en" ? punto.linea_en || punto.linea : punto.linea}
    </Enlace>
    {punto.fuente ? <span className="se-res-punto__fuente"> · {punto.fuente}</span> : null}
  </li>
);

Punto.propTypes = {
  punto: PropTypes.shape({
    url: PropTypes.string.isRequired,
    linea: PropTypes.string.isRequired,
    linea_en: PropTypes.string,
    fuente: PropTypes.string,
  }).isRequired,
  lang: PropTypes.string.isRequired,
};

export const Resumen = () => {
  const { t, lang } = useIdioma();
  const { fecha } = useParams();
  const [estado, setEstado] = useState({ status: "loading", datos: null, error: null });

  useMetaPagina({ title: t("resumen.meta", { marca: BRAND.name }), description: t("resumen.descripcion") });

  useEffect(() => {
    let vivo = true;
    setEstado({ status: "loading", datos: null, error: null });
    getResumen(fecha)
      .then((r) => vivo && setEstado({ status: "success", datos: r?.data ?? r, error: null }))
      .catch((error) => vivo && setEstado({ status: error?.status === 404 ? "vacio" : "error", datos: null, error }));
    return () => {
      vivo = false;
    };
  }, [fecha]);

  const { status, datos, error } = estado;
  const cifras = [...(datos?.cifras ?? []), ...(datos?.cifras_manuales ?? [])];

  return (
    <main className="se-section se-res" role="main">
      <div className="se-container se-res__caja">
        <p className="se-res__eyebrow">{t("resumen.eyebrow")}</p>
        <h1 className="se-res__titulo">{t("resumen.titulo")}</h1>
        {datos ? <p className="se-res__fecha">{fechaLarga(datos.fecha, lang)}</p> : null}

        {status === "loading" ? <LoadingState title={t("resumen.cargando")} /> : null}
        {status === "error" ? (
          <ErrorState title={t("resumen.error")} error={error} onRetry={() => window.location.reload()} />
        ) : null}
        {status === "vacio" ? (
          <>
            <EmptyState title={t("resumen.vacioTitulo")} description={fecha ? t("resumen.noEseDia") : t("resumen.vacio")} />
            {fecha ? (
              <p className="se-res__nota">
                <Enlace to="/resumen">{t("resumen.ultimo")}</Enlace>
              </p>
            ) : null}
          </>
        ) : null}

        {datos ? (
          <>
            {datos.secciones.map((s) => (
              <section key={s.clave} className="se-res-seccion" aria-labelledby={`res-${s.clave}`}>
                <h2 id={`res-${s.clave}`} className="se-res-seccion__titulo">{t(`resumen.secciones.${s.clave}`)}</h2>
                <ul className="se-res-lista">
                  {s.puntos.map((p) => (
                    <Punto key={p.url} punto={p} lang={lang} />
                  ))}
                </ul>
              </section>
            ))}

            {cifras.length || datos.monedas?.length ? (
              <section className="se-res-seccion se-res-cifras" aria-labelledby="res-cifras">
                <h2 id="res-cifras" className="se-res-seccion__titulo">{t("resumen.cifras")}</h2>
                <dl className="se-res-cifras__lista">
                  {cifras.map((c) => (
                    <div key={c.etiqueta} className="se-res-cifra">
                      <dt>{c.etiqueta}</dt>
                      <dd>
                        {c.valor}
                        <span className="se-res-cifra__var">{variacion(c.variacion, lang)}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
                {datos.monedas?.length ? (
                  <p className="se-res-monedas">
                    <strong>{t("resumen.porDolar")}:</strong>{" "}
                    {datos.monedas.map((m) => `${m.etiqueta} ${m.valor}${variacion(m.variacion, lang)}`).join(" · ")}
                  </p>
                ) : null}
              </section>
            ) : null}

            {datos.lvbp?.length ? (
              <section className="se-res-seccion" aria-labelledby="res-lvbp">
                <h2 id="res-lvbp" className="se-res-seccion__titulo">{t("resumen.lvbp")}</h2>
                <ul className="se-res-lista se-res-lista--juegos">
                  {datos.lvbp.map((j) => (
                    <li key={j}>{j}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {datos.frase ? (
              <figure className="se-res-frase">
                <figcaption>{t("resumen.frase")}</figcaption>
                <blockquote>{datos.frase}</blockquote>
              </figure>
            ) : null}

            <p className="se-res__nota">{t("resumen.sale")}</p>
          </>
        ) : null}
      </div>
    </main>
  );
};
