import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { TEAM, claveDeFoto } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";
import { TeamMemberCard } from "./TeamMemberCard";
import "./arbolDelEquipo.css";

/**
 * El equipo de «Quiénes somos» como un organigrama: de la Junta Directiva al Equipo,
 * cargo a cargo, unidos por el tronco, y los Colaboradores en una rama de trazo
 * discontinuo (están fuera de la redacción).
 *
 * Cada nivel se dibuja al asomarse: baja el tronco, aparece el cargo, se abre la
 * llave y caen las personas. El árbol crece mientras se lee.
 *
 * La misma persona ocupa varios cargos -- Óscar Doval está en cuatro --, que es como lo
 * tiene el documento del cliente (ver `TEAM`). Al pasar por un nombre se encienden
 * todos sus sitios en el árbol y la línea de abajo los dice en voz alta. La identidad
 * es `claveDeFoto`: es lo que ya une las fichas repetidas de una persona.
 */

/** Los niveles, de arriba abajo. `rama` cuelga de ese nivel, al costado. */
const NIVELES = [
  { clave: "junta", grupo: "board" },
  { clave: "directorGeneral", grupo: "directorGeneral", rama: { clave: "colaboradores", grupo: "collaborators" } },
  { clave: "editorEnJefe", grupo: "editorEnJefe" },
  { clave: "comiteEditorial", grupo: "editorialCommittee" },
  { clave: "equipo", grupo: "team" },
];

const Personas = ({ miembros, fotos, quien, onResaltar, className }) => (
  <ul className={className}>
    {miembros.map((m, i) => {
      const clave = claveDeFoto(m);
      return (
        <li
          key={m.id}
          className={`se-arbol__persona${quien === clave ? " es-resaltada" : ""}`}
          style={{ "--i": i }}
          onPointerEnter={(e) => e.pointerType === "mouse" && onResaltar(clave)}
          onPointerLeave={(e) => e.pointerType === "mouse" && onResaltar(null)}
          // En el teléfono no hay «pasar por encima»: un toque enciende y otro apaga.
          onPointerUp={(e) => e.pointerType !== "mouse" && onResaltar((antes) => (antes === clave ? null : clave))}
          onFocus={() => onResaltar(clave)}
          onBlur={() => onResaltar(null)}
        >
          <TeamMemberCard member={m} foto={fotos?.[clave] || ""} compacta />
        </li>
      );
    })}
  </ul>
);

Personas.propTypes = {
  miembros: PropTypes.arrayOf(PropTypes.object).isRequired,
  fotos: PropTypes.objectOf(PropTypes.string),
  quien: PropTypes.string,
  onResaltar: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
};

const Nivel = ({ titulo, miembros, rama, ...resto }) => {
  // Cada nivel tiene su propio vigía: se dibuja cuando le toca, no todos a la vez.
  const ref = useRef(null);
  useRevealOnScroll(ref, { threshold: 0.2 });
  return (
    <li ref={ref} className="se-arbol__nivel" style={{ "--cuantos": miembros.length }}>
      <h3 className="se-arbol__cargo">{titulo}</h3>
      <Personas miembros={miembros} className="se-arbol__personas" {...resto} />
      {rama ? (
        <section className="se-arbol__rama" aria-label={rama.titulo}>
          <h3 className="se-arbol__cargo se-arbol__cargo--rama">{rama.titulo}</h3>
          <Personas miembros={rama.miembros} className="se-arbol__personas se-arbol__personas--rama" {...resto} />
        </section>
      ) : null}
    </li>
  );
};

Nivel.propTypes = {
  titulo: PropTypes.string.isRequired,
  miembros: PropTypes.arrayOf(PropTypes.object).isRequired,
  rama: PropTypes.shape({ titulo: PropTypes.string, miembros: PropTypes.arrayOf(PropTypes.object) }),
};

export const ArbolDelEquipo = ({ fotos }) => {
  const { t, lang } = useIdioma();
  const [quien, setQuien] = useState(null);
  const titulo = (clave) => t(`paginas.quienesSomos.secciones.${clave}`);

  // Los cargos de quien está encendido, en el orden del árbol y las ramas al final.
  // Son veinte fichas: se recorren al vuelo, sin guardar nada.
  const elegido = quien
    ? [...NIVELES, ...NIVELES.filter((n) => n.rama).map((n) => n.rama)].reduce(
        (acc, n) => {
          const m = (TEAM[n.grupo] ?? []).find((x) => claveDeFoto(x) === quien);
          return m ? { nombre: m.name, cargos: [...acc.cargos, titulo(n.clave)] } : acc;
        },
        { nombre: "", cargos: [] }
      )
    : null;
  const lista = new Intl.ListFormat(lang, { type: "conjunction" });

  return (
    <div className={`se-arbol-equipo${quien ? " se-arbol-equipo--resaltando" : ""}`}>
      <p className="se-arbol-equipo__pista">{t("paginas.quienesSomos.arbol.pista")}</p>
      <ol className="se-arbol">
        {NIVELES.map((n) =>
          TEAM[n.grupo]?.length ? (
            <Nivel
              key={n.clave}
              titulo={titulo(n.clave)}
              miembros={TEAM[n.grupo]}
              rama={n.rama && TEAM[n.rama.grupo]?.length ? { titulo: titulo(n.rama.clave), miembros: TEAM[n.rama.grupo] } : null}
              fotos={fotos}
              quien={quien}
              onResaltar={setQuien}
            />
          ) : null
        )}
      </ol>
      {/* Siempre en la página, para que el lector de pantalla la anuncie; a la vista
          solo con alguien encendido, pegada al pie de la pantalla. */}
      <p className={`se-arbol-equipo__lectura${elegido ? " es-visible" : ""}`} aria-live="polite">
        {elegido ? (
          <>
            <strong>{elegido.nombre}</strong>
            <span>{lista.format(elegido.cargos)}</span>
          </>
        ) : null}
      </p>
    </div>
  );
};

ArbolDelEquipo.propTypes = {
  /** `{ clave de foto: dirección }`. Quien no esté, sale con sus iniciales. */
  fotos: PropTypes.objectOf(PropTypes.string),
};

export default ArbolDelEquipo;
