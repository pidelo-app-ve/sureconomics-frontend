import { Enlace } from "../components/Enlace";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";

import { BRAND } from "../data/surEconomicsMock";

/**
 * «Anúnciate aquí»: la página de venta del inventario.
 *
 * ## Por qué no tiene formulario propio
 *
 * Lleva al de contacto con el asunto ya puesto (`/contacto?asunto=…`), que es una
 * capacidad que esa página ya tenía. Un segundo formulario habría significado un
 * segundo buzón, un segundo camino antispam y una segunda historia de idempotencia
 * para el mismo trabajo: que llegue un correo a `info@sureconomics.com`. Y el día que
 * cambie el remitente o el proveedor de correo, se cambia en un sitio.
 *
 * ## Por qué los textos están aquí y no en el panel
 *
 * Es copia comercial, no inventario: cambia cuando cambia la oferta, no cuando cambia
 * una campaña. Meterla en la base obligaría a mantener un editor para algo que se toca
 * dos veces al año, y a que la página se cayera si la base no responde.
 *
 * Las letras son las del documento del cliente -- incluido el salto de la G --, porque
 * son el vocabulario con el que se habla de esto en las reuniones.
 */

/* Letra y disponibilidad de cada formato. Nombre y texto viven en `paginas.json`
   (`paginas.anunciate.formato.<letra>`), para los dos idiomas. */
const FORMATOS = [
  { letra: "A", estado: "disponible" },
  { letra: "B", estado: "disponible" },
  { letra: "C", estado: "disponible" },
  { letra: "D", estado: "disponible" },
  { letra: "E", estado: "proximamente" },
  { letra: "H", estado: "disponible" },
  { letra: "I", estado: "disponible" },
];

/* Las filas de la tabla de especificaciones: los formatos que ya se venden. */
const ESPECIFICACIONES = ["A", "B", "C", "D", "H", "I"];

export const Anunciate = () => {
  const { t } = useIdioma();
  useMetaPagina({
    title: t("paginas.anunciate.meta.titulo", { marca: BRAND.name }),
    description: t("paginas.anunciate.meta.descripcion"),
  });
  const nombreDe = (letra) => t(`paginas.anunciate.formato.${letra}.nombre`);
  const asuntoDe = (f) =>
    `/contacto?asunto=${encodeURIComponent(t("paginas.anunciate.asunto", { letra: f.letra, nombre: nombreDe(f.letra) }))}`;
  const asuntoGeneral = `/contacto?asunto=${encodeURIComponent(t("paginas.anunciate.asuntoGeneral"))}`;

  return (
    <main className="se-blog se-anunciate" role="main">
      <section className="se-section se-anunciate__hero">
        <div className="se-container">
          <p className="se-anunciate__kicker">{t("paginas.anunciate.kicker")}</p>
          <h1 className="se-anunciate__title">{t("paginas.anunciate.titulo")}</h1>
          <p className="se-anunciate__lead">{t("paginas.anunciate.lead")}</p>
          <Enlace className="se-btn se-btn--primary" to={asuntoGeneral}>
            {t("paginas.anunciate.solicitar")}
          </Enlace>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <h2 className="se-anunciate__h2">{t("paginas.anunciate.formatos")}</h2>
          <p className="se-anunciate__sub">{t("paginas.anunciate.formatosSub", { marca: BRAND.name })}</p>

          <ul className="se-anunciate__grid">
            {FORMATOS.map((f) => (
              <li key={f.letra} className="se-anunciate__tarjeta">
                <span className="se-anunciate__letra">{f.letra}</span>
                <span
                  className={`se-anunciate__estado se-anunciate__estado--${f.estado}`}
                >
                  {f.estado === "disponible" ? t("paginas.anunciate.disponible") : t("paginas.anunciate.proximamente")}
                </span>
                <h3 className="se-anunciate__nombre">{nombreDe(f.letra)}</h3>
                <p className="se-anunciate__texto">{t(`paginas.anunciate.formato.${f.letra}.texto`)}</p>
                {f.estado === "disponible" ? (
                  <Enlace className="se-anunciate__enlace" to={asuntoDe(f)}>
                    {t("paginas.anunciate.consultar")}
                  </Enlace>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          <h2 className="se-anunciate__h2">{t("paginas.anunciate.especificaciones")}</h2>
          <p className="se-anunciate__sub">{t("paginas.anunciate.especificacionesSub")}</p>

          {/* En su propio contenedor con scroll horizontal: una tabla de cuatro
              columnas no cabe en un móvil, y sin esto sería la página entera la que
              se desplazaría de lado. */}
          <div className="se-anunciate__tabla-caja">
            <table className="se-anunciate__tabla">
              <thead>
                <tr>
                  <th scope="col">{t("paginas.anunciate.colFormato")}</th>
                  <th scope="col">{t("paginas.anunciate.colUbicacion")}</th>
                  <th scope="col">{t("paginas.anunciate.colRotacion")}</th>
                  <th scope="col">{t("paginas.anunciate.colMedicion")}</th>
                </tr>
              </thead>
              <tbody>
                {ESPECIFICACIONES.map((letra) => (
                  <tr key={letra}>
                    <th scope="row">{`${letra} · ${nombreDe(letra)}`}</th>
                    <td>{t(`paginas.anunciate.formato.${letra}.ubicacion`)}</td>
                    <td>{t(`paginas.anunciate.formato.${letra}.rotacion`)}</td>
                    <td>{t(`paginas.anunciate.formato.${letra}.medicion`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="se-anunciate__nota">{t("paginas.anunciate.nota")}</p>
        </div>
      </section>

      <section className="se-section se-anunciate__cierre">
        <div className="se-container">
          <h2 className="se-anunciate__h2">{t("paginas.anunciate.hablemos")}</h2>
          <p className="se-anunciate__sub">{t("paginas.anunciate.hablemosSub")}</p>
          <Enlace className="se-btn se-btn--primary" to={asuntoGeneral}>
            {t("paginas.anunciate.escribirComercial")}
          </Enlace>
        </div>
      </section>
    </main>
  );
};
