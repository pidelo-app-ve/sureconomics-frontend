import { useCallback, useEffect, useMemo, useState } from "react";
import { MapaDelSitio } from "../components/mapa/MapaDelSitio";
import { RecorridoVista } from "../../../../components/recorrido/RecorridoVista";
import { recorridoPublicidad } from "../../../../lib/guias/guiaPublicidad";
import { applyPageMeta } from "../../../../lib/seo";
import { useAdminToast } from "../../../../context/AdminToastContext";
import { useAdminConfirm } from "../../../../hooks/useAdminConfirm";
import { useConfirmacionDeGuardado } from "../../../../hooks/useConfirmacionDeGuardado";
import { AsistenteDeAnuncio } from "../components/AsistenteDeAnuncio";
import { adminErrorMessage } from "../../../../lib/adminErrorMessage";
import {
  actualizarPieza,
  getEscalera,
  getOcupacion,
  fijarAjustes,
  getResumen,
  listar,
} from "../services/api";
import { CabeceraDePagina } from "../../../../components/admin/CabeceraDePagina";
import { piezasConArteAutomatico } from "../utils/arteAutomatico";
import { TablaDeCampanas } from "../components/TablaDeCampanas";
import { TarjetaDeAnunciante } from "../components/TarjetaDeAnunciante";

/**
 * El panel de publicidad: anunciantes, campañas, piezas y cifras.
 *
 * ## Tres niveles y no cuatro
 *
 * Anunciante → campaña → pieza. Los segmentos no son un nivel propio aunque en la base
 * sean una tabla: se editan dentro de la campaña, como una lista de condiciones, porque
 * eso es lo que son para quien vende. Un cuarto nivel plegable convertiría «quiero salir
 * en Venezuela» en cuatro clics.
 *
 * ## Por qué se guarda al momento
 *
 * Igual que en Educación, y por un motivo parecido: **el servidor puede rechazar un
 * cambio por algo que no está en este formulario**. Activar una campaña sin ninguna
 * pieza activa da 422, y los segmentos se reemplazan enteros. Un estado local
 * «pendiente de guardar» acabaría enseñando una campaña activa que el servidor tiene en
 * borrador.
 *
 * ## El formulario enseña lo que ese formato publica, y nada más
 *
 * Los ocho formatos comparten una sola tabla, así que una pieza tiene ocho campos
 * aunque un banner sólo imprima dos. Enseñarlos todos siempre era barato de escribir y
 * caro de usar: quien monta un banner rellenaba titular, titular corto y pie sin que
 * ninguno saliera publicado, y no había forma de enterarse -- se guardan sin protestar.
 *
 * Peor era el par de campos de imagen. «Imagen de la pieza» iba primero y «Cinta»
 * después, pero un banner se pinta con la cinta y la imagen es sólo un respaldo: el
 * orden invitaba a subir el arte al campo equivocado, y lo que salía era el respaldo
 * estirado. [GUIA_DE_FORMATO] nombra cada campo por lo que hace en *ese* formato, y
 * esconde el que ese formato no usa.
 *
 * Las dos columnas siguen existiendo porque la tarjeta nativa necesita dos artes de
 * verdad -- logotipo en la rejilla, cinta a sangre en un listado -- y con un solo
 * archivo, acertar en un hueco garantiza fallar en el otro.
 */

const { ancla } = recorridoPublicidad;

export const AdminPublicidad = () => {
  const [datos, setDatos] = useState({ anunciantes: [], ajustes: {} });
  const [resumen, setResumen] = useState(null);
  // El mapa: la escalera en las próximas recargas y las plazas fijas de hoy.
  const [escalera, setEscalera] = useState([]);
  const [ocupacionHoy, setOcupacionHoy] = useState(null);
  const [carga, setCarga] = useState({ estado: "cargando", error: "" });
  const [error, setError] = useState("");
  // Que anunciante pidio abrir el mural. Guarda el id **y un contador**: pulsar dos
  // veces el mismo logotipo tiene que volver a llevarte alli, y con solo el id la
  // segunda pulsacion no cambiaria el estado y no pasaria nada.
  const [destacado, setDestacado] = useState({ id: null, n: 0 });
  const [asistente, setAsistente] = useState(false);
  const { guardado, confirmar } = useConfirmacionDeGuardado();
  const { toastSuccess, toastError } = useAdminToast();
  // El diálogo del panel, el mismo que usan Medios, Lugares y las otras cinco páginas
  // con borrados. Aquí se usaba `window.confirm`, que pinta una caja del navegador con
  // «localhost:3000 dice» encima de la página: no es del producto, no se puede explicar
  // qué se lleva por delante, y en el móvil sale donde el navegador quiera.
  const { confirm: preguntar, ConfirmDialog } = useAdminConfirm();
  const [ocupado, setOcupado] = useState(false);
  // El anunciante con el que abre el asistente («Nueva campaña» desde una ficha).
  const [asistenteCon, setAsistenteCon] = useState(null);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Publicidad", description: "Publicidad (SurEconomics)." });
  }, []);

  const abrirFicha = (id) => {
    setDestacado((d) => ({ id, n: d.n + 1 }));
    // El desplazamiento espera un cuadro: la ficha se despliega en este mismo render y
    // su altura final no existe todavía.
    requestAnimationFrame(() =>
      document.getElementById(`anunciante-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  };

  const cargar = useCallback(async () => {
    setCarga({ estado: "cargando", error: "" });
    try {
      const [lista, cifras, recargas, ocupacion] = await Promise.all([
        listar(),
        getResumen(30),
        // El mapa no puede tumbar la página: sin él, el resto sigue.
        getEscalera({ recargas: 6, seccion: "portada" }).catch(() => ({ recargas: [] })),
        getOcupacion().catch(() => ({})),
      ]);
      setDatos(lista);
      setResumen(cifras);
      setEscalera(recargas.recargas ?? []);
      setOcupacionHoy(ocupacion);
      setCarga({ estado: "listo", error: "" });
    } catch (err) {
      setCarga({ estado: "error", error: adminErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Los artes de teléfono que armó el panel solo el 2-nov: el sitio ya no los usa, y
  // aquí se ofrecen quitar para que la pieza diga otra vez «Sin arte de teléfono».
  const conAutomatico = useMemo(() => piezasConArteAutomatico(datos.anunciantes), [datos.anunciantes]);
  const quitarArtesAutomaticos = () =>
    correr(async () => {
      for (const pieza of conAutomatico) await actualizarPieza(pieza.id, { cinta_movil_id: null });
      return listar();
    }, "Artes de teléfono automáticos quitados").then((d) => d && setDatos(d));

  /**
   * Ejecuta, avisa de cómo fue, y devuelve lo que salió (o `undefined`).
   *
   * El aviso va flotante y no sólo en la cabecera. Esta pantalla mide más de mil
   * líneas y sus botones están al fondo de cada campaña: el «Guardado ✓» del `<h1>`
   * se pintaba fuera de la pantalla, así que desde abajo pulsar Guardar no producía
   * ninguna señal. Es justo el caso que el propio `AdminToastContext` dice que existe
   * para resolver, y esta página era la única grande que no lo usaba.
   *
   * `aviso` viaja por parámetro en vez de ser un «Guardado» único porque desde abajo
   * no se ve *qué* se guardó: activar una campaña y borrar una pieza son sucesos
   * distintos y quien pulsa tiene que poder distinguirlos sin subir a mirar.
   */
  const correr = async (accion, aviso = "Guardado") => {
    setOcupado(true);
    setError("");
    try {
      const resultado = await accion();
      // Sólo si salió bien. Confirmar en el `finally` diría «guardado» también cuando
      // el servidor rechazó el cambio, que es la mentira más cara de esta pantalla.
      confirmar();
      // `aviso` nulo = recarga interna, que no es un suceso del que informar. Sin esto
      // cada guardado avisaba dos veces: una por el cambio y otra por releer la lista.
      if (aviso) toastSuccess(aviso);
      return resultado;
    } catch (err) {
      const mensaje = adminErrorMessage(err);
      // En los dos sitios: el flotante se ve donde se pulsó pero se desvanece, y el de
      // la cabecera se queda para poder releerlo. Ver `AdminFormFeedback`.
      setError(mensaje);
      toastError(mensaje);
      return undefined;
    } finally {
      setOcupado(false);
    }
  };

  const aplicar = (nuevo) => {
    if (nuevo) setDatos(nuevo);
  };

  // Las cifras, indexadas por pieza, para que cada campaña encuentre las suyas sin
  // recorrer la lista entera en cada render.
  const cifrasPorPieza = Object.fromEntries(
    (resumen?.por_creatividad ?? []).map((e) => [e.creatividad_id, e]),
  );

  const ajustes = datos.ajustes ?? {};

  return (
    <div className="se-admin-shell se-admin-pub">
      <CabeceraDePagina
        titulo={
          <>
            Publicidad
            {guardado ? <span className="se-guardado">Guardado ✓</span> : null}
          </>
        }
        explica="Quién anuncia, qué campañas están al aire y cómo rinden."
        acciones={
          <>
            {/* El camino guiado, arriba y destacado. La lista de abajo sigue haciendo lo
                mismo para quien ya sabe cómo encajan los tres niveles; esto existe para
                quien no, que antes se encontraba una lista vacía y ninguna pista. */}
            <button
              type="button"
              className="se-btn se-btn--primary"
              onClick={() => {
                setAsistenteCon(null);
                setAsistente(true);
              }}
              disabled={carga.estado !== "listo"}
              {...ancla("publicar")}
            >
              Publicar un anuncio
            </button>
          </>
        }
        guia={recorridoPublicidad}
      />

      {carga.estado === "error" ? (
        <p className="se-admin-form-error">{carga.error}</p>
      ) : null}
      {error ? <p className="se-admin-form-error">{error}</p> : null}

      {carga.estado === "listo" ? (
        <>
          <section className="se-admin-pub__cifras" {...ancla("cifras")}>
            <div className="se-admin-pub__cifra">
              <span className="se-admin-pub__cifra-n">
                {(resumen?.impresiones ?? 0).toLocaleString("es")}
              </span>
              <span className="se-admin-pub__cifra-t">impresiones · 30 días</span>
            </div>
            <div className="se-admin-pub__cifra">
              <span className="se-admin-pub__cifra-n">
                {(resumen?.clics ?? 0).toLocaleString("es")}
              </span>
              <span className="se-admin-pub__cifra-t">clics</span>
            </div>
            <div className="se-admin-pub__cifra">
              <span className="se-admin-pub__cifra-n">
                {resumen?.ratio == null ? "—" : `${resumen.ratio} %`}
              </span>
              <span className="se-admin-pub__cifra-t">ratio de clic</span>
            </div>
          </section>

          {conAutomatico.length ? (
            <div className="se-admin-pub__rescate">
              <p>
                <b>
                  {conAutomatico.length}{" "}
                  {conAutomatico.length === 1 ? "pieza tiene" : "piezas tienen"} un arte de
                  teléfono hecho solo por el panel.
                </b>{" "}
                Esa prueba se retiró: el sitio ya no los usa y en el teléfono sale la tira.
                Quítelos para que cada pieza vuelva a marcar «Sin arte de teléfono» hasta que
                el anunciante mande el suyo.
              </p>
              <div className="se-admin-pub__acciones">
                <button
                  type="button"
                  className="se-btn se-btn--primary"
                  disabled={ocupado}
                  onClick={quitarArtesAutomaticos}
                >
                  Quitarlos
                </button>
              </div>
            </div>
          ) : null}

          {/* El mosaico de marcas, detrás de las cifras totales y delante de la lista:
              las cifras dicen cuánto se sirvió y el mosaico, a quién. Con el orden al
              revés habría que bajar hasta la lista para saber quién está al aire. */}
          {/* El mapa del sitio: cada página con sus huecos y, dentro, el carrusel que verá
              el lector en cada recarga. Sustituye al mural: dice lo mismo (quién está al
              aire) y además dónde y en qué orden. */}
          <div {...ancla("mapa")}>
            <MapaDelSitio
              recargas={escalera}
              ocupacion={ocupacionHoy}
              titulo="Mapa del sitio: quién sale en cada hueco"
            />
          </div>

          <TablaDeCampanas
            anunciantes={datos.anunciantes}
            cifras={cifrasPorPieza}
            ocupado={ocupado}
            correr={correr}
            onCambio={aplicar}
            onAbrir={abrirFicha}
          />

          <section className="se-admin-pub__interruptores" {...ancla("interruptores")}>
            <label className="se-admin-pub__casilla">
              <input
                type="checkbox"
                checked={ajustes.activa !== false}
                disabled={ocupado}
                onChange={async (e) => {
                  const encender = e.target.checked;
                  if (!encender) {
                    const apagar = await preguntar({
                      title: "Apagar la publicidad",
                      description:
                        "Los diez espacios del sitio dejan de servir anuncios ahora mismo, para todas las marcas. " +
                        "Es lo que se hace el día de una noticia delicada. Se vuelve a encender con la misma casilla.",
                      confirmLabel: "Apagar la publicidad",
                      cancelLabel: "Dejarla encendida",
                    });
                    if (!apagar) return;
                  }
                  correr(
                    () => fijarAjustes({ activa: encender }),
                    encender
                      ? "Publicidad encendida en todo el sitio"
                      : "Publicidad apagada — los diez espacios dejan de servir",
                  ).then((a) => (a ? setDatos((d) => ({ ...d, ajustes: a })) : null));
                }}
              />
              Publicidad encendida
            </label>
            <label className="se-admin-pub__casilla">
              <input
                type="checkbox"
                checked={!!ajustes.barra_inferior}
                disabled={ocupado}
                onChange={(e) =>
                  correr(
                    () => fijarAjustes({ barra_inferior: e.target.checked }),
                    e.target.checked
                      ? "Barra fija inferior encendida"
                      : "Barra fija inferior apagada",
                  ).then((a) => (a ? setDatos((d) => ({ ...d, ajustes: a })) : null))
                }
              />
              Barra fija inferior
            </label>
            <p className="se-admin-meta-hint">
              La barra nace apagada: es el formato que más molesta y en móvil se come la
              franja donde está el pulgar. El interruptor general apaga los diez espacios
              de golpe, que es lo que hace falta el día de una noticia delicada.
            </p>
            <p className="se-admin-meta-hint">
              Cada hueco rota hasta <b>tres marcas</b>, una cada siete segundos. Quién va
              en cada hueco lo decide la escalera (el mapa de arriba), no un sorteo: en cada
              recarga del lector baja un peldaño, y el peso de una campaña son sus entradas
              en la cola.
            </p>
          </section>

          <h2 className="se-admin-pub__sub" {...ancla("fichas")}>
            Anunciantes
          </h2>
          {datos.anunciantes.length ? (
            datos.anunciantes.map((a) => (
              <TarjetaDeAnunciante
                key={a.id}
                anunciante={a}
                destacada={destacado.id === a.id ? destacado.n : 0}
                ajustes={ajustes}
                cifras={cifrasPorPieza}
                ocupado={ocupado}
                correr={correr}
                preguntar={preguntar}
                onCambio={aplicar}
                onNuevaCampana={(id) => {
                  setAsistenteCon(id);
                  setAsistente(true);
                }}
              />
            ))
          ) : (
            <p className="se-admin-meta-hint">
              Todavía no hay anunciantes. Conviene empezar por uno marcado como relleno
              («Anúnciate aquí»): es el que ocupa los espacios que no ha comprado nadie,
              y sin él quedan huecos vacíos en la portada.
            </p>
          )}
        </>
      ) : null}

      <AsistenteDeAnuncio
        abierto={asistente}
        anunciantes={datos.anunciantes ?? []}
        formatos={ajustes?.formatos}
        anuncianteInicial={asistenteCon}
        correr={correr}
        onCerrar={() => setAsistente(false)}
        onListo={() => {
          setAsistente(false);
          cargar();
        }}
      />

      {/* Uno solo para toda la pantalla: lo abre quien lo necesite a través de
          `preguntar`, que viaja por props igual que `correr`. */}
      <ConfirmDialog />
      <RecorridoVista recorrido={recorridoPublicidad} />
    </div>
  );
};
