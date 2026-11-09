import PropTypes from "prop-types";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { listAdminPosts } from "../../services/adminPostsService";

/**
 * El buscador del panel (Ctrl+K o ⌘K): salta a cualquier página del menú o a una pieza
 * por su título, sin pasar por el menú. Con el teclado: escribir, flechas, Enter.
 *
 * Las páginas se filtran aquí mismo (el menú es pequeño); las piezas se piden al
 * servidor con el mismo filtro que el listado de Contenido, un cuarto de segundo
 * después de dejar de escribir.
 */
const sinTildes = (t) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const BuscadorDelPanel = ({ abierto, onCerrar, menu }) => {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [piezas, setPiezas] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [activo, setActivo] = useState(0);
  const entrada = useRef(null);
  const listaId = useId();

  useEffect(() => {
    if (!abierto) return undefined;
    setTexto("");
    setPiezas([]);
    setActivo(0);
    const t = window.setTimeout(() => entrada.current?.focus(), 20);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  const paginas = useMemo(() => {
    const q = sinTildes(texto.trim());
    const todas = menu.flatMap((g) => g.items.map((i) => ({ ...i, grupo: g.nombre })));
    if (!q) return todas.slice(0, 8);
    return todas.filter((i) => sinTildes(`${i.nombre} ${i.grupo} ${i.palabras ?? ""}`).includes(q)).slice(0, 8);
  }, [texto, menu]);

  useEffect(() => {
    const q = texto.trim();
    if (!abierto || q.length < 2) {
      setPiezas([]);
      return undefined;
    }
    let vivo = true;
    const t = window.setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await listAdminPosts({ q, limit: 6, page: 1 });
        const items = r?.items ?? r?.data ?? [];
        if (vivo) setPiezas(items.map((p) => ({ to: `/admin/posts/${p.id}`, nombre: p.title || "(sin título)", grupo: p.status === "published" ? "Publicada" : p.status === "scheduled" ? "Programada" : "Borrador" })));
      } catch {
        if (vivo) setPiezas([]);
      } finally {
        if (vivo) setBuscando(false);
      }
    }, 250);
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [texto, abierto]);

  const resultados = [...paginas.map((p) => ({ ...p, tipo: "Página" })), ...piezas.map((p) => ({ ...p, tipo: "Pieza" }))];

  useEffect(() => {
    setActivo((a) => Math.min(a, Math.max(0, resultados.length - 1)));
  }, [resultados.length]);

  if (!abierto) return null;

  const ir = (r) => {
    if (!r) return;
    onCerrar();
    navigate(r.to);
  };

  const alPulsar = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCerrar();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((a) => (resultados.length ? (a + 1) % resultados.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((a) => (resultados.length ? (a - 1 + resultados.length) % resultados.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      ir(resultados[activo]);
    }
  };

  return createPortal(
    <div className="se-admin-app se-adm-portal">
      <div className="se-buscador" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
        <div className="se-buscador__caja" role="dialog" aria-modal="true" aria-label="Buscar en el panel">
          <input
            ref={entrada}
            className="se-buscador__entrada"
            type="search"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setActivo(0);
            }}
            onKeyDown={alPulsar}
            placeholder="Ir a una página o buscar una pieza por su título…"
            role="combobox"
            aria-expanded={resultados.length > 0}
            aria-controls={listaId}
            aria-activedescendant={resultados[activo] ? `${listaId}-${activo}` : undefined}
            aria-autocomplete="list"
          />
          <ul className="se-buscador__lista" id={listaId} role="listbox" aria-label="Resultados">
            {resultados.map((r, i) => (
              <li
                key={`${r.tipo}-${r.to}`}
                id={`${listaId}-${i}`}
                role="option"
                aria-selected={i === activo}
                className={`se-buscador__item${i === activo ? " is-activo" : ""}`}
                onMouseEnter={() => setActivo(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  ir(r);
                }}
              >
                <span className="se-buscador__nombre">{r.nombre}</span>
                <span className="se-buscador__tipo">
                  {r.tipo} · {r.grupo}
                </span>
              </li>
            ))}
            {!resultados.length ? (
              <li className="se-buscador__vacio">{buscando ? "Buscando…" : "Nada con ese nombre."}</li>
            ) : null}
          </ul>
          <p className="se-buscador__pie">
            <kbd>↑</kbd> <kbd>↓</kbd> para moverse · <kbd>Enter</kbd> para abrir · <kbd>Esc</kbd> para cerrar
            {buscando ? " · buscando piezas…" : ""}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
};

BuscadorDelPanel.propTypes = {
  abierto: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  /** El menú que ve este rol (`menuPara`). */
  menu: PropTypes.array.isRequired,
};

export default BuscadorDelPanel;
