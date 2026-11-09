import PropTypes from "prop-types";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { POR_FORMATO } from "../../publicidad/EspacioPublicitario";
import { useRotacion } from "../../../hooks/useRotacion";
import { FORMATO_DEL_HUECO, NOMBRE_DEL_HUECO, PAGINAS, huecosDe } from "./paginas";
import "../../../styles/mapa.css";

/**
 * El mapa del sitio: cada página dibujada con sus huecos de publicidad, y dentro de
 * cada hueco el carrusel de marcas tal como lo sirve el servidor en esa recarga.
 *
 * Lo que enseña sale de `GET /admin/publicidad/escalera`, que corre **la misma función
 * que sirve al lector**: lo que se ve aquí es lo que pasa en el sitio. «Siguiente
 * recarga» hace bajar la escalera un peldaño, igual que cuando alguien recarga.
 *
 * Con `fijar`, el mapa sirve para elegir plaza: los huecos que admiten ese arte se pueden
 * pulsar, y dicen cuántas plazas fijas quedan en esas fechas.
 */

const ANCHO = { pc: 1120, telefono: 390 };

/** Mide el ancho disponible y escala el dibujo entero para que quepa. */
const useEscala = (anchoDeDiseno) => {
  const marco = useRef(null);
  const lienzo = useRef(null);
  const [escala, setEscala] = useState(1);
  const [alto, setAlto] = useState(0);
  useLayoutEffect(() => {
    const medir = () => {
      const disponible = marco.current?.clientWidth ?? anchoDeDiseno;
      const e = Math.min(1, disponible / anchoDeDiseno);
      setEscala(e);
      setAlto((lienzo.current?.offsetHeight ?? 0) * e);
    };
    medir();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    if (ro && marco.current) ro.observe(marco.current);
    if (ro && lienzo.current) ro.observe(lienzo.current);
    return () => ro?.disconnect();
  }, [anchoDeDiseno]);
  return { marco, lienzo, escala, alto };
};

const Muestra = ({ forma, texto }) => {
  if (forma === "cabecera") {
    return (
      <div className="se-mapa__cabecera">
        <span className="se-mapa__logo">SurEconomics</span>
        <span className="se-mapa__menu">Noticias · Artículos · Editorial · Al punto · Informes</span>
      </div>
    );
  }
  if (forma === "seccion") return <div className="se-mapa__seccion">{texto}</div>;
  if (forma === "titular") {
    return (
      <div className="se-mapa__titular">
        <span className="se-mapa__kicker">Mercados</span>
        <span className="se-mapa__h1">Titular de muestra: la pieza que está leyendo el lector</span>
        <span className="se-mapa__firma">Por Redacción · hace 2 horas</span>
      </div>
    );
  }
  if (forma === "apertura") {
    return (
      <div className="se-mapa__apertura">
        <div className="se-mapa__foto" />
        <span className="se-mapa__h1">La noticia que abre la portada hoy</span>
        <span className="se-mapa__lineas se-mapa__lineas--3" />
      </div>
    );
  }
  if (forma === "lista") {
    return (
      <div className="se-mapa__lista">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className="se-mapa__item">
            <b>09:{n}0</b> Titular breve de una noticia de muestra
          </span>
        ))}
      </div>
    );
  }
  if (forma === "monedas") {
    return (
      <div className="se-mapa__monedas">
        {["USD/VES", "EUR/VES", "USD/COP", "USD/ARS"].map((m) => (
          <span key={m} className="se-mapa__moneda">
            <b>{m}</b> 00,00
          </span>
        ))}
      </div>
    );
  }
  if (forma === "tarjeta") {
    return (
      <div className="se-mapa__tarjeta">
        <div className="se-mapa__foto se-mapa__foto--16-9" />
        <span className="se-mapa__h3">Titular de una pieza de muestra</span>
        <span className="se-mapa__lineas se-mapa__lineas--2" />
      </div>
    );
  }
  if (forma === "foto") return <div className="se-mapa__foto se-mapa__foto--grande" />;
  if (forma === "texto") return <span className="se-mapa__lineas se-mapa__lineas--6" />;
  if (forma === "juego") return <div className="se-mapa__juego">Un minuto de pausa · pantalla del juego</div>;
  if (forma === "marcador") return <div className="se-mapa__juego">Marcador de la jornada</div>;
  if (forma === "pie") return <div className="se-mapa__pie">SurEconomics · Quiénes somos · Anúnciese · Boletín</div>;
  return null;
};

Muestra.propTypes = { forma: PropTypes.string.isRequired, texto: PropTypes.string };

/** Lo que pinta un hueco: el carrusel de sus plazas con el componente real del sitio. */
const Hueco = ({ espacio, variante, plazas, destacada, fijar, ocupado, telefono }) => {
  const formato = FORMATO_DEL_HUECO[espacio];
  const Pintor = POR_FORMATO[formato];
  const { indice } = useRotacion(plazas, { activa: plazas.length > 1 });
  const actual = plazas[indice] ?? null;
  const miPlaza = plazas.findIndex((p) => destacada && p.pieza_id === destacada);

  const compatible = fijar && fijar.formato === formato;
  const libres = ocupado?.libres ?? null;
  const elegido = Boolean(fijar?.elegidos?.includes(espacio));
  const sePuede = compatible && (elegido || libres === null || libres > 0);

  const clases = [
    "se-mapa__hueco",
    `se-mapa__hueco--${formato}`,
    miPlaza >= 0 ? "is-mia" : "",
    fijar ? (compatible ? (sePuede ? "is-elegible" : "is-lleno") : "is-ajeno") : "",
    elegido ? "is-elegido" : "",
    telefono ? "is-telefono" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cuerpo = actual && Pintor ? (
    <div className="se-mapa__anuncio" key={actual.pieza_id}>
      <Pintor hueco={{ ...actual, enlace: null }} variante={variante} />
    </div>
  ) : (
    <div className="se-mapa__vacio">
      <span>{NOMBRE_DEL_HUECO[espacio]}</span>
      <small>{fijar ? "Sin marcas en esta recarga" : "Libre · sale el relleno de la casa"}</small>
    </div>
  );

  const rotulo = (
    <div className="se-mapa__rotulo">
      <span className="se-mapa__nombre">{NOMBRE_DEL_HUECO[espacio]}</span>
      {plazas.length ? (
        <span className="se-mapa__orden" title="El orden del carrusel en esta recarga">
          {plazas.map((p, i) => (
            <b key={p.pieza_id} className={i === indice ? "is-ahora" : ""}>
              {i + 1} {p.anunciante}
              {p.fijada ? " ·fija" : ""}
            </b>
          ))}
        </span>
      ) : null}
      {fijar && compatible ? (
        <span className="se-mapa__plazas">
          {libres === null ? "" : libres > 0 ? `${libres} de ${ocupado.plazas} plazas libres` : `Lleno hasta ${ocupado?.libre_desde ?? "…"}`}
          {elegido ? " · elegido" : ""}
        </span>
      ) : null}
      {miPlaza >= 0 ? <span className="se-mapa__mia">Tu anuncio: {miPlaza + 1}.º del carrusel</span> : null}
    </div>
  );

  if (fijar && compatible) {
    return (
      <button
        type="button"
        className={clases}
        disabled={!sePuede}
        aria-pressed={elegido}
        onClick={() => fijar.onElegir(espacio)}
        title={sePuede ? (elegido ? "Quitar la plaza fija" : "Fijar una plaza aquí") : "Sin plazas libres en esas fechas"}
      >
        {rotulo}
        {cuerpo}
      </button>
    );
  }
  return (
    <div className={clases}>
      {rotulo}
      {cuerpo}
    </div>
  );
};

Hueco.propTypes = {
  espacio: PropTypes.string.isRequired,
  variante: PropTypes.string,
  plazas: PropTypes.array.isRequired,
  destacada: PropTypes.number,
  fijar: PropTypes.object,
  ocupado: PropTypes.object,
  telefono: PropTypes.bool,
};

const Bloques = ({ bloques, aparato, reparto, destacada, fijar, ocupacion }) =>
  bloques
    .filter((b) => !b.solo || b.solo === aparato)
    .map((b, i) => {
      if (b.tipo === "muestra") return <Muestra key={i} forma={b.forma} texto={b.texto} />;
      if (b.tipo === "hueco") {
        return (
          <div key={b.espacio} className={`se-mapa__sitio${b.fija ? " se-mapa__sitio--fijo" : ""}`}>
            <Hueco
              espacio={b.espacio}
              variante={b.variante}
              plazas={reparto[b.espacio] ?? []}
              destacada={destacada}
              fijar={fijar}
              ocupado={ocupacion?.[b.espacio]}
              telefono={aparato === "telefono"}
            />
          </div>
        );
      }
      if (b.tipo === "rejilla") {
        return (
          <div key={i} className="se-mapa__rejilla">
            <Bloques bloques={b.bloques} aparato={aparato} reparto={reparto} destacada={destacada} fijar={fijar} ocupacion={ocupacion} />
          </div>
        );
      }
      if (b.tipo === "columnas") {
        return (
          <div key={i} className="se-mapa__columnas">
            {b.columnas.map((c, j) => (
              <div key={j} className="se-mapa__columna" style={{ flex: c.ancho }}>
                <Bloques bloques={c.bloques} aparato={aparato} reparto={reparto} destacada={destacada} fijar={fijar} ocupacion={ocupacion} />
              </div>
            ))}
          </div>
        );
      }
      return null;
    });

export const MapaDelSitio = ({
  recargas,
  fecha,
  ocupacion,
  destacada,
  fijar,
  cargando,
  titulo,
}) => {
  const [pagina, setPagina] = useState(PAGINAS[0].clave);
  const [aparato, setAparato] = useState("pc");
  const [recarga, setRecarga] = useState(0);
  const total = recargas?.length ?? 0;
  const reparto = recargas?.[Math.min(recarga, Math.max(0, total - 1))] ?? {};
  const actual = PAGINAS.find((p) => p.clave === pagina) ?? PAGINAS[0];
  const { marco, lienzo, escala, alto } = useEscala(ANCHO[aparato]);

  useEffect(() => {
    if (recarga >= total && total) setRecarga(0);
  }, [recarga, total]);

  // Dónde cae el anuncio destacado en esta recarga, para decirlo arriba.
  const dondeCae = useMemo(() => {
    if (!destacada) return [];
    return Object.entries(reparto)
      .map(([espacio, plazas]) => {
        const i = plazas.findIndex((p) => p.pieza_id === destacada);
        return i >= 0 ? { espacio, posicion: i + 1 } : null;
      })
      .filter(Boolean);
  }, [reparto, destacada]);
  const enEstaPagina = new Set(huecosDe(actual, aparato));

  return (
    <section className="se-mapa" aria-label={titulo ?? "Mapa del sitio"}>
      <header className="se-mapa__barra">
        <div className="se-mapa__pestanas" role="tablist" aria-label="Página">
          {PAGINAS.map((p) => (
            <button
              key={p.clave}
              type="button"
              role="tab"
              aria-selected={p.clave === pagina}
              className={`se-mapa__pestana${p.clave === pagina ? " is-on" : ""}`}
              onClick={() => setPagina(p.clave)}
            >
              {p.nombre}
            </button>
          ))}
        </div>
        <div className="se-mapa__pestanas" role="tablist" aria-label="Aparato">
          {[
            ["pc", "Computador"],
            ["telefono", "Teléfono"],
          ].map(([clave, nombre]) => (
            <button
              key={clave}
              type="button"
              role="tab"
              aria-selected={aparato === clave}
              className={`se-mapa__pestana${aparato === clave ? " is-on" : ""}`}
              onClick={() => setAparato(clave)}
            >
              {nombre}
            </button>
          ))}
        </div>
        {total > 1 ? (
          <div className="se-mapa__recargas" role="group" aria-label="Recarga">
            <button type="button" className="se-mapa__paso" onClick={() => setRecarga((r) => (r - 1 + total) % total)} aria-label="Recarga anterior">
              ‹
            </button>
            <span className="se-mapa__cual">
              Recarga <b>{recarga + 1}</b> de {total}
            </span>
            <button type="button" className="se-mapa__paso se-mapa__paso--siguiente" onClick={() => setRecarga((r) => (r + 1) % total)}>
              Siguiente recarga ›
            </button>
          </div>
        ) : null}
      </header>

      <p className="se-mapa__explica">
        {fijar
          ? "Pulse un hueco iluminado para fijarle una plaza a este arte. Los huecos en gris piden otra forma de arte."
          : "Así lo ve una persona en esa recarga: cada hueco pasa sus marcas cada siete segundos, y en la recarga siguiente la escalera baja un peldaño."}
        {destacada && dondeCae.length ? (
          <>
            {" "}
            En esta recarga tu anuncio sale en{" "}
            {dondeCae
              .map((d) => `${NOMBRE_DEL_HUECO[d.espacio] ?? d.espacio} (${d.posicion}.º)${enEstaPagina.has(d.espacio) ? "" : " · otra página"}`)
              .join(", ")}
            .
          </>
        ) : null}
        {destacada && total && !dondeCae.length ? " En esta recarga tu anuncio no sale en ningún hueco: la escalera lo trae en otra." : null}
        {fecha && fecha !== new Date().toISOString().slice(0, 10) ? ` Simulado para el ${fecha}, primer día de la campaña.` : null}
      </p>

      <div className={`se-mapa__marco se-mapa__marco--${aparato}${cargando ? " is-cargando" : ""}`} ref={marco} style={{ height: alto || undefined }}>
        <div
          className={`se-mapa__pagina se-mapa__pagina--${aparato}`}
          ref={lienzo}
          style={{ width: ANCHO[aparato], transform: `scale(${escala})` }}
        >
          <Bloques bloques={actual.bloques} aparato={aparato} reparto={reparto} destacada={destacada} fijar={fijar} ocupacion={ocupacion} />
        </div>
      </div>
    </section>
  );
};

MapaDelSitio.propTypes = {
  /** Lo que devuelve `getEscalera`: una entrada por recarga, `{ espacio: [plazas] }`. */
  recargas: PropTypes.array,
  /** Lo que devuelve `getOcupacion`: `{ espacio: { plazas, libres, fijas, libre_desde } }`. */
  ocupacion: PropTypes.object,
  /** El día simulado (ISO): hoy, o el primer día de una campaña futura. */
  fecha: PropTypes.string,
  /** El id de la pieza que se está creando, para señalarla. */
  destacada: PropTypes.number,
  /** Modo elegir plaza: `{ formato, elegidos: string[], onElegir(espacio) }`. */
  fijar: PropTypes.shape({
    formato: PropTypes.string.isRequired,
    elegidos: PropTypes.arrayOf(PropTypes.string).isRequired,
    onElegir: PropTypes.func.isRequired,
  }),
  cargando: PropTypes.bool,
  titulo: PropTypes.string,
};

export default MapaDelSitio;
