import { BRAND } from "../data/surEconomicsMock";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import { TarjetaClave, TarjetaPausa } from "../components/home/TarjetaPausa";
import "./pausa.css";

/**
 * `/juegos`: todos los juegos del sitio en una página. A ella lleva el botón «Juegos» de
 * la cabecera.
 *
 * Una tarjeta por juego publicado, las mismas que ya se ven en `/pausa` y en la portada:
 * solo ilustración y enlace, así que la página es ligera y cada juego se descarga al
 * abrirlo. Un juego nuevo se añade aquí como una tarjeta más de la lista, cuando ya esté
 * publicado. El Analista está en pausa y por eso no sale (ver `routes.jsx`).
 */
export const Juegos = () => {
  const { t } = useIdioma();
  useMetaPagina({
    title: t("juegos.lista.meta.titulo", { marca: BRAND.name }),
    description: t("juegos.lista.meta.descripcion", { marca: BRAND.name }),
  });

  return (
    <main className="se-blog">
      <section className="se-section se-pausa">
        <div className="se-container se-pausa__caja se-pausa__caja--juegos">
          <header className="se-pausa__cabeza">
            <p className="se-pausa__kicker">{t("juegos.lista.kicker")}</p>
            <h1 className="se-pausa__titulo">{t("juegos.lista.titulo")}</h1>
            <p className="se-pausa__entrada">{t("juegos.lista.entrada")}</p>
          </header>

          <ul className="se-pausa__juegos" aria-label={t("juegos.lista.etiqueta", { marca: BRAND.name })}>
            <li>
              <TarjetaPausa suelta />
            </li>
            <li>
              <TarjetaClave />
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
};

export default Juegos;
