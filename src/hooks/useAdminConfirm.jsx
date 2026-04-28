import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminConfirmDialog } from "../components/admin/AdminConfirmDialog";

/**
 * @typedef {{
 *  title: string,
 *  description: import('react').ReactNode,
 *  confirmLabel?: string,
 *  cancelLabel?: string,
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
      state.cancelLabel,
      state.confirmLabel,
      state.description,
      state.errorMessage,
      state.isBusy,
      state.open,
      state.title,
    ]
  );

  return { confirm, ConfirmDialog };
};

