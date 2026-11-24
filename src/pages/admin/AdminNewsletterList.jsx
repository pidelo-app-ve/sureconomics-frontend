import { useCallback, useEffect, useRef, useState } from "react";
import {
  downloadNewsletterCsv,
  listNewsletterSubscribers,
} from "../../services/newsletterService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { useAuth } from "../../context/AuthContext";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";
import { PaginasDeLaLista } from "../../components/admin/PaginasDeLaLista";
import { FiltrosDeSuscriptores } from "../../components/admin/boletin/FiltrosDeSuscriptores";
import { useBuscadorConEspera } from "../../hooks/useBuscadorConEspera";
import { useListaDelServidor } from "../../hooks/useListaDelServidor";
import { paginaQueExiste } from "../../lib/listasDelPanel";
import { esEditor } from "../../lib/menuDelPanel";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { recorridoSuscriptores } from "../../lib/guias/guiaSuscriptores";

const { ancla } = recorridoSuscriptores;

const FECHA = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit", month: "short", year: "numeric",
});

const fecha = (valor) => {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? "—" : FECHA.format(d);
};

const ORIGEN = {
  home: "Portada",
  footer: "Pie de página",
  instagram: "Instagram",
  invitacion: "Invitación",
  admin: "Panel",
  otro: "—",
};

/**
 * La lista del boletín.
 *
 * Existe porque sin ella la lista está guardada pero es invisible: no habría forma de
 * saber cuántos hay ni de llevársela para mandar el boletín. Una lista que no se puede
 * consultar es casi lo mismo que no tenerla.
 *
 * El filtro por estado empieza en "suscritos" y no en "todos" a propósito: lo que la
 * redacción necesita ver casi siempre es a quién le puede escribir. Las bajas están a un
 * clic, para poder comprobar que alguien salió cuando lo pide. Al lado, de dónde se apuntó
 * y un buscador por correo (pide cuando se deja de escribir), todo pedido al servidor;
 * cambiar algo vuelve a la página 1. El CSV va con el estado elegido, como siempre.
 */

const SIN_FILTROS = { estado: "subscribed", origen: "", q: "" };
export const AdminNewsletterList = () => {
  const { role } = useAuth();
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const { estado } = filtros;
  const [csv, setCsv] = useState({ status: "idle", error: "" });
  const arriba = useRef(null);
  const [texto, setTexto] = useBuscadorConEspera(filtros.q, (q) => {
    setPage(1);
    setFiltros((f) => ({ ...f, q }));
  });

  const pedir = useCallback(
    () => listNewsletterSubscribers({ page, limit: 20, status: estado === "all" ? undefined : estado, q: filtros.q, origen: filtros.origen }),
    [page, estado, filtros.q, filtros.origen],
  );
  // Una página que ya no existe (un filtro dejó menos) lleva a la última.
  const alLlegar = ({ meta }) => {
    const existe = paginaQueExiste(page, meta?.pages ?? 0);
    if (existe) setPage(existe);
  };
  const lista = useListaDelServidor(pedir, alLlegar);
  // Con los nombres de antes: lo de abajo se lee igual que cuando la página pedía por su cuenta.
  const state = { status: lista.status, items: lista.datos?.items ?? [], meta: lista.datos?.meta, error: lista.error };
  const load = () => lista.cargar();
  const conFiltros = Boolean(filtros.q || filtros.origen);
  // Vacía porque la página pedida ya no existe: se está yendo a la última, sin decir «nadie».
  const vacia = state.status === "success" && state.items.length === 0;
  const saltando = vacia && Boolean(paginaQueExiste(state.meta?.page ?? page, state.meta?.pages ?? 0));

  useEffect(() => {
    applyPageMeta({
      title: "Admin — Suscriptores del boletín",
      description: "Quién pidió recibir el boletín.",
      noindex: true,
    });
  }, []);

  const descargar = async () => {
    setCsv({ status: "loading", error: "" });
    try {
      await downloadNewsletterCsv({ status: estado === "all" ? "all" : "subscribed" });
      setCsv({ status: "idle", error: "" });
    } catch (err) {
      setCsv({ status: "error", error: err?.message || "No se pudo descargar la lista." });
    }
  };

  const cambiarFiltro = (clave, valor) => {
    // Volver a la primera página: en la página 3 de los suscritos puede no haber página
    // 3 de bajas, y el listado saldría vacío sin explicar por qué.
    setPage(1);
    setFiltros((f) => ({ ...f, [clave]: valor }));
  };
  const limpiarFiltros = () => {
    setTexto("");
    setPage(1);
    setFiltros(SIN_FILTROS);
  };
  const irAPagina = (p) => {
    setPage(p);
    arriba.current?.scrollIntoView?.({ block: "start" });
  };

  return (
    <main role="main">
      <CabeceraDePagina
        titulo="Suscriptores del boletín"
        dato={
          <>
            {state.meta?.total != null
              ? `${state.meta.total} ${conFiltros ? "con estos filtros" : estado === "unsubscribed" ? "bajas" : "en la lista"}`
              : "Quién pidió recibirlo"}
          </>
        }
        acciones={
          <>
            {/* La cabecera ya reparte con `justify-content: space-between`, así que este
                grupo se queda a la derecha sin CSS nuevo. */}
            <div className="se-boletin__acciones">
              {/* Sólo `admin`: un publicador puede ver el listado en pantalla, y llevarse
                  todos los correos en un archivo es otra cosa. El servidor lo exige igual,
                  esto sólo evita ofrecer un botón que iba a dar 403. */}
              {esEditor(role) ? (
                <button
                  type="button"
                  className="se-btn"
                  onClick={descargar}
                  disabled={csv.status === "loading"}
                  {...ancla("csv")}
                >
                  {csv.status === "loading" ? "Preparando…" : "Descargar CSV"}
                </button>
              ) : null}
              {esEditor(role) ? (
                <span className="se-admin-meta-hint">
                  El CSV lleva a todos los suscritos ({estado === "all" ? "y, con «Todos», también las bajas" : "sin las bajas"}),
                  sin la búsqueda ni el origen.
                </span>
              ) : null}
            </div>
          </>
        }
        guia={recorridoSuscriptores}
      />
      <RecorridoVista recorrido={recorridoSuscriptores} />

      <div ref={arriba}>
        <FiltrosDeSuscriptores filtros={filtros} texto={texto} onTexto={setTexto} onCambio={cambiarFiltro}
          origenes={ORIGEN} anclaje={ancla("filtro")} />
      </div>

      {csv.status === "error" ? (
        <p className="se-admin-form-feedback" role="alert">{csv.error}</p>
      ) : null}

      {state.status === "loading" || saltando ? <LoadingState title="Cargando la lista…" /> : null}
      {state.status === "error" ? (
        <ErrorState
          title="No se pudo cargar la lista del boletin"
          error={state.error}
          onRetry={load}
        />
      ) : null}

      {vacia && !saltando && conFiltros ? (
        <EmptyState
          title="Nadie con estos filtros"
          description="No hay correos que cumplan todo lo elegido. Pruebe con otro trozo del correo, otro origen u otro estado."
          action={
            <button type="button" className="se-btn se-btn--secondary" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          }
        />
      ) : null}

      {vacia && !saltando && !conFiltros ? (
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
          <PaginasDeLaLista pagina={state.meta?.page ?? page} paginas={state.meta?.pages ?? 1}
            total={state.meta?.total ?? state.items.length} onPagina={irAPagina} anclaje={ancla("paginas")} />
          <div className="se-admin-table-wrap" {...ancla("tabla")}>
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
            onPageChange={irAPagina}
          />
        </>
      ) : null}
    </main>
  );
};
