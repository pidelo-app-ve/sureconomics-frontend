import { useCallback, useEffect, useState } from "react";
import {
  downloadNewsletterCsv,
  listNewsletterSubscribers,
} from "../../services/newsletterService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { useAuth } from "../../context/AuthContext";

const FECHA = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit", month: "short", year: "numeric",
});

const fecha = (valor) => {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? "—" : FECHA.format(d);
};

const ORIGEN = { home: "Portada", footer: "Pie de página", admin: "Panel", otro: "—" };

/**
 * La lista del boletín.
 *
 * Existe porque sin ella la lista está guardada pero es invisible: no habría forma de
 * saber cuántos hay ni de llevársela para mandar el boletín. Una lista que no se puede
 * consultar es casi lo mismo que no tenerla.
 *
 * El filtro por estado empieza en "suscritos" y no en "todos" a propósito: lo que la
 * redacción necesita ver casi siempre es a quién le puede escribir. Las bajas están a un
 * clic, para poder comprobar que alguien salió cuando lo pide.
 */
export const AdminNewsletterList = () => {
  const { role } = useAuth();
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState("subscribed");
  const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });
  const [csv, setCsv] = useState({ status: "idle", error: "" });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { items, meta } = await listNewsletterSubscribers({
        page,
        limit: 20,
        status: estado === "all" ? undefined : estado,
      });
      setState({ status: "success", items, meta, error: null });
    } catch (err) {
      setState({ status: "error", items: [], meta: null, error: err });
    }
  }, [page, estado]);

  useEffect(() => {
    applyPageMeta({
      title: "Admin — Boletín",
      description: "Quién pidió recibir el boletín.",
      noindex: true,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const descargar = async () => {
    setCsv({ status: "loading", error: "" });
    try {
      await downloadNewsletterCsv({ status: estado === "all" ? "all" : "subscribed" });
      setCsv({ status: "idle", error: "" });
    } catch (err) {
      setCsv({ status: "error", error: err?.message || "No se pudo descargar la lista." });
    }
  };

  const cambiarFiltro = (valor) => {
    setEstado(valor);
    // Volver a la primera página: en la página 3 de los suscritos puede no haber página
    // 3 de bajas, y el listado saldría vacío sin explicar por qué.
    setPage(1);
  };

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="se-heading-section" style={{ margin: 0 }}>Boletín</h1>
          <p className="se-meta se-meta--category" style={{ marginTop: "0.5rem" }}>
            {state.meta?.total != null
              ? `${state.meta.total} ${estado === "unsubscribed" ? "bajas" : "en la lista"}`
              : "Quién pidió recibirlo"}
          </p>
        </div>

        {/* La cabecera ya reparte con `justify-content: space-between`, así que este
            grupo se queda a la derecha sin CSS nuevo. */}
        <div className="se-boletin__acciones">
          <label className="se-form-field" htmlFor="boletin-estado">
            <span className="se-sr-only">Estado</span>
            <select
              id="boletin-estado"
              className="se-form-control"
              value={estado}
              onChange={(e) => cambiarFiltro(e.target.value)}
            >
              <option value="subscribed">Suscritos</option>
              <option value="unsubscribed">Dados de baja</option>
              <option value="all">Todos</option>
            </select>
          </label>

          {/* Sólo `admin`: un publicador puede ver el listado en pantalla, y llevarse
              todos los correos en un archivo es otra cosa. El servidor lo exige igual,
              esto sólo evita ofrecer un botón que iba a dar 403. */}
          {role === "admin" ? (
            <button
              type="button"
              className="se-btn"
              onClick={descargar}
              disabled={csv.status === "loading"}
            >
              {csv.status === "loading" ? "Preparando…" : "Descargar CSV"}
            </button>
          ) : null}
        </div>
      </header>

      {csv.status === "error" ? (
        <p className="se-admin-form-feedback" role="alert">{csv.error}</p>
      ) : null}

      {state.status === "loading" ? <LoadingState title="Cargando la lista…" /> : null}
      {state.status === "error" ? (
        <ErrorState
          title="No se pudo cargar la lista del boletin"
          error={state.error}
          onRetry={load}
        />
      ) : null}

      {state.status === "success" && state.items.length === 0 ? (
        <EmptyState
          title={estado === "unsubscribed" ? "Nadie se ha dado de baja" : "Todavía nadie"}
          description={
            estado === "unsubscribed"
              ? "Cuando alguien use el enlace de baja, aparecerá aquí."
              : "Las suscripciones del formulario de la portada y del pie de página aparecen aquí."
          }
        />
      ) : null}

      {state.status === "success" && state.items.length > 0 ? (
        <>
          <div className="se-admin-table-wrap">
            <table className="se-admin-table">
              <thead>
                <tr>
                  <th scope="col">Correo</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Origen</th>
                  <th scope="col">Alta</th>
                  <th scope="col">Baja</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((fila) => (
                  <tr key={fila.id}>
                    <td>{fila.email}</td>
                    <td>{fila.status === "subscribed" ? "Suscrito" : "De baja"}</td>
                    <td>{ORIGEN[fila.source] ?? fila.source}</td>
                    <td>{fecha(fila.subscribed_at || fila.created_at)}</td>
                    <td>{fecha(fila.unsubscribed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={state.meta?.page ?? page}
            totalPages={state.meta?.pages ?? 1}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </main>
  );
};
