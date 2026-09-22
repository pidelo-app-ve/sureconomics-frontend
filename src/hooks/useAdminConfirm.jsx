import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminConfirmDialog } from "../components/admin/AdminConfirmDialog";

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
  const resolverRef = useRef(null);
  const stateRef = useRef(null);
  const [state, setState] = useState({
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

  const close = useCallback((result) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setState((s) => ({ ...s, open: false, isBusy: false, errorMessage: "", onConfirm: null }));
    if (resolve) resolve(Boolean(result));
  }, []);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setState({
          open: true,
          title: options.title,
          description: options.description,
          confirmLabel: options.confirmLabel ?? "Eliminar",
          cancelLabel: options.cancelLabel ?? "Cancelar",
          // `undefined` deja que el dialogo ponga su texto de siempre; `null` lo
          // quita. La diferencia importa: quien ya explico que se pierde no quiere
          // un aviso generico debajo contradiciendole.
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
    close(false);
  }, [close, state.isBusy]);

  const handleConfirm = useCallback(async () => {
    const current = stateRef.current;
    if (!current || current.isBusy) return;
    if (!current.onConfirm) {
      close(true);
      return;
    }
    setState((s) => ({ ...s, isBusy: true, errorMessage: "" }));
    try {
      await current.onConfirm();
      close(true);
    } catch (err) {
      setState((s) => ({
        ...s,
        isBusy: false,
        errorMessage: err instanceof Error ? err.message : "No se pudo completar la acción.",
      }));
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

