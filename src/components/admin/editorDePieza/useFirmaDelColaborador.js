import { useState } from "react";
import { quitarVinculoConElLector, usarFirmaDeSuCuenta } from "../../../services/adminPostsService";
import { quitarVinculo, usarFirmaDeLaCuenta } from "./guardado";

/**
 * La firma del colaborador: los dos botones del editor. Guardan al momento (como
 * publicar) y traen la firma nueva al formulario sin tocar el resto de lo escrito. Van
 * con el candado del editor y con lo que usan las demás acciones (`dependencias`, ver
 * `guardado.js`): no se cruzan con guardar, publicar ni eliminar.
 */
export const useFirmaDelColaborador = ({ dependencias }) => {
    const [colaboradorOcupado, setColaboradorOcupado] = useState(false);
    const d = () => ({ ...dependencias(), setColaboradorOcupado, usarFirmaDeSuCuenta, quitarVinculoConElLector });
    const handleUsarSuCuenta = () => usarFirmaDeLaCuenta(d());
    const handleQuitarVinculo = () =>
        quitarVinculo({
            ...d(),
            dialogo: {
                title: "Quitar el vínculo con el lector",
                description:
                    "La pieza deja de contar como suya. La firma que tiene ahora se queda: si hay que cambiarla, se cambia a mano.",
                confirmLabel: "Quitar el vínculo",
            },
        });

    return { colaboradorOcupado, handleUsarSuCuenta, handleQuitarVinculo };
};
