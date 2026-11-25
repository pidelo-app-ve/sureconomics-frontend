import { useEffect, useRef, useState } from "react";
import { getTraductor, traducirTextos } from "../../../services/adminPostsService";
import { adminErrorMessage } from "../../../lib/adminErrorMessage";
import { textoPlano } from "./formulario";

/** Deja de esperar la traducción en curso (`enCurso`, un ref a su `AbortController`), si hay una. */
const dejarDeEsperar = (enCurso) => {
    enCurso.current?.abort();
    enCurso.current = null;
};

/**
 * «Traducir con Claude»: solo existe si el servidor tiene la clave (se pregunta al
 * abrir). `versionEn` fuerza a los editores de texto en inglés a volver a montarse
 * con lo que llegó, y `revisadaAhora` mantiene a la vista la casilla de «revisada»
 * después de marcarla, por si alguien se equivoca y quiere desmarcarla.
 *
 * La traducción puede tardar minutos (`traducirTextos` pregunta al servidor hasta que
 * acaba). Si mientras tanto se cierra el editor o se abre otra pieza, se deja de
 * preguntar y lo que llegue no se pone en ninguna: sería el inglés de otra pieza.
 * `piezaId` es la pieza abierta (`null` al crear una). `espera` solo lo cambian las
 * pruebas: `{ cadaMs, topeMs }` (ver `ESPERA_DE_LA_TRADUCCION`).
 */
export const useTraduccionDePieza = ({ form, setForm, confirm, toastSuccess, toastError, piezaId = null, espera }) => {
    const [traductorDisponible, setTraductorDisponible] = useState(false);
    const [traduciendo, setTraduciendo] = useState(false);
    const [versionEn, setVersionEn] = useState(0);
    const [revisadaAhora, setRevisadaAhora] = useState(false);
    // La traducción en curso (su `AbortController`), para poder dejarla.
    const enCurso = useRef(null);
    const piezaDeAntes = useRef(piezaId);

    useEffect(() => {
        let vivo = true;
        getTraductor()
            .then((r) => vivo && setTraductorDisponible(Boolean(r?.disponible)))
            .catch(() => {});
        return () => {
            vivo = false;
        };
    }, []);

    // Al cerrar el editor.
    useEffect(() => () => dejarDeEsperar(enCurso), []);

    // Al abrir otra pieza sin cerrar el editor. De «nueva» a su número no cuenta: es la
    // misma pieza, que se acaba de crear.
    useEffect(() => {
        const antes = piezaDeAntes.current;
        piezaDeAntes.current = piezaId;
        if (antes === piezaId || antes == null || !enCurso.current) return;
        dejarDeEsperar(enCurso);
        setTraduciendo(false);
    }, [piezaId]);

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
        dejarDeEsperar(enCurso);
        const control = new AbortController();
        enCurso.current = control;
        setTraduciendo(true);
        try {
            const r = await traducirTextos(
                { title: form.title, excerpt: form.excerpt, content: form.content },
                { ...espera, signal: control.signal },
            );
            if (control.signal.aborted) return;
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
            if (control.signal.aborted) return;
            toastError(adminErrorMessage(err, "No se pudo traducir."), "En inglés");
        } finally {
            if (enCurso.current === control) {
                enCurso.current = null;
                setTraduciendo(false);
            }
        }
    };

    return { traductorDisponible, traduciendo, versionEn, revisadaAhora, setRevisadaAhora, traducir };
};
