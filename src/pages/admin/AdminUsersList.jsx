import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminUsers } from "../../services/adminUsersService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";
import { puedeEnviarPropuestas } from "../../lib/adminUserDetailDisplay";
import { paginaQueExiste } from "../../lib/listasDelPanel";
import { useAuth } from "../../context/AuthContext";
import { useBuscadorConEspera } from "../../hooks/useBuscadorConEspera";
import { useListaDelServidor } from "../../hooks/useListaDelServidor";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";
import { FiltrosDeUsuarios } from "../../components/admin/FiltrosDeUsuarios";
import { PaginasDeLaLista } from "../../components/admin/PaginasDeLaLista";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { recorridoUsuarios } from "../../lib/guias/guiaUsuarios";

const { ancla } = recorridoUsuarios;

/** Sin filtros: todos los lectores. `q` es lo que de verdad se pide (ya con la espera). */
const SIN_FILTROS = { q: "", activo: "", verificado: "", colaborador: "" };

const flagLabel = (row) => {
  const v = puedeEnviarPropuestas(row);
  return v === null ? "—" : v ? "Sí" : "No";
};

/** «Activa», «Desactivada · sin verificar»…: cómo está la cuenta, en una celda. */
const cuenta = (row) =>
  [row.is_active === false ? "Desactivada" : "Activa", row.is_email_verified ? null : "sin verificar"].filter(Boolean).join(" · ");

/**
 * Los lectores con cuenta en el sitio, de veinte en veinte y del más reciente al más
 * antiguo. Con buscador (nombre, apellido o correo, cuando se deja de escribir) y filtros
 * de la cuenta, el correo y las propuestas, pedidos al servidor; cambiar uno vuelve a la
 * página 1. Una página que ya no existe (un filtro dejó menos) lleva a la última.
 */
export const AdminUsersList = () => {
  const { role } = useAuth();
  const puede = role === "publicador" || role === "admin";
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const arriba = useRef(null);
  const [texto, setTexto] = useBuscadorConEspera(filtros.q, (q) => {
    setPage(1);
    setFiltros((f) => ({ ...f, q }));
  });

  const pedir = useCallback(
    async () => (puede ? listAdminUsers({ page, limit: 20, ...filtros }) : { items: [], meta: null }),
    [puede, page, filtros],
  );
  const alLlegar = ({ meta }) => {
    const existe = paginaQueExiste(page, meta?.pages ?? 0);
    if (existe) setPage(existe);
  };
  const { status, datos, error, cargar } = useListaDelServidor(pedir, alLlegar);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Usuarios", description: "Usuarios públicos registrados.", noindex: true });
  }, []);

  if (!puede) {
    return <EmptyState title="Sin acceso" description="Hace falta ser editor o admin para ver a los lectores." />;
  }

  const cambiarFiltro = (clave, valor) => {
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

  const items = datos?.items ?? [];
  const meta = datos?.meta;
  const conFiltros = Object.values(filtros).some(Boolean);

  return (
    <main role="main">
      <CabeceraDePagina titulo="Usuarios" guia={recorridoUsuarios} />

      <div ref={arriba}>
        <FiltrosDeUsuarios filtros={filtros} texto={texto} onTexto={setTexto} onCambio={cambiarFiltro} anclaje={ancla("filtros")} />
      </div>

      {status === "loading" ? <LoadingState title="Cargando usuarios…" /> : null}
      {status === "error" ? <ErrorState title="No se pudieron cargar los usuarios" error={error} onRetry={() => cargar()} /> : null}

      {status === "success" && items.length === 0 ? (
        conFiltros ? (
          <EmptyState
            title="Ningún lector con estos filtros"
            description="No hay lectores que cumplan todo lo elegido. Pruebe con menos filtros o con otra búsqueda."
            action={
              <button type="button" className="se-btn se-btn--secondary" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            }
          />
        ) : (
          <EmptyState title="Todavía no hay lectores" description="Cuando alguien se abra una cuenta en el sitio, aparece aquí." />
        )
      ) : null}

      {status === "success" && items.length > 0 ? (
        <>
          <PaginasDeLaLista pagina={meta?.page ?? page} paginas={meta?.pages ?? 1} total={meta?.total ?? items.length}
            onPagina={irAPagina} anclaje={ancla("paginas")} />
          <div className="se-admin-table-wrap" {...ancla("lista")}>
            <table className="se-admin-table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo electrónico</th>
                  <th scope="col">Cuenta</th>
                  <th scope="col">Colaborador</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const uid = adminPick(row, ["id", "_id"], "");
                  const firstName = adminPick(row, ["first_name", "firstName"], "");
                  const lastName = adminPick(row, ["last_name", "lastName"], "");
                  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || "—";
                  const email = adminPick(row, ["email"], "—");
                  return (
                    <tr key={uid || email}>
                      <td>{uid}</td>
                      <td>{name}</td>
                      <td>{email}</td>
                      <td>{cuenta(row)}</td>
                      <td>{flagLabel(row)}</td>
                      <td>
                        <Link to={`/admin/users/${uid}`} className="se-link">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={meta?.page ?? page} totalPages={meta?.pages ?? 1} onPageChange={irAPagina} />
        </>
      ) : null}

      <RecorridoVista recorrido={recorridoUsuarios} />
    </main>
  );
};
