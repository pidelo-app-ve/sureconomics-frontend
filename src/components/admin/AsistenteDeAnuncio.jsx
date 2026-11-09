import PropTypes from "prop-types";
import { useEffect, useState } from "react";

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
  actualizarPieza,
  crearAnunciante,
  crearCampana,
  crearPieza,
  getEscalera,
  getOcupacion,
} from "../../services/adminPublicidadService";
import { MapaDelSitio } from "./mapa/MapaDelSitio";

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
 * Quien recorre un asistente entero llamado «publicar un anuncio» quiere que salga
 * publicado; terminar con un «ahora búsquelo en la lista y cámbielo a activa» sería un
 * paso escondido. Se activa al final, en «Afinar».
 *
 * ## Dónde sale (nov-2026)
 *
 * El paso «Dónde» enseña el mapa del sitio con la escalera: en qué hueco cae este arte
 * en cada recarga, y permite fijarle una plaza. La simulación corre en el servidor con
 * la campaña incluida como si ya estuviera activa (`incluir`), así que lo que se ve es
 * lo que pasará al publicar.
 */

const PASOS = [
  { n: 1, corto: "Quién" },
  { n: 2, corto: "Cuándo" },
  { n: 3, corto: "Arte" },
  { n: 4, corto: "Dónde" },
  { n: 5, corto: "Afinar" },
];

/** Los formatos que hoy se publican. E y H no tienen dónde pintarse todavía. */
const FORMATOS_UTILES = ["B", "A", "C", "D", "I", "F"];

/** El nombre para compararlo: sin mayúsculas ni espacios de más (igual que el servidor). */
const comparable = (nombre) => String(nombre ?? "").split(/\s+/).filter(Boolean).join(" ").toLowerCase();

export const AsistenteDeAnuncio = ({
  abierto,
  anunciantes,
  formatos,
  anuncianteInicial,
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

  // Paso 4: la pieza ya creada, sus plazas fijas y lo que enseña el mapa.
  const [pieza, setPieza] = useState(null);
  const [espaciosFijos, setEspaciosFijos] = useState([]);
  const [recargas, setRecargas] = useState([]);
  const [fechaSimulada, setFechaSimulada] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [cargandoMapa, setCargandoMapa] = useState(false);

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
    setPieza(null);
    setEspaciosFijos([]);
    setRecargas([]);
    setOcupacion(null);
  };

  const cerrar = () => {
    reiniciar();
    onCerrar();
  };

  // «Nueva campaña» desde la ficha de un anunciante: el asistente abre con él elegido.
  useEffect(() => {
    if (abierto && anuncianteInicial) setAnuncianteId(String(anuncianteInicial));
  }, [abierto, anuncianteInicial]);

  // Un nombre nuevo que ya existe: se ofrece el que hay en vez de crear un duplicado.
  const yaExiste = !anuncianteId && nombreNuevo.trim()
    ? anunciantes.find((a) => comparable(a.nombre) === comparable(nombreNuevo))
    : null;

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

  const cargarMapa = async (campanaId) => {
    setCargandoMapa(true);
    try {
      const [r, o] = await Promise.all([
        getEscalera({ recargas: 6, seccion: "portada", incluir: campanaId }),
        getOcupacion({
          desde: conFechas && desde ? desde : undefined,
          hasta: conFechas && hasta ? hasta : undefined,
        }),
      ]);
      setRecargas(r.recargas);
      setFechaSimulada(r.fecha);
      setOcupacion(o);
    } catch {
      setRecargas([]);
      setOcupacion({});
    } finally {
      setCargandoMapa(false);
    }
  };

  // El arte se guarda al avanzar (y se actualiza si se vuelve atrás y se cambia), para
  // que el mapa del paso siguiente pueda enseñar esta pieza de verdad.
  const paso3 = async () => {
    const datos = {
      formato,
      enlace: enlace.trim(),
      titular: guia.titular ? titular.trim() : "",
      imagen_id: imagenId,
      cinta_id: cintaId,
      activa: true,
    };
    setOcupado(true);
    const hecha = await correr(
      () => (pieza ? actualizarPieza(pieza.id, datos) : crearPieza(campana.id, datos)),
      pieza ? "Arte actualizado" : "Arte guardado",
    );
    setOcupado(false);
    if (!hecha) return;
    setPieza(hecha);
    setEspaciosFijos(hecha.espacios_fijos ?? []);
    setPaso(4);
    cargarMapa(campana.id);
  };

  // Fijar una plaza exige fecha de fin: sin ella la plaza quedaría tomada para siempre.
  const necesitaFechaDeFin = espaciosFijos.length > 0 && !(conFechas && hasta);

  const paso4 = async () => {
    const antes = pieza?.espacios_fijos ?? [];
    const igual = antes.length === espaciosFijos.length && antes.every((e) => espaciosFijos.includes(e));
    if (!igual) {
      setOcupado(true);
      const hecha = await correr(
        () => actualizarPieza(pieza.id, { espacios_fijos: espaciosFijos }),
        espaciosFijos.length ? "Plaza fija guardada" : "Sin plaza fija: va por la escalera",
      );
      setOcupado(false);
      if (!hecha) return;
      setPieza(hecha);
    }
    setPaso(5);
  };

  const publicar = async () => {
    setOcupado(true);
    const hecho = await correr(
      () => actualizarCampana(campana.id, { segmentos, estado: "activa" }),
      "Anuncio publicado — ya está saliendo en el sitio",
    );
    setOcupado(false);
    if (!hecho) return;
    reiniciar();
    onListo();
  };

  const puedeSeguir1 = anuncianteId || (nombreNuevo.trim().length > 1 && !yaExiste);
  const puedeSeguir3 =
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
              onClick={paso3}
              disabled={ocupado || !puedeSeguir3}
            >
              {ocupado ? "Un momento…" : "Siguiente"}
            </button>
          ) : null}
          {paso === 4 ? (
            <button
              type="button"
              className="se-btn se-btn--primary"
              onClick={paso4}
              disabled={ocupado || necesitaFechaDeFin}
            >
              {ocupado ? "Un momento…" : "Siguiente"}
            </button>
          ) : null}
          {paso === 5 ? (
            <button
              type="button"
              className="se-btn se-btn--primary"
              onClick={publicar}
              disabled={ocupado}
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
              {yaExiste ? (
                <p className="se-asis__repetido" role="status">
                  Ya hay un anunciante que se llama «{yaExiste.nombre}».{" "}
                  <button
                    type="button"
                    className="se-asis__usar"
                    onClick={() => {
                      setAnuncianteId(String(yaExiste.id));
                      setNombreNuevo("");
                    }}
                  >
                    Usar ese
                  </button>
                </p>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {paso === 2 ? (
        <section className="se-asis__cuerpo">
          <h3 className="se-asis__titulo">¿Cuándo sale?</h3>
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
          <p className="se-admin-meta-hint">
            Con fecha de fin, más adelante podrá fijarle una plaza en un hueco; sin ella,
            el anuncio va solo por la escalera.
          </p>
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

        </section>
      ) : null}

      {paso === 4 ? (
        <section className="se-asis__cuerpo">
          <h3 className="se-asis__titulo">¿Dónde sale?</h3>
          <p className="se-asis__lede">
            Este arte va por la <b>escalera</b>: cada hueco rota hasta tres marcas, y en cada
            recarga del lector la escalera baja un peldaño. El mapa enseña dónde cae en cada
            recarga, con las marcas que ya están. Si quiere que salga <b>siempre</b> en un
            hueco, púlselo: toma una de sus tres plazas durante las fechas de la campaña.
          </p>
          {necesitaFechaDeFin ? (
            <p className="se-asis__repetido" role="status">
              Para fijar una plaza, la campaña necesita fecha de fin. Vuelva a «Cuándo» y
              elija «Entre dos fechas», o quite la plaza.
            </p>
          ) : null}
          <MapaDelSitio
            recargas={recargas}
            fecha={fechaSimulada}
            ocupacion={ocupacion}
            destacada={pieza?.id}
            cargando={cargandoMapa}
            fijar={{
              formato,
              elegidos: espaciosFijos,
              onElegir: (e) =>
                setEspaciosFijos((v) => (v.includes(e) ? v.filter((x) => x !== e) : [...v, e])),
            }}
          />
        </section>
      ) : null}

      {paso === 5 ? (
        <section className="se-asis__cuerpo">
          <h3 className="se-asis__titulo">Afinar (opcional)</h3>
          <p className="se-asis__lede">
            Sin tocar nada, el anuncio sale en todo el sitio. Aquí se puede limitar a
            unas secciones, temas o países: donde no encajen, la escalera lo salta.
          </p>
          <DondeSale valor={segmentos} onChange={setSegmentos} />
          <p className="se-asis__final">
            Al publicar, la campaña queda <b>activa</b> y el anuncio empieza a salir.
            Todo esto se puede cambiar después desde su ficha.
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
  /** Abre con este anunciante elegido (id). */
  anuncianteInicial: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onCerrar: PropTypes.func.isRequired,
  /** Se llama al terminar, para que la página recargue la lista. */
  onListo: PropTypes.func.isRequired,
  /** El mismo `correr` de la página: avisa y captura el error. */
  correr: PropTypes.func.isRequired,
};

AsistenteDeAnuncio.defaultProps = { anunciantes: [] };

export default AsistenteDeAnuncio;
