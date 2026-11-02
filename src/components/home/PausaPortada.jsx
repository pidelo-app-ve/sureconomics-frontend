import { useState } from "react";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { MarcadorLvbp } from "../lvbp/MarcadorLvbp";
import { BannerDeJuegos } from "./TarjetaPausa";

/**
 * El béisbol y los juegos en la portada: un módulo discreto que no rompa la seriedad
 * del diario. Abierto en todas las pantallas: en el teléfono iba plegado y el marcador
 * no lo veía nadie (lo pidió el equipo, nov-2026). El lector puede plegarlo.
 *
 * Es un `<details>`: plegar y desplegar funciona con teclado y sin JavaScript.
 */
export const PausaPortada = () => {
  const { t } = useIdioma();
  const [abierto, setAbierto] = useState(true);

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
