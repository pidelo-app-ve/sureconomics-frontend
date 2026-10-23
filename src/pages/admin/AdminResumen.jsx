import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ErrorState, LoadingState } from "../../components/content";
import { BotonGuia, RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { adminRequest } from "../../lib/api";
import { recorridoResumen } from "../../lib/guias/guiaResumen";
import { applyPageMeta } from "../../lib/seo";
import { unwrapEntity } from "../../services/adminResponseUtils";

/**
 * «Resumen diario» en el panel: revisar y aprobar «Lo importante de hoy».
 *
 * A las 6:00 el backend arma solo un borrador (ver `services/resumen_service.py`); aquí
 * el editor quita, reordena, mueve de sección y reescribe los puntos, añade cifras a
 * mano y la frase del día, y lo **aprueba**. A las 7:00 sale en la web, en Telegram y en
 * WhatsApp (o en el minuto, si se aprueba después). Sin aprobación no sale.
 *
 * Los cambios se guardan con «Guardar cambios»: el borrador se edita aquí, en el
 * navegador, y solo se manda entero al guardar. Aprobar pide que no haya nada sin guardar.
 */

const ESTADO = {
  borrador: { texto: "Borrador", clase: "se-res-adm-chip--borrador" },
  aprobado: { texto: "Aprobado", clase: "se-res-adm-chip--aprobado" },
  publicado: { texto: "Publicado", clase: "se-res-adm-chip--publicado" },
};
const CANAL = {
  apagado: "sin configurar",
  pendiente: "pendiente",
  enviando: "enviando…",
  enviado: "enviado",
  fallo: "falló",
};
const ancla = (clave) => ({ [recorridoResumen.atributo]: clave });
const zona = { timeZone: "America/Caracas" };
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("es-VE", { ...zona, hour: "2-digit", minute: "2-digit" }) : "—");
const conVariacion = (c) =>
  typeof c.variacion === "number" && Math.abs(c.variacion) >= 0.005
    ? `${c.valor} (${c.variacion > 0 ? "+" : "−"}${Math.abs(c.variacion).toFixed(2).replace(".", ",")} %)`
    : c.valor;

/** Lo editable de un resumen, en la forma que se manda al guardar. */
const editable = (r) => ({
  secciones: (r?.secciones ?? []).map((s) => ({
    clave: s.clave,
    puntos: s.puntos.map((p) => ({ id: p.id, linea: p.linea, linea_en: p.linea_en })),
  })),
  frase: r?.frase ?? "",
  cifras_manuales: (r?.cifras_manuales ?? []).map((c) => ({ etiqueta: c.etiqueta, valor: c.valor })),
});

const Punto = ({ punto, info, secciones, clave, primero, ultimo, bloqueado, onCambio, onMover, onQuitar, onSubir, onBajar }) => (
  <li className="se-res-adm-punto">
    <div className="se-res-adm-punto__fila">
      <input className="se-form-control" value={punto.linea} maxLength={140} disabled={bloqueado}
        aria-label="Línea del punto" onChange={(e) => onCambio({ ...punto, linea: e.target.value })} />
      <div className="se-res-adm-punto__botones">
        <button type="button" className="se-btn se-btn--secondary" aria-label="Subir" disabled={bloqueado || primero} onClick={onSubir}>↑</button>
        <button type="button" className="se-btn se-btn--secondary" aria-label="Bajar" disabled={bloqueado || ultimo} onClick={onBajar}>↓</button>
        <label className="se-sr-only" htmlFor={`mover-${punto.id}`}>Mover a otra sección</label>
        <select id={`mover-${punto.id}`} className="se-form-control se-res-adm-punto__mover" value="" disabled={bloqueado}
          onChange={(e) => e.target.value && onMover(e.target.value)}>
          <option value="">Mover a…</option>
          {secciones.filter((s) => s.clave !== clave).map((s) => (
            <option key={s.clave} value={s.clave}>{s.titulo}</option>
          ))}
        </select>
        <button type="button" className="se-btn se-btn--secondary" disabled={bloqueado} onClick={onQuitar}>Quitar</button>
      </div>
    </div>
    <p className="se-admin-meta-hint se-res-adm-punto__meta">
      {info?.tipo === "titular" ? `Última hora${info.fuente ? ` · ${info.fuente}` : ""}` : "Pieza de SurEconomics"} ·{" "}
      <a href={info?.url} target="_blank" rel="noopener noreferrer">ver original</a>
      {info?.titulo && info.titulo !== punto.linea ? ` · título original: «${info.titulo}»` : ""}
    </p>
    <details className="se-res-adm-punto__en">
      <summary className="se-admin-meta-hint">Inglés</summary>
      <input className="se-form-control" value={punto.linea_en ?? ""} maxLength={140} disabled={bloqueado}
        aria-label="Línea en inglés" onChange={(e) => onCambio({ ...punto, linea_en: e.target.value })} />
    </details>
  </li>
);

Punto.propTypes = {
  punto: PropTypes.shape({ id: PropTypes.string.isRequired, linea: PropTypes.string, linea_en: PropTypes.string }).isRequired,
  info: PropTypes.object,
  secciones: PropTypes.array.isRequired,
  clave: PropTypes.string.isRequired,
  primero: PropTypes.bool,
  ultimo: PropTypes.bool,
  bloqueado: PropTypes.bool,
  onCambio: PropTypes.func.isRequired,
  onMover: PropTypes.func.isRequired,
  onQuitar: PropTypes.func.isRequired,
  onSubir: PropTypes.func.isRequired,
  onBajar: PropTypes.func.isRequired,
};

export const AdminResumen = () => {
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm, ConfirmDialog } = useAdminConfirm();
  const [lista, setLista] = useState({ status: "loading", datos: null, error: null });
  const [actual, setActual] = useState(null);
  const [edicion, setEdicion] = useState(null);
  const [sucio, setSucio] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [anadir, setAnadir] = useState({ id: "", seccion: "importante" });

  useEffect(() => {
    applyPageMeta({ title: "Admin — Resumen diario", description: "Revisar y aprobar el resumen de la mañana." });
  }, []);

  const abrir = useCallback(async (id) => {
    const r = unwrapEntity(await adminRequest(`/admin/resumen/${id}`));
    setActual(r);
    setEdicion(editable(r));
    setSucio(false);
  }, []);

  const cargar = useCallback(async (elegir) => {
    try {
      const d = unwrapEntity(await adminRequest("/admin/resumen"));
      setLista({ status: "success", datos: d, error: null });
      const hoy = d.resumenes.find((r) => r.fecha === d.hoy);
      const id = elegir ?? hoy?.id ?? null;
      if (id) await abrir(id);
      else {
        setActual(null);
        setEdicion(null);
      }
    } catch (error) {
      setLista((l) => (l.datos ? l : { status: "error", datos: null, error }));
    }
  }, [abrir]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Una acción del panel: la petición, el aviso y volver a cargar. 202 = sigue en marcha. */
  const hacer = async (peticion, exito, fallo) => {
    setOcupado(true);
    try {
      const r = await peticion();
      const d = unwrapEntity(r);
      if (d?.en_marcha) {
        toastSuccess("Armándolo con la IA. Vuelve a mirar en un minuto.", "Resumen");
      } else {
        toastSuccess(exito, "Resumen");
      }
      await cargar(d?.id ?? actual?.id);
      return true;
    } catch (err) {
      toastError(adminErrorMessage(err, fallo), "Resumen");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const guardar = () =>
    hacer(() => adminRequest(`/admin/resumen/${actual.id}`, { method: "PATCH", json: edicion }),
      actual.estado === "aprobado" ? "Guardado. Volvió a borrador: apruébalo otra vez." : "Guardado.",
      "No se pudo guardar.");

  const aprobar = () =>
    hacer(() => adminRequest(`/admin/resumen/${actual.id}/aprobar`, { method: "POST" }),
      `Aprobado. Sale a las ${lista.datos?.hora_de_salida ?? "7:00"} (o en el minuto, si ya pasó la hora).`,
      "No se pudo aprobar.");

  const rehacer = async () => {
    const ok = await confirm({
      title: "Rehacer el resumen",
      description: "Se arma otra vez desde cero con lo último publicado. Se pierden los cambios a las líneas; la frase y las cifras a mano se conservan.",
      confirmLabel: "Rehacer",
    });
    if (ok) await hacer(() => adminRequest(`/admin/resumen/${actual.id}/rehacer`, { method: "POST" }), "Rehecho.", "No se pudo rehacer.");
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(actual.texto_whatsapp);
      toastSuccess("Texto copiado.", "Resumen");
    } catch {
      toastError("No se pudo copiar: selecciónalo en la vista previa.", "Resumen");
    }
  };

  // —— la edición, en el navegador ——
  const cambiarSecciones = (fn) => {
    setEdicion((e) => ({ ...e, secciones: fn(e.secciones) }));
    setSucio(true);
  };
  const enSeccion = (clave, fn) => cambiarSecciones((ss) => ss.map((s) => (s.clave === clave ? { ...s, puntos: fn(s.puntos) } : s)));
  const mover = (clave, i, destino) =>
    cambiarSecciones((ss) => {
      const punto = ss.find((s) => s.clave === clave).puntos[i];
      return ss.map((s) => {
        if (s.clave === clave) return { ...s, puntos: s.puntos.filter((_, k) => k !== i) };
        if (s.clave === destino) return { ...s, puntos: [...s.puntos, punto] };
        return s;
      });
    });
  const intercambiar = (clave, i, j) =>
    enSeccion(clave, (ps) => {
      const copia = [...ps];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });

  // Lo que se puede añadir: lo que quedó fuera al armar más lo que se quitó aquí.
  const info = useMemo(() => {
    const m = new Map();
    for (const s of actual?.secciones ?? []) for (const p of s.puntos) m.set(p.id, p);
    for (const f of actual?.fuera ?? []) m.set(f.id, { ...f, linea: f.titulo });
    return m;
  }, [actual]);
  const usados = new Set((edicion?.secciones ?? []).flatMap((s) => s.puntos.map((p) => p.id)));
  const disponibles = [...info.values()].filter((p) => !usados.has(p.id));

  if (lista.status === "loading") return <LoadingState title="Cargando el resumen…" />;
  if (lista.status === "error") return <ErrorState title="No se pudo cargar." error={lista.error} onRetry={() => cargar()} />;

  const datos = lista.datos;
  const esHoy = actual?.fecha === datos.hoy;
  const bloqueado = !actual || actual.estado === "publicado" || ocupado;
  const tieneHoy = datos.resumenes.some((r) => r.fecha === datos.hoy);

  return (
    <main role="main">
      <header className="se-admin-shell__header se-tit-cabecera" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>Resumen diario</h1>
          <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
            «Lo importante de hoy». Se arma solo a las {datos.hora_de_armar} y sale a las {datos.hora_de_salida} en la web,
            Telegram y WhatsApp, cuando lo apruebas. Sin aprobación no sale.
            {datos.reloj_encendido ? "" : " (El reloj está apagado en este entorno: ármalo con el botón.)"}
          </p>
        </div>
        <BotonGuia recorrido={recorridoResumen} className="se-btn se-btn--secondary se-tit-guia" />
      </header>
      <RecorridoVista recorrido={recorridoResumen} />

      {!tieneHoy ? (
        <section className="se-admin-table-wrap se-res-adm-bloque">
          <p style={{ margin: 0 }}>
            El de hoy todavía no está armado: se arma solo a las {datos.hora_de_armar}.
          </p>
          <button type="button" className="se-btn se-btn--primary" style={{ marginTop: "0.75rem" }} disabled={ocupado}
            onClick={() => hacer(() => adminRequest("/admin/resumen/armar", { method: "POST" }), "Armado.", "No se pudo armar.")}>
            Armar ahora
          </button>
        </section>
      ) : null}

      {actual ? (
        <>
          <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("estado")}>
            <div className="se-res-adm-estado">
              <span className={`se-res-adm-chip ${ESTADO[actual.estado]?.clase ?? ""}`}>{ESTADO[actual.estado]?.texto}</span>
              <strong>{actual.fecha_larga}{esHoy ? " · hoy" : ""}</strong>
              <span className="se-admin-meta-hint">
                {actual.estado === "aprobado" ? `sale a las ${hora(actual.sale_a_las)} · ` : ""}
                {actual.estado === "publicado" ? `salió a las ${hora(actual.publicado_en)} · ` : ""}
                armado {actual.armado_con === "ia" ? "con IA" : "por reglas"} a las {hora(actual.armado_en)}
              </span>
            </div>
            {actual.armado_con !== "ia" && actual.estado !== "publicado" ? (
              <p className="se-tit-aviso" role="alert">
                Este borrador salió por reglas, no por la IA
                {actual.motivo_reglas ? ` (${actual.motivo_reglas})` : ""}: es un reparto mecánico, sin
                redactar y con huecos. Antes de aprobarlo, pulse «Rehacer» para que lo arme la IA.
              </p>
            ) : null}
            {actual.estado === "publicado" ? (
              <p className="se-admin-meta-hint se-res-adm-canales">
                Telegram: {CANAL[actual.canales.telegram.estado]}
                {actual.canales.telegram.error ? ` (${actual.canales.telegram.error})` : ""} · WhatsApp:{" "}
                {CANAL[actual.canales.whatsapp.estado]}
                {actual.canales.whatsapp.error ? ` (${actual.canales.whatsapp.error})` : ""}
              </p>
            ) : null}
            <div className="se-tit-acciones" {...ancla("acciones")}>
              {actual.estado === "borrador" ? (
                <button type="button" className="se-btn se-btn--primary" disabled={ocupado || sucio || !esHoy} onClick={aprobar}
                  title={sucio ? "Guarda los cambios antes de aprobar" : undefined}>
                  Aprobar
                </button>
              ) : null}
              {actual.estado === "aprobado" ? (
                <button type="button" className="se-btn se-btn--secondary" disabled={ocupado}
                  onClick={() => hacer(() => adminRequest(`/admin/resumen/${actual.id}/borrador`, { method: "POST" }), "Vuelve a borrador.", "No se pudo.")}>
                  Volver a borrador
                </button>
              ) : null}
              {actual.estado !== "publicado" ? (
                <button type="button" className="se-btn se-btn--secondary" disabled={ocupado} onClick={rehacer}>Rehacer</button>
              ) : null}
              <button type="button" className="se-btn se-btn--secondary" onClick={copiar}>Copiar el texto</button>
              {actual.estado === "publicado" ? (
                <a className="se-btn se-btn--secondary" href={actual.url} target="_blank" rel="noopener noreferrer">Ver en la web</a>
              ) : null}
              {actual.estado === "publicado" && esHoy && ["fallo", "enviando"].includes(actual.canales.whatsapp.estado) ? (
                <button type="button" className="se-btn se-btn--secondary" disabled={ocupado}
                  onClick={() => hacer(() => adminRequest(`/admin/resumen/${actual.id}/whatsapp/reintentar`, { method: "POST" }),
                    "WhatsApp vuelve a la cola: sale en el próximo minuto.", "No se pudo.")}>
                  Reintentar WhatsApp
                </button>
              ) : null}
            </div>
            {sucio ? <p className="se-tit-aviso" role="status">Hay cambios sin guardar.</p> : null}
            {actual.estado === "borrador" && !esHoy ? (
              <p className="se-admin-meta-hint">Es de un día que ya pasó: no se puede aprobar.</p>
            ) : null}
          </section>

          <div className="se-res-adm-rejilla">
            <div className="se-res-adm-col">
              <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("secciones")}>
                {edicion.secciones.map((s) => {
                  const meta = actual.secciones.find((x) => x.clave === s.clave);
                  return (
                    <div key={s.clave} className="se-res-adm-seccion">
                      <h2 className="se-form-label">{meta?.titulo} <span className="se-admin-meta-hint">({s.puntos.length} de {meta?.tope})</span></h2>
                      {s.puntos.length ? (
                        <ol className="se-res-adm-puntos">
                          {s.puntos.map((p, i) => (
                            <Punto key={p.id} punto={p} info={info.get(p.id)} secciones={actual.secciones} clave={s.clave}
                              primero={i === 0} ultimo={i === s.puntos.length - 1} bloqueado={bloqueado}
                              onCambio={(nuevo) => enSeccion(s.clave, (ps) => ps.map((x, k) => (k === i ? nuevo : x)))}
                              onMover={(destino) => mover(s.clave, i, destino)}
                              onQuitar={() => enSeccion(s.clave, (ps) => ps.filter((_, k) => k !== i))}
                              onSubir={() => intercambiar(s.clave, i, i - 1)}
                              onBajar={() => intercambiar(s.clave, i, i + 1)} />
                          ))}
                        </ol>
                      ) : (
                        <p className="se-admin-meta-hint">Vacía: no sale en el mensaje.</p>
                      )}
                    </div>
                  );
                })}
                {!bloqueado && disponibles.length ? (
                  <div className="se-res-adm-anadir">
                    <span className="se-form-label">Añadir</span>
                    <select className="se-form-control" value={anadir.id} aria-label="Qué añadir"
                      onChange={(e) => setAnadir((a) => ({ ...a, id: e.target.value }))}>
                      <option value="">Elige uno de lo que quedó fuera…</option>
                      {disponibles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.tipo === "titular" ? "Última hora · " : ""}{p.titulo ?? p.linea}
                        </option>
                      ))}
                    </select>
                    <select className="se-form-control" value={anadir.seccion} aria-label="En qué sección"
                      onChange={(e) => setAnadir((a) => ({ ...a, seccion: e.target.value }))}>
                      {actual.secciones.map((s) => (
                        <option key={s.clave} value={s.clave}>{s.titulo}</option>
                      ))}
                    </select>
                    <button type="button" className="se-btn se-btn--secondary" disabled={!anadir.id}
                      onClick={() => {
                        const p = info.get(anadir.id);
                        enSeccion(anadir.seccion, (ps) => [...ps, { id: p.id, linea: p.linea ?? p.titulo, linea_en: p.linea_en ?? p.titulo }]);
                        setAnadir((a) => ({ ...a, id: "" }));
                      }}>
                      Añadir
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("cifras")}>
                <h2 className="se-form-label">Cifras</h2>
                <ul className="se-res-adm-cifras">
                  {actual.cifras.map((c) => <li key={c.etiqueta}>{c.etiqueta}: {conVariacion(c)}</li>)}
                  {actual.monedas.length ? <li>Por dólar: {actual.monedas.map((m) => `${m.etiqueta} ${conVariacion(m)}`).join(" · ")}</li> : null}
                  {!actual.cifras.length && !actual.monedas.length ? <li className="se-admin-meta-hint">El cintillo no tenía cifras al armarlo.</li> : null}
                </ul>
                <p className="se-admin-meta-hint" style={{ marginBottom: "0.4rem" }}>A mano (hasta 3), por ejemplo el petróleo:</p>
                {edicion.cifras_manuales.map((c, i) => (
                  <div key={i} className="se-res-adm-manual">
                    <input className="se-form-control" placeholder="Nombre (Brent)" maxLength={40} value={c.etiqueta} disabled={bloqueado}
                      aria-label="Nombre de la cifra"
                      onChange={(e) => { setEdicion((x) => ({ ...x, cifras_manuales: x.cifras_manuales.map((y, k) => (k === i ? { ...y, etiqueta: e.target.value } : y)) })); setSucio(true); }} />
                    <input className="se-form-control" placeholder="Valor (64,30 $)" maxLength={30} value={c.valor} disabled={bloqueado}
                      aria-label="Valor de la cifra"
                      onChange={(e) => { setEdicion((x) => ({ ...x, cifras_manuales: x.cifras_manuales.map((y, k) => (k === i ? { ...y, valor: e.target.value } : y)) })); setSucio(true); }} />
                    <button type="button" className="se-btn se-btn--secondary" disabled={bloqueado}
                      onClick={() => { setEdicion((x) => ({ ...x, cifras_manuales: x.cifras_manuales.filter((_, k) => k !== i) })); setSucio(true); }}>
                      Quitar
                    </button>
                  </div>
                ))}
                {edicion.cifras_manuales.length < 3 && !bloqueado ? (
                  <button type="button" className="se-btn se-btn--secondary"
                    onClick={() => { setEdicion((x) => ({ ...x, cifras_manuales: [...x.cifras_manuales, { etiqueta: "", valor: "" }] })); setSucio(true); }}>
                    Añadir una cifra
                  </button>
                ) : null}
              </section>

              <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("frase")}>
                <label className="se-form-label" htmlFor="res-frase">Frase del día (opcional)</label>
                <textarea id="res-frase" className="se-form-control" rows={2} maxLength={240} value={edicion.frase} disabled={bloqueado}
                  onChange={(e) => { setEdicion((x) => ({ ...x, frase: e.target.value })); setSucio(true); }} />
              </section>

              {!bloqueado ? (
                <div className="se-tit-acciones se-res-adm-guardar">
                  <button type="button" className="se-btn se-btn--primary" disabled={!sucio || ocupado} onClick={guardar}>Guardar cambios</button>
                  <button type="button" className="se-btn se-btn--secondary" disabled={!sucio || ocupado}
                    onClick={() => { setEdicion(editable(actual)); setSucio(false); }}>
                    Descartar
                  </button>
                </div>
              ) : null}
            </div>

            <section className="se-admin-table-wrap se-res-adm-bloque se-res-adm-vista" {...ancla("vista")}>
              <h2 className="se-form-label">Así sale en WhatsApp</h2>
              <pre className="se-res-adm-texto">{actual.texto_whatsapp}</pre>
              {sucio ? <p className="se-admin-meta-hint">La vista previa se actualiza al guardar.</p> : null}
            </section>
          </div>
        </>
      ) : null}

      <section className="se-admin-table-wrap se-res-adm-bloque" {...ancla("historial")}>
        <h2 className="se-form-label">Días anteriores</h2>
        {datos.resumenes.length ? (
          <div className="se-tit-fuentes__tabla">
            <table className="se-admin-table">
              <thead>
                <tr>
                  <th scope="col">Día</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="se-tit-num">Puntos</th>
                  <th scope="col">Telegram</th>
                  <th scope="col">WhatsApp</th>
                  <th scope="col"><span className="se-sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {datos.resumenes.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fecha_larga}</td>
                    <td>{ESTADO[r.estado]?.texto}</td>
                    <td className="se-tit-num">{r.puntos}</td>
                    <td>{r.estado === "publicado" ? CANAL[r.telegram] : "—"}</td>
                    <td>{r.estado === "publicado" ? CANAL[r.whatsapp] : "—"}</td>
                    <td className="se-admin-table__actions">
                      <button type="button" className="se-btn se-btn--secondary" disabled={r.id === actual?.id || ocupado}
                        onClick={async () => {
                          if (sucio && !(await confirm({ title: "Cambios sin guardar", description: "Se pierden si abres otro día.", confirmLabel: "Abrir igual" }))) return;
                          abrir(r.id);
                        }}>
                        {r.id === actual?.id ? "Abierto" : "Ver"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="se-admin-meta-hint">Todavía no hay ninguno.</p>
        )}
      </section>
      <ConfirmDialog />
    </main>
  );
};
