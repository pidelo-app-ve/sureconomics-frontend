import { useEffect, useState } from "react";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { MarcadorLvbp } from "../lvbp/MarcadorLvbp";
import { BannerDeJuegos } from "./TarjetaPausa";

/**
 * El béisbol y los juegos en la portada: un módulo discreto que no rompa la seriedad
 * del diario. En escritorio va abierto; en el teléfono, plegado bajo su rótulo para no
 * cortar el hilo de las noticias, y se abre con un toque.
 *
 * Es un `<details>`: plegar y desplegar funciona con teclado y sin JavaScript. El
 * estado inicial sale del ancho de la pantalla; después manda el lector.
 */

const ESCRITORIO = "(min-width: 760px)";

const anchoDeEscritorio = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(ESCRITORIO).matches;

export const PausaPortada = () => {
  const { t } = useIdioma();
  const [abierto, setAbierto] = useState(anchoDeEscritorio);

  // Al cruzar el ancho (girar la tableta) vuelve a su estado natural.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const consulta = window.matchMedia(ESCRITORIO);
    const alCambiar = (e) => setAbierto(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return (
    <section className="se-section se-pausa-franja" aria-label={t("portada.pausa.region")}>
      <div className="se-container">
        <details
          className="se-pausa-plegable"
          open={abierto}
          onToggle={(e) => setAbierto(e.currentTarget.open)}
        >
          <summary className="se-pausa-plegable__rotulo">
            <span>{t("portada.pausa.region")}</span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <MarcadorLvbp />
          <BannerDeJuegos />
        </details>
      </div>
    </section>
  );
};

export default PausaPortada;
