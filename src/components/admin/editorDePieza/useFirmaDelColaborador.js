import { useState } from "react";
import { quitarVinculoConElLector, usarFirmaDeSuCuenta } from "../../../services/adminPostsService";

/**
 * La firma del colaborador: los dos botones del editor. Guardan al momento (como
 * publicar) y traen la firma nueva al formulario sin tocar el resto de lo escrito.
 */
export const useFirmaDelColaborador = ({
    numericPostId,
    confirm,
    setForm,
    setBase,
    setAssets,
    setColaborador,
    setActionState,
}) => {
    const [colaboradorOcupado, setColaboradorOcupado] = useState(false);
    const aplicarFirma = (post) => {
        const firma = { byline: post.byline ?? "", byline_photo_asset_id: post.byline_photo_asset_id ?? null };
        setForm((prev) => ({ ...prev, ...firma }));
        setBase((prev) => (prev ? { ...prev, ...firma } : prev));
        setAssets((prev) => ({ ...prev, bylinePhoto: post.byline_photo ?? null }));
        setColaborador(post.colaborador ?? null);
    };
    const handleUsarSuCuenta = async () => {
        setColaboradorOcupado(true);
        setActionState({ status: "idle", message: "", kind: "" });
        try {
            aplicarFirma(await usarFirmaDeSuCuenta(numericPostId));
            setActionState({ status: "success", message: "Firma puesta al día con su cuenta.", kind: "colaborador" });
        } catch (err) {
            setActionState({ status: "error", message: err?.message || "No se pudo cambiar la firma.", kind: "colaborador" });
        } finally {
            setColaboradorOcupado(false);
        }
    };
    const handleQuitarVinculo = async () => {
        await confirm({
            title: "Quitar el vínculo con el lector",
            description:
                "La pieza deja de contar como suya. La firma que tiene ahora se queda: si hay que cambiarla, se cambia a mano.",
            confirmLabel: "Quitar el vínculo",
            onConfirm: async () => {
                aplicarFirma(await quitarVinculoConElLector(numericPostId));
            },
        });
    };

    return { colaboradorOcupado, handleUsarSuCuenta, handleQuitarVinculo };
};
