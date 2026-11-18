import { useEffect, useState } from "react";
import { getTraductor, traducirTextos } from "../../../services/adminPostsService";
import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { textoPlano } from "./formulario";

/**
 * «Traducir con Claude»: solo existe si el servidor tiene la clave (se pregunta al
 * abrir). `versionEn` fuerza a los editores de texto en inglés a volver a montarse
 * con lo que llegó, y `revisadaAhora` mantiene a la vista la casilla de «revisada»
 * después de marcarla, por si alguien se equivoca y quiere desmarcarla.
 */
export const useTraduccionDePieza = ({ form, setForm, confirm, toastSuccess, toastError }) => {
    const [traductorDisponible, setTraductorDisponible] = useState(false);
    const [traduciendo, setTraduciendo] = useState(false);
    const [versionEn, setVersionEn] = useState(0);
    const [revisadaAhora, setRevisadaAhora] = useState(false);
    useEffect(() => {
        let vivo = true;
        getTraductor()
            .then((r) => vivo && setTraductorDisponible(Boolean(r?.disponible)))
            .catch(() => {});
        return () => {
            vivo = false;
        };
    }, []);

    // Traduce lo que hay en el formulario, guardado o no, y lo vuelca en los campos en
    // inglés marcado como automático. No guarda: la redacción revisa y guarda.
    const traducir = async () => {
        if (!form.title.trim() || !textoPlano(form.content)) {
            toastError("Escribe primero el título y el cuerpo en español.", "En inglés");
            return;
        }
        const yaHayIngles =
            form.title_en.trim() || textoPlano(form.excerpt_en) || textoPlano(form.content_en);
        if (yaHayIngles) {
            const seguir = await confirm({
                title: "Reemplazar la traducción",
                description: "Esto reemplaza lo que hay escrito en inglés por una traducción nueva.",
                confirmLabel: "Reemplazar",
                cancelLabel: "Dejarla como está",
            });
            if (!seguir) return;
        }
        setTraduciendo(true);
        try {
            const r = await traducirTextos({
                title: form.title,
                excerpt: form.excerpt,
                content: form.content,
            });
            setForm((prev) => ({
                ...prev,
                title_en: r.title ?? "",
                excerpt_en: r.excerpt ?? "",
                content_en: r.content ?? "",
                traduccion_automatica: true,
            }));
            setRevisadaAhora(false);
            setVersionEn((v) => v + 1);
            toastSuccess("Traducción lista. Revísala y guarda la pieza.", "En inglés");
        } catch (err) {
            toastError(adminErrorMessage(err, "No se pudo traducir."), "En inglés");
        } finally {
            setTraduciendo(false);
        }
    };

    return { traductorDisponible, traduciendo, versionEn, revisadaAhora, setRevisadaAhora, traducir };
};
