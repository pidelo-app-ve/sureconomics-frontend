import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Una lista del panel que se pide al servidor por páginas y con filtros (Resumen,
 * Usuarios, Suscriptores): lo de Titulares, en un solo sitio.
 *
 * `pedir` es la petición de la página y los filtros de ahora, hecha con `useCallback`:
 * cuando cambia, se pide otra vez, con «Cargando…». Cada petición lleva su **turno**: si
 * llega tarde una vieja (se cambió de filtro mientras tanto), no pisa a la nueva.
 *
 * `alLlegar(datos)`, si se da, corre con cada respuesta que vale (la del último turno): ahí
 * se pone, por ejemplo, la página que el servidor dice que existe. Si `pedir` devuelve los
 * datos ya a mano (no una promesa: la respuesta que acaba de llegar, para esa página), se
 * ponen tal cual, sin «Cargando…» ni otra petición.
 *
 * Devuelve `{ status, datos, error, cargar, recargar }`:
 * - `cargar()`: otra vez, con «Cargando…» (el «Reintentar» de un error);
 * - `recargar()`: la de después de una acción, callada (sin «Cargando…» y, si falla, se
 *   queda lo que se ve). Pide siempre la lista **vigente**: si entre el clic y la vuelta
 *   se cambió de página o de filtro, no trae la de antes.
 */
export const useListaDelServidor = (pedir, alLlegar) => {
  const [lista, setLista] = useState({ status: "loading", datos: null, error: null });
  const turno = useRef(0);
  const llegada = useRef(alLlegar);
  llegada.current = alLlegar;

  const cargar = useCallback(
    async ({ callado = false } = {}) => {
      const mio = ++turno.current;
      try {
        const pedido = pedir();
        if (typeof pedido?.then !== "function") {
          setLista({ status: "success", datos: pedido, error: null });
          return;
        }
        if (!callado) setLista((l) => ({ ...l, status: "loading", error: null }));
        const datos = await pedido;
        if (mio !== turno.current) return;
        setLista({ status: "success", datos, error: null });
        llegada.current?.(datos);
      } catch (error) {
        if (mio !== turno.current) return;
        setLista((l) => (callado && l.status === "success" ? l : { status: "error", datos: l.datos, error }));
      }
    },
    [pedir],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const vigente = useRef(cargar);
  vigente.current = cargar;
  const recargar = useCallback(() => vigente.current({ callado: true }), []);

  return { ...lista, cargar, recargar };
};
