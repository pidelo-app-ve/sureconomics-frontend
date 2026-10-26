import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { useHeadlines } from "../../hooks/useHeadlines";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha } from "../../i18n/motor";
import { rutaDePieza } from "../../lib/pieza";
import { TituloDePieza } from "../content/TituloDePieza";
import "../../styles/titulares.css";

/**
 * La columna izquierda de la primera plana: «Última hora» como en un diario en línea,
 * una lista con la hora delante de cada titular.
 *
 * Los titulares son los de la sección (`useHeadlines`), que se redacta cada 10
 * minutos. Si el más reciente tiene más de un día, la columna no se queda vacía: pasa
 * a las noticias más recientes del sitio (`recientes`), con su hora o su fecha.
 *
 * El punto verde late solo mientras lo primero de la lista tiene menos de una hora:
 * un «en vivo» que late con noticias de ayer miente. En el teléfono se ven tres.
 */

const CUANTOS = 6;
const UN_DIA_MS = 24 * 60 * 60 * 1000;
const UNA_HORA_MS = 60 * 60 * 1000;

const useAhora = (cada) => {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cada);
    return () => clearInterval(id);
  }, [cada]);
  return ahora;
};

const MEDIA_HORA_MS = 30 * 60 * 1000;

/**
 * «12 min» durante la primera hora, «9:21» el resto del día y «4 ago» si no es de hoy.
 * En rojo solo lo de la última media hora: el color dice «acaba de pasar», y si todo
 * va en rojo no dice nada. Los minutos se leen enteros para el lector de pantalla
 * («Hace 12 min»); a la vista, sin el «hace», caben en la columna de la hora.
 */
const sello = (iso, lang, ahora, t) => {
  const ms = Date.parse(iso || "");
  if (!ms) return { visible: "" };
  const pasado = Math.max(0, ahora - ms);
  if (pasado < UNA_HORA_MS) {
    const n = Math.floor(pasado / 60_000);
    return n < 1
      ? { visible: t("titulares.hace.ahora"), fresca: true }
      : { visible: t("titulares.hace.corto", { n }), leido: t("titulares.hace.minutos", { n }), fresca: pasado < MEDIA_HORA_MS };
  }
  const hoy = new Date(ahora).toDateString() === new Date(ms).toDateString();
  return { visible: formatearFecha(iso, hoy ? "hora" : "diaMes", lang) };
};

export const UltimaHoraColumna = ({ recientes = [] }) => {
  const { t, lang } = useIdioma();
  const { items } = useHeadlines();
  const ahora = useAhora(60_000);

  const titulares = items.slice(0, CUANTOS);
  const masReciente = titulares.reduce((max, i) => Math.max(max, Date.parse(i.published_at || "") || 0), 0);
  const hayTitulares = titulares.length > 0 && ahora - masReciente < UN_DIA_MS;

  const filas = hayTitulares
    ? titulares.map((i) => ({ id: `t-${i.id}`, iso: i.published_at, titulo: i.title, ruta: `/ultima-hora#t-${i.id}` }))
    : recientes.slice(0, CUANTOS).map((p) => ({ id: p.id, iso: p.fechaIso, titulo: <TituloDePieza pieza={p} />, ruta: rutaDePieza(p) }));
  if (!filas.length) return null;

  const enVivo = ahora - (Date.parse(filas[0].iso || "") || 0) < UNA_HORA_MS;

  return (
    <section className="se-plana__uh" aria-labelledby="plana-uh">
      <h2 id="plana-uh" className="se-plana__uh-cabeza">
        <Enlace to="/ultima-hora" className="se-plana__uh-pastilla">
          <span className={`se-plana__uh-punto${enVivo ? " se-plana__uh-punto--vivo" : ""}`} aria-hidden="true" />
          {t("titulares.tarjeta.etiqueta")}
        </Enlace>
      </h2>
      <ol className="se-plana__uh-lista">
        {filas.map((f) => {
          const s = sello(f.iso, lang, ahora, t);
          return (
          <li key={f.id} className="se-plana__uh-item">
            <time className={`se-plana__uh-hora${s.fresca ? " se-plana__uh-hora--fresca" : ""}`} dateTime={f.iso ?? undefined}>
              {s.leido ? (
                <>
                  <span className="se-sr-only">{s.leido}</span>
                  <span aria-hidden="true">{s.visible}</span>
                </>
              ) : (
                s.visible
              )}
            </time>
            <Enlace className="se-plana__uh-titulo" to={f.ruta}>
              {f.titulo}
            </Enlace>
          </li>
          );
        })}
      </ol>
      <Enlace className="se-plana__mas" to="/ultima-hora">
        {t("portada.plana.todaLaUltimaHora")}
      </Enlace>
    </section>
  );
};

UltimaHoraColumna.propTypes = {
  recientes: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), fechaIso: PropTypes.string })
  ),
};

export default UltimaHoraColumna;
