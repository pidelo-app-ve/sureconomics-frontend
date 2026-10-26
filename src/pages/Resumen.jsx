import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { BRAND } from "../data/surEconomicsMock";
import { EmptyState, ErrorState, LoadingState } from "../components/content";
import { Enlace } from "../components/Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { getResumen } from "../services/resumenService";
import { lineaDelPunto, rutaInterna } from "../lib/resumen";
import "../styles/resumen.css";

/**
 * «Lo importante de esta mañana / tarde / noche»: las tres ediciones del resumen diario.
 * Es la página a la que llevan los mensajes de Telegram y WhatsApp («Todo con enlaces»).
 *
 * - `/resumen`: la última edición que salió.
 * - `/resumen/<AAAA-MM-DD>`: las de ese día, la más reciente arriba. Los enlaces de los
 *   primeros días, de cuando había una sola, llevan aquí.
 * - `/resumen/<AAAA-MM-DD>/<edicion>`: una edición.
 *
 * Cada punto enlaza a su pieza o a su titular de «Última hora», dentro del sitio y en el
 * idioma de la página; los titulares llevan su fuente. Todo se pinta como texto.
 */

const fechaLarga = (fecha, lang) =>
  new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-VE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${fecha}T12:00:00Z`));

/** La hora de salida, en la de Caracas: «7:00», «13:00». */
const horaDeSalida = (iso, lang) =>
  iso
    ? new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-VE", {
        hour: "numeric", minute: "2-digit", timeZone: "America/Caracas",
      }).format(new Date(iso))
    : "";

const variacion = (v, lang) => {
  if (typeof v !== "number" || Math.abs(v) < 0.005) return "";
  const n = new Intl.NumberFormat(lang === "en" ? "en-US" : "es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Math.abs(v));
  return ` (${v > 0 ? "+" : "−"}${n} %)`;
};

const Punto = ({ punto, lang }) => (
  <li className="se-res-punto">
    <Enlace to={rutaInterna(punto.url)} className="se-res-punto__enlace">
      {lineaDelPunto(punto, lang)}
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

/**
 * Una edición entera. En la página de un día van varias, cada una con su título: ahí sus
 * secciones bajan un nivel (`dentroDelDia`) y sus anclas llevan la edición delante.
 */
const Edicion = ({ datos, dentroDelDia }) => {
  const { t, lang } = useIdioma();
  const cifras = [...(datos.cifras ?? []), ...(datos.cifras_manuales ?? [])];
  const H = dentroDelDia ? "h3" : "h2";
  const id = (clave) => `res-${datos.edicion}-${clave}`;

  return (
    <>
      {datos.imagen?.url ? (
        <figure className="se-res__imagen">
          <img src={datos.imagen.url} alt={datos.imagen.alt || ""} />
          {datos.imagen.credito ? <figcaption>{datos.imagen.credito}</figcaption> : null}
        </figure>
      ) : null}
      {datos.secciones.map((s) => (
        <section key={s.clave} className="se-res-seccion" aria-labelledby={id(s.clave)}>
          <H id={id(s.clave)} className="se-res-seccion__titulo">{t(`resumen.secciones.${s.clave}`)}</H>
          <ul className="se-res-lista">
            {s.puntos.map((p) => (
              <Punto key={p.url} punto={p} lang={lang} />
            ))}
          </ul>
        </section>
      ))}

      {cifras.length || datos.monedas?.length ? (
        <section className="se-res-seccion se-res-cifras" aria-labelledby={id("cifras")}>
          <H id={id("cifras")} className="se-res-seccion__titulo">{t("resumen.cifras")}</H>
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
        <section className="se-res-seccion" aria-labelledby={id("lvbp")}>
          <H id={id("lvbp")} className="se-res-seccion__titulo">{t("resumen.lvbp")}</H>
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
    </>
  );
};

Edicion.propTypes = {
  datos: PropTypes.shape({
    edicion: PropTypes.string.isRequired,
    secciones: PropTypes.array.isRequired,
    cifras: PropTypes.array,
    cifras_manuales: PropTypes.array,
    monedas: PropTypes.array,
    lvbp: PropTypes.array,
    frase: PropTypes.string,
    imagen: PropTypes.shape({ url: PropTypes.string, alt: PropTypes.string, credito: PropTypes.string }),
  }).isRequired,
  dentroDelDia: PropTypes.bool,
};

export const Resumen = () => {
  const { t, lang } = useIdioma();
  const { fecha, edicion } = useParams();
  const [estado, setEstado] = useState({ status: "loading", datos: null, error: null });

  useEffect(() => {
    let vivo = true;
    setEstado({ status: "loading", datos: null, error: null });
    getResumen(fecha, edicion)
      .then((r) => vivo && setEstado({ status: "success", datos: r?.data ?? r, error: null }))
      .catch((error) => vivo && setEstado({ status: error?.status === 404 ? "vacio" : "error", datos: null, error }));
    return () => {
      vivo = false;
    };
  }, [fecha, edicion]);

  const { status, datos, error } = estado;
  // El día entero trae `ediciones` (en su orden: la más reciente va arriba); una sola, no.
  const delDia = Array.isArray(datos?.ediciones);
  const ediciones = delDia ? [...datos.ediciones].reverse() : datos ? [datos] : [];
  const titulo = delDia
    ? t("resumen.tituloDia")
    : datos?.edicion
      ? t(`resumen.titulos.${datos.edicion}`)
      : t("resumen.titulo");

  useMetaPagina({ title: t("resumen.meta", { titulo, marca: BRAND.name }), description: t("resumen.descripcion") });

  return (
    <main className="se-section se-res" role="main">
      <div className="se-container se-res__caja">
        <h1 className="se-res__titulo">{titulo}</h1>
        {datos ? (
          <p className="se-res__fecha">
            {fechaLarga(datos.fecha, lang)}
            {!delDia && datos.sale_a_las ? <span className="se-res__hora"> · {horaDeSalida(datos.sale_a_las, lang)}</span> : null}
          </p>
        ) : null}

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

        {delDia
          ? ediciones.map((e) => (
              <section key={e.edicion} className="se-res-edicion" aria-labelledby={`res-${e.edicion}`}>
                <h2 id={`res-${e.edicion}`} className="se-res-edicion__titulo">
                  <Enlace to={`/resumen/${e.fecha}/${e.edicion}`}>{t(`resumen.titulos.${e.edicion}`)}</Enlace>
                  <span className="se-res-edicion__hora">{horaDeSalida(e.sale_a_las, lang)}</span>
                </h2>
                <Edicion datos={e} dentroDelDia />
              </section>
            ))
          : ediciones.map((e) => <Edicion key={e.edicion} datos={e} />)}

        {datos ? (
          <>
            {!delDia ? (
              <p className="se-res__nota">
                <Enlace to={`/resumen/${datos.fecha}`}>{t("resumen.todasDelDia")}</Enlace>
              </p>
            ) : null}
            <p className="se-res__nota">{t("resumen.sale")}</p>
          </>
        ) : null}
      </div>
    </main>
  );
};
