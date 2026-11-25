import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

/**
 * @typedef {{
 *  title: string,
 *  description: import('react').ReactNode,
 *  confirmLabel?: string,
 *  cancelLabel?: string,
 *  warning?: import('react').ReactNode,
 *  busyLabel?: string,
 *  onConfirm?: () => Promise<void> | void,
 * }} ConfirmOptions
 */

export const useAdminConfirm = () => {
  // `{ id, resolve }` del diálogo abierto. Cada `confirm()` lleva su `id`: lo que acaba
  // tarde (un borrado que termina con otro diálogo ya encima, el de salir sin guardar)
  // solo cierra y responde el suyo, no el que esté abierto ahora.
  const resolverRef = useRef(null);
  const siguienteId = useRef(0);
  const stateRef = useRef(null);
  const [state, setState] = useState({
    id: 0,
    open: false,
    title: "",
    description: "",
    confirmLabel: "Eliminar",
    cancelLabel: "Cancelar",
    warning: undefined,
    busyLabel: undefined,
    isBusy: false,
    errorMessage: "",
    onConfirm: null,
  });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const close = useCallback((result, id) => {
    const pendiente = resolverRef.current;
    if (!pendiente || pendiente.id !== id) return;
    resolverRef.current = null;
    setState((s) => (s.id === id ? { ...s, open: false, isBusy: false, errorMessage: "", onConfirm: null } : s));
    pendiente.resolve(Boolean(result));
  }, []);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        // Un solo diálogo a la vez: si había otro abierto (la pregunta de eliminar y,
        // encima, la de salir sin guardar), su promesa se resuelve como «no» antes de
        // pisarla. Si no, no se resolvía nunca y quien la esperaba se quedaba colgado
        // (el editor, con su candado tomado y todos los botones sin hacer nada).
        if (resolverRef.current) resolverRef.current.resolve(false);
        siguienteId.current += 1;
        const id = siguienteId.current;
        resolverRef.current = { id, resolve };
        setState({
          id,
          open: true,
          title: options.title,
          description: options.description,
          confirmLabel: options.confirmLabel ?? "Eliminar",
          cancelLabel: options.cancelLabel ?? "Cancelar",
          warning: options.warning,
          busyLabel: options.busyLabel,
          isBusy: false,
          errorMessage: "",
          onConfirm: typeof options.onConfirm === "function" ? options.onConfirm : null,
        });
      }),
    []
  );

  const handleClose = useCallback(() => {
    if (state.isBusy) return;
    close(false, state.id);
  }, [close, state.isBusy, state.id]);

  const handleConfirm = useCallback(async () => {
    const current = stateRef.current;
    if (!current || current.isBusy) return;
    if (!current.onConfirm) {
      close(true, current.id);
      return;
    }
    setState((s) => (s.id === current.id ? { ...s, isBusy: true, errorMessage: "" } : s));
    try {
      await current.onConfirm();
      close(true, current.id);
    } catch (err) {
      setState((s) =>
        s.id === current.id
          ? {
              ...s,
              isBusy: false,
              errorMessage: err instanceof Error ? err.message : "No se pudo completar la acción.",
            }
          : s
      );
    }
  }, [close]);

  const ConfirmDialog = useMemo(
    () =>
      function ConfirmDialogRenderer() {
        return (
          <AdminConfirmDialog
            open={state.open}
            title={state.title}
            description={state.description}
            confirmLabel={state.confirmLabel}
            cancelLabel={state.cancelLabel}
            warning={state.warning}
            busyLabel={state.busyLabel}
            isBusy={state.isBusy}
            errorMessage={state.errorMessage}
            onConfirm={handleConfirm}
            onClose={handleClose}
          />
        );
      },
    [
      handleClose,
      handleConfirm,
      state.busyLabel,
      state.cancelLabel,
      state.confirmLabel,
      state.warning,
      state.description,
      state.errorMessage,
      state.isBusy,
      state.open,
      state.title,
    ]
  );

  return { confirm, ConfirmDialog };
};

