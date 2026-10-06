import { useEffect, useState } from "react";
import { Enlace } from "../../components/Enlace";
import { BRAND } from "../../data/surEconomicsMock";
import { formatearFecha, formatearNumero, idiomaActual } from "../../i18n/motor";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import { getMisCompras } from "../../services/userMeService";
import { duracionLegible, nivelLegible } from "../../services/educacionService";

/**
 * Lo mío: los módulos de Educación comprados, y el recibo de cada pago.
 *
 * ## Por qué hacía falta
 *
 * Se podía pagar un módulo y después no encontrarlo. El catálogo no distingue lo
 * comprado de lo demás hasta que se entra en la ficha, y en la cuenta no había ni
 * mención de Educación: quien pagó diecinueve dólares tenía que acordarse del nombre y
 * buscarlo. Pagar y no saber dónde está lo comprado es la peor sensación que deja una
 * tienda, y es la que impide la segunda compra.
 *
 * ## Lo pendiente se enseña, y distinguido
 *
 * Una compra a medias es alguien que se fue a la pasarela y no volvió — o volvió y el
 * aviso del banco aún no llegó. Esconderla hace que quien ya puso la tarjeta no vea
 * nada y lo intente otra vez; enseñarla como si ya fuera suya es peor. Va aparte, con su
 * estado dicho.
 *
 * ## No dice «continúe donde lo dejó»
 *
 * Porque no lo sabemos: registrar por dónde va cada persona sería medir la lectura de
 * alguien identificado, y eso no se hace. Ofrece empezar por la primera clase, que es
 * verdad, en vez de una promesa que no se puede cumplir.
 */

const dinero = (centavos, moneda) => {
  const valor = (Number(centavos) || 0) / 100;
  try {
    return formatearNumero(valor, idiomaActual(), {
      style: "currency",
      currency: moneda || "USD",
      minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${valor} ${moneda || ""}`.trim();
  }
};

const fechaLegible = (iso) => formatearFecha(iso, "larga");

export const CuentaLoMio = () => {
  const { t } = useIdioma();
  const [estado, setEstado] = useState({ cargando: true, error: "", datos: null });

  useMetaPagina({
    title: t("cuenta.loMio.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.loMio.meta.descripcion"),
    noindex: true,
  });

  useEffect(() => {
    let vivo = true;
    getMisCompras()
      .then((d) => vivo && setEstado({ cargando: false, error: "", datos: d }))
      .catch(() =>
        vivo &&
        setEstado({
          cargando: false,
          error: "fallo",
          datos: null,
        }),
      );
    return () => {
      vivo = false;
    };
  }, []);

  const d = estado.datos;
  const hayAlgo = Boolean(d?.modulos?.length || d?.pendientes?.length);

  return (
    <div className="se-cuenta__pagina">
      <header className="se-cuenta__cabecera">
        <h1 className="se-cuenta__titulo">{t("cuenta.loMio.titulo")}</h1>
        <p className="se-cuenta__lead">
          {t("cuenta.loMio.lead")}
        </p>
      </header>

      {estado.cargando ? <p className="se-cuenta__aviso">{t("comun.cargando")}</p> : null}
      {estado.error ? (
        <p className="se-cuenta__error" role="alert">
          {t("cuenta.loMio.fallo")}
        </p>
      ) : null}

      {d && !hayAlgo ? (
        /* El vacío explica qué aparecería aquí y lleva al catálogo. Una lista vacía sin
           salida es un callejón: quien llega buscando algo que compró y no lo ve, lo
           único que necesita es saber si es que no ha comprado nada. */
        <div className="se-cuenta__vacio">
          <h2>{t("cuenta.loMio.vacioTitulo")}</h2>
          <p>
            {t("cuenta.loMio.vacioTexto")}
          </p>
          <Enlace to="/educacion" className="se-btn">
            {t("cuenta.loMio.verModulos")}
          </Enlace>
        </div>
      ) : null}

      {d?.modulos?.length ? (
        <>
          <h2 className="se-cuenta__h2">
            {t("cuenta.loMio.susModulos", { n: d.modulos.length })}
            <span className="se-cuenta__pendiente">
              {t("cuenta.loMio.enTotal", { importe: dinero(d.gastadoCentavos, d.moneda) })}
            </span>
          </h2>

          <ul className="se-mio__lista">
            {d.modulos.map((m) => {
              const duracion = duracionLegible(m.duracion_minutos);
              const nivel = nivelLegible(m.nivel);
              return (
                <li key={m.slug} className="se-mio__ficha">
                  <div className="se-mio__portada">
                    {m.portada ? (
                      <img src={m.portada} alt="" loading="lazy" />
                    ) : (
                      <span className="se-mio__portada-fill" aria-hidden="true" />
                    )}
                  </div>

                  <div className="se-mio__copy">
                    <p className="se-mio__kicker">
                      {nivel ? t("cuenta.loMio.nivel", { nivel: nivel.toLowerCase() }) : t("cuenta.loMio.modulo")}
                      {duracion ? ` · ${duracion}` : ""}
                    </p>
                    <h3 className="se-mio__titulo">{m.titulo}</h3>
                    {m.resumen ? <p className="se-mio__resumen">{m.resumen}</p> : null}

                    <p className="se-mio__recibo">
                      {dinero(m.recibo.importe_centavos, m.recibo.moneda)} ·{" "}
                      {fechaLegible(m.recibo.fecha)}
                      <span className="se-mio__ref">{t("cuenta.loMio.ref", { referencia: m.recibo.referencia })}</span>
                    </p>
                  </div>

                  <div className="se-mio__accion">
                    {/* Un módulo despublicado sigue siendo suyo: lo que se compró no se
                        puede retirar de debajo de quien pagó. Pero el enlace a la clase
                        no serviría, así que se dice en vez de llevar a un 404. */}
                    {m.publicado && m.empezar_por ? (
                      <Enlace
                        to={`/educacion/${m.slug}/${m.empezar_por}`}
                        className="se-btn"
                      >
                        {t("cuenta.loMio.abrir")}
                      </Enlace>
                    ) : (
                      <span className="se-mio__pausa">
                        {t("cuenta.loMio.fueraDelCatalogo")}
                      </span>
                    )}
                    {m.publicado ? (
                      <Enlace to={`/educacion/${m.slug}`} className="se-mio__temario">
                        {t("cuenta.loMio.verTemario")} →
                      </Enlace>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {d?.pendientes?.length ? (
        <>
          <h2 className="se-cuenta__h2 se-cuenta__h2--separado">{t("cuenta.loMio.pagosAMedias")}</h2>
          <ul className="se-mio__pendientes">
            {d.pendientes.map((p) => (
              <li key={p.referencia}>
                <strong>{p.modulo}</strong>
                <span>
                  {dinero(p.importe_centavos, p.moneda)} · {p.proveedor} ·{" "}
                  {fechaLegible(p.fecha)}
                </span>
                <small>
                  {t("cuenta.loMio.pendienteTexto")}
                </small>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
};

export default CuentaLoMio;
