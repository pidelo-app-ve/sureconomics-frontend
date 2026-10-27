import { useEffect, useState } from "react";
import { Enlace } from "../../components/Enlace";
import { BotonDeSeguirTema } from "../../components/content/BotonDeSeguirTema";
import { TituloDePieza } from "../../components/content/TituloDePieza";
import { useTemasSeguidos } from "../../context/TemasSeguidosContext";
import { useUserAuth } from "../../context/UserAuthContext";
import { BRAND } from "../../data/surEconomicsMock";
import { useTaxonomy } from "../../hooks/useTaxonomy";
import { formatearFecha } from "../../i18n/motor";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import { nombreTraducido, rutaDePieza } from "../../lib/pieza";
import { getPiezasDeMisTemas } from "../../services/userMeService";
import "../../styles/cuenta.css";

/**
 * «Mis temas»: los temas que sigue el lector, los que puede seguir, y lo último
 * publicado en los suyos. Es la página detrás de la pestaña «Mis temas» de Última hora
 * y del botón «Seguir» de cada pieza.
 */
const CUANTAS = 20;

export const CuentaTemas = () => {
  const { t, lang } = useIdioma();
  const { isEmailVerified } = useUserAuth();
  const { temas, listo } = useTemasSeguidos();
  const { topics } = useTaxonomy();
  const [piezas, setPiezas] = useState(null);

  useMetaPagina({
    title: t("cuenta.temas.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.temas.meta.descripcion"),
    noindex: true,
  });

  const seguidos = temas.map((x) => x.slug).join(",");
  useEffect(() => {
    if (!isEmailVerified) return undefined;
    let vivo = true;
    setPiezas(null);
    getPiezasDeMisTemas({ page: 1, limit: CUANTAS })
      .then((r) => vivo && setPiezas(r.piezas))
      .catch(() => vivo && setPiezas([]));
    return () => {
      vivo = false;
    };
  }, [isEmailVerified, seguidos]);

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-card se-reader-card--narrow">
          <h1 className="se-reader-page-title">{t("cuenta.temas.titulo")}</h1>
          <p className="se-reader-page-lead">
            {t("cuenta.temas.verifique")}{" "}
            <Enlace to="/cuenta/verificar-email" className="se-link">
              {t("cuenta.comun.verificar")}
            </Enlace>
          </p>
        </div>
      </div>
    );
  }

  const sigue = new Set(temas.map((x) => x.slug));
  const nombreDe = (tema) => nombreTraducido(tema) || tema.name;
  const otros = (topics ?? []).filter((tema) => !sigue.has(tema.slug));

  return (
    <div className="se-reader-dash__page">
      <header className="se-reader-page-head">
        <h1 className="se-reader-page-title">{t("cuenta.temas.titulo")}</h1>
        <p className="se-reader-page-lead">{t("cuenta.temas.lead")}</p>
      </header>

      <section className="se-reader-card se-reader-temas__bloque" aria-labelledby="temas-sigo">
        <h2 id="temas-sigo" className="se-reader-temas__subtitulo">{t("cuenta.temas.siguiendo")}</h2>
        {!listo ? (
          <p className="se-reader-empty__text">{t("cuenta.temas.cargando")}</p>
        ) : temas.length ? (
          <ul className="se-reader-temas">
            {temas.map((tema) => (
              <li key={tema.slug} className="se-reader-temas__item">
                <Enlace to={`/explorar?tema=${encodeURIComponent(nombreDe(tema))}`}>{nombreDe(tema)}</Enlace>
                <BotonDeSeguirTema slug={tema.slug} nombre={nombreDe(tema)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="se-reader-empty__text">{t("cuenta.temas.ninguno")}</p>
        )}
      </section>

      {otros.length ? (
        <section className="se-reader-card se-reader-temas__bloque" aria-labelledby="temas-otros">
          <h2 id="temas-otros" className="se-reader-temas__subtitulo">{t("cuenta.temas.otros")}</h2>
          <ul className="se-reader-temas">
            {otros.map((tema) => (
              <li key={tema.slug} className="se-reader-temas__item">
                <span>{nombreDe(tema)}</span>
                <BotonDeSeguirTema slug={tema.slug} nombre={nombreDe(tema)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="se-reader-card se-reader-temas__bloque" aria-labelledby="temas-nuevo">
        <h2 id="temas-nuevo" className="se-reader-temas__subtitulo">{t("cuenta.temas.loNuevo")}</h2>
        {piezas === null ? (
          <p className="se-reader-empty__text">{t("comun.cargando")}</p>
        ) : piezas.length ? (
          <ol className="se-reader-temas__piezas">
            {piezas.map((p) => (
              <li key={p.id} className="se-reader-temas__pieza">
                <Enlace to={rutaDePieza(p)}>
                  <TituloDePieza pieza={p} />
                </Enlace>
                <span className="se-reader-temas__meta">
                  {p.formatoNombre}
                  {p.fechaIso ? ` · ${formatearFecha(p.fechaIso, "diaMes", lang)}` : ""}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="se-reader-empty__text">{t("cuenta.temas.nadaNuevo")}</p>
        )}
      </section>
    </div>
  );
};

export default CuentaTemas;
