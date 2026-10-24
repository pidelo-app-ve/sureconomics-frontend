import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Enlace } from "../components/Enlace";
import { CardMedia } from "../components/home/CardMedia";
import { TituloDePieza } from "../components/content/TituloDePieza";
import { Escudo, TarjetaJuego, useLvbp } from "../components/lvbp/MarcadorLvbp";
import { PatrocinioCompacto, useEspacios, useHueco } from "../components/publicidad";
import { BRAND } from "../data/surEconomicsMock";
import { formatearFecha, formatearNumero } from "../i18n/motor";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { IconoWhatsApp, enlaceWhatsApp } from "../juegos/compartir";
import { LOGO_LIGA, equipo, fechaDelDia } from "../lib/lvbp";
import { piezasFromApi, rutaDeFormato, rutaDePieza } from "../lib/pieza";
import { SITIO } from "../lib/seo";
import { getPieces } from "../services/publicContentService";
import { ESPACIOS } from "../services/publicidadService";
import "./lvbp.css";

/**
 * `/lvbp`: los juegos por día, la tabla de posiciones y las noticias de la liga.
 *
 * Es la dirección que se comparte desde cada resultado («LVBP · Caracas 0 – Zulia 8»),
 * así que lleva título y descripción propios. El marcador se actualiza solo mientras
 * hay juego (`useLvbp`), igual que la franja de la portada.
 */

const DIAS = ["ayer", "hoy", "manana"];

/** «Presentado por»: un patrocinio C apuntado a la sección `lvbp`; sin anunciante, la casa. */
const Patrocinio = () => {
  const { t } = useIdioma();
  useEspacios({ espacios: [ESPACIOS.LVBP_PATROCINIO], contexto: { seccion: "lvbp" } });
  const hueco = useHueco(ESPACIOS.LVBP_PATROCINIO);
  if (hueco && !hueco.es_casa) return <PatrocinioCompacto hueco={hueco} className="se-lvbp-pagina__patrocinio" />;
  return (
    <p className="se-lvbp-pagina__patrocinio se-lvbp-pagina__patrocinio--casa">
      {t("lvbp.presentadoPor", { marca: <strong>{BRAND.name}</strong> })}
    </p>
  );
};

const Compartir = ({ juego, fecha }) => {
  const { t, ruta } = useIdioma();
  const texto = t("lvbp.compartir.texto", {
    visitante: equipo(juego.visitante).corto,
    cv: juego.carreras_visitante,
    local: equipo(juego.local).corto,
    cl: juego.carreras_local,
    fecha: formatearFecha(fecha, "diaMes"),
    marca: BRAND.name,
  });
  return (
    <a className="se-lvbp-pagina__compartir" href={enlaceWhatsApp(`${texto} ${SITIO}${ruta("/lvbp")}`)} target="_blank" rel="noopener noreferrer">
      <IconoWhatsApp className="se-lvbp-pagina__icono" />
      {t("lvbp.compartir.boton")}
    </a>
  );
};
Compartir.propTypes = {
  juego: PropTypes.shape({
    visitante: PropTypes.string.isRequired,
    local: PropTypes.string.isRequired,
    carreras_visitante: PropTypes.number,
    carreras_local: PropTypes.number,
  }).isRequired,
  fecha: PropTypes.string,
};
Compartir.defaultProps = { fecha: null };

/** Juegos detrás como en el béisbol: «—» el líder, «½», «1», «1½»… (nunca «0½»). */
const juegosDetras = (jd) => {
  if (!jd) return "—";
  const enteros = Math.floor(jd);
  const medio = jd - enteros >= 0.5 ? "½" : "";
  return `${enteros || ""}${medio}` || "—";
};

export const Lvbp = () => {
  const { t, lang } = useIdioma();
  const { status, datos } = useLvbp();
  const [dia, setDia] = useState("hoy");
  const [filasNoticias, setFilasNoticias] = useState([]);

  useMetaPagina({
    title: t("lvbp.meta.titulo", { marca: BRAND.name }),
    description: t("lvbp.meta.descripcion", { temporada: datos?.temporada ?? "2026-2027" }),
  });

  // Si hoy no hay juegos, se abre en el día que sí tenga: mañana, o ayer.
  useEffect(() => {
    if (!datos?.dias) return;
    if (datos.dias.hoy?.length) setDia("hoy");
    else if (datos.dias.manana?.length) setDia("manana");
    else if (datos.dias.ayer?.length) setDia("ayer");
  }, [datos?.hoy]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let vivo = true;
    getPieces({ q: "LVBP", limit: 3 })
      .then((r) => vivo && setFilasNoticias(r.filas ?? []))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const noticias = useMemo(() => piezasFromApi(filasNoticias), [filasNoticias, lang]);

  const juegos = datos?.dias?.[dia] ?? [];
  const fecha = fechaDelDia(datos?.hoy, dia);
  // La tabla se enseña en cuanto haya un juego terminado, aunque no haya juegos en los tres
  // días de la ventana (día libre, parón): sin juegos que mostrar sigue siendo temporada.
  const hayAlgo = DIAS.some((d) => datos?.dias?.[d]?.length) || (datos?.tabla ?? []).some((f) => f.g + f.p > 0);
  const actualizado = datos?.actualizado ? new Date(datos.actualizado) : null;

  return (
    <main className="se-blog se-lvbp-pagina">
      <section className="se-section">
        <div className="se-container">
          <header className="se-lvbp-pagina__cabeza">
            <img className="se-lvbp-pagina__liga" src={LOGO_LIGA} alt="" width="64" height="64" decoding="async" />
            <div className="se-lvbp-pagina__cabeza-texto">
              <h1 className="se-lvbp-pagina__titulo">{t("lvbp.nombre")}</h1>
              <p className="se-lvbp-pagina__kicker">{t("lvbp.temporada", { temporada: datos?.temporada ?? "2026-2027" })}</p>
              <p className="se-lvbp-pagina__entrada">{t("lvbp.entrada")}</p>
            </div>
            <Patrocinio />
          </header>

          {status === "error" ? <p className="se-lvbp-pagina__nota">{t("lvbp.error")}</p> : null}
          {status === "success" && !hayAlgo ? <p className="se-lvbp-pagina__nota">{t("lvbp.fueraDeTemporada")}</p> : null}

          {hayAlgo ? (
            <div className="se-lvbp-pagina__cols">
              <section className="se-lvbp-pagina__juegos" aria-labelledby="lvbp-juegos">
                <div className="se-lvbp-pagina__barra">
                  <h2 id="lvbp-juegos" className="se-lvbp-pagina__h2">{t("lvbp.juegos.titulo")}</h2>
                  <div className="se-lvbp-pagina__dias" role="group" aria-label={t("lvbp.juegos.titulo")}>
                    {DIAS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`se-lvbp-pagina__dia${d === dia ? " se-lvbp-pagina__dia--activo" : ""}`}
                        aria-pressed={d === dia}
                        onClick={() => setDia(d)}
                      >
                        {t(`lvbp.dia.${d}`)}
                        <span className="se-lvbp-pagina__dia-fecha">{formatearFecha(fechaDelDia(datos?.hoy, d), "diaMes")}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {juegos.length ? (
                  <div className="se-lvbp-pagina__lista">
                    {juegos.map((j) => (
                      <TarjetaJuego key={j.id} juego={j} grande>
                        <div className="se-lvbp-pagina__pie">
                          <span className="se-lvbp-pagina__estadio">
                            {j.estadio || t("lvbp.estadio", { equipo: equipo(j.local).corto })} · {equipo(j.local).ciudad}
                          </span>
                          {j.estado === "final" ? <Compartir juego={j} fecha={fecha} /> : null}
                        </div>
                      </TarjetaJuego>
                    ))}
                  </div>
                ) : (
                  <p className="se-lvbp-pagina__nota">{t("lvbp.juegos.sinJuegos")}</p>
                )}
                {actualizado ? (
                  <p className="se-lvbp-pagina__actualizado">
                    {t("lvbp.actualizado", { hora: actualizado.toLocaleTimeString(lang === "en" ? "en-US" : "es-VE", { hour: "numeric", minute: "2-digit", timeZone: "America/Caracas" }) })}
                  </p>
                ) : null}
              </section>

              <aside className="se-lvbp-pagina__tabla" aria-labelledby="lvbp-tabla">
                <h2 id="lvbp-tabla" className="se-lvbp-pagina__h2">{t("lvbp.tabla.titulo")}</h2>
                <div className="se-lvbp-pagina__tabla-caja">
                  <table className="se-lvbp-tabla">
                    <thead>
                      <tr>
                        <th scope="col" className="se-lvbp-tabla__equipo">{t("lvbp.tabla.equipo")}</th>
                        <th scope="col">{t("lvbp.tabla.jj")}</th>
                        <th scope="col">{t("lvbp.tabla.g")}</th>
                        <th scope="col">{t("lvbp.tabla.p")}</th>
                        <th scope="col">{t("lvbp.tabla.pct")}</th>
                        <th scope="col">{t("lvbp.tabla.jd")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(datos?.tabla ?? []).map((f) => (
                        <tr key={f.sigla}>
                          <th scope="row" className="se-lvbp-tabla__equipo">
                            <span className="se-lvbp-tabla__pos">{f.posicion}</span>
                            <Escudo sigla={f.sigla} tamano={24} />
                            <span className="se-lvbp-tabla__nombre" title={f.nombre}>{f.corto}</span>
                          </th>
                          <td>{formatearNumero(f.g + f.p)}</td>
                          <td>{formatearNumero(f.g)}</td>
                          <td>{formatearNumero(f.p)}</td>
                          <td>{f.pct_texto}</td>
                          <td>{juegosDetras(f.jd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="se-lvbp-pagina__leyenda">{t("lvbp.tabla.leyenda")}</p>
                <p className="se-lvbp-pagina__leyenda">{t("lvbp.tabla.nota", { marca: BRAND.name })}</p>
              </aside>
            </div>
          ) : null}

          {noticias.length ? (
            <section className="se-lvbp-pagina__noticias" aria-labelledby="lvbp-noticias">
              <div className="se-lvbp-pagina__barra">
                <h2 id="lvbp-noticias" className="se-lvbp-pagina__h2">{t("lvbp.noticias.titulo")}</h2>
                <Enlace to={rutaDeFormato("noticia")} className="se-lvbp-pagina__ver">
                  {t("lvbp.noticias.ver")}
                  <span aria-hidden="true"> →</span>
                </Enlace>
              </div>
              <div className="se-lvbp-pagina__rejilla">
                {noticias.map((n) => (
                  <article key={n.id} className="se-artcard">
                    <Enlace to={rutaDePieza(n)} className="se-artcard__media" aria-label={n.titulo}>
                      <CardMedia pieza={n} />
                    </Enlace>
                    <div className="se-artcard__body">
                      <span className="se-meta se-meta--category">{n.formatoNombre}</span>
                      <h3 className="se-artcard__title">
                        <Enlace to={rutaDePieza(n)}><TituloDePieza pieza={n} /></Enlace>
                      </h3>
                      <div className="se-artcard__foot">
                        <span className="se-artcard__by">{n.fecha}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export default Lvbp;
