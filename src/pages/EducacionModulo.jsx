import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Enlace } from "../components/Enlace";
import { PanelDeCompra } from "../components/educacion/PanelDeCompra";
import { IconCandado, IconLlave, IconoDeTipo, IconReloj } from "../components/icons/educacion";
import { BRAND } from "../data/surEconomicsMock";
import { useIdioma } from "../i18n/ProveedorIdioma";
import { useMetaPagina } from "../i18n/useMetaPagina";
import {
  duracionLegible,
  getCatalogo,
  getModulo,
  nivelLegible,
} from "../services/educacionService";

/**
 * El detalle de un modulo: de que va, cuanto cuesta y su temario.
 *
 * El candado de cada leccion lo decide el servidor y llega resuelto en `abierta`. La
 * pantalla no lo deduce: deducirlo aqui significaria tener la regla de negocio escrita
 * dos veces -- una en cada lado -- y el dia que cambie, una de las dos se queda vieja.
 * Y la que se queda vieja en el navegador es la que promete lo que el servidor niega.
 *
 * `libre` y `abierta` son cosas distintas y se usan para cosas distintas: `libre` es del
 * contenido ("esta leccion no se cobra") y `abierta` es de quien mira ("usted puede
 * entrar"). Una leccion gratuita esta `libre` para todos y `abierta` solo para quien
 * tiene cuenta verificada.
 *
 * ## La leccion abierta es un enlace, no una insignia
 *
 * La version anterior marcaba la primera con un sello que decia "Acceso libre" y dejaba
 * el titulo como enlace discreto al lado. Es al reves de lo que conviene: la clase
 * gratuita es la prueba del producto, y lo que hay que ofrecer no es una etiqueta sino
 * un boton que la abra. Quien la lee entera es quien compra.
 *
 * ## Solo en español
 *
 * La interfaz habla los dos idiomas, pero el modulo (titulo, resumen, temario) existe
 * solo en español. En `/en` la pagina sale con `noindex`, el canonico apunta al español
 * y se avisa arriba del contenido (`idioma.soloEnEspanol`).
 */

/** Los tipos de leccion con nombre propio en el temario (`educacion.tipoDeLeccion.<tipo>`); otro cualquiera sale con su id. */
const TIPOS = ["video", "texto", "audio", "pdf"];

export const EducacionModulo = () => {
  const { t, lang } = useIdioma();
  const { slug } = useParams();
  const [modulo, setModulo] = useState(null);
  const [pasarelas, setPasarelas] = useState([]);
  // `error`: "" | "no-existe" | "fallo". La frase se elige al pintar, en el idioma de la página.
  const [estado, setEstado] = useState({ cargando: true, error: "" });

  useMetaPagina({
    title: modulo ? t("educacion.modulo.meta.titulo", { titulo: modulo.titulo, marca: BRAND.name }) : undefined,
    description: modulo?.resumen || undefined,
    soloEspanol: true,
  });

  const cargar = useCallback(async () => {
    setEstado({ cargando: true, error: "" });
    try {
      const datos = await getModulo(slug);
      setModulo(datos);
      setEstado({ cargando: false, error: "" });
    } catch (err) {
      setModulo(null);
      setEstado({ cargando: false, error: err?.status === 404 ? "no-existe" : "fallo" });
    }
  }, [slug]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    // Las pasarelas viven en el catálogo. Se piden aparte para no retrasar el temario,
    // que es lo que el lector vino a ver.
    let vivo = true;
    getCatalogo()
      .then((datos) => vivo && setPasarelas(datos.pasarelas))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  if (estado.cargando) {
    return (
      <main className="se-blog se-edu" role="main">
        <section className="se-section">
          <div className="se-container">
            <p className="se-edu__aviso">{t("comun.cargando")}</p>
          </div>
        </section>
      </main>
    );
  }

  if (estado.error || !modulo) {
    return (
      <main className="se-blog se-edu" role="main">
        <section className="se-section">
          <div className="se-container">
            <p className="se-edu__aviso" role="alert">
              {estado.error === "no-existe"
                ? t("educacion.modulo.noExiste")
                : t("educacion.modulo.noSePudoCargar")}
            </p>
            <Enlace to="/educacion" className="se-link">
              {t("educacion.comun.volverAEducacion")}
            </Enlace>
          </div>
        </section>
      </main>
    );
  }

  const nivel = nivelLegible(modulo.nivel);
  const duracion = duracionLegible(modulo.duracion_minutos);
  const claseDePrueba = (modulo.temario || []).find((l) => l.libre || l.abierta);

  return (
    <main className="se-blog se-edu" role="main">
      <section className="se-section">
        <div className="se-container">
          {lang === "en" ? <p className="se-solo-espanol">{t("idioma.soloEnEspanol")}</p> : null}

          <nav className="se-edu__migas" aria-label={t("educacion.comun.ruta")}>
            <Enlace to="/educacion" className="se-link">
              {t("nav.educacion")}
            </Enlace>
          </nav>

          <div className="se-modulo-detalle">
            {/* Cabecera y temario son dos áreas distintas de la rejilla, no un solo
                bloque. En vertical el panel de compra se cuela entre las dos: así la
                página abre con el título y no con un precio sin contexto, y la lista
                larga queda después de la decisión. */}
            <div className="se-modulo-detalle__cabecera">
              <p className="se-modulo-detalle__kicker">
                {nivel
                  ? t("educacion.modulo.nivel", { nivel: nivel.toLowerCase() })
                  : t("educacion.comun.modulo")}
                {duracion ? ` · ${duracion}` : ""}
              </p>
              <h1 className="se-modulo-detalle__titulo">{modulo.titulo}</h1>
              {modulo.resumen ? (
                <p className="se-modulo-detalle__resumen">{modulo.resumen}</p>
              ) : null}

              {/* El atajo a la clase abierta, arriba y antes del temario: es la acción
                  que más conviene a las dos partes -- quien duda la prueba sin pagar, y
                  la casa enseña el producto en vez de describirlo. */}
              {claseDePrueba && !modulo.comprado ? (
                <Enlace
                  to={`/educacion/${modulo.slug}/${claseDePrueba.slug}`}
                  className="se-btn se-btn--secondary se-modulo-detalle__prueba"
                >
                  <IconLlave className="se-modulo-detalle__prueba-icono" />
                  {t("educacion.modulo.leerClaseAbierta")}
                </Enlace>
              ) : null}
            </div>

            <div className="se-modulo-detalle__temario">
              <h2 className="se-edu__h2 se-modulo-detalle__h2">{t("educacion.modulo.temario")}</h2>
              <ol className="se-temario">
                {modulo.temario.map((leccion) => {
                  const minutos = duracionLegible(leccion.duracion_minutos);
                  const contenido = (
                    <>
                      <span className="se-temario__num" aria-hidden="true">
                        {leccion.posicion}
                      </span>
                      <span className="se-temario__copy">
                        <span className="se-temario__titulo">{leccion.titulo}</span>
                        <span className="se-temario__meta">
                          <IconoDeTipo tipo={leccion.tipo} className="se-temario__icono" />
                          {TIPOS.includes(leccion.tipo)
                            ? t(`educacion.tipoDeLeccion.${leccion.tipo}`)
                            : leccion.tipo}
                          {minutos ? (
                            <>
                              <span className="se-temario__punto" aria-hidden="true">
                                ·
                              </span>
                              <IconReloj className="se-temario__icono" />
                              {minutos}
                            </>
                          ) : null}
                        </span>
                      </span>
                      {/* `libre` manda sobre `abierta`, y el orden importa. Una
                          leccion gratuita esta `libre` para todo el mundo pero solo
                          `abierta` para quien tiene cuenta verificada: mirando primero
                          `abierta`, a un visitante anonimo la primera clase se le
                          anunciaba como "Con el modulo" -- es decir, se le cobraba de
                          palabra justo lo que es gratis, que es el gancho entero de la
                          seccion.

                          En un modulo gratuito el sello de "gratis" sobra en la primera:
                          si lo lleva solo ella, las demas parecen de pago por contraste.
                          Ahi todas dicen lo mismo. */}
                      <span className="se-temario__estado">
                        {leccion.libre && !modulo.comprado && !modulo.gratuito ? (
                          <span className="se-temario__sello se-temario__sello--libre">
                            {leccion.abierta
                              ? t("educacion.modulo.abrirGratis")
                              : t("educacion.modulo.gratisConCuenta")}
                          </span>
                        ) : leccion.abierta ? (
                          <span className="se-temario__sello">{t("educacion.modulo.abrir")}</span>
                        ) : (
                          <span className="se-temario__sello se-temario__sello--cerrado">
                            <IconCandado className="se-temario__icono" />
                            {t("educacion.modulo.conElModulo")}
                          </span>
                        )}
                      </span>
                    </>
                  );

                  // Toda la fila es el enlace cuando se puede entrar. Un título
                  // enlazable dentro de una fila que no lo es obliga a apuntar a un
                  // objetivo de dos centímetros; la fila entera es un objetivo cómodo
                  // en cualquier pantalla.
                  // Se entra tambien a una leccion `libre` que todavia no esta
                  // `abierta`: la pantalla de destino dice "cree una cuenta" con los
                  // dos botones puestos. Cortar el enlace aqui dejaria al visitante
                  // delante de una clase gratis sin forma de llegar a ella.
                  const sePuedeEntrar = leccion.abierta || leccion.libre;

                  return (
                    <li
                      key={leccion.slug}
                      className={`se-temario__fila${
                        sePuedeEntrar ? "" : " se-temario__fila--cerrada"
                      }`}
                    >
                      {sePuedeEntrar ? (
                        <Enlace
                          to={`/educacion/${modulo.slug}/${leccion.slug}`}
                          className="se-temario__enlace"
                        >
                          {contenido}
                        </Enlace>
                      ) : (
                        <span className="se-temario__enlace">{contenido}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="se-modulo-detalle__lado">
              <PanelDeCompra
                modulo={modulo}
                pasarelas={pasarelas}
                onComprado={cargar}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default EducacionModulo;
