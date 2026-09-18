import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";

import { MuralDeAnunciantes } from "../../components/admin/MuralDeAnunciantes";
import { useConfirmacionDeGuardado } from "../../hooks/useConfirmacionDeGuardado";
import { AssetField } from "../../components/admin/AssetField";
import { VistaDeLaPieza } from "../../components/admin/VistaDeLaPieza";
import {
  ACCEPTED_IMAGE_MIME,
  uploadAdminMediaImage,
} from "../../services/adminMediaService";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
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
 * ## La imagen va por id de la biblioteca
 *
 * Y no por un selector visual, todavía. Es la rugosidad conocida de esta primera
 * versión: se copia el id desde Archivos. Cambiarlo por el selector que ya usa el editor
 * de piezas es trabajo de pantalla, no de modelo -- el backend ya valida que el id sea
 * una imagen pública de la biblioteca.
 */

/* ─── Piezas ─────────────────────────────────────────────────────────────── */

const FilaDePieza = ({ pieza, formatos, anunciante, ocupado, onGuardar, onBorrar }) => {
  const [abierta, setAbierta] = useState(false);
  const [borrador, setBorrador] = useState(pieza);
  // El archivo, aparte del borrador: no se guarda -- se manda el id --, es lo que el
  // selector pinta mientras tanto.
  const [imagen, setImagen] = useState(pieza.imagen_asset ?? null);
  const [cinta, setCinta] = useState(pieza.cinta_asset ?? null);
  const [variante, setVariante] = useState("tarjeta");

  useEffect(() => {
    setBorrador(pieza);
    setImagen(pieza.imagen_asset ?? null);
    setCinta(pieza.cinta_asset ?? null);
  }, [pieza]);

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setBorrador((antes) => ({ ...antes, [campo]: valor }));
  };

  return (
    <li className="se-admin-pub__pieza">
      <div className="se-admin-pub__pieza-cabeza">
        <button
          type="button"
          className="se-admin-pub__pieza-titulo"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
        >
          <span>
            {pieza.formato} · {formatos?.[pieza.formato] ?? "—"}
          </span>
          <span className="se-admin-pub__meta">
            {pieza.titular_corto || pieza.titular || "Sin titular"}
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

      {abierta ? (
        <div className="se-admin-pub__pieza-cuerpo">
          <div className="se-admin-pub__doble">
            <div>
              <label className="se-form-label" htmlFor={`p-${pieza.id}-formato`}>
                Formato
              </label>
              <select
                id={`p-${pieza.id}-formato`}
                className="se-form-control"
                value={borrador.formato}
                onChange={cambiar("formato")}
              >
                {Object.entries(formatos ?? {}).map(([letra, nombre]) => (
                  <option key={letra} value={letra}>
                    {letra} · {nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* La imagen, con el mismo selector que las piezas del sitio: se sube aquí y
              se ve al momento. Antes había que abrir Archivos en otra pestaña, subirla,
              copiar el id y pegarlo en un campo numérico -- cuatro pasos y un número que
              no dice nada, para poner un logotipo. */}
          <AssetField
            id={`p-${pieza.id}-imagen`}
            label="Imagen de la pieza"
            hint="El logotipo o el arte del anuncio. Súbalo aquí, o pegue la dirección si vive en otro sitio."
            kind="image"
            value={borrador.imagen_id ?? null}
            asset={imagen}
            onChange={(idDeLaImagen, objeto) => {
              setBorrador((b) => ({ ...b, imagen_id: idDeLaImagen ?? null }));
              setImagen(objeto ?? null);
            }}
            onUpload={uploadAdminMediaImage}
            accept={ACCEPTED_IMAGE_MIME}
          />

          {/* La cinta, aparte de la imagen. Son dos artes distintos, no dos tamaños del
              mismo: una pieza de formato A se pinta como tarjeta en la rejilla —logotipo
              sobre placa— y como cinta a sangre en un listado. Con un solo archivo, subir
              el correcto para un hueco garantiza el incorrecto en el otro, y falla en
              silencio: guarda bien, sale publicada, y solo se ve mal. */}
          <AssetField
            id={`p-${pieza.id}-cinta`}
            label="Cinta (1456 × 180)"
            hint="El arte apaisado que se ve entero en el banner, las franjas, el patrocinio y el boletín. Si no la sube, se usa la imagen de arriba centrada."
            kind="image"
            value={borrador.cinta_id ?? null}
            asset={cinta}
            onChange={(idDeLaCinta, objeto) => {
              setBorrador((b) => ({ ...b, cinta_id: idDeLaCinta ?? null }));
              setCinta(objeto ?? null);
            }}
            onUpload={uploadAdminMediaImage}
            accept={ACCEPTED_IMAGE_MIME}
          />

          {/* Montada con el mismo componente que la publica. Se dibuja con lo que hay
              escrito ahora, no con lo guardado: así el titular que se acaba de teclear
              se ve antes de guardarlo, que es cuando sirve mirarlo. */}
          <VistaDeLaPieza
            pieza={{
              ...borrador,
              imagen: imagen?.url ?? pieza.imagen ?? null,
              cinta: cinta?.url ?? pieza.cinta ?? null,
            }}
            anunciante={anunciante}
            variante={variante}
            onVariante={setVariante}
          />

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
            El rail y la barra inferior tienen la mitad de ancho que un banner. Sin este,
            o el banner se queda corto o la barra se rompe.
          </p>

          <div className="se-admin-pub__doble">
            <div>
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
            </div>
            <div>
              <label className="se-form-label" htmlFor={`p-${pieza.id}-alt`}>
                Texto alternativo
              </label>
              <input
                id={`p-${pieza.id}-alt`}
                className="se-form-control"
                value={borrador.alt ?? ""}
                onChange={cambiar("alt")}
              />
            </div>
          </div>

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

          {/* La casilla y el botón, en una fila con espacio propio. Sueltos eran dos
              elementos en línea sin separación, y el botón acababa montado encima de la
              palabra «Activa». */}
          <div className="se-admin-pub__pie-de-pieza">
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
                  activa: !!borrador.activa,
                })
              }
            >
              Guardar la pieza
            </button>
          </div>
        </div>
      ) : null}
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

/* ─── Segmentos ──────────────────────────────────────────────────────────── */

const Segmentos = ({ valor, tipos, onChange }) => {
  const [tipo, setTipo] = useState(tipos?.[0] ?? "seccion");
  const [texto, setTexto] = useState("");

  return (
    <div className="se-admin-pub__segmentos">
      <p className="se-admin-meta-hint">
        Varias condiciones del <b>mismo tipo</b> son alternativas («Venezuela o
        Colombia»); de <b>tipos distintos</b> se exigen a la vez («Venezuela y además
        Mercados»). Sin ninguna, la campaña sale en todas partes.
      </p>

      <ul className="se-admin-pub__fichas">
        {valor.map((s) => (
          <li key={`${s.tipo}-${s.valor}`} className="se-admin-pub__ficha">
            <span>
              {s.tipo}: <b>{s.valor}</b>
            </span>
            <button
              type="button"
              aria-label={`Quitar ${s.tipo} ${s.valor}`}
              onClick={() =>
                onChange(valor.filter((x) => !(x.tipo === s.tipo && x.valor === s.valor)))
              }
            >
              ✕
            </button>
          </li>
        ))}
        {!valor.length ? <li className="se-admin-meta-hint">En todas partes.</li> : null}
      </ul>

      <div className="se-admin-pub__nueva">
        <select
          className="se-form-control"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          aria-label="Tipo de condición"
        >
          {(tipos ?? []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          className="se-form-control"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="venezuela, mercados, informes…"
          aria-label="Valor de la condición"
        />
        <button
          type="button"
          className="se-btn se-btn--secondary"
          disabled={!texto.trim()}
          onClick={() => {
            const nuevo = { tipo, valor: texto.trim().toLowerCase() };
            if (!valor.some((x) => x.tipo === nuevo.tipo && x.valor === nuevo.valor)) {
              onChange([...valor, nuevo]);
            }
            setTexto("");
          }}
        >
          Añadir
        </button>
      </div>
    </div>
  );
};

Segmentos.propTypes = {
  valor: PropTypes.array.isRequired,
  tipos: PropTypes.array,
  onChange: PropTypes.func.isRequired,
};

/* ─── Campañas ───────────────────────────────────────────────────────────── */

const TarjetaDeCampana = ({
  campana,
  anunciante,
  ajustes,
  cifras,
  ocupado,
  correr,
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
    correr(() =>
      actualizarCampana(campana.id, {
        nombre: borrador.nombre,
        desde: borrador.desde || null,
        hasta: borrador.hasta || null,
        peso: Number(borrador.peso) || 1,
        tope_impresiones: borrador.tope_impresiones === "" ? null : borrador.tope_impresiones,
        exclusiva: !!borrador.exclusiva,
        segmentos: borrador.segmentos ?? [],
        ...extra,
      }),
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
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
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

      {abierta ? (
        <div className="se-admin-pub__campana-cuerpo">
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
          <Segmentos
            valor={borrador.segmentos ?? []}
            tipos={ajustes?.tipos_de_segmento}
            onChange={(segmentos) => setBorrador((a) => ({ ...a, segmentos }))}
          />

          <div className="se-admin-pub__acciones">
            <button
              type="button"
              className="se-btn se-btn--primary"
              disabled={ocupado}
              onClick={() => guardar()}
            >
              Guardar la campaña
            </button>
            <select
              className="se-form-control"
              value={campana.estado}
              disabled={ocupado}
              onChange={(e) => guardar({ estado: e.target.value })}
              aria-label="Estado de la campaña"
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
              onClick={() => {
                if (!window.confirm(`¿Borrar la campaña «${campana.nombre}» y sus piezas?`))
                  return;
                correr(() => borrarCampana(campana.id)).then(() => onCambio(null));
              }}
            >
              Borrar la campaña
            </button>
          </div>

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
                    correr(async () => {
                      await actualizarPieza(pieza.id, datos);
                      return actualizarCampana(campana.id, {});
                    }).then(onCambio)
                  }
                  onBorrar={() => {
                    if (!window.confirm("¿Quitar esta pieza?")) return;
                    correr(async () => {
                      await borrarPieza(pieza.id);
                      return actualizarCampana(campana.id, {});
                    }).then(onCambio);
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
              {Object.entries(ajustes?.formatos ?? {}).map(([letra, nombre]) => (
                <option key={letra} value={letra}>
                  {letra} · {nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() =>
                correr(async () => {
                  await crearPieza(campana.id, { formato: formatoNuevo });
                  return actualizarCampana(campana.id, {});
                }).then(onCambio)
              }
            >
              Añadir pieza
            </button>
          </div>
        </div>
      ) : null}
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
  onCambio: PropTypes.func.isRequired,
};

/* ─── Anunciantes ────────────────────────────────────────────────────────── */

const TarjetaDeAnunciante = ({
  anunciante,
  ajustes,
  cifras,
  ocupado,
  correr,
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

  const recargar = () => correr(() => listar()).then((d) => onCambio(d));

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
                correr(async () => {
                  await actualizarAnunciante(anunciante.id, {
                    nombre: ficha.nombre.trim(),
                    sitio_web: ficha.sitio_web.trim(),
                    contacto_email: ficha.contacto_email.trim(),
                    notas: ficha.notas,
                    activo: ficha.activo,
                    logo_id: ficha.logo_id,
                  });
                  return listar();
                }).then(onCambio)
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
                correr(async () => {
                  await crearCampana(anunciante.id, { nombre: nombreCampana.trim() });
                  setNombreCampana("");
                  return listar();
                }).then(onCambio)
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
                correr(async () => {
                  await actualizarAnunciante(anunciante.id, { activo: !anunciante.activo });
                  return listar();
                }).then(onCambio)
              }
            >
              {anunciante.activo ? "Desactivar" : "Activar"}
            </button>
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() => {
                if (
                  !window.confirm(
                    `¿Borrar «${anunciante.nombre}»? Se van con él sus campañas, sus piezas y sus cifras.`,
                  )
                )
                  return;
                correr(async () => {
                  await borrarAnunciante(anunciante.id);
                  return listar();
                }).then(onCambio);
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
  const { guardado, confirmar } = useConfirmacionDeGuardado();
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

  /** Ejecuta, enseña el error si lo hay, y devuelve lo que salió (o `undefined`). */
  const correr = async (accion) => {
    setOcupado(true);
    setError("");
    try {
      const resultado = await accion();
      // Sólo si salió bien. Confirmar en el `finally` diría «guardado» también cuando
      // el servidor rechazó el cambio, que es la mentira más cara de esta pantalla.
      confirmar();
      return resultado;
    } catch (err) {
      setError(adminErrorMessage(err));
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
                  correr(() => fijarAjustes({ activa: e.target.checked })).then((a) =>
                    a ? setDatos((d) => ({ ...d, ajustes: a })) : null,
                  )
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
                  correr(() => fijarAjustes({ barra_inferior: e.target.checked })).then((a) =>
                    a ? setDatos((d) => ({ ...d, ajustes: a })) : null,
                  )
                }
              />
              Barra fija inferior
            </label>
            <p className="se-admin-meta-hint">
              La barra nace apagada: es el formato que más molesta y en móvil se come la
              franja donde está el pulgar. El interruptor general apaga los diez espacios
              de golpe, que es lo que hace falta el día de una noticia delicada.
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
                correr(async () => {
                  await crearAnunciante({ nombre: nombreNuevo.trim() });
                  setNombreNuevo("");
                  return listar();
                }).then(aplicar)
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
    </div>
  );
};
