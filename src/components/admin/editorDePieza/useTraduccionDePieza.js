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
 *
 * La excepción es la pieza que se está creando: al guardarla, el editor pasa de «nueva»
 * (`piezaId` nulo) a su número sin desmontarse, y la traducción sigue. Para distinguirlo
 * de saltar a otra pieza desde «nueva» (el buscador, un aviso), el guardado avisa con
 * `seCreo(id)` antes de ir a ella. Y como al llegar el editor vuelve a cargar la pieza del
 * servidor (`apertura` sube cuando termina), lo que llegue antes se guarda y se pone
 * después: si no, la carga lo pisaría.
 *
 * `espera` solo lo cambian las pruebas: `{ cadaMs, topeMs }` (ver `ESPERA_DE_LA_TRADUCCION`).
 */
export const useTraduccionDePieza = ({
    form,
    setForm,
    confirm,
    toastSuccess,
    toastError,
    piezaId = null,
    apertura = 0,
    espera,
}) => {
    const [traductorDisponible, setTraductorDisponible] = useState(false);
    const [traduciendo, setTraduciendo] = useState(false);
    const [versionEn, setVersionEn] = useState(0);
    const [revisadaAhora, setRevisadaAhora] = useState(false);
    // La traducción en curso (su `AbortController`), para poder dejarla.
    const enCurso = useRef(null);
    const piezaDeAntes = useRef(piezaId);
    // La pieza que se acaba de crear aquí (`seCreo`).
    const piezaCreada = useRef(null);
    // Recién creada, hasta que el editor la vuelve a cargar: lo que llegue, a `pendiente`.
    const esperandoCarga = useRef(false);
    const pendiente = useRef(null);

    useEffect(() => {
        let vivo = true;
        getTraductor()
            .then((r) => vivo && setTraductorDisponible(Boolean(r?.disponible)))
            .catch(() => {});
        return () => {
            vivo = false;
        };
    }, []);

    /** Vuelca la traducción en los campos en inglés, marcada como automática. */
    const aplicar = (r) => {
        setForm((prev) => ({
            ...prev,
            title_en: r.title ?? "",
            excerpt_en: r.excerpt ?? "",
            content_en: r.content ?? "",
            traduccion_automatica: true,
        }));
        setRevisadaAhora(false);
        setVersionEn((v) => v + 1);
        setTraduciendo(false);
        toastSuccess("Traducción lista. Revísala y guarda la pieza.", "En inglés");
    };
    // La de este pintado, para el efecto de la carga (que no debe correr por otra cosa).
    const aplicarAhora = useRef(aplicar);
    aplicarAhora.current = aplicar;

    // Al cerrar el editor.
    useEffect(() => () => dejarDeEsperar(enCurso), []);

    // Al cambiar de pieza sin cerrar el editor. El aviso de `seCreo` vale para este cambio
    // y nada más: si no, crear la 7, empezar otra nueva y volver a la 7 por el buscador
    // dejaría caer en la 7 la traducción de la nueva.
    useEffect(() => {
        const antes = piezaDeAntes.current;
        piezaDeAntes.current = piezaId;
        const creada = piezaCreada.current;
        piezaCreada.current = null;
        if (antes === piezaId || (!enCurso.current && !pendiente.current)) return;
        if (antes == null && piezaId != null && piezaId === creada) {
            esperandoCarga.current = true;
            return;
        }
        dejarDeEsperar(enCurso);
        esperandoCarga.current = false;
        pendiente.current = null;
        setTraduciendo(false);
    }, [piezaId]);

    // La pieza recién creada ya se cargó: ahora sí, lo que llegó mientras tanto.
    useEffect(() => {
        if (!esperandoCarga.current) return;
        esperandoCarga.current = false;
        const r = pendiente.current;
        pendiente.current = null;
        if (r) aplicarAhora.current(r);
    }, [apertura]);

    /** Lo llama el guardado al crear la pieza, antes de ir a ella. */
    const seCreo = (id) => {
        piezaCreada.current = id ?? null;
    };

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
        pendiente.current = null;
        const control = new AbortController();
        enCurso.current = control;
        setTraduciendo(true);
        try {
            const r = await traducirTextos(
                { title: form.title, excerpt: form.excerpt, content: form.content },
                { ...espera, signal: control.signal },
            );
            if (control.signal.aborted) return;
            if (esperandoCarga.current) pendiente.current = r;
            else aplicar(r);
        } catch (err) {
            if (control.signal.aborted) return;
            toastError(adminErrorMessage(err, "No se pudo traducir."), "En inglés");
        } finally {
            if (enCurso.current === control) {
                enCurso.current = null;
                if (!pendiente.current) setTraduciendo(false);
            }
        }
    };

    return { traductorDisponible, traduciendo, versionEn, revisadaAhora, setRevisadaAhora, traducir, seCreo };
};
