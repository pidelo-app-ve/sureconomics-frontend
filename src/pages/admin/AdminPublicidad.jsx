import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";

import { MuralDeAnunciantes } from "../../components/admin/MuralDeAnunciantes";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useConfirmacionDeGuardado } from "../../hooks/useConfirmacionDeGuardado";
import { AssetField } from "../../components/admin/AssetField";
import { AsistenteDeAnuncio } from "../../components/admin/AsistenteDeAnuncio";
import { DondeSale } from "../../components/admin/DondeSale";
import { ModalDelPanel } from "../../components/admin/ModalDelPanel";
import { VistaDeLaPieza } from "../../components/admin/VistaDeLaPieza";
import {
  ACCEPTED_IMAGE_MIME,
  uploadAdminMediaImage,
} from "../../services/adminMediaService";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import {
  GUIA_DE_FORMATO,
  nombreDeFormato,
  resumenDePieza,
} from "../../lib/formatosDePublicidad";
import {
  actualizarAnunciante,
  actualizarCampana,
  actualizarPieza,
  borrarAnunciante,
  borrarCampana,
  borrarPieza,
  crearAnunciante,
  crearCampana,
  crearPieza,
  fijarAjustes,
  getResumen,
  listar,
} from "../../services/adminPublicidadService";

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

/* ─── Piezas ─────────────────────────────────────────────────────────────── */

const FilaDePieza = ({ pieza, formatos, anunciante, ocupado, onGuardar, onBorrar }) => {
  const [abierta, setAbierta] = useState(false);
  const [borrador, setBorrador] = useState(pieza);
  // El archivo, aparte del borrador: no se guarda -- se manda el id --, es lo que el
  // selector pinta mientras tanto.
  const [imagen, setImagen] = useState(pieza.imagen_asset ?? null);
  const [cinta, setCinta] = useState(pieza.cinta_asset ?? null);
  const [movil, setMovil] = useState(pieza.cinta_movil_asset ?? null);
  const [variante, setVariante] = useState("tarjeta");

  useEffect(() => {
    setBorrador(pieza);
    setImagen(pieza.imagen_asset ?? null);
    setCinta(pieza.cinta_asset ?? null);
    setMovil(pieza.cinta_movil_asset ?? null);
  }, [pieza]);

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setBorrador((antes) => ({ ...antes, [campo]: valor }));
  };

  // Lo que publica el formato que está elegido *ahora mismo en el desplegable*, no el
  // que tiene guardado: cambiar el formato reordena el formulario al momento, que es
  // cuando sirve saber qué hace falta.
  const guia = GUIA_DE_FORMATO[borrador.formato] ?? {};
  const artes = guia.arte ?? [];
  const usaCinta = artes.some((a) => a.campo === "cinta");
  const usaImagen = artes.some((a) => a.campo === "imagen");

  // Una imagen guardada en la columna que este formato no usa. Pasa al cambiar de
  // formato, y pasaba mucho más cuando los dos campos salían siempre uno encima de
  // otro. Callarla sería lo peor: en los formatos de cinta la imagen todavía hace de
  // respaldo, así que seguiría saliendo publicada desde un campo que ya no se ve.
  const imagenPerdida = !usaImagen && (borrador.imagen_id ?? null) !== null;
  const cintaPerdida = !usaCinta && (borrador.cinta_id ?? null) !== null;

  /** El selector de archivo de una de las dos columnas, con el nombre que le toca. */
  const campoDeArte = ({ campo, etiqueta, pista, forma }) => {
    const esCinta = campo === "cinta";
    return (
      <AssetField
        key={campo}
        id={`p-${pieza.id}-${campo}`}
        label={etiqueta}
        hint={pista}
        forma={forma}
        kind="image"
        value={borrador[`${campo}_id`] ?? null}
        asset={esCinta ? cinta : imagen}
        onChange={(idNuevo, objeto) => {
          setBorrador((b) => ({ ...b, [`${campo}_id`]: idNuevo ?? null }));
          (esCinta ? setCinta : setImagen)(objeto ?? null);
        }}
        onUpload={uploadAdminMediaImage}
        accept={ACCEPTED_IMAGE_MIME}
      />
    );
  };

  /** Mueve el archivo de una columna a la otra sin volver a subirlo. */
  const mover = (desde, hacia) => {
    const objeto = desde === "cinta" ? cinta : imagen;
    setBorrador((b) => ({ ...b, [`${hacia}_id`]: b[`${desde}_id`], [`${desde}_id`]: null }));
    (hacia === "cinta" ? setCinta : setImagen)(objeto);
    (desde === "cinta" ? setCinta : setImagen)(null);
  };

  const soltar = (campo) => {
    setBorrador((b) => ({ ...b, [`${campo}_id`]: null }));
    (campo === "cinta" ? setCinta : setImagen)(null);
  };

  return (
    <li className="se-admin-pub__pieza">
      <div className="se-admin-pub__pieza-cabeza">
        <button
          type="button"
          className="se-admin-pub__pieza-titulo"
          onClick={() => setAbierta(true)}
        >
          <span>{nombreDeFormato(pieza.formato, formatos)}</span>
          <span className="se-admin-pub__meta">
            {resumenDePieza(pieza, GUIA_DE_FORMATO[pieza.formato])}
          </span>
        </button>
        {!pieza.activa ? <span className="se-admin-pub__sello">Apagada</span> : null}
        <button
          type="button"
          className="se-btn se-btn--secondary"
          disabled={ocupado}
          onClick={onBorrar}
        >
          Quitar
        </button>
      </div>

      {/* El formulario, en un modal y no desplegado bajo la fila. Con anunciante,
          campana y pieza desplegandose cada uno en el sitio, la pagina se convertia en
          un muro donde el campo que se esta rellenando y el boton de guardar quedaban a
          pantallas de distancia. Aqui se abre una cosa a la vez. */}
      <ModalDelPanel
        abierto={abierta}
        ocupado={ocupado}
        onCerrar={() => setAbierta(false)}
        ancho="ancho"
        titulo={nombreDeFormato(pieza.formato, formatos)}
        subtitulo={anunciante?.nombre}
        pie={
          <>
            <label className="se-admin-pub__casilla">
              <input
                type="checkbox"
                checked={!!borrador.activa}
                onChange={cambiar("activa")}
              />
              Activa
            </label>
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() => setAbierta(false)}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="se-btn se-btn--primary"
              disabled={ocupado}
              onClick={() =>
                onGuardar({
                  formato: borrador.formato,
                  titular: borrador.titular,
                  titular_corto: borrador.titular_corto,
                  pie: borrador.pie,
                  alt: borrador.alt,
                  enlace: borrador.enlace,
                  imagen_id: borrador.imagen_id === "" ? null : borrador.imagen_id,
                  cinta_id: borrador.cinta_id === "" ? null : borrador.cinta_id,
                  cinta_movil_id: borrador.cinta_movil_id === "" ? null : borrador.cinta_movil_id ?? null,
                  activa: !!borrador.activa,
                })
              }
            >
              {ocupado ? "Guardando…" : "Guardar la pieza"}
            </button>
          </>
        }
      >
        <div className="se-asis__cuerpo">
          <label className="se-form-label" htmlFor={`p-${pieza.id}-formato`}>
            Formato
          </label>
          <select
            id={`p-${pieza.id}-formato`}
            className="se-form-control"
            value={borrador.formato}
            onChange={cambiar("formato")}
          >
            {Object.keys(formatos ?? {}).map((letra) => (
              <option key={letra} value={letra}>
                {nombreDeFormato(letra, formatos)}
              </option>
            ))}
          </select>
          {guia.donde ? <p className="se-admin-meta-hint">{guia.donde}</p> : null}

          {guia.sinSalida ? (
            <p className="se-admin-pub__aviso">{guia.sinSalida}</p>
          ) : null}
          {guia.soloTexto ? (
            <p className="se-admin-meta-hint">{guia.soloTexto}</p>
          ) : null}

          {/* Sólo los campos de arte que este formato publica, con el nombre de lo que
              hacen aquí. El selector sube el archivo en el sitio y lo enseña al momento:
              no hay que abrir Archivos en otra pestaña ni copiar ningún identificador. */}
          {artes.map(campoDeArte)}
          {/* La tira es 8:1: en un teléfono mide unos 48 px de alto y el texto deja de
              leerse. Escalar no reacomoda -- da igual SVG o JPEG --, así que el
              teléfono necesita su propia composición. Sin ella, sale la tira entera. */}
          {usaCinta ? (
            <AssetField
              id={`p-${pieza.id}-cinta-movil`}
              label="Arte para teléfono — 1200 × 600 px (opcional)"
              hint="Lo mismo que la tira, pero con el logo, la frase y el botón apilados. Se usa en pantallas de menos de 640 px. Sin él, en el teléfono sale la tira entera, más pequeña."
              forma={{ ancho: 2, alto: 1 }}
              kind="image"
              value={borrador.cinta_movil_id ?? null}
              asset={movil}
              onChange={(idNuevo, objeto) => {
                setBorrador((b) => ({ ...b, cinta_movil_id: idNuevo ?? null }));
                setMovil(objeto ?? null);
              }}
              onUpload={uploadAdminMediaImage}
              accept={ACCEPTED_IMAGE_MIME}
            />
          ) : null}

          {imagenPerdida || cintaPerdida ? (
            <div className="se-admin-pub__rescate">
              <p>
                Hay un archivo subido en el campo que <b>{guia.nombre ?? "este formato"}</b>{" "}
                no usa
                {imagenPerdida && usaCinta
                  ? ", y por eso la pieza no se ve como debería."
                  : "."}
              </p>
              <div className="se-admin-pub__acciones">
                {imagenPerdida && usaCinta ? (
                  <button
                    type="button"
                    className="se-btn se-btn--primary"
                    onClick={() => mover("imagen", "cinta")}
                  >
                    Usarlo como arte de este formato
                  </button>
                ) : null}
                {cintaPerdida && usaImagen ? (
                  <button
                    type="button"
                    className="se-btn se-btn--primary"
                    onClick={() => mover("cinta", "imagen")}
                  >
                    Usarlo como arte de este formato
                  </button>
                ) : null}
                <button
                  type="button"
                  className="se-btn se-btn--secondary"
                  onClick={() => soltar(imagenPerdida ? "imagen" : "cinta")}
                >
                  Quitarlo
                </button>
              </div>
            </div>
          ) : null}

          {guia.titular ? (
            <>
              <label className="se-form-label" htmlFor={`p-${pieza.id}-titular`}>
                Titular
              </label>
              <input
                id={`p-${pieza.id}-titular`}
                className="se-form-control"
                value={borrador.titular ?? ""}
                onChange={cambiar("titular")}
              />

              <label className="se-form-label" htmlFor={`p-${pieza.id}-corto`}>
                Titular corto
              </label>
              <input
                id={`p-${pieza.id}-corto`}
                className="se-form-control"
                value={borrador.titular_corto ?? ""}
                onChange={cambiar("titular_corto")}
              />
              <p className="se-admin-meta-hint">
                Para donde no cabe el largo: el rail tiene menos de la mitad de ancho que
                un banner. Si lo deja vacío, allí se usa el titular entero y se corta.
              </p>
            </>
          ) : null}

          {guia.pie ? (
            <>
              <label className="se-form-label" htmlFor={`p-${pieza.id}-pie`}>
                Pie
              </label>
              <input
                id={`p-${pieza.id}-pie`}
                className="se-form-control"
                value={borrador.pie ?? ""}
                onChange={cambiar("pie")}
                placeholder="Contenido patrocinado"
              />
            </>
          ) : null}

          <label className="se-form-label" htmlFor={`p-${pieza.id}-enlace`}>
            Destino
          </label>
          <input
            id={`p-${pieza.id}-enlace`}
            className="se-form-control"
            value={borrador.enlace ?? ""}
            onChange={cambiar("enlace")}
            placeholder="https://…"
          />

          {/* El texto alternativo, plegado. No se publica en ninguna parte: es lo que
              lee en voz alta un lector de pantalla y lo que sale si la imagen no carga.
              Estaba al mismo nivel que el arte y el destino, y en un banner —donde lo
              único que se ve es la cinta— parecía un campo más que hay que rellenar
              para que la pieza salga. Vacío no rompe nada: el sitio usa el nombre del
              anunciante. */}
          {artes.length ? (
            <details className="se-admin-pub__extra">
              <summary>Texto alternativo (opcional)</summary>
              <p className="se-admin-meta-hint">
                No se publica. Lo lee en voz alta un lector de pantalla, y es lo que
                aparece si la imagen no carga. Si lo deja vacío se usa
                «{anunciante?.nombre ?? "el nombre del anunciante"}».
              </p>
              <input
                id={`p-${pieza.id}-alt`}
                className="se-form-control"
                aria-label="Texto alternativo"
                value={borrador.alt ?? ""}
                onChange={cambiar("alt")}
                placeholder={anunciante?.nombre ?? "Nombre del anunciante"}
              />
            </details>
          ) : null}

          {/* Al final y no en medio del formulario: se mira cuando ya está todo puesto.
              Montada con el mismo componente que la publica, y con lo que hay escrito
              ahora — no con lo guardado —, que es cuando sirve mirarlo. */}
          <VistaDeLaPieza
            pieza={{
              ...borrador,
              imagen: imagen?.url ?? pieza.imagen ?? null,
              cinta: cinta?.url ?? pieza.cinta ?? null,
            }}
            anunciante={anunciante}
            variante={variante}
            onVariante={setVariante}
            usaTitular={!!guia.titular}
          />

          {/* La casilla y el botón, en una fila con espacio propio. Sueltos eran dos
              elementos en línea sin separación, y el botón acababa montado encima de la
              palabra «Activa». */}
        </div>
      </ModalDelPanel>
    </li>
  );
};

FilaDePieza.propTypes = {
  pieza: PropTypes.object.isRequired,
  /** Para poder pintar la etiqueta «Publicidad · [marca]» en la vista previa. */
  anunciante: PropTypes.object,
  formatos: PropTypes.object,
  ocupado: PropTypes.bool,
  onGuardar: PropTypes.func.isRequired,
  onBorrar: PropTypes.func.isRequired,
};

/* ─── Campañas ───────────────────────────────────────────────────────────── */

const TarjetaDeCampana = ({
  campana,
  anunciante,
  ajustes,
  cifras,
  ocupado,
  correr,
  preguntar,
  onCambio,
}) => {
  const [abierta, setAbierta] = useState(false);
  const [borrador, setBorrador] = useState(campana);
  const [formatoNuevo, setFormatoNuevo] = useState("A");

  useEffect(() => setBorrador(campana), [campana]);

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setBorrador((antes) => ({ ...antes, [campo]: valor }));
  };

  const guardar = (extra = {}) =>
    correr(
      () =>
        actualizarCampana(campana.id, {
          nombre: borrador.nombre,
          desde: borrador.desde || null,
          hasta: borrador.hasta || null,
          peso: Number(borrador.peso) || 1,
          tope_impresiones:
            borrador.tope_impresiones === "" ? null : borrador.tope_impresiones,
          exclusiva: !!borrador.exclusiva,
          segmentos: borrador.segmentos ?? [],
          ...extra,
        }),
      // Cambiar el estado es lo único de esta pantalla que altera si la campaña sale
      // publicada o no, así que se dice en vez de un «guardada» que suena a nada.
      extra.estado
        ? `Campaña «${campana.nombre}» ahora está ${extra.estado}`
        : `Campaña «${campana.nombre}» guardada`,
    ).then(onCambio);

  const totales = (campana.creatividades ?? []).reduce(
    (acc, cr) => {
      const c = cifras?.[cr.id];
      return {
        impresiones: acc.impresiones + (c?.impresiones ?? 0),
        clics: acc.clics + (c?.clics ?? 0),
      };
    },
    { impresiones: 0, clics: 0 },
  );

  return (
    <li className="se-admin-pub__campana">
      <div className="se-admin-pub__campana-cabeza">
        <button
          type="button"
          className="se-admin-pub__campana-titulo"
          onClick={() => setAbierta(true)}
        >
          <span>{campana.nombre}</span>
          <span className="se-admin-pub__meta">
            {campana.creatividades?.length ?? 0} piezas
            {campana.desde || campana.hasta
              ? ` · ${campana.desde ?? "…"} → ${campana.hasta ?? "…"}`
              : " · sin fechas"}
            {totales.impresiones
              ? ` · ${totales.impresiones.toLocaleString("es")} impresiones, ${totales.clics} clics`
              : ""}
          </span>
        </button>
        <span
          className={`se-admin-pub__estado se-admin-pub__estado--${campana.estado}`}
        >
          {campana.estado}
        </span>
      </div>

      {/* Los ajustes de la campana, en modal. La lista de piezas se queda fuera --
          debajo de esta fila-- porque es navegacion y no formulario: hay que verla para
          saber que falta, y meterla dentro obligaria a abrir el modal para mirarla. */}
      <ModalDelPanel
        abierto={abierta}
        ocupado={ocupado}
        onCerrar={() => setAbierta(false)}
        ancho="ancho"
        titulo={campana.nombre}
        subtitulo={anunciante?.nombre}
        pie={
          <>
            <select
              className="se-form-control"
              value={campana.estado}
              disabled={ocupado}
              onChange={(e) => guardar({ estado: e.target.value })}
              aria-label="Estado de la campana"
            >
              {(ajustes?.estados ?? []).map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() => setAbierta(false)}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="se-btn se-btn--primary"
              disabled={ocupado}
              onClick={() => guardar()}
            >
              {ocupado ? "Guardando…" : "Guardar la campana"}
            </button>
          </>
        }
      >
        <div className="se-asis__cuerpo">
          <label className="se-form-label" htmlFor={`c-${campana.id}-nombre`}>
            Nombre
          </label>
          <input
            id={`c-${campana.id}-nombre`}
            className="se-form-control"
            value={borrador.nombre ?? ""}
            onChange={cambiar("nombre")}
          />

          <div className="se-admin-pub__doble">
            <div>
              <label className="se-form-label" htmlFor={`c-${campana.id}-desde`}>
                Desde
              </label>
              <input
                id={`c-${campana.id}-desde`}
                type="date"
                className="se-form-control"
                value={borrador.desde ?? ""}
                onChange={cambiar("desde")}
              />
            </div>
            <div>
              <label className="se-form-label" htmlFor={`c-${campana.id}-hasta`}>
                Hasta
              </label>
              <input
                id={`c-${campana.id}-hasta`}
                type="date"
                className="se-form-control"
                value={borrador.hasta ?? ""}
                onChange={cambiar("hasta")}
              />
            </div>
          </div>

          <div className="se-admin-pub__doble">
            <div>
              <label className="se-form-label" htmlFor={`c-${campana.id}-peso`}>
                Peso (1–10)
              </label>
              <input
                id={`c-${campana.id}-peso`}
                type="number"
                min="1"
                max="10"
                className="se-form-control"
                value={borrador.peso ?? 5}
                onChange={cambiar("peso")}
              />
            </div>
            <div>
              <label className="se-form-label" htmlFor={`c-${campana.id}-tope`}>
                Tope de impresiones
              </label>
              <input
                id={`c-${campana.id}-tope`}
                inputMode="numeric"
                className="se-form-control"
                value={borrador.tope_impresiones ?? ""}
                onChange={cambiar("tope_impresiones")}
                placeholder="Sin tope"
              />
            </div>
          </div>
          <p className="se-admin-meta-hint">
            Con tope y fechas, el reparto se hace a lo largo del periodo: una campaña que
            va adelantada pesa la mitad, para que no se gaste el mes en tres días.
          </p>

          <label className="se-admin-pub__casilla">
            <input
              type="checkbox"
              checked={!!borrador.exclusiva}
              onChange={cambiar("exclusiva")}
            />
            Exclusiva — mientras encaje, nadie más entra en ese espacio
          </label>

          <h4 className="se-admin-pub__sub">Dónde sale</h4>
          <DondeSale
            valor={borrador.segmentos ?? []}
            onChange={(segmentos) => setBorrador((a) => ({ ...a, segmentos }))}
          />

          <div className="se-admin-pub__acciones">
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={async () => {
                const n = campana.creatividades?.length ?? 0;
                const vale = await preguntar({
                  title: `¿Borrar la campaña «${campana.nombre}»?`,
                  description:
                    n > 0
                      ? `Se van con ella sus ${n} ${n === 1 ? "pieza" : "piezas"} y las cifras de cada una.`
                      : "No tiene piezas, así que no se pierde ningún arte.",
                  confirmLabel: "Borrar la campaña",
                  busyLabel: "Borrando…",
                  warning:
                    "Las impresiones y los clics ya contados se pierden, y eso no se puede deshacer.",
                });
                if (!vale) return;
                correr(
                  () => borrarCampana(campana.id),
                  `Campaña «${campana.nombre}» borrada`,
                ).then(() => onCambio(null));
              }}
            >
              Borrar la campaña
            </button>
          </div>
        </div>
      </ModalDelPanel>

      <div className="se-admin-pub__campana-cuerpo">
          <h4 className="se-admin-pub__sub">Piezas</h4>
          {campana.creatividades?.length ? (
            <ul className="se-admin-pub__piezas">
              {campana.creatividades.map((pieza) => (
                <FilaDePieza
                  key={pieza.id}
                  pieza={pieza}
                  formatos={ajustes?.formatos}
                  anunciante={anunciante}
                  ocupado={ocupado}
                  onGuardar={(datos) =>
                    correr(
                      async () => {
                        await actualizarPieza(pieza.id, datos);
                        return actualizarCampana(campana.id, {});
                      },
                      `${nombreDeFormato(datos.formato, ajustes?.formatos)} guardado`,
                    ).then(onCambio)
                  }
                  onBorrar={async () => {
                    const vale = await preguntar({
                      title: `¿Quitar ${nombreDeFormato(pieza.formato, ajustes?.formatos).toLowerCase()}?`,
                      description:
                        "Se borra la pieza y sus cifras. El arte se queda en Archivos, así que se puede volver a usar.",
                      confirmLabel: "Quitar la pieza",
                      busyLabel: "Quitando…",
                      // La descripcion ya dice exactamente que se pierde y que no.
                      warning: null,
                    });
                    if (!vale) return;
                    correr(
                      async () => {
                        await borrarPieza(pieza.id);
                        return actualizarCampana(campana.id, {});
                      },
                      `${nombreDeFormato(pieza.formato, ajustes?.formatos)} quitado`,
                    ).then(onCambio);
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="se-admin-meta-hint">
              Sin piezas. Una campaña sin ninguna pieza activa no se puede activar: no
              fallaría en ningún sitio, simplemente no saldría nunca.
            </p>
          )}

          <div className="se-admin-pub__nueva">
            <select
              className="se-form-control"
              value={formatoNuevo}
              onChange={(e) => setFormatoNuevo(e.target.value)}
              aria-label="Formato de la nueva pieza"
            >
              {Object.keys(ajustes?.formatos ?? {}).map((letra) => (
                <option key={letra} value={letra}>
                  {nombreDeFormato(letra, ajustes?.formatos)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() =>
                correr(
                  async () => {
                    await crearPieza(campana.id, { formato: formatoNuevo });
                    return actualizarCampana(campana.id, {});
                  },
                  `${nombreDeFormato(formatoNuevo, ajustes?.formatos)} añadido — ábralo para ponerle el arte`,
                ).then(onCambio)
              }
            >
              Añadir pieza
            </button>
          </div>
      </div>
    </li>
  );
};

TarjetaDeCampana.propTypes = {
  campana: PropTypes.object.isRequired,
  /** Se pasa a cada pieza para la vista previa: la etiqueta lleva su marca. */
  anunciante: PropTypes.object,
  ajustes: PropTypes.object,
  cifras: PropTypes.object,
  ocupado: PropTypes.bool,
  correr: PropTypes.func.isRequired,
  /** Abre el diálogo del panel y resuelve a `true` si se confirmó. */
  preguntar: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
};

/* ─── Anunciantes ────────────────────────────────────────────────────────── */

const TarjetaDeAnunciante = ({
  anunciante,
  ajustes,
  cifras,
  ocupado,
  correr,
  preguntar,
  onCambio,
  destacada,
}) => {
  const [abierta, setAbierta] = useState(false);
  const [ficha, setFicha] = useState({
    nombre: anunciante.nombre,
    sitio_web: anunciante.sitio_web ?? "",
    contacto_email: anunciante.contacto_email ?? "",
    notas: anunciante.notas ?? "",
    activo: anunciante.activo,
    logo_id: anunciante.logo_id ?? null,
  });
  const [logo, setLogo] = useState(anunciante.logo ?? null);

  useEffect(() => {
    setFicha({
      nombre: anunciante.nombre,
      sitio_web: anunciante.sitio_web ?? "",
      contacto_email: anunciante.contacto_email ?? "",
      notas: anunciante.notas ?? "",
      activo: anunciante.activo,
      logo_id: anunciante.logo_id ?? null,
    });
    setLogo(anunciante.logo ?? null);
  }, [
    anunciante.nombre,
    anunciante.sitio_web,
    anunciante.contacto_email,
    anunciante.notas,
    anunciante.activo,
    anunciante.logo_id,
    anunciante.logo,
  ]);

  // El mural de arriba pide abrir una ficha concreta. Se obedece abriendo, nunca
  // cerrando: quien tenia otras dos desplegadas comparando campanas no quiere que
  // pulsar un logotipo se las cierre.
  useEffect(() => {
    if (destacada) setAbierta(true);
  }, [destacada]);
  const [nombreCampana, setNombreCampana] = useState("");

  // Sin aviso: releer la lista después de un cambio no es un suceso propio, y avisarlo
  // tapaba el mensaje del cambio que acababa de producirlo.
  const recargar = () => correr(() => listar(), null).then((d) => onCambio(d));

  return (
    <section className="se-admin-pub__anunciante" id={`anunciante-${anunciante.id}`}>
      <div className="se-admin-pub__anunciante-cabeza">
        <button
          type="button"
          className="se-admin-pub__anunciante-titulo"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
        >
          <span>{anunciante.nombre}</span>
          <span className="se-admin-pub__meta">
            /{anunciante.slug} · {anunciante.campanas?.length ?? 0} campañas
            {anunciante.contacto_email ? ` · ${anunciante.contacto_email}` : ""}
          </span>
        </button>
        {anunciante.es_casa ? (
          <span className="se-admin-pub__sello se-admin-pub__sello--casa">Relleno</span>
        ) : null}
        {!anunciante.activo ? <span className="se-admin-pub__sello">Inactivo</span> : null}
      </div>

      {abierta ? (
        <div className="se-admin-pub__anunciante-cuerpo">
          {anunciante.es_casa ? (
            <p className="se-admin-meta-hint">
              Este es el anunciante de relleno: ocupa cualquier espacio que no haya
              comprado nadie. No entra en el sorteo y no compite con las campañas pagadas.
            </p>
          ) : null}

          {/* La ficha de la marca. Antes un anunciante era solo un nombre: no había
              dónde poner su logotipo ni su página, y el panel tenía que deducir quién
              era a partir del arte de alguna de sus campañas -- que cambia cada mes. */}
          <AssetField
            id={`a-${anunciante.id}-logo`}
            label="Logotipo de la marca"
            hint="Sale en el mosaico de arriba y sirve para reconocer al anunciante aunque su campaña de este mes lleve otro arte."
            kind="image"
            value={ficha.logo_id}
            asset={logo}
            onChange={(id, objeto) => {
              setFicha((f) => ({ ...f, logo_id: id ?? null }));
              setLogo(objeto ?? null);
            }}
            onUpload={uploadAdminMediaImage}
            accept={ACCEPTED_IMAGE_MIME}
          />

          <div className="se-admin-pub__doble">
            <div>
              <label className="se-form-label" htmlFor={`a-${anunciante.id}-nombre`}>
                Nombre
              </label>
              <input
                id={`a-${anunciante.id}-nombre`}
                className="se-form-control"
                value={ficha.nombre}
                onChange={(e) => setFicha({ ...ficha, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="se-form-label" htmlFor={`a-${anunciante.id}-web`}>
                Página de la marca
              </label>
              <input
                id={`a-${anunciante.id}-web`}
                className="se-form-control"
                type="url"
                placeholder="https://…"
                value={ficha.sitio_web}
                onChange={(e) => setFicha({ ...ficha, sitio_web: e.target.value })}
              />
              {/* No es el destino de los anuncios: ese va en cada pieza, porque una
                  campaña puede apuntar a una promoción concreta y no a la portada. */}
              <p className="se-admin-meta-hint">
                La dirección de la empresa. El destino de cada anuncio se pone en su
                pieza.
              </p>
            </div>
          </div>

          <div className="se-admin-pub__doble">
            <div>
              <label className="se-form-label" htmlFor={`a-${anunciante.id}-correo`}>
                Contacto
              </label>
              <input
                id={`a-${anunciante.id}-correo`}
                className="se-form-control"
                type="email"
                placeholder="comercial@…"
                value={ficha.contacto_email}
                onChange={(e) => setFicha({ ...ficha, contacto_email: e.target.value })}
              />
            </div>
            <label className="se-admin-pub__casilla">
              <input
                type="checkbox"
                checked={ficha.activo}
                disabled={ocupado}
                onChange={(e) => setFicha({ ...ficha, activo: e.target.checked })}
              />
              Activo
            </label>
          </div>

          <label className="se-form-label" htmlFor={`a-${anunciante.id}-notas`}>
            Notas
          </label>
          <textarea
            id={`a-${anunciante.id}-notas`}
            className="se-form-control"
            rows={2}
            placeholder="Condiciones acordadas, quién es el contacto, lo que convenga recordar."
            value={ficha.notas}
            onChange={(e) => setFicha({ ...ficha, notas: e.target.value })}
          />

          <div className="se-admin-pub__acciones">
            <button
              type="button"
              className="se-btn"
              disabled={ocupado || !ficha.nombre.trim()}
              onClick={() =>
                correr(
                  async () => {
                    await actualizarAnunciante(anunciante.id, {
                      nombre: ficha.nombre.trim(),
                      sitio_web: ficha.sitio_web.trim(),
                      contacto_email: ficha.contacto_email.trim(),
                      notas: ficha.notas,
                      activo: ficha.activo,
                      logo_id: ficha.logo_id,
                    });
                    return listar();
                  },
                  `Ficha de «${ficha.nombre.trim()}» guardada`,
                ).then(onCambio)
              }
            >
              Guardar el anunciante
            </button>
          </div>

          <h4 className="se-admin-pub__sub">Campañas</h4>
          <ul className="se-admin-pub__campanas">
            {(anunciante.campanas ?? []).map((campana) => (
              <TarjetaDeCampana
                key={campana.id}
                campana={campana}
                anunciante={anunciante}
                ajustes={ajustes}
                cifras={cifras}
                ocupado={ocupado}
                correr={correr}
                preguntar={preguntar}
                onCambio={recargar}
              />
            ))}
          </ul>

          <div className="se-admin-pub__nueva">
            <input
              className="se-form-control"
              placeholder="Nombre de la nueva campaña"
              value={nombreCampana}
              onChange={(e) => setNombreCampana(e.target.value)}
            />
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado || !nombreCampana.trim()}
              onClick={() =>
                correr(
                  async () => {
                    await crearCampana(anunciante.id, { nombre: nombreCampana.trim() });
                    setNombreCampana("");
                    return listar();
                  },
                  // Nace en borrador, y eso decide si sale publicada. Decirlo aquí
                  // evita la pregunta de por qué no se ve nada en el sitio.
                  `Campaña «${nombreCampana.trim()}» creada en borrador`,
                ).then(onCambio)
              }
            >
              Nueva campaña
            </button>
          </div>

          <div className="se-admin-pub__acciones">
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() =>
                correr(
                  async () => {
                    await actualizarAnunciante(anunciante.id, {
                      activo: !anunciante.activo,
                    });
                    return listar();
                  },
                  anunciante.activo
                    ? `«${anunciante.nombre}» desactivado — sus campañas dejan de salir`
                    : `«${anunciante.nombre}» activado`,
                ).then(onCambio)
              }
            >
              {anunciante.activo ? "Desactivar" : "Activar"}
            </button>
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={async () => {
                const n = anunciante.campanas?.length ?? 0;
                const vale = await preguntar({
                  title: `¿Borrar «${anunciante.nombre}»?`,
                  description: `Se van con él sus ${n} ${n === 1 ? "campaña" : "campañas"}, todas sus piezas y el histórico de impresiones y clics. Si sólo quiere que deje de salir, use «Desactivar».`,
                  confirmLabel: "Borrar el anunciante",
                  busyLabel: "Borrando…",
                  warning:
                    "Las cifras históricas se pierden, y eso no se puede deshacer.",
                });
                if (!vale) return;
                correr(
                  async () => {
                    await borrarAnunciante(anunciante.id);
                    return listar();
                  },
                  `«${anunciante.nombre}» borrado con sus campañas y sus cifras`,
                ).then(onCambio);
              }}
            >
              Borrar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

TarjetaDeAnunciante.propTypes = {
  /** Contador que sube cada vez que el mural pide abrir esta ficha. */
  destacada: PropTypes.number,
  anunciante: PropTypes.object.isRequired,
  ajustes: PropTypes.object,
  cifras: PropTypes.object,
  ocupado: PropTypes.bool,
  correr: PropTypes.func.isRequired,
  /** Abre el dialogo del panel y resuelve a `true` si se confirmo. */
  preguntar: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
};

/* ─── La pantalla ────────────────────────────────────────────────────────── */

export const AdminPublicidad = () => {
  const [datos, setDatos] = useState({ anunciantes: [], ajustes: {} });
  const [resumen, setResumen] = useState(null);
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
  const [nombreNuevo, setNombreNuevo] = useState("");

  const cargar = useCallback(async () => {
    setCarga({ estado: "cargando", error: "" });
    try {
      const [lista, cifras] = await Promise.all([listar(), getResumen(30)]);
      setDatos(lista);
      setResumen(cifras);
      setCarga({ estado: "listo", error: "" });
    } catch (err) {
      setCarga({ estado: "error", error: adminErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

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
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-admin-shell__title">
            Publicidad
            {guardado ? <span className="se-guardado">Guardado ✓</span> : null}
          </h1>
          <p className="se-admin-shell__subtitle">
            Los ocho formatos del documento comercial, repartidos en diez espacios del
            sitio. Decide el servidor y se rota por carga de página, no por reloj: un
            anuncio que cambia solo mientras alguien lee es lo que hace que la gente
            instale bloqueadores.
          </p>
        </div>
        {/* El camino guiado, arriba y destacado. La lista de abajo sigue haciendo lo
            mismo para quien ya sabe cómo encajan los tres niveles; esto existe para
            quien no, que antes se encontraba una lista vacía y ninguna pista. */}
        <button
          type="button"
          className="se-btn se-btn--primary"
          onClick={() => setAsistente(true)}
          disabled={carga.estado !== "listo"}
        >
          Publicar un anuncio
        </button>
      </header>

      {carga.estado === "error" ? (
        <p className="se-admin-form-error">{carga.error}</p>
      ) : null}
      {error ? <p className="se-admin-form-error">{error}</p> : null}

      {carga.estado === "listo" ? (
        <>
          <section className="se-admin-pub__cifras">
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

          {/* El mosaico de marcas, detrás de las cifras totales y delante de la lista:
              las cifras dicen cuánto se sirvió y el mosaico, a quién. Con el orden al
              revés habría que bajar hasta la lista para saber quién está al aire. */}
          <MuralDeAnunciantes
            anunciantes={datos.anunciantes}
            cifrasPorPieza={cifrasPorPieza}
            onAbrir={(id) => {
              setDestacado((d) => ({ id, n: d.n + 1 }));
              // El desplazamiento espera un cuadro: la ficha se despliega en este
              // mismo render y su altura final no existe todavía.
              requestAnimationFrame(() =>
                document
                  .getElementById(`anunciante-${id}`)
                  ?.scrollIntoView({ block: "start", behavior: "smooth" }),
              );
            }}
          />

          <section className="se-admin-pub__interruptores">
            <label className="se-admin-pub__casilla">
              <input
                type="checkbox"
                checked={ajustes.activa !== false}
                disabled={ocupado}
                onChange={(e) =>
                  correr(
                    () => fijarAjustes({ activa: e.target.checked }),
                    e.target.checked
                      ? "Publicidad encendida en todo el sitio"
                      : "Publicidad apagada — los diez espacios dejan de servir",
                  ).then((a) => (a ? setDatos((d) => ({ ...d, ajustes: a })) : null))
                }
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
            <label className="se-admin-pub__casilla">
              <input
                type="checkbox"
                checked={!!ajustes.repetir_anunciante}
                disabled={ocupado}
                onChange={(e) =>
                  correr(
                    () => fijarAjustes({ repetir_anunciante: e.target.checked }),
                    e.target.checked
                      ? "Un anunciante ya puede ocupar varios espacios de la misma página"
                      : "Vuelve a repartirse: un anunciante, un espacio por página",
                  ).then((a) => (a ? setDatos((d) => ({ ...d, ajustes: a })) : null))
                }
              />
              Un anunciante puede repetir en la misma página
            </label>
            <p className="se-admin-meta-hint">
              La barra nace apagada: es el formato que más molesta y en móvil se come la
              franja donde está el pulgar. El interruptor general apaga los diez espacios
              de golpe, que es lo que hace falta el día de una noticia delicada.
            </p>
            <p className="se-admin-meta-hint">
              <b>Repetir</b> está pensado para cuando hay poco inventario. Apagado, cada
              marca ocupa un solo espacio por página y el resto queda libre para otras —
              con pocos anunciantes eso deja huecos vacíos. Encendido, una misma marca
              puede llevarse el banner, el boletín y la tarjeta de la misma portada.
            </p>
          </section>

          <div className="se-admin-pub__nueva se-admin-pub__nueva--alta">
            <input
              className="se-form-control"
              placeholder="Nombre del nuevo anunciante"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
            />
            <button
              type="button"
              className="se-btn se-btn--primary"
              disabled={ocupado || !nombreNuevo.trim()}
              onClick={() =>
                correr(
                  async () => {
                    await crearAnunciante({ nombre: nombreNuevo.trim() });
                    setNombreNuevo("");
                    return listar();
                  },
                  `Anunciante «${nombreNuevo.trim()}» creado — ahora hace falta una campaña`,
                ).then(aplicar)
              }
            >
              Nuevo anunciante
            </button>
          </div>

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
    </div>
  );
};
