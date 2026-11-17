import { useEffect, useId, useState } from "react";
import PropTypes from "prop-types";
import { useAdminToast } from "../../../context/AdminToastContext";
import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { adminRequest } from "../../../lib/api";
import { recorridoTitulares } from "../../../lib/guias/guiaTitulares";
import { unwrapEntity } from "../../../services/adminResponseUtils";
import { ModalDelPanel } from "../ModalDelPanel";

const { ancla } = recorridoTitulares;

/**
 * Los medios que lee el sistema de titulares, con cuántas notas mandaron en 24 horas.
 *
 * Silenciar uno hace que sus notas nuevas dejen de contar; con la casilla marcada, se
 * borran además los titulares publicados donde era el único medio (motivo «fuente poco
 * confiable»). Reactivar lo devuelve desde ese momento. Va plegada: son decenas de
 * medios y se mira de vez en cuando, no a cada rato.
 *
 * **Un medio nuevo llega silenciado** (`"nueva": true`; auditoría del 17-nov-2026,
 * D-12): nadie lo ha revisado y sus notas no cuentan hasta que alguien lo activa aquí,
 * eligiendo su nivel. Van los primeros de la lista, con su marca, y el resumen plegado
 * dice cuántos esperan. Activar y reactivar pasan por la misma ventana, con el nivel:
 * es la única forma de cambiarlo (el que dice el recolector solo vale la primera vez).
 */

const NIVEL = { 1: "1 · oficial", 2: "2 · agencia", 3: "3 · medio", 4: "4 · Google News o pequeño" };

/**
 * Qué significa cada nivel, para quien lo elige. Sale de las reglas del backend
 * (`titulares_reglas.puede_publicar` y `titulares_ajustes`): con qué basta para publicar.
 */
const NIVELES = [
  { nivel: 1, nombre: "Oficial", ejemplo: "Bancos centrales, gobiernos, organismos públicos.",
    pesa: "Basta él solo para publicar una noticia." },
  { nivel: 2, nombre: "Agencia de noticias", ejemplo: "EFE, Reuters, AFP.",
    pesa: "Basta él solo para publicar una noticia." },
  { nivel: 3, nombre: "Medio reconocido", ejemplo: "Diarios nacionales de América Latina o del mundo.",
    pesa: "Basta él solo para una noticia normal; una delicada pide otro medio que la cuente." },
  { nivel: 4, nombre: "Google News o medio pequeño", ejemplo: "Búsquedas por tema, medios locales o poco conocidos.",
    pesa: "Nunca basta solo: hacen falta 3 medios distintos (2 si la noticia es de Venezuela)." },
];

const FILTROS = [
  { clave: "todas", texto: "Todos" },
  { clave: "nuevas", texto: "Nuevos, sin activar" },
  { clave: "silenciadas", texto: "Silenciados" },
  { clave: "cuentan", texto: "Que cuentan" },
];

const pasa = {
  todas: () => true,
  nuevas: (f) => f.nueva,
  silenciadas: (f) => f.silenciada && !f.nueva,
  cuentan: (f) => !f.silenciada,
};

const estadoDe = (f) => {
  if (f.nueva) return <span className="se-tit-marca se-tit-marca--nueva">Nueva, sin activar</span>;
  if (f.silenciada) return `Silenciado${f.silenciada_por ? ` por ${f.silenciada_por}` : ""}`;
  return "Cuenta";
};

export const FuentesDeTitulares = ({ fuentes, onCambio, anclaje }) => {
  const { toastSuccess, toastError } = useAdminToast();
  const [silenciando, setSilenciando] = useState(null);
  const [retirar, setRetirar] = useState(false);
  const [activando, setActivando] = useState(null);
  const [nivel, setNivel] = useState(3);
  const [filtro, setFiltro] = useState("todas");
  const [ocupado, setOcupado] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const grupoNivel = useId();

  // Los pasos de la guía que hablan de los medios (`abrirFuentes`) despliegan la lista:
  // lo que el paso explica tiene que verse. Solo abre; cerrarla es cosa de quien mira.
  useEffect(() => {
    const mirar = () => {
      if (recorridoTitulares.definicionActual()?.abrirFuentes) setAbierta(true);
    };
    mirar();
    return recorridoTitulares.suscribir(mirar);
  }, []);

  // Silenciados a mano; los nuevos, que también lo están, se cuentan aparte.
  const silenciadas = fuentes.filter((f) => f.silenciada && !f.nueva).length;
  const nuevas = fuentes.filter((f) => f.nueva).length;
  // Las nuevas, arriba: son las que piden que alguien haga algo. El resto, en el orden
  // del servidor (`sort` es estable).
  const visibles = fuentes.filter(pasa[filtro] ?? pasa.todas).sort((a, b) => Number(Boolean(b.nueva)) - Number(Boolean(a.nueva)));

  const silenciar = async () => {
    setOcupado(true);
    try {
      const r = await adminRequest(`/admin/headlines/fuentes/${encodeURIComponent(silenciando.id)}/mute`, {
        method: "POST",
        json: { retirar },
      });
      const n = unwrapEntity(r)?.retirados?.length ?? 0;
      toastSuccess(
        `${silenciando.nombre} silenciada.${n ? ` Se borraron ${n} titular${n === 1 ? "" : "es"} donde era la única fuente.` : ""}`,
        "Titulares",
      );
      setSilenciando(null);
      onCambio();
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo silenciar."), "Titulares");
    } finally {
      setOcupado(false);
    }
  };

  /** Abre la ventana de activar con el nivel que tiene ahora (el que propuso el recolector, si es nueva). */
  const abrirActivar = (f) => {
    setNivel(NIVEL[f.nivel] ? f.nivel : 3);
    setActivando(f);
  };

  const activar = async () => {
    const f = activando;
    setOcupado(true);
    try {
      await adminRequest(`/admin/headlines/fuentes/${encodeURIComponent(f.id)}/unmute`, {
        method: "POST",
        json: { nivel },
      });
      toastSuccess(
        `${f.nombre} ${f.nueva ? "activado" : "vuelve a contar"}, con nivel ${nivel}.`,
        "Titulares",
      );
      setActivando(null);
      onCambio();
    } catch (err) {
      toastError(adminErrorMessage(err, f.nueva ? "No se pudo activar." : "No se pudo reactivar."), "Titulares");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <details className="se-admin-table-wrap se-tit-fuentes" open={abierta}
      onToggle={(e) => setAbierta(e.currentTarget.open)} {...anclaje}>
      <summary className="se-tit-fuentes__resumen">
        <span className="se-heading-card">Medios que lee el sistema</span>
        <span className="se-admin-meta-hint">
          {fuentes.length} medio{fuentes.length === 1 ? "" : "s"}
          {silenciadas ? ` · ${silenciadas} silenciado${silenciadas === 1 ? "" : "s"}` : ""}
        </span>
        {nuevas ? (
          <span className="se-tit-marca se-tit-marca--nueva">
            {nuevas} nuevo{nuevas === 1 ? "" : "s"} sin activar
          </span>
        ) : null}
      </summary>
      {fuentes.length ? (
        <>
          <div className="se-admin-filters se-tit-fuentes__filtros" {...ancla("fuentes-nuevas")}>
            <label className="se-admin-filters__field">
              <span className="se-form-label">Enseñar</span>
              <select className="se-form-control" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                {FILTROS.map((o) => (
                  <option key={o.clave} value={o.clave}>
                    {o.texto}
                    {o.clave === "nuevas" ? ` (${nuevas})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <span className="se-admin-meta-hint">
              Un medio nuevo llega silenciado: sus notas no cuentan hasta que alguien lo revisa y lo activa. Van los primeros.
            </span>
          </div>
          {visibles.length ? (
            <div className="se-tit-fuentes__tabla">
              <table className="se-admin-table">
                <thead>
                  <tr>
                    <th scope="col">Medio</th>
                    <th scope="col" {...ancla("fuentes-nivel")}>Nivel</th>
                    <th scope="col">País</th>
                    <th scope="col" className="se-tit-num">Notas 24 h</th>
                    <th scope="col">Estado</th>
                    <th scope="col"><span className="se-sr-only">Acción</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((f) => (
                    <tr key={f.id} className={f.silenciada && !f.nueva ? "se-tit-fuentes__fila--muda" : undefined}>
                      <td>{f.nombre}</td>
                      <td>{NIVEL[f.nivel] || f.nivel}</td>
                      <td>{f.pais}</td>
                      <td className="se-tit-num">{f.notas_24h}</td>
                      <td>{estadoDe(f)}</td>
                      <td className="se-admin-table__actions">
                        {f.silenciada ? (
                          <button type="button" className={`se-btn ${f.nueva ? "se-btn--primary" : "se-btn--secondary"}`}
                            disabled={ocupado} onClick={() => abrirActivar(f)}>
                            {f.nueva ? "Activar…" : "Reactivar…"}
                          </button>
                        ) : (
                          <button type="button" className="se-btn se-btn--secondary" disabled={ocupado}
                            onClick={() => { setRetirar(false); setSilenciando(f); }}>
                            Silenciar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="se-admin-meta-hint">Ningún medio en esta lista.</p>
          )}
        </>
      ) : (
        <p className="se-admin-meta-hint">Todavía no llegó ninguna nota.</p>
      )}

      <ModalDelPanel
        abierto={Boolean(activando)}
        ocupado={ocupado}
        onCerrar={() => setActivando(null)}
        titulo={`${activando?.nueva ? "Activar" : "Reactivar"} ${activando?.nombre ?? ""}`}
        subtitulo={activando?.pais ? `País: ${activando.pais}` : undefined}
        pie={
          <>
            <button type="button" className="se-btn se-btn--secondary" onClick={() => setActivando(null)} disabled={ocupado}>
              Cancelar
            </button>
            <button type="button" className="se-btn se-btn--primary" onClick={activar} disabled={ocupado}>
              {ocupado ? "Activando…" : `${activando?.nueva ? "Activar" : "Reactivar"} con nivel ${nivel}`}
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          {activando?.nueva
            ? "Llegó solo y todavía no cuenta. Antes de activarlo, compruebe que es un medio serio. Desde ahora sus notas sirven para elegir y redactar titulares."
            : "Sus notas vuelven a contar desde ahora."}
        </p>
        <fieldset className="se-tit-niveles">
          <legend className="se-form-label">¿Qué tipo de medio es?</legend>
          {NIVELES.map((n) => (
            <label key={n.nivel} className="se-tit-nivel">
              <input type="radio" name={grupoNivel} value={n.nivel} checked={nivel === n.nivel}
                onChange={() => setNivel(n.nivel)} disabled={ocupado} />
              <span>
                <strong>{n.nivel} · {n.nombre}</strong>
                {activando?.nivel === n.nivel ? (
                  <span className="se-admin-meta-hint"> ({activando.nueva ? "el que propone el sistema" : "el que tiene ahora"})</span>
                ) : null}
                <span className="se-tit-nivel__texto">{n.ejemplo} {n.pesa}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="se-admin-meta-hint" style={{ marginBottom: 0 }}>
          Las noticias delicadas (política, sucesos, tribunales) piden más: dos medios distintos o uno de nivel 1 o 2;
          un caso judicial con nombres, siempre dos medios. Cuanto más bajo el número, más pesa el medio al elegir qué sale. El nivel se aplica también a las notas suyas ya guardadas.
        </p>
      </ModalDelPanel>

      <ModalDelPanel
        abierto={Boolean(silenciando)}
        ocupado={ocupado}
        onCerrar={() => setSilenciando(null)}
        titulo={`Silenciar ${silenciando?.nombre ?? ""}`}
        pie={
          <>
            <button type="button" className="se-btn se-btn--secondary" onClick={() => setSilenciando(null)} disabled={ocupado}>
              Cancelar
            </button>
            <button type="button" className="se-btn se-btn--primary" onClick={silenciar} disabled={ocupado}>
              {ocupado ? "Silenciando…" : "Silenciar"}
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          Sus notas nuevas dejan de contar para elegir y redactar titulares. Lo que ya contó sigue contando.
          Se puede reactivar cuando quiera.
        </p>
        <label className="se-tit-casilla">
          <input type="checkbox" checked={retirar} onChange={(e) => setRetirar(e.target.checked)} />
          Borrar también los titulares publicados donde este medio era la única fuente
        </label>
      </ModalDelPanel>
    </details>
  );
};

FuentesDeTitulares.propTypes = {
  fuentes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nombre: PropTypes.string,
      nivel: PropTypes.number,
      pais: PropTypes.string,
      notas_24h: PropTypes.number,
      silenciada: PropTypes.bool,
      nueva: PropTypes.bool,
      silenciada_por: PropTypes.string,
    }),
  ).isRequired,
  onCambio: PropTypes.func.isRequired,
  anclaje: PropTypes.object,
};
