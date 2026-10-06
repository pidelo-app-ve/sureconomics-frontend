import { PatrocinioCompacto, useEspacios, useHueco } from "../../components/publicidad";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { ESPACIOS } from "../../services/publicidadService";

/**
 * La línea «Patrocinado por…» del juego, servida por el sistema de publicidad.
 *
 * Pide el espacio `pausa-patrocinio` con la sección `pausa`, así que una campaña de
 * patrocinio (formato C) apuntada a «Juego: Un minuto de pausa» sale aquí y se cuenta
 * como cualquier anuncio: impresión cuando se ve, clic por nuestra API.
 *
 * Sin campaña, o con el relleno de la casa («Espacio disponible»), dice SurEconomics:
 * dentro del juego un «Anúnciate aquí» rompería la escena, y para vender el espacio ya
 * está la página de anunciantes.
 *
 * Se monta una sola vez, en el pie del escenario: si lo montaran la pantalla de inicio y
 * la final por separado, cada partida contaría dos impresiones del mismo patrocinador.
 */
export const PatrocinioDelJuego = () => {
  const { t } = useIdioma();
  useEspacios({ espacios: [ESPACIOS.PAUSA_PATROCINIO], contexto: { seccion: "pausa" } });
  const hueco = useHueco(ESPACIOS.PAUSA_PATROCINIO);

  if (hueco && !hueco.es_casa) return <PatrocinioCompacto hueco={hueco} tono="oscuro" />;
  return (
    <p className="se-guaca__patrocinio">
      {t("juegos.guacamaya.patrocinadoPor", { marca: <strong>SurEconomics</strong> })}
    </p>
  );
};

export default PatrocinioDelJuego;
