import { useEffect } from "react";
import { applyPageMeta } from "../lib/seo";
import { BRAND } from "../data/surEconomicsMock";
import { Guacamaya } from "../juegos/guacamaya/Guacamaya";
import { PatrocinioDelJuego } from "../juegos/guacamaya/PatrocinioDelJuego";

/**
 * El Analista: el juego largo de la casa, que vive en su propio sitio.
 *
 * Por ahora se abre en otra pestaña. Está previsto servirlo dentro del sitio, en
 * `/el-analista/`, con la cuenta del lector guardando su carrera; mientras eso no
 * exista, esta es la dirección de su despliegue.
 */
const EL_ANALISTA = "https://el-analista-delta.vercel.app/";

/**
 * `/pausa`: un minuto de juego entre lecturas.
 *
 * Es la dirección que se comparte («¿lo superas? sureconomics.com/pausa»), así que
 * lleva su título y su descripción propios para que la tarjeta de WhatsApp o de X diga
 * de qué se trata. Va con la cabecera y el pie del sitio: quien llega desde un enlace
 * compartido tiene que ver dónde está y tener a un toque las noticias.
 */
export const Pausa = () => {
  useEffect(() => {
    applyPageMeta({
      title: `Un minuto de pausa: la guacamaya va a su casa — ${BRAND.name}`,
      description:
        "Un juego de un minuto sobre Caracas al atardecer. Cada día, un vuelo nuevo y el mismo para todos: esquive papagayos y zamuros, recoja mangos y llegue a casa.",
    });
  }, []);

  return (
    <main className="se-blog">
      <section className="se-section se-pausa">
        <div className="se-container se-pausa__caja">
          <header className="se-pausa__cabeza">
            <p className="se-pausa__kicker">Un minuto de pausa</p>
            <h1 className="se-pausa__titulo">Entre lectura y lectura, un vuelo</h1>
            <p className="se-pausa__entrada">
              Cada día el vuelo cambia, y es el mismo para todos. Juegue, compare su
              resultado y vuelva a la lectura.
            </p>
          </header>
          <Guacamaya patrocinio={<PatrocinioDelJuego />} />

          <section className="se-analista" aria-labelledby="analista-titulo">
            <p className="se-analista__kicker">Para cuando tenga más de un minuto</p>
            <h2 id="analista-titulo" className="se-analista__titulo">El Analista</h2>
            <p className="se-analista__texto">
              Un simulador de carrera e inversión: treinta años, un año por turno, con
              decisiones que pesan, noticias que sacuden el mercado, una cartera que reparte
              usted y un temario de finanzas que sube con su carrera.
            </p>
            <a
              className="se-analista__boton"
              href={EL_ANALISTA}
              target="_blank"
              rel="noopener noreferrer"
            >
              Jugar El Analista
              <span className="se-analista__fuera" aria-hidden="true">↗</span>
              <span className="se-sr-only"> (se abre en otra pestaña)</span>
            </a>
          </section>
        </div>
      </section>
    </main>
  );
};

export default Pausa;
