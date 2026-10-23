import { Enlace } from "../Enlace";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { rutaDePieza } from "../../lib/pieza";
import { useMasLeidas } from "../../hooks/useMasLeidas";
import { TituloDePieza } from "../content/TituloDePieza";

/**
 * «Lo más leído»: las piezas con más lectores distintos en los últimos siete días,
 * según la medición propia del sitio (`AnaliticaLectura`). No es una lista a mano ni
 * un número inventado: sale de `/analitica/mas-leidas`, y con menos de tres piezas no
 * se pinta, porque una lista de una o dos no es un ranking.
 *
 * Los números van porque aquí el orden sí dice algo: el 1 es el más leído.
 */
const MINIMO = 3;

export const MasLeido = () => {
  const { t } = useIdioma();
  const { status, piezas } = useMasLeidas();
  if (status !== "success" || piezas.length < MINIMO) return null;

  return (
    <section className="se-masleido" aria-labelledby="masleido-titulo">
      <h2 id="masleido-titulo" className="se-masleido__titulo">
        {t("portada.masLeido.titulo")}
      </h2>
      <p className="se-masleido__nota">{t("portada.masLeido.nota")}</p>
      <ol className="se-masleido__lista">
        {piezas.map((p, i) => (
          <li key={p.id} className="se-masleido__item">
            <span className="se-masleido__numero" aria-hidden="true">
              {i + 1}
            </span>
            <Enlace to={rutaDePieza(p)} className="se-masleido__enlace">
              <TituloDePieza pieza={p} />
            </Enlace>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default MasLeido;
