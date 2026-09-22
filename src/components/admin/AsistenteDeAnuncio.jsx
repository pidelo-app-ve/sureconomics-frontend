import PropTypes from "prop-types";
import { useState } from "react";

import { AssetField } from "./AssetField";
import { DondeSale } from "./DondeSale";
import { ModalDelPanel } from "./ModalDelPanel";
import { VistaDeLaPieza } from "./VistaDeLaPieza";
import { GUIA_DE_FORMATO, nombreDeFormato } from "../../lib/formatosDePublicidad";
import {
  ACCEPTED_IMAGE_MIME,
  uploadAdminMediaImage,
} from "../../services/adminMediaService";
import {
  actualizarCampana,
  crearAnunciante,
  crearCampana,
  crearPieza,
} from "../../services/adminPublicidadService";

/**
 * Publicar un anuncio de principio a fin, explicando cada paso.
 *
 * ## Por qué un asistente y no mejores etiquetas
 *
 * El modelo tiene tres niveles —anunciante → campaña → pieza— y eso es correcto: se
 * factura al anunciante, las fechas y el presupuesto son de la campaña, y el arte es de
 * la pieza. Pero para publicar el primer anuncio hay que **saber que los tres existen**
 * y en qué orden, y el panel no lo decía en ninguna parte: se abría en una lista de
 * anunciantes vacía y el resto había que deducirlo.
 *
 * Aquí los tres niveles siguen estando, sólo que se recorren una vez y en orden, con
 * una frase que explica para qué sirve cada uno. Quien ya lo sabe no lo necesita: la
 * lista de siempre sigue debajo y hace lo mismo.
 *
 * ## Por qué crea de verdad en cada paso y no al final
 *
 * Porque una campaña necesita un anunciante con id, y una pieza una campaña con id: el
 * servidor no acepta los tres de golpe. Se crea al avanzar.
 *
 * Eso **no** impide volver atrás, que es lo primero que se echa en falta al llegar al
 * paso 2 y ver que el nombre estaba mal. Lo que hace es cambiar qué significa avanzar la
 * segunda vez: si el anunciante o la campaña ya existen, se **actualizan** en vez de
 * crearse otra vez. Sin eso, ir atrás y adelante dejaba un rastro de campañas duplicadas
 * -- que es exactamente el motivo por el que antes no había botón.
 *
 * Cerrar a medias también vale: lo ya creado se queda en la lista y se sigue por ahí.
 *
 * ## La campaña nace activa
 *
 * Al revés que desde la lista, donde nace en borrador. Quien recorre un asistente
 * entero llamado «publicar un anuncio» quiere que salga publicado; terminar con un
 * «ahora búsquelo en la lista y cámbielo a activa» sería un cuarto paso escondido.
 */

const PASOS = [
  { n: 1, corto: "Quién" },
  { n: 2, corto: "Cuándo" },
  { n: 3, corto: "Qué se ve" },
];

/** Los formatos que hoy se publican. E y H no tienen dónde pintarse todavía. */
const FORMATOS_UTILES = ["B", "A", "C", "D", "I", "F"];

export const AsistenteDeAnuncio = ({
  abierto,
  anunciantes,
  formatos,
  onCerrar,
  onListo,
  correr,
}) => {
  const [paso, setPaso] = useState(1);
  const [ocupado, setOcupado] = useState(false);

  // Paso 1
  const [anuncianteId, setAnuncianteId] = useState("");
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [anunciante, setAnunciante] = useState(null);

  // Paso 2
  const [nombreCampana, setNombreCampana] = useState("");
  const [conFechas, setConFechas] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [segmentos, setSegmentos] = useState([]);
  const [campana, setCampana] = useState(null);

  // Paso 3
  const [formato, setFormato] = useState("B");
  const [enlace, setEnlace] = useState("");
  const [imagen, setImagen] = useState(null);
  const [cinta, setCinta] = useState(null);
  const [imagenId, setImagenId] = useState(null);
  const [cintaId, setCintaId] = useState(null);
  const [titular, setTitular] = useState("");

  const guia = GUIA_DE_FORMATO[formato] ?? {};
  const artes = guia.arte ?? [];

  const reiniciar = () => {
    setPaso(1);
    setAnuncianteId("");
    setNombreNuevo("");
    setAnunciante(null);
    setNombreCampana("");
    setConFechas(false);
    setDesde("");
    setHasta("");
    setSegmentos([]);
    setCampana(null);
    setFormato("B");
    setEnlace("");
    setImagen(null);
    setCinta(null);
    setImagenId(null);
    setCintaId(null);
    setTitular("");
  };

  const cerrar = () => {
    reiniciar();
    onCerrar();
  };

  const paso1 = async () => {
    // Ya pasamos por aquí y volvimos: el anunciante existe, no se crea otro.
    if (anunciante && String(anunciante.id) === String(anuncianteId)) {
      setPaso(2);
      return;
    }
    setOcupado(true);
    const elegido = anuncianteId
      ? anunciantes.find((a) => String(a.id) === String(anuncianteId))
      : await correr(
          () => crearAnunciante({ nombre: nombreNuevo.trim() }),
          `Anunciante «${nombreNuevo.trim()}» creado`,
        );
    setOcupado(false);
    if (!elegido) return;
    setAnunciante(elegido);
    // Queda elegido en el desplegable, para que volver atrás lo enseñe seleccionado y
    // seguir otra vez no cree un segundo anunciante con el mismo nombre.
    setAnuncianteId(String(elegido.id));
    if (!nombreCampana) setNombreCampana(elegido.nombre);
    setPaso(2);
  };

  const paso2 = async () => {
    const nombre = nombreCampana.trim() || anunciante.nombre;
    const campos = {
      nombre,
      desde: conFechas ? desde || null : null,
      hasta: conFechas ? hasta || null : null,
      segmentos,
    };
    setOcupado(true);
    const hecha = await correr(
      () =>
        campana
          ? actualizarCampana(campana.id, campos)
          : crearCampana(anunciante.id, campos),
      campana ? `Campaña «${nombre}» actualizada` : `Campaña «${nombre}» creada`,
    );
    setOcupado(false);
    if (!hecha) return;
    setCampana(hecha);
    setPaso(3);
  };

  const terminar = async () => {
    setOcupado(true);
    const hecho = await correr(async () => {
      await crearPieza(campana.id, {
        formato,
        enlace: enlace.trim(),
        titular: guia.titular ? titular.trim() : "",
        imagen_id: imagenId,
        cinta_id: cintaId,
        activa: true,
      });
      // Activarla es lo último: el servidor rechaza activar una campaña sin ninguna
      // pieza activa, así que en cualquier otro orden esto daría 422.
      return actualizarCampana(campana.id, { estado: "activa" });
    }, "Anuncio publicado — ya está saliendo en el sitio");
    setOcupado(false);
    if (!hecho) return;
    reiniciar();
    onListo();
  };

  const puedeSeguir1 = anuncianteId || nombreNuevo.trim().length > 1;
  const puedeTerminar =
    enlace.trim() && (!artes.length || imagenId || cintaId) && (!guia.titular || titular.trim());

  return (
    <ModalDelPanel
      abierto={abierto}
      ocupado={ocupado}
      onCerrar={cerrar}
      ancho="ancho"
      titulo="Publicar un anuncio"
      subtitulo={
        <span className="se-asis__pasos">
          {PASOS.map((p) => (
            <span
              key={p.n}
              className={`se-asis__paso${p.n === paso ? " se-asis__paso--hoy" : ""}${
                p.n < paso ? " se-asis__paso--hecho" : ""
              }`}
            >
              {p.corto}
            </span>
          ))}
        </span>
      }
      pie={
        <>
          <button
            type="button"
            className="se-btn se-btn--secondary"
            onClick={cerrar}
            disabled={ocupado}
          >
            Cerrar
          </button>
          {paso > 1 ? (
            <button
              type="button"
              className="se-btn se-btn--secondary"
              onClick={() => setPaso((p) => p - 1)}
              disabled={ocupado}
            >
              Atrás
            </button>
          ) : null}
          {paso === 1 ? (
            <button
              type="button"
              className="se-btn se-btn--primary"
              onClick={paso1}
              disabled={ocupado || !puedeSeguir1}
            >
              {ocupado ? "Un momento…" : "Siguiente"}
            </button>
          ) : null}
          {paso === 2 ? (
            <button
              type="button"
              className="se-btn se-btn--primary"
              onClick={paso2}
              disabled={ocupado}
            >
              {ocupado ? "Un momento…" : "Siguiente"}
            </button>
          ) : null}
          {paso === 3 ? (
            <button
              type="button"
              className="se-btn se-btn--primary"
              onClick={terminar}
              disabled={ocupado || !puedeTerminar}
            >
              {ocupado ? "Publicando…" : "Publicar"}
            </button>
          ) : null}
        </>
      }
    >
      {paso === 1 ? (
        <section className="se-asis__cuerpo">
          <h3 className="se-asis__titulo">¿Quién paga este anuncio?</h3>
          <p className="se-asis__lede">
            El <b>anunciante</b> es la empresa. Su ficha es una agenda interna: el
            contacto, el sitio y las notas <b>no salen publicados en ninguna parte</b>,
            sirven para saber a quién escribir cuando toca cobrar o pedir arte nuevo.
          </p>

          {anunciantes.length ? (
            <>
              <label className="se-form-label" htmlFor="asis-existente">
                Uno que ya existe
              </label>
              <select
                id="asis-existente"
                className="se-form-control"
                value={anuncianteId}
                onChange={(e) => {
                  setAnuncianteId(e.target.value);
                  if (e.target.value) setNombreNuevo("");
                }}
              >
                <option value="">— Crear uno nuevo —</option>
                {anunciantes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                    {a.es_casa ? " (relleno de la casa)" : ""}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          {!anuncianteId ? (
            <>
              <label className="se-form-label" htmlFor="asis-nuevo">
                {anunciantes.length ? "O el nombre de uno nuevo" : "Nombre de la empresa"}
              </label>
              <input
                id="asis-nuevo"
                className="se-form-control"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                placeholder="Alalza Inversiones"
              />
              <p className="se-admin-meta-hint">
                Tal y como quiere que se lea en la etiqueta «Publicidad · …» que acompaña
                a cada anuncio.
              </p>
            </>
          ) : null}
        </section>
      ) : null}

      {paso === 2 ? (
        <section className="se-asis__cuerpo">
          <h3 className="se-asis__titulo">¿Cuándo y dónde sale?</h3>
          <p className="se-asis__lede">
            Una <b>campaña</b> es un periodo de pauta. Agrupa las piezas que comparten
            fechas y condiciones, para que renovar o parar sea una sola acción y no una
            por anuncio.
          </p>

          <label className="se-form-label" htmlFor="asis-campana">
            Nombre de la campaña
          </label>
          <input
            id="asis-campana"
            className="se-form-control"
            value={nombreCampana}
            onChange={(e) => setNombreCampana(e.target.value)}
            placeholder={anunciante?.nombre}
          />
          <p className="se-admin-meta-hint">
            Sólo lo ve usted. Sirve para distinguir «Navidad 2026» de «Marca todo el
            año» cuando el mismo cliente tenga varias.
          </p>

          <fieldset className="se-donde__grupo">
            <legend>Fechas</legend>
            {/* En vertical y no en fila: son dos frases enteras, y en una sola línea
                la segunda queda pegada a la primera y cuesta ver dónde acaba una. */}
            <div className="se-asis__opciones">
              <label className="se-donde__casilla">
                <input
                  type="radio"
                  name="asis-fechas"
                  checked={!conFechas}
                  onChange={() => setConFechas(false)}
                />
                <span>Desde ya y hasta que la pare</span>
              </label>
              <label className="se-donde__casilla">
                <input
                  type="radio"
                  name="asis-fechas"
                  checked={conFechas}
                  onChange={() => setConFechas(true)}
                />
                <span>Entre dos fechas</span>
              </label>
            </div>
            {conFechas ? (
              <div className="se-admin-pub__doble" style={{ marginTop: "0.8rem" }}>
                <div>
                  <label className="se-form-label" htmlFor="asis-desde">
                    Desde
                  </label>
                  <input
                    id="asis-desde"
                    type="date"
                    className="se-form-control"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                  />
                </div>
                <div>
                  <label className="se-form-label" htmlFor="asis-hasta">
                    Hasta
                  </label>
                  <input
                    id="asis-hasta"
                    type="date"
                    className="se-form-control"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                  />
                </div>
              </div>
            ) : null}
          </fieldset>

          <h4 className="se-admin-pub__sub">En qué páginas</h4>
          <DondeSale valor={segmentos} onChange={setSegmentos} />
        </section>
      ) : null}

      {paso === 3 ? (
        <section className="se-asis__cuerpo">
          <h3 className="se-asis__titulo">¿Qué ve el lector?</h3>
          <p className="se-asis__lede">
            La <b>pieza</b> es el anuncio en sí. El formato decide dónde encaja y qué
            arte necesita; abajo sólo aparece lo que ese formato publica de verdad.
          </p>

          <label className="se-form-label" htmlFor="asis-formato">
            Formato
          </label>
          <select
            id="asis-formato"
            className="se-form-control"
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
          >
            {FORMATOS_UTILES.map((letra) => (
              <option key={letra} value={letra}>
                {nombreDeFormato(letra, formatos)}
              </option>
            ))}
          </select>
          {guia.donde ? <p className="se-admin-meta-hint">{guia.donde}</p> : null}
          {guia.soloTexto ? (
            <p className="se-admin-meta-hint">{guia.soloTexto}</p>
          ) : null}

          {artes.map(({ campo, etiqueta, pista, forma }) => {
            const esCinta = campo === "cinta";
            return (
              <AssetField
                key={campo}
                id={`asis-${campo}`}
                label={etiqueta}
                hint={pista}
                forma={forma}
                kind="image"
                value={esCinta ? cintaId : imagenId}
                asset={esCinta ? cinta : imagen}
                onChange={(id, objeto) => {
                  (esCinta ? setCintaId : setImagenId)(id ?? null);
                  (esCinta ? setCinta : setImagen)(objeto ?? null);
                }}
                onUpload={uploadAdminMediaImage}
                accept={ACCEPTED_IMAGE_MIME}
              />
            );
          })}

          {guia.titular ? (
            <>
              <label className="se-form-label" htmlFor="asis-titular">
                Titular
              </label>
              <input
                id="asis-titular"
                className="se-form-control"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
              />
            </>
          ) : null}

          <label className="se-form-label" htmlFor="asis-enlace">
            Destino
          </label>
          <input
            id="asis-enlace"
            className="se-form-control"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            placeholder="https://…"
          />
          <p className="se-admin-meta-hint">
            Adónde llega el lector al pulsar. Pasa por nuestra API, que cuenta el clic y
            redirige — por eso el clic sí se factura aunque el lector tenga bloqueadores.
          </p>

          <VistaDeLaPieza
            pieza={{
              formato,
              titular,
              enlace,
              imagen: imagen?.url ?? null,
              cinta: cinta?.url ?? null,
            }}
            anunciante={anunciante}
            usaTitular={!!guia.titular}
          />

          <p className="se-asis__final">
            Al publicar, la campaña queda <b>activa</b> y el anuncio empieza a salir.
            Todo esto se puede cambiar después desde la lista.
          </p>
        </section>
      ) : null}
    </ModalDelPanel>
  );
};

AsistenteDeAnuncio.propTypes = {
  abierto: PropTypes.bool.isRequired,
  anunciantes: PropTypes.array,
  formatos: PropTypes.object,
  onCerrar: PropTypes.func.isRequired,
  /** Se llama al terminar, para que la página recargue la lista. */
  onListo: PropTypes.func.isRequired,
  /** El mismo `correr` de la página: avisa y captura el error. */
  correr: PropTypes.func.isRequired,
};

AsistenteDeAnuncio.defaultProps = { anunciantes: [] };

export default AsistenteDeAnuncio;
