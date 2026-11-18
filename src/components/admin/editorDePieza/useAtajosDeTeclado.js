import { useEffect } from "react";

/**
 * Ctrl+S guarda y Ctrl+Enter publica (Cmd en Mac): quien escribe no suelta el teclado.
 * `atajos` es un ref que el editor pone al día en cada pintado: `{ guardar, publicar }`,
 * y nulo lo que en ese momento no se puede hacer.
 */
export const useAtajosDeTeclado = (atajos) => {
    useEffect(() => {
        const alTeclear = (e) => {
            if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
            const tecla = e.key.toLowerCase();
            if (tecla === "s" && atajos.current.guardar) {
                e.preventDefault();
                atajos.current.guardar();
            } else if (tecla === "enter" && atajos.current.publicar) {
                e.preventDefault();
                atajos.current.publicar();
            }
        };
        window.addEventListener("keydown", alTeclear);
        return () => window.removeEventListener("keydown", alTeclear);
        // El ref es siempre el mismo objeto: el efecto se monta una vez, como antes.
    }, [atajos]);
};
