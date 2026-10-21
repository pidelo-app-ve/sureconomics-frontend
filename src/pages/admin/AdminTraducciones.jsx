import { useCallback, useEffect, useState } from "react";
import { ErrorState, LoadingState } from "../../components/content";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { adminRequest } from "../../lib/api";
import { applyPageMeta } from "../../lib/seo";
import { unwrapEntity } from "../../services/adminResponseUtils";

/**
 * «Traducir el archivo»: las piezas publicadas que aún no tienen inglés, en lote.
 *
 * El trabajo lo hace el servidor: con Anthropic, por su API de lotes, en grupos de cien;
 * con Cloudflare, que no tiene lotes, pieza a pieza (ver `services/traduccion_archivo.py`
 * en el backend; `d.proveedor` y `d.modo` dicen cuál). Esta pantalla sólo lo
 * pone en marcha y enseña cómo va. Mientras hay algo en curso, pregunta cada quince
 * segundos. Se puede cerrar: el trabajo sigue solo y retoma tras un reinicio.
 */

const ESTADOS = {
  inactivo: "Sin empezar",
  en_curso: "En curso",
  cancelando: "Cancelando",
  terminado: "Terminado",
  cancelado: "Cancelado",
};
const EN_MARCHA = new Set(["en_curso", "cancelando"]);

const cuando = (iso) =>
  iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas", dateStyle: "short", timeStyle: "short" }) : "—";
const usd = (n) => (typeof n === "number" ? `${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : null);

export const AdminTraducciones = () => {
  const { role } = useAuth();
  const puede = role === "publicador" || role === "admin";
  const { toastSuccess, toastError } = useAdminToast();
  const { confirm, ConfirmDialog } = useAdminConfirm();
  const [state, setState] = useState({ status: "loading", datos: null, error: null });
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Traducciones", description: "Traducir al inglés las piezas ya publicadas." });
  }, []);

  const cargar = useCallback(async () => {
    try {
      const datos = unwrapEntity(await adminRequest("/admin/traduccion-archivo"));
      setState({ status: "success", datos, error: null });
    } catch (err) {
      setState((s) => (s.datos ? s : { status: "error", datos: null, error: err }));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enMarcha = EN_MARCHA.has(state.datos?.estado);
  useEffect(() => {
    if (!enMarcha) return undefined;
    const id = setInterval(cargar, 15000);
    return () => clearInterval(id);
  }, [enMarcha, cargar]);

  const iniciar = async () => {
    const d = state.datos;
    const ok = await confirm({
      title: "Traducir el archivo",
      description: (
        <>
          Se traducirán al inglés <strong>{d.pendientes}</strong> piezas publicadas que aún no lo tienen
          {usd(d.costo_estimado_usd) ? <>, por unos <strong>{usd(d.costo_estimado_usd)}</strong> de crédito de {d.proveedor}</> : null}.
          Salen en /en con el aviso de traducción automática hasta que alguien las revise.{" "}
          {d.modo === "una_a_una"
            ? `Van de tres en tres: unos ${Math.max(1, Math.ceil((d.pendientes * 6) / 60))} minutos.`
            : "Suele tardar menos de una hora."}
        </>
      ),
      confirmLabel: "Traducir",
    });
    if (!ok) return;
    setOcupado(true);
    try {
      const datos = unwrapEntity(await adminRequest("/admin/traduccion-archivo/iniciar", { method: "POST" }));
      setState({ status: "success", datos, error: null });
      toastSuccess("En marcha. Puede cerrar esta pantalla: sigue solo.", "Traducciones");
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo empezar."), "Traducciones");
    } finally {
      setOcupado(false);
    }
  };

  const cancelar = async () => {
    const ok = await confirm({
      title: "Cancelar la traducción",
      description: "No se mandarán más piezas. Lo que ya esté traducido se guarda igual.",
      confirmLabel: "Cancelar traducción",
      cancelLabel: "Seguir",
    });
    if (!ok) return;
    setOcupado(true);
    try {
      const datos = unwrapEntity(await adminRequest("/admin/traduccion-archivo/cancelar", { method: "POST" }));
      setState({ status: "success", datos, error: null });
    } catch (err) {
      toastError(adminErrorMessage(err, "No se pudo cancelar."), "Traducciones");
    } finally {
      setOcupado(false);
    }
  };

  if (state.status === "loading") return <LoadingState title="Cargando traducciones…" />;
  if (state.status === "error") return <ErrorState title="No se pudo cargar." error={state.error} onRetry={cargar} />;

  const d = state.datos;
  const hechas = d.traducidas + d.fallidas + d.saltadas;
  const porcentaje = d.total ? Math.min(100, Math.round((hechas / d.total) * 100)) : 0;

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>
            Traducir el archivo al inglés
          </h1>
          <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
            Traduce con Claude todas las piezas publicadas que todavía no tienen versión en inglés. Las
            nuevas se siguen traduciendo una a una desde el editor. Lo traducido aquí sale en /en con el
            aviso de traducción automática; para corregir una, ábrala en el editor, revise el inglés y
            guarde.
          </p>
        </div>
      </header>

      <section className="se-admin-table-wrap" style={{ marginBottom: "1rem", padding: "1rem" }}>
        <div className="se-admin-filters" style={{ alignItems: "center" }}>
          <div className="se-admin-filters__field se-admin-filters__field--grow">
            <span className="se-form-label">Pendientes</span>
            <span className="se-admin-meta-hint">
              {d.disponible
                ? `${d.pendientes} piezas publicadas sin inglés${usd(d.costo_estimado_usd) ? ` · costo aproximado: ${usd(d.costo_estimado_usd)}` : ""} · modelo: ${d.modelo}`
                : "Sin clave de Anthropic (ANTHROPIC_API_KEY) ni de Cloudflare (CF_IA_ACCOUNT_ID y CF_IA_API_TOKEN) en el servidor: no se puede traducir."}
            </span>
          </div>
          {puede && d.disponible && !enMarcha ? (
            <button type="button" className="se-btn se-btn--primary" onClick={iniciar} disabled={ocupado || !d.pendientes}>
              {d.estado === "terminado" || d.estado === "cancelado" ? "Traducir las que faltan" : "Traducir el archivo"}
            </button>
          ) : null}
          {puede && d.estado === "en_curso" ? (
            <button type="button" className="se-btn se-btn--secondary" onClick={cancelar} disabled={ocupado}>
              Cancelar
            </button>
          ) : null}
        </div>
      </section>

      {d.estado !== "inactivo" ? (
        <section className="se-admin-table-wrap" style={{ padding: "1rem" }} aria-live="polite">
          <h2 className="se-heading-card" style={{ margin: "0 0 0.5rem" }}>
            {ESTADOS[d.estado] ?? d.estado}
            {d.total ? ` · ${porcentaje} %` : ""}
          </h2>
          {d.total ? (
            <div
              role="progressbar"
              aria-valuenow={porcentaje}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Avance de la traducción"
              style={{ height: 8, borderRadius: 4, background: "var(--color-hairline, #e5e5e5)", overflow: "hidden", marginBottom: "0.75rem" }}
            >
              <div style={{ width: `${porcentaje}%`, height: "100%", background: "var(--marca-verde, #0b3d2e)", transition: "width 300ms ease" }} />
            </div>
          ) : null}
          <p className="se-admin-meta-hint" style={{ margin: 0 }}>
            Traducidas: <strong>{d.traducidas}</strong> · fallidas: {d.fallidas} · saltadas: {d.saltadas}
            {d.modo === "lotes" ? ` · en Anthropic ahora: ${d.en_proceso}` : ""} · esperando turno: {d.en_cola} · de{" "}
            {d.total}
          </p>
          <p className="se-admin-meta-hint" style={{ marginBottom: 0 }}>
            Empezó: {cuando(d.iniciado_en)}
            {d.terminado_en ? ` · terminó: ${cuando(d.terminado_en)}` : ""}
            {enMarcha ? " · se actualiza solo cada 15 segundos" : ""}
          </p>
          {d.saltadas ? (
            <p className="se-admin-meta-hint" style={{ marginBottom: 0 }}>
              Saltadas: piezas que alguien tradujo a mano, despublicó o borró mientras tanto. No se tocan.
            </p>
          ) : null}
          {d.ultimo_error ? (
            <p className="se-admin-meta-hint" style={{ marginBottom: 0, color: "var(--color-red, #b42318)" }}>
              Último problema al hablar con {d.proveedor}: {d.ultimo_error}. Se reintenta solo cada minuto.
            </p>
          ) : null}
          {d.errores?.length ? (
            <details style={{ marginTop: "0.75rem" }}>
              <summary className="se-admin-meta-hint">Piezas que fallaron ({d.errores.length} últimas)</summary>
              <ul className="se-admin-meta-hint">
                {d.errores.map((e, i) => (
                  <li key={`${e.post_id}-${i}`}>
                    {e.post_id ? <a href={`/admin/posts/${e.post_id}`}>Pieza {e.post_id}</a> : "Pieza"}: {e.motivo}
                  </li>
                ))}
              </ul>
              <p className="se-admin-meta-hint">
                Siguen sin inglés: «Traducir las que faltan» las vuelve a intentar.
              </p>
            </details>
          ) : null}
        </section>
      ) : null}
      <ConfirmDialog />
    </main>
  );
};

export default AdminTraducciones;
