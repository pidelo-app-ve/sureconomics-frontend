import PropTypes from "prop-types";
import { useId, useMemo } from "react";

import { useTaxonomy } from "../../hooks/useTaxonomy";

/**
 * Dónde sale una campaña, con los valores que existen de verdad.
 *
 * ## Por qué no es un campo de texto
 *
 * Lo era, y se guardaba cualquier cosa. El servidor compara el valor escrito contra el
 * contexto de la página —`{seccion, tema, pais}`— y si no coincide exactamente, la
 * campaña **no sale nunca y nadie se entera**: se guarda bien, aparece configurada, y
 * simplemente no se publica. Para un patrocinio vendido eso es dinero.
 *
 * Y el propio texto de ayuda enseñaba a fallar. Proponía «venezuela, mercados,
 * informes»: de los tres, `venezuela` existe, pero el tema es `mercados-e-inversion` y
 * el formato es `informe` en singular. Dos de cada tres ejemplos no encajaban con nada.
 *
 * Aquí las listas salen de la misma taxonomía que usa el sitio público, así que no se
 * puede elegir algo inexistente. Se enseña el nombre —«Mercados e Inversión»— y se
 * guarda el identificador.
 *
 * ## Por qué «formato» ya no se puede elegir
 *
 * Porque era el mismo dato que «sección» con otro nombre. Las tres vistas que sirven
 * publicidad arman su contexto igual:
 *
 *     contexto: { seccion: pieza.formatoApi, formato: pieza.formatoApi, ... }
 *
 * Dos ejes en la pantalla, uno solo en la realidad. Peor: como las condiciones de tipos
 * distintos se exigen **a la vez**, poner «sección: portada» y «formato: noticia» daba
 * una campaña imposible —la portada no tiene formato— que no salía en ningún sitio.
 *
 * Las que ya estén guardadas con `formato` se siguen enseñando, aparte y marcadas, para
 * poder quitarlas a mano. Borrarlas solo sería decidir por quien las puso.
 *
 * ## Las condiciones se combinan así
 *
 * Varias del mismo grupo son alternativas; grupos distintos se exigen a la vez. Es lo
 * que ya hacía el servidor, pero había que leerlo en un párrafo: ahora el resumen de
 * abajo lo dice con los nombres puestos.
 */

/** El grupo que no viene de la taxonomía: la portada no es un formato de contenido. */
const PORTADA = { slug: "portada", nombre: "Portada" };

const GRUPOS = [
  {
    tipo: "seccion",
    titulo: "Secciones",
    pista: "La portada, o el tipo de pieza en cuya página aparece.",
  },
  {
    tipo: "tema",
    titulo: "Temas",
    pista:
      "Sólo cuenta cuando la pieza lleva ese tema, o cuando el lector filtra por él en un listado.",
  },
  {
    tipo: "pais",
    titulo: "Países y regiones",
    pista: "Igual que los temas: por lo que la pieza tiene etiquetado.",
  },
];

/** Une la lista con comas y un «o» final, que es como se lee en voz alta. */
const enumerar = (nombres) => {
  if (nombres.length <= 1) return nombres[0] ?? "";
  return `${nombres.slice(0, -1).join(", ")} o ${nombres[nombres.length - 1]}`;
};

export const DondeSale = ({ valor, onChange }) => {
  const { formats, topics, regiones, slugPorNombre, ready } = useTaxonomy();
  // Propio de esta instancia: con un `name` fijo, dos campañas abiertas a la vez
  // formarían un solo grupo de radios y marcar en una desmarcaría la otra.
  const grupo = useId();

  /** `{tipo: [{slug, nombre}]}` con todo lo que se puede elegir. */
  const opciones = useMemo(() => {
    const paises = [];
    Object.entries(regiones ?? {}).forEach(([grupo, hojas]) => {
      hojas.forEach((nombre) => {
        const slug = slugPorNombre?.[nombre];
        if (slug) paises.push({ slug, nombre, grupo });
      });
    });
    return {
      seccion: [
        PORTADA,
        ...(formats ?? []).map((f) => ({
          slug: f.slug,
          nombre: f.name_plural ?? f.name,
        })),
      ],
      tema: (topics ?? []).map((t) => ({ slug: t.slug, nombre: t.name })),
      pais: paises,
    };
  }, [formats, topics, regiones, slugPorNombre]);

  const nombreDe = (tipo, slug) =>
    opciones[tipo]?.find((o) => o.slug === slug)?.nombre ?? null;

  const puestas = valor ?? [];
  const enTodasPartes = puestas.length === 0;

  const tiene = (tipo, slug) =>
    puestas.some((s) => s.tipo === tipo && s.valor === slug);

  const alternar = (tipo, slug) => {
    onChange(
      tiene(tipo, slug)
        ? puestas.filter((s) => !(s.tipo === tipo && s.valor === slug))
        : [...puestas, { tipo, valor: slug }],
    );
  };

  // Lo que está guardado pero no se puede elegir: valores mal escritos de cuando esto
  // era un campo libre, y los `formato` de la versión anterior. Se enseñan para poder
  // quitarlos, no se tocan solos.
  const huerfanas = puestas.filter(
    (s) => s.tipo === "formato" || (ready && !nombreDe(s.tipo, s.valor)),
  );

  /**
   * La combinación que se guarda bien y no sale nunca.
   *
   * Las condiciones de tipos distintos se exigen **a la vez**, y la portada no tiene ni
   * tema ni país que comparar: una campaña con «Portada» más un tema no encaja en la
   * portada —le falta el tema— ni en un artículo —su sección no es «portada»—. Queda
   * configurada, activa y en ningún sitio.
   *
   * Comprobado contra el decisor real: con «Portada» + «Mercados e Inversión» la portada
   * devuelve cero; quitando el tema, sale.
   */
  const marcaPortada = puestas.some(
    (s) => s.tipo === "seccion" && s.valor === PORTADA.slug,
  );
  const marcaContenido = puestas.some((s) => s.tipo === "tema" || s.tipo === "pais");
  const soloPortada =
    marcaPortada &&
    !puestas.some((s) => s.tipo === "seccion" && s.valor !== PORTADA.slug);
  const combinacionImposible = soloPortada && marcaContenido;

  const resumen = useMemo(() => {
    if (enTodasPartes) return "Sale en todas las páginas del sitio.";
    const trozos = GRUPOS.map(({ tipo }) => {
      const nombres = puestas
        .filter((s) => s.tipo === tipo)
        .map((s) => nombreDe(tipo, s.valor) ?? s.valor);
      if (!nombres.length) return null;
      const lista = enumerar(nombres);
      if (tipo === "seccion") return `en ${lista}`;
      if (tipo === "tema") return `sobre ${lista}`;
      return `de ${lista}`;
    }).filter(Boolean);
    return `Sale ${trozos.join(", y además ")}.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puestas, enTodasPartes, opciones]);

  return (
    <div className="se-donde">
      <div className="se-donde__modo">
        <label className="se-donde__casilla">
          <input
            type="radio"
            name={grupo}
            checked={enTodasPartes}
            onChange={() => onChange([])}
          />
          <span>En todas partes</span>
        </label>
        <label className="se-donde__casilla">
          <input
            type="radio"
            name={grupo}
            checked={!enTodasPartes}
            // Sin condiciones no hay nada que marcar, así que elegir esto y no ver
            // ningún cambio sería desconcertante: se abren las listas y ya está.
            onChange={() => {
              if (enTodasPartes && opciones.seccion.length) {
                onChange([{ tipo: "seccion", valor: PORTADA.slug }]);
              }
            }}
          />
          <span>Sólo donde yo diga</span>
        </label>
      </div>

      {enTodasPartes ? (
        <p className="se-admin-meta-hint">
          Es lo normal para una campaña de marca, y no hace falta configurar nada.
        </p>
      ) : (
        <>
          {!ready ? (
            <p className="se-admin-meta-hint">Cargando las secciones y los temas…</p>
          ) : (
            GRUPOS.map(({ tipo, titulo, pista }) => (
              <fieldset key={tipo} className="se-donde__grupo">
                <legend>{titulo}</legend>
                <p className="se-admin-meta-hint">{pista}</p>
                <div className="se-donde__casillas">
                  {opciones[tipo].map((o) => (
                    <label key={o.slug} className="se-donde__casilla">
                      <input
                        type="checkbox"
                        checked={tiene(tipo, o.slug)}
                        onChange={() => alternar(tipo, o.slug)}
                      />
                      <span>{o.nombre}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))
          )}

          {huerfanas.length ? (
            <div className="se-donde__huerfanas">
              <p>
                Estas condiciones estaban guardadas y <b>no encajan con nada</b>, así que
                hoy impiden que la campaña salga. Vienen de cuando esto era un campo de
                texto libre.
              </p>
              <ul>
                {huerfanas.map((s) => (
                  <li key={`${s.tipo}-${s.valor}`}>
                    <code>
                      {s.tipo}: {s.valor}
                    </code>
                    <button
                      type="button"
                      className="se-btn se-btn--secondary"
                      onClick={() =>
                        onChange(
                          puestas.filter(
                            (x) => !(x.tipo === s.tipo && x.valor === s.valor),
                          ),
                        )
                      }
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      {combinacionImposible ? (
        <p className="se-donde__imposible">
          <b>Así no va a salir en ninguna parte.</b> La portada no tiene tema ni país, y
          las condiciones de grupos distintos se exigen a la vez. Marque también alguna
          sección de contenido, o quite los temas y países.
        </p>
      ) : null}

      <p className="se-donde__resumen">{resumen}</p>
    </div>
  );
};

DondeSale.propTypes = {
  /** `[{tipo, valor}]`, tal y como lo guarda la campaña. */
  valor: PropTypes.arrayOf(
    PropTypes.shape({ tipo: PropTypes.string, valor: PropTypes.string }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default DondeSale;
