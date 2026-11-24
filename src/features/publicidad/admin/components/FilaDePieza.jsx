import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { PlazasFijas } from "./PlazasFijas";
import { ModalDelPanel } from "../../../../components/admin/ModalDelPanel";
import { VistaDeLaPieza } from "./VistaDeLaPieza";
import { CampoDeArte } from "./CampoDeArte";
import { guardarSoloEseArte } from "../aligerarArte";
import {
  ARTE_DE_TELEFONO,
  GUIA_DE_FORMATO,
  nombreDeFormato,
  resumenDePieza,
} from "../utils";
import { conArteAutomatico } from "../arteAutomatico";

/**
 * Lo que se está escribiendo en la pieza (`borrador`) y los archivos de sus tres artes,
 * aparte: no se guardan -- se manda el id --, son lo que el selector pinta mientras tanto.
 * Cuando la pieza vuelve del servidor, se toma entera; salvo si «Aligerar» acaba de guardar
 * solo un arte (`soloArte` dice cuál): entonces solo ese, y lo demás que se esté
 * escribiendo y aún no se haya guardado no se pierde.
 */
const useBorradorDePieza = (pieza) => {
  const [borrador, setBorrador] = useState(pieza);
  const [imagen, setImagen] = useState(pieza.imagen_asset ?? null);
  const [cinta, setCinta] = useState(pieza.cinta_asset ?? null);
  const [movil, setMovil] = useState(pieza.cinta_movil_asset ?? null);
  const soloArte = useRef(null);
  const ponerAsset = { imagen: setImagen, cinta: setCinta, cinta_movil: setMovil };

  useEffect(() => {
    const campo = soloArte.current;
    soloArte.current = null;
    if (campo) {
      const id = `${campo}_id`;
      setBorrador((b) => ({ ...b, [id]: pieza[id] ?? null }));
      ({ imagen: setImagen, cinta: setCinta, cinta_movil: setMovil })[campo](pieza[`${campo}_asset`] ?? null);
      return;
    }
    setBorrador(pieza);
    setImagen(pieza.imagen_asset ?? null);
    setCinta(pieza.cinta_asset ?? null);
    setMovil(pieza.cinta_movil_asset ?? null);
  }, [pieza]);

  return { borrador, setBorrador, imagen, setImagen, cinta, setCinta, movil, ponerAsset, soloArte };
};

export const FilaDePieza = ({ pieza, campana, formatos, anunciante, ocupado, preguntar, onGuardar, onCambiarArte, onBorrar }) => {
  const [abierta, setAbierta] = useState(false);
  const { borrador, setBorrador, imagen, setImagen, cinta, setCinta, movil, ponerAsset, soloArte } =
    useBorradorDePieza(pieza);
  const [variante, setVariante] = useState("tarjeta");

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

  /** El selector del arte de una columna, con el nombre que le toca y «Aligerar» si pesa. */
  const campoDeArte = ({ campo, etiqueta, pista, forma, medidas }) => (
    <CampoDeArte
      key={campo}
      id={`p-${pieza.id}-${campo.replace("_", "-")}`}
      etiqueta={etiqueta}
      pista={pista}
      forma={forma}
      medidas={medidas}
      valor={borrador[`${campo}_id`]}
      asset={{ imagen, cinta, cinta_movil: movil }[campo]}
      onChange={(idNuevo, objeto) => {
        setBorrador((b) => ({ ...b, [`${campo}_id`]: idNuevo ?? null }));
        ponerAsset[campo](objeto ?? null);
      }}
      preguntar={preguntar}
      ocupado={ocupado}
      onReemplazar={guardarSoloEseArte(soloArte, campo, (fila) => onCambiarArte({ [`${campo}_id`]: fila.id }))}
    />
  );

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
        {/* Sin arte de teléfono, la tira sale ahí de unos 45 px de alto y el equipo la
            daba por invisible. A la vista en la lista, sin abrir la pieza, para que
            comercial sepa a qué anunciante pedírselo. */}
        {(GUIA_DE_FORMATO[pieza.formato]?.arte ?? []).some((a) => a.campo === "cinta") &&
        (!pieza.cinta_movil_id || conArteAutomatico(pieza)) ? (
          <span
            className="se-admin-pub__sello"
            title="En el teléfono sale la tira entera, muy fina. Pídale al anunciante su arte de 1200 × 600 px."
          >
            Sin arte de teléfono
          </span>
        ) : null}
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
                  espacios_fijos: borrador.espacios_fijos ?? [],
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
          {/* La tira es 8:1: en un teléfono no se lee, y el teléfono necesita su propia
              composición (`ARTE_DE_TELEFONO`). Sin ella, sale la tira entera. */}
          {usaCinta ? campoDeArte(ARTE_DE_TELEFONO) : null}

          <PlazasFijas
            formato={borrador.formato}
            campana={campana}
            valor={borrador.espacios_fijos ?? []}
            onChange={(v) => setBorrador((b) => ({ ...b, espacios_fijos: v }))}
            deshabilitado={ocupado}
          />

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
  /** La campaña de la pieza: sus fechas deciden qué plazas fijas están libres. */
  campana: PropTypes.object,
  pieza: PropTypes.object.isRequired,
  /** Para poder pintar la etiqueta «Publicidad · [marca]» en la vista previa. */
  anunciante: PropTypes.object,
  formatos: PropTypes.object,
  ocupado: PropTypes.bool,
  /** El diálogo de confirmar del panel (lo usa «Aligerar»). */
  preguntar: PropTypes.func.isRequired,
  onGuardar: PropTypes.func.isRequired,
  /** Guarda solo el arte de una columna (`{ cinta_id: 7 }`); resuelve a `true` si salió. */
  onCambiarArte: PropTypes.func.isRequired,
  onBorrar: PropTypes.func.isRequired,
};
