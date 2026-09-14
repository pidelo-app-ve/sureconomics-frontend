import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { TEAM, claveDeFoto } from "../../data/surEconomicsMock";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import {
  ACCEPTED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
  uploadAdminMediaImage,
  patchAdminMedia,
} from "../../services/adminMediaService";
import { getTeamPhotos, putTeamPhotos } from "../../services/adminSettingsService";
import { RecorteDeAvatar } from "../../components/admin/RecorteDeAvatar";

const ACCEPTED_MIME_SET = new Set(ACCEPTED_IMAGE_MIME.split(","));
const formatMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Rechazar aquí lo obvio, antes de que el archivo viaje al servidor para volver
 * rebotado. El mismo criterio que ya usa `ImageField.jsx` para la imagen
 * destacada de una pieza -- esta pantalla se quedó sin él porque se escribió
 * aparte, y sin el aviso una foto de mas de 10 MB se iba en silencio: la
 * pantalla no decia nada especifico, y quien subia terminaba sin saber si
 * habia funcionado o no.
 */
const problemaLocal = (archivo) => {
  if (!archivo) return "No se seleccionó ningún archivo.";
  if (archivo.size === 0) return "El archivo está vacío.";
  if (archivo.size > MAX_IMAGE_BYTES) {
    return `La imagen pesa ${formatMb(archivo.size)} y el máximo es ${formatMb(MAX_IMAGE_BYTES)}.`;
  }
  if (archivo.type && !ACCEPTED_MIME_SET.has(archivo.type)) {
    return "Formato no admitido. Use JPG, PNG, WebP, GIF o AVIF.";
  }
  return "";
};

/**
 * Lo que mide la foto de verdad, leyendo el archivo antes de subirlo.
 *
 * Devuelve `null` si el navegador no puede decodificarla -- un archivo roto, o un
 * formato que dice ser imagen y no lo es. En ese caso no se bloquea nada: el
 * servidor vuelve a comprobarlo y es quien manda.
 */
const medirImagen = (archivo) =>
  new Promise((resolver) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolver({ ancho: img.naturalWidth, alto: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolver(null);
    };
    img.src = url;
  });

/**
 * El lado corto minimo para que la cara se vea nitida en el circulo.
 *
 * El circulo mide 64 px en el panel y 54 en la pagina, pero en una pantalla de
 * alta densidad eso son 128 px reales -- y el recorte cuadrado usa solo el lado
 * corto de la foto. Por debajo de 256 px el navegador tiene que estirar, y ahi es
 * donde "se rompen los pixeles": no hay detalle que mostrar y se inventa.
 *
 * Es un aviso y no un bloqueo a proposito: a veces la unica foto que existe de
 * alguien es esa, y publicarla algo borrosa es decision de la redaccion, no mia.
 */
const LADO_MINIMO = 256;

/**
 * Las fotos de «Quiénes somos».
 *
 * **Sólo las fotos.** Quién está en el equipo, con qué cargo y en qué orden vive en el
 * código, y esta pantalla no lo toca: cambia dos veces al año y nadie ha pedido
 * administrarlo. Lo que sí hacía falta poder hacer sin desplegar es subir las caras,
 * que es lo que el cliente pidió.
 *
 * **El círculo de las iniciales es el botón.** Es lo que se pidió literalmente, y
 * además es lo correcto: el sitio donde aparece la foto es el sitio donde se cambia,
 * sin un formulario aparte que haya que relacionar mentalmente con la tarjeta.
 *
 * **Se guarda al terminar, no a cada clic.** Subir una foto la deja puesta en pantalla
 * pero no en la página pública hasta pulsar Guardar. Así se pueden arreglar varias de
 * una sentada -- y deshacer un error -- sin que cada paso intermedio salga publicado.
 */

const iniciales = (nombre) => {
  const partes = String(nombre ?? "").split(" ").map((p) => p.trim()).filter(Boolean);
  const primera = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1]?.[0] : "";
  return `${primera}${ultima}`.toUpperCase() || "SE";
};

/** Los tres grupos, tal como se pintan en la página pública. */
const GRUPOS = [
  { titulo: "Junta Directiva", gente: TEAM.board },
  { titulo: "Consejo Editorial", gente: TEAM.editorialBoard },
  { titulo: "Equipo operativo", gente: TEAM.operational },
];

const FichaDeFoto = ({ persona, foto, ocupado, onSubir, onQuitar }) => {
  const entrada = useRef(null);

  return (
    <li className="se-admin-equipo__ficha">
      <button
        type="button"
        className="se-admin-equipo__avatar-btn"
        onClick={() => entrada.current?.click()}
        disabled={ocupado}
        aria-label={
          foto ? `Cambiar la foto de ${persona.name}` : `Subir una foto de ${persona.name}`
        }
      >
        {foto ? (
          <img className="se-admin-equipo__avatar" src={foto} alt="" width="64" height="64" />
        ) : (
          <span className="se-admin-equipo__avatar se-admin-equipo__avatar--iniciales">
            {iniciales(persona.name)}
          </span>
        )}
        <span className="se-admin-equipo__avatar-capa" aria-hidden="true">
          {ocupado ? "…" : "Cambiar"}
        </span>
      </button>

      <div className="se-admin-equipo__datos">
        <p className="se-admin-equipo__nombre">{persona.name}</p>
        <p className="se-admin-equipo__cargo">{persona.role}</p>
        {foto ? (
          <button
            type="button"
            className="se-btn se-btn--secondary se-btn--small"
            onClick={() => onQuitar(claveDeFoto(persona))}
            disabled={ocupado}
          >
            Quitar la foto
          </button>
        ) : (
          <p className="se-admin-equipo__sinfoto">Sin foto: sale con sus iniciales.</p>
        )}
      </div>

      <input
        ref={entrada}
        type="file"
        accept={ACCEPTED_IMAGE_MIME}
        style={{ display: "none" }}
        onChange={(evento) => {
          const archivo = evento.target.files?.[0];
          // Se limpia el campo para que elegir el MISMO archivo otra vez vuelva a
          // disparar el cambio; sin esto, reintentar tras un fallo no hacía nada.
          evento.target.value = "";
          if (archivo) onSubir(persona, archivo);
        }}
      />
    </li>
  );
};

FichaDeFoto.propTypes = {
  persona: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string,
  }).isRequired,
  foto: PropTypes.string,
  ocupado: PropTypes.bool,
  onSubir: PropTypes.func.isRequired,
  onQuitar: PropTypes.func.isRequired,
};

export const AdminEquipo = () => {
  // Dos mapas y no uno: `imagenes` es lo que se va a guardar -- id de persona a id de
  // imagen -- y `vistas` es lo que se pinta. Se separan porque al subir una foto se
  // tiene la dirección en la mano y no hay que ir a buscarla para poder enseñarla.
  const [imagenes, setImagenes] = useState({});
  const [vistas, setVistas] = useState({});
  const [inicial, setInicial] = useState({});
  const [carga, setCarga] = useState({ status: "loading", error: "" });
  const [guardado, setGuardado] = useState({ status: "idle", mensaje: "" });
  const [subiendo, setSubiendo] = useState("");
  // La foto elegida esperando encuadre: `{ persona, archivo }` o nada.
  const [recortando, setRecortando] = useState(null);

  useEffect(() => {
    let vivo = true;
    getTeamPhotos()
      .then(({ fotos, imagenes: ids }) => {
        if (!vivo) return;
        setVistas(fotos);
        setInicial(fotos);
        // Los ids de lo que ya estaba guardado: sin esto, guardar un cambio habria
        // mandado el mapa sin las demas y las habria borrado.
        setImagenes(ids);
        setCarga({ status: "ready", error: "" });
      })
      .catch((err) => {
        if (vivo) {
          setCarga({ status: "error", error: adminErrorMessage(err, "No se pudieron cargar las fotos.") });
        }
      });
    return () => {
      vivo = false;
    };
  }, []);

  /**
   * Elegir un archivo ya no sube nada: abre el recorte.
   *
   * El encuadre es el paso que faltaba. Las fotos que manda la gente son de cuerpo
   * entero, y un recorte cuadrado automatico se queda con el torso -- la cara acaba
   * diminuta dentro del circulo. Aqui se mira si el archivo sirve, se avisa si es
   * demasiado pequeño, y quien sube elige que parte se ve.
   */
  const elegirArchivo = useCallback(async (persona, archivo) => {
    const problema = problemaLocal(archivo);
    if (problema) {
      setGuardado({ status: "error", mensaje: `${persona.name}: ${problema}` });
      return;
    }

    // Se mide el ORIGINAL, no el recorte: el recorte siempre sale del mismo tamaño,
    // asi que medirlo no diria nada. Lo que importa es cuanto detalle traia la foto.
    const medida = await medirImagen(archivo);
    const corto = medida ? Math.min(medida.ancho, medida.alto) : null;
    if (corto !== null && corto < LADO_MINIMO) {
      setGuardado({
        status: "aviso",
        mensaje:
          `${persona.name}: la foto mide ${medida.ancho}x${medida.alto} px. Por `
          + `debajo de ${LADO_MINIMO} px de lado corto se va a ver pixelada. Puede `
          + `encuadrarla igual, pero si consigue una mas grande, mejor.`,
      });
    } else {
      setGuardado({ status: "idle", mensaje: "" });
    }

    setRecortando({ persona, archivo });
  }, []);

  const subir = useCallback(async (persona, archivo) => {
    setSubiendo(claveDeFoto(persona));
    try {
      let fila = await uploadAdminMediaImage(archivo);
      // Se etiqueta con el nombre para que la foto se encuentre después en la
      // biblioteca. Si falla, la foto ya está subida y perderla por una etiqueta
      // sería el peor cambio posible.
      try {
        fila = await patchAdminMedia(fila.id, { label: persona.name });
      } catch {
        /* la etiqueta es un extra, no el trabajo */
      }
      // Se guarda bajo la clave de FOTO, no bajo el id de la ficha: quien aparece
      // en dos grupos comparte retrato y las dos tarjetas se actualizan a la vez.
      const clave = claveDeFoto(persona);
      setImagenes((previo) => ({ ...previo, [clave]: fila.id }));
      setVistas((previo) => ({ ...previo, [clave]: fila.url || "" }));
    } catch (err) {
      setGuardado({
        status: "error",
        mensaje: adminErrorMessage(err, `No se pudo subir la foto de ${persona.name}.`),
      });
    } finally {
      setSubiendo("");
    }
  }, []);

  const quitar = useCallback((id) => {
    setImagenes((previo) => {
      const copia = { ...previo };
      delete copia[id];
      return copia;
    });
    setVistas((previo) => {
      const copia = { ...previo };
      delete copia[id];
      return copia;
    });
    setGuardado({ status: "idle", mensaje: "" });
  }, []);

  const hayCambios = useMemo(() => {
    const ids = new Set([...Object.keys(inicial), ...Object.keys(vistas)]);
    return [...ids].some((id) => (inicial[id] || "") !== (vistas[id] || ""));
  }, [inicial, vistas]);

  const guardar = async () => {
    setGuardado({ status: "saving", mensaje: "" });
    try {
      // El mapa entero: quien tenga foto en pantalla va con su id de imagen -- el que
      // ya estaba guardado, o el que acaba de salir de la subida. `putTeamPhotos`
      // reemplaza todo, asi que quien no este aqui es justamente a quien se le quito.
      const mapa = {};
      Object.keys(vistas).forEach((id) => {
        if (imagenes[id]) mapa[id] = imagenes[id];
      });
      const resultado = await putTeamPhotos(mapa);
      setVistas(resultado);
      setInicial(resultado);
      setImagenes((previo) => {
        // Se conservan los ids de lo que sigue puesto; lo quitado ya no esta en
        // `resultado` y se cae solo.
        const vivos = {};
        Object.keys(resultado).forEach((id) => {
          if (previo[id]) vivos[id] = previo[id];
        });
        return vivos;
      });
      setGuardado({ status: "ok", mensaje: "Guardado. Ya se ve en «Quiénes somos»." });
    } catch (err) {
      setGuardado({
        status: "error",
        mensaje: adminErrorMessage(err, "No se pudieron guardar las fotos."),
      });
    }
  };

  return (
    <div className="se-admin-shell">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>
            Fotos del equipo
          </h1>
          <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
            Pulse el círculo de una persona para subir su foto. Quien no tenga sale con
            sus iniciales, que es normal y no un error. Los nombres y los cargos no se
            editan aquí. JPG, PNG, WebP, GIF o AVIF, hasta {formatMb(MAX_IMAGE_BYTES)}.
          </p>
        </div>
      </header>

      {carga.status === "loading" ? <p className="se-admin-meta-hint">Cargando…</p> : null}
      {carga.status === "error" ? (
        <p className="se-admin-form-feedback" role="alert">
          {carga.error}
        </p>
      ) : null}

      {/* El encuadre, sobre la lista y no en una pantalla aparte: quien sube ve las
          fichas detrás y no pierde el sitio donde estaba. */}
      {recortando ? (
        <RecorteDeAvatar
          archivo={recortando.archivo}
          nombre={recortando.persona.name}
          onCancelar={() => setRecortando(null)}
          onListo={(recortada) => {
            const { persona } = recortando;
            setRecortando(null);
            subir(persona, recortada);
          }}
        />
      ) : null}

      {carga.status === "ready" ? (
        <>
          {GRUPOS.map((grupo) => (
            <section key={grupo.titulo} className="se-admin-equipo__grupo">
              <h2 className="se-admin-equipo__grupo-titulo">{grupo.titulo}</h2>
              <ul className="se-admin-equipo__lista">
                {grupo.gente.map((persona) => (
                  <FichaDeFoto
                    key={persona.id}
                    persona={persona}
                    foto={vistas[claveDeFoto(persona)] || ""}
                    ocupado={subiendo === claveDeFoto(persona)}
                    onSubir={elegirArchivo}
                    onQuitar={quitar}
                  />
                ))}
              </ul>
            </section>
          ))}

          <div className="se-admin-form-actions" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="se-btn"
              onClick={guardar}
              disabled={!hayCambios || guardado.status === "saving" || Boolean(subiendo)}
            >
              {guardado.status === "saving" ? "Guardando…" : "Guardar"}
            </button>
            {hayCambios ? (
              <p className="se-admin-meta-hint" style={{ margin: 0 }}>
                Hay cambios sin guardar.
              </p>
            ) : null}
          </div>

          {guardado.mensaje ? (
            <p
              className={
                // El aviso de resolucion comparte el recuadro del error -- no es un
                // fallo, pero un texto que explica por que una foto se vera mal no
                // puede pasar por la nota gris de abajo, que nadie lee.
                guardado.status === "error" || guardado.status === "aviso"
                  ? "se-admin-form-feedback"
                  : "se-admin-meta-hint"
              }
              role={guardado.status === "error" ? "alert" : "status"}
            >
              {guardado.mensaje}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
