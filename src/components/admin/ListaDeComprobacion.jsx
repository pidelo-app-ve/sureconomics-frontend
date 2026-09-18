import PropTypes from "prop-types";

/**
 * Lo que falta antes de publicar, dicho antes y no después.
 *
 * ## Por qué existe
 *
 * Publicar era un botón sin comprobar nada. Se podía poner en el catálogo un módulo sin
 * resumen, sin portada, con la clase de entrada vacía —justo la que engancha— y con las
 * duraciones sin medir, que deja al catálogo sin poder anunciar la del módulo. Nada
 * avisaba, y el fallo se descubría mirando el sitio publicado.
 *
 * ## Dos niveles, y la diferencia importa
 *
 * **Falta** bloquea: es lo que hace que lo publicado esté roto o mienta. **Conviene**
 * avisa y deja seguir: mejora la pieza, pero quien publica sabrá si puede esperar a
 * tenerlo. Poner todo en el mismo nivel tiene un solo resultado conocido — la gente
 * aprende a saltarse el aviso entero, incluido el que sí importaba.
 *
 * Y lo que ya está resuelto también se enseña. Una lista que solo muestra pegas se lee
 * como una regañina; con los ✓ delante, se lee como el estado de la pieza.
 */

const Icono = ({ nivel }) => {
  if (nivel === "bien") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className="se-chequeo__icono">
        <path
          d="M3.5 8.5l3 3 6-6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (nivel === "falta") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className="se-chequeo__icono">
        <path
          d="M4 4l8 8M12 4l-8 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="se-chequeo__icono">
      <path
        d="M8 2.5l6 11H2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 6.8v3.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="11.6" r="0.8" fill="currentColor" />
    </svg>
  );
};

Icono.propTypes = { nivel: PropTypes.oneOf(["bien", "falta", "conviene"]).isRequired };

export const ListaDeComprobacion = ({ titulo, puntos }) => {
  const faltan = puntos.filter((p) => p.nivel === "falta");
  const convienen = puntos.filter((p) => p.nivel === "conviene");

  return (
    <section className="se-chequeo" aria-label={titulo}>
      <h4 className="se-chequeo__titulo">
        {titulo}
        <span className="se-chequeo__cuenta">
          {faltan.length
            ? `${faltan.length} sin resolver`
            : convienen.length
              ? `listo · ${convienen.length} por mejorar`
              : "todo listo"}
        </span>
      </h4>
      <ul className="se-chequeo__lista">
        {puntos.map((p) => (
          <li key={p.texto} className={`se-chequeo__punto se-chequeo__punto--${p.nivel}`}>
            <Icono nivel={p.nivel} />
            <span>
              {p.texto}
              {p.detalle ? <small>{p.detalle}</small> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

ListaDeComprobacion.propTypes = {
  titulo: PropTypes.string.isRequired,
  /** `nivel`: "bien" ya está, "falta" bloquea, "conviene" solo avisa. */
  puntos: PropTypes.arrayOf(
    PropTypes.shape({
      nivel: PropTypes.oneOf(["bien", "falta", "conviene"]).isRequired,
      texto: PropTypes.string.isRequired,
      detalle: PropTypes.string,
    }),
  ).isRequired,
};

/* ─── Las reglas ─────────────────────────────────────────────────────────── */

/** Un texto con etiquetas HTML pero sin nada escrito dentro cuenta como vacío. */
const tieneTexto = (html) =>
  Boolean(
    String(html ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim(),
  );

/**
 * Qué hace falta para publicar un módulo de Educación.
 *
 * La clase de entrada tiene tratamiento aparte y es la única regla que quizá sorprenda:
 * un módulo cuya primera clase está vacía se publica sin fallar en ningún sitio y no
 * vende nada, porque esa clase **es** la demostración del producto. Es el fallo más
 * caro de los que se pueden cometer aquí y el más silencioso.
 */
export const chequeoDeModulo = (modulo) => {
  const lecciones = modulo.lecciones ?? [];
  const entrada = lecciones.find((l) => l.posicion === 1);
  const sinCuerpoNiArchivo = lecciones.filter(
    (l) => !tieneTexto(l.cuerpo) && !l.archivo_id,
  );
  const sinMedir = lecciones.filter((l) => l.duracion_minutos == null);

  const puntos = [];

  puntos.push(
    lecciones.length
      ? { nivel: "bien", texto: `${lecciones.length} lección${lecciones.length === 1 ? "" : "es"}` }
      : { nivel: "falta", texto: "No tiene ninguna lección" },
  );

  if (entrada) {
    puntos.push(
      tieneTexto(entrada.cuerpo) || entrada.archivo_id
        ? { nivel: "bien", texto: "La clase de entrada tiene contenido" }
        : {
            nivel: "falta",
            texto: "La clase de entrada está vacía",
            detalle:
              "Es la que se abre gratis y la que decide la compra. Un módulo con esta clase en blanco se publica sin fallar y no vende.",
          },
    );
  }

  puntos.push(
    tieneTexto(modulo.resumen)
      ? { nivel: "bien", texto: "Tiene resumen" }
      : {
          nivel: "falta",
          texto: "Sin resumen",
          detalle: "Es lo que se lee en la tarjeta del catálogo, debajo del título.",
        },
  );

  if (sinCuerpoNiArchivo.length && entrada && !sinCuerpoNiArchivo.includes(entrada)) {
    puntos.push({
      nivel: "conviene",
      texto: `${sinCuerpoNiArchivo.length} lección${
        sinCuerpoNiArchivo.length === 1 ? "" : "es"
      } sin contenido`,
      detalle: "Se pueden completar después; el módulo comprado las muestra vacías.",
    });
  }

  puntos.push(
    modulo.portada_id
      ? { nivel: "bien", texto: "Tiene portada" }
      : {
          nivel: "conviene",
          texto: "Sin portada",
          detalle: "La tarjeta funciona sin ella, pero con imagen destaca en el catálogo.",
        },
  );

  puntos.push(
    modulo.nivel
      ? { nivel: "bien", texto: `Nivel ${modulo.nivel}` }
      : {
          nivel: "conviene",
          texto: "Sin nivel",
          detalle: "Responde a «¿es para mí?», que es la primera duda de quien mira.",
        },
  );

  if (sinMedir.length) {
    puntos.push({
      nivel: "conviene",
      texto: `${sinMedir.length} lección${sinMedir.length === 1 ? "" : "es"} sin medir`,
      detalle:
        "Mientras falte una, el catálogo se calla la duración del módulo entero en vez de prometer una suma parcial.",
    });
  } else if (lecciones.length) {
    puntos.push({ nivel: "bien", texto: "Todas las lecciones medidas" });
  }

  return puntos;
};

/** Qué hace falta para que una campaña salga de verdad. */
export const chequeoDeCampana = (campana) => {
  const piezas = campana.creatividades ?? [];
  const activas = piezas.filter((p) => p.activa);
  const sinDestino = activas.filter((p) => !p.enlace);
  const sinImagen = activas.filter((p) => !p.imagen_id);
  const puntos = [];

  puntos.push(
    activas.length
      ? { nivel: "bien", texto: `${activas.length} pieza${activas.length === 1 ? "" : "s"} activa${activas.length === 1 ? "" : "s"}` }
      : {
          nivel: "falta",
          texto: "Ninguna pieza activa",
          detalle: "Una campaña sin pieza no falla en ningún sitio: simplemente no sale nunca.",
        },
  );

  if (sinDestino.length) {
    puntos.push({
      nivel: "falta",
      texto: `${sinDestino.length} pieza${sinDestino.length === 1 ? "" : "s"} sin destino`,
      detalle: "Un anuncio que no lleva a ninguna parte se cobra igual y no sirve de nada.",
    });
  }

  if (sinImagen.length) {
    puntos.push({
      nivel: "conviene",
      texto: `${sinImagen.length} pieza${sinImagen.length === 1 ? "" : "s"} sin imagen`,
      detalle: "Saldrá solo con el texto. En una tarjeta nativa eso se nota.",
    });
  }

  puntos.push(
    campana.desde && campana.hasta
      ? { nivel: "bien", texto: "Con fechas" }
      : {
          nivel: "conviene",
          texto: "Sin fechas",
          detalle: "Sin ellas no hay reparto en el tiempo: el tope se puede gastar en dos días.",
        },
  );

  return puntos;
};

/** Si la lista permite publicar. Solo los «falta» bloquean. */
export const sePuedePublicar = (puntos) => !puntos.some((p) => p.nivel === "falta");

export default ListaDeComprobacion;
