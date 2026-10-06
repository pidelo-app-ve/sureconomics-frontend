import { useEffect, useState } from "react";
import { getCatalogo } from "../services/educacionService";
import { TarjetaDeModulo } from "../components/educacion/TarjetaDeModulo";
import { IconEscudo, IconLlave, IconVisto } from "../components/icons/educacion";
import { BRAND } from "../data/surEconomicsMock";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";

/**
 * Educacion: el catalogo de modulos.
 *
 * Esta pagina era antes una rejilla de piezas editoriales marcadas como educativas. El
 * cliente pidio (09/2026) que "Educacion" pase a ser el catalogo de modulos de pago, y
 * eso es lo que hay aqui. Las piezas de antes no se perdieron: siguen en su seccion de
 * siempre -- un articulo educativo sigue estando en Articulos --, solo dejaron de tener
 * una vista que las agrupara.
 *
 * ## Por que esta pagina tiene mas de una rejilla
 *
 * Porque es una pagina de venta y antes no lo era. Llevaba el hero institucional de
 * "Quienes somos" -- pensado para una declaracion de principios, con casi 250 px de
 * aire antes del contenido -- y debajo, directamente, las tarjetas. Quien llegaba veia
 * un titulo enorme, un vacio, y tres precios sin una sola razon para pagarlos.
 *
 * El orden de ahora sigue el patron de una pagina de precios: que es esto y por que
 * confiar, el producto, como funciona, y las dudas que frenan la compra. Lo que **no**
 * se copia de los sitios de cursos: contadores de urgencia, plazas que se agotan,
 * precios tachados y estrellas sin resenas detras. Eso convierte a corto plazo y quema
 * justo el activo que vende estos modulos, que es la credibilidad de la casa.
 *
 * ## El gancho va en la tarjeta, no en la letra pequena
 *
 * Cada tarjeta dice cuantas lecciones tiene y cuantas se abren sin pagar. Ese numero lo
 * calcula el servidor con la misma regla que luego aplica al servir la leccion, asi que
 * no puede prometer una clase gratis que despues conteste 403 -- que es exactamente lo
 * que pasaria si el texto estuviera escrito a mano en el panel.
 *
 * Los textos viven en `i18n/{es,en}/educacion.json`, apartado `educacion.catalogo`: el
 * catalogo existe en los dos idiomas (los modulos en si, solo en español).
 */

/** Las tres promesas de la cabecera. Son verdad comprobable, no adjetivos. El texto de cada una está en `educacion.catalogo.promesas.<clave>`. */
const PROMESAS = [
  { Icono: IconLlave, clave: "claseAbierta" },
  { Icono: IconEscudo, clave: "unPago" },
  { Icono: IconVisto, clave: "sinCaducidad" },
];

/** Las dudas que frenan una compra, contestadas antes de que haya que preguntarlas (`educacion.catalogo.dudas.<clave>.p` y `.r`). */
const DUDAS = ["nivel", "verAntes", "pago", "donde"];

export const Educacion = () => {
  const { t } = useIdioma();
  const [estado, setEstado] = useState({ cargando: true, error: false, modulos: [] });

  useMetaPagina({
    title: t("educacion.catalogo.meta.titulo", { marca: BRAND.name }),
    description: t("educacion.catalogo.claim"),
  });

  useEffect(() => {
    let vivo = true;
    getCatalogo()
      .then((datos) => {
        if (vivo) setEstado({ cargando: false, error: false, modulos: datos.modulos });
      })
      .catch(() => {
        if (vivo) setEstado({ cargando: false, error: true, modulos: [] });
      });
    return () => {
      vivo = false;
    };
  }, []);

  const hayModulos = estado.modulos.length > 0;

  return (
    <main className="se-blog se-edu" role="main">
      {/* La cabecera: dice a quién va dirigido y qué se obtiene, y entrega las tarjetas
          dentro de la primera pantalla. El hero institucional que había antes empujaba
          el catálogo entero por debajo del pliegue. */}
      <section className="se-edu__portada">
        <div className="se-container">
          <p className="se-edu__portada-kicker">{t("educacion.catalogo.kicker")}</p>
          <h1 className="se-edu__portada-titulo">{t("educacion.catalogo.titulo")}</h1>
          <p className="se-edu__portada-claim">{t("educacion.catalogo.claim")}</p>

          <ul className="se-edu__promesas">
            {PROMESAS.map(({ Icono, clave }) => (
              <li key={clave} className="se-edu__promesa">
                <Icono className="se-edu__promesa-icono" />
                <span>
                  <strong>{t(`educacion.catalogo.promesas.${clave}.titulo`)}</strong>
                  {t(`educacion.catalogo.promesas.${clave}.texto`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="se-section">
        <div className="se-container">
          {estado.cargando ? <p className="se-edu__aviso">{t("comun.cargando")}</p> : null}

          {estado.error ? (
            <p className="se-edu__aviso" role="alert">
              {t("educacion.catalogo.errorCatalogo")}
            </p>
          ) : null}

          {!estado.cargando && !estado.error && !hayModulos ? (
            <p className="se-edu__aviso">{t("educacion.catalogo.sinModulos")}</p>
          ) : null}

          {hayModulos ? (
            <>
              <h2 className="se-edu__h2">
                {t("educacion.catalogo.disponibles", { n: estado.modulos.length })}
              </h2>
              <ul className="se-edu__grid">
                {estado.modulos.map((modulo) => (
                  <li key={modulo.slug}>
                    <TarjetaDeModulo modulo={modulo} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>

      {/* Cómo funciona y las dudas van **después** de las tarjetas, no antes: quien
          llega al catálogo viene a ver los módulos, y hacerle leer una explicación
          primero es cobrarle peaje. Quien siga bajando es porque le interesó alguno y
          ahora sí tiene preguntas. */}
      {hayModulos ? (
        <section className="se-section se-edu__banda">
          <div className="se-container">
            <h2 className="se-edu__h2">{t("educacion.catalogo.comoFunciona")}</h2>
            <ol className="se-edu__pasos">
              <li className="se-edu__paso">
                <span className="se-edu__paso-num">1</span>
                <span className="se-edu__paso-copy">
                  <strong>{t("educacion.catalogo.pasos.abrir.titulo")}</strong>
                  {t("educacion.catalogo.pasos.abrir.texto")}
                </span>
              </li>
              <li className="se-edu__paso">
                <span className="se-edu__paso-num">2</span>
                <span className="se-edu__paso-copy">
                  <strong>{t("educacion.catalogo.pasos.comprar.titulo")}</strong>
                  {t("educacion.catalogo.pasos.comprar.texto")}
                </span>
              </li>
              <li className="se-edu__paso">
                <span className="se-edu__paso-num">3</span>
                <span className="se-edu__paso-copy">
                  <strong>{t("educacion.catalogo.pasos.ritmo.titulo")}</strong>
                  {t("educacion.catalogo.pasos.ritmo.texto")}
                </span>
              </li>
            </ol>

            <h2 className="se-edu__h2 se-edu__h2--separado">{t("educacion.catalogo.antesDeComprar")}</h2>
            <dl className="se-edu__dudas">
              {DUDAS.map((clave) => (
                <div key={clave} className="se-edu__duda">
                  <dt>{t(`educacion.catalogo.dudas.${clave}.p`)}</dt>
                  <dd>{t(`educacion.catalogo.dudas.${clave}.r`)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}
    </main>
  );
};

export default Educacion;
