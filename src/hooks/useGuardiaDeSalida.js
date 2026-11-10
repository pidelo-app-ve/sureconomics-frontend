import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Salir con cambios sin guardar: pregunta antes de irse a otra página del panel y avisa
 * al cerrar o recargar la pestaña.
 *
 * Nació dentro del editor de piezas (un clic de más en el menú se llevaba lo escrito) y
 * se sacó aquí para que «En redes» y «Fotos del equipo» pregunten lo mismo y con las
 * mismas palabras. Una sola guardia por página: el enrutador solo admite un bloqueo.
 *
 * `confirm` es el de `useAdminConfirm` de la página (su diálogo ya está pintado).
 * `saltar` es una referencia que la página pone a `true` cuando ella misma manda fuera
 * tras guardar o eliminar: ahí no hay nada que preguntar.
 */
export const useGuardiaDeSalida = (sinGuardar, confirm, { saltar, descripcion } = {}) => {
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            sinGuardar && !saltar?.current && currentLocation.pathname !== nextLocation.pathname,
    );
    useEffect(() => {
        if (blocker.state !== "blocked") return;
        confirm({
            title: "¿Salir sin guardar?",
            description: descripcion || "Hay cambios en esta página que todavía no se guardaron.",
            confirmLabel: "Salir sin guardar",
            cancelLabel: "Seguir editando",
            warning: null,
        }).then((salir) => (salir ? blocker.proceed() : blocker.reset()));
    }, [blocker, confirm, descripcion]);
    useEffect(() => {
        if (!sinGuardar) return undefined;
        const alSalir = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", alSalir);
        return () => window.removeEventListener("beforeunload", alSalir);
    }, [sinGuardar]);
};
