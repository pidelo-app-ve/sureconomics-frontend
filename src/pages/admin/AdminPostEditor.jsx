import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEsMovil } from "../../hooks/useEsMovil";
import {
    Link,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";
import {
    createAdminPost,
    deleteAdminPost,
    getAdminPost,
    patchAdminPost,
    publishAdminPost,
    unpublishAdminPost,
} from "../../services/adminPostsService";
import { subirVideoDeStream } from "../../lib/subirVideoDeStream";
import { EmptyState, ErrorState, LoadingState } from "../../ui";
import { AdminFormFeedback } from "../../components/admin/AdminFormFeedback";
import { ListaDeComprobacion } from "../../components/admin/ListaDeComprobacion";
import { PiezaPublicada } from "../../components/admin/PiezaPublicada";
import { useSugerenciasDeClasificacion } from "../../components/admin/SugerenciasDeClasificacion";
import { applyPageMeta } from "../../lib/seo";
import { useAdminConfirm } from "../../ui/admin/useAdminConfirm";
import { useGuardiaDeSalida } from "../../hooks/useGuardiaDeSalida";
import { useFlashMessage } from "../../hooks/useFlashMessage";
import { useAuth } from "../../context/AuthContext";
import { useAdminToast } from "../../context/AdminToastContext";
import { VistaPreviaDePieza } from "../../components/admin/VistaPreviaDePieza";
import { useClaveIdempotente } from "../../hooks/useClaveIdempotente";
import { rutaDePieza } from "../../lib/pieza";
import { useBorradorLocal } from "../../hooks/useBorradorLocal";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { recorridoEditor } from "../../lib/guias/guiaEditor";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";
import {
    FORMAT_FIELDS,
    FORMATOS_SIN_PROGRAMAR,
    emptyForm,
    fechaDeCaracas,
    formToPayload,
    horaCorta,
    idDeLaPieza,
    normalizarPieza,
    postToForm,
} from "../../components/admin/editorDePieza/formulario";
import {
    avisoDelFormulario,
    claveDelBorrador as claveDelBorradorDe,
    ejecutarAccion,
    eliminarPieza,
    estaOcupado,
    guardarPieza,
    hayCambios,
} from "../../components/admin/editorDePieza/guardado";
import { estadoDeLaPieza, estadoDelIngles } from "../../components/admin/editorDePieza/derivadosDeLaPieza";
import { useTraduccionDePieza } from "../../components/admin/editorDePieza/useTraduccionDePieza";
import { useTaxonomiaDelEditor } from "../../components/admin/editorDePieza/useTaxonomiaDelEditor";
import { useFirmaDelColaborador } from "../../components/admin/editorDePieza/useFirmaDelColaborador";
import { useAtajosDeTeclado } from "../../components/admin/editorDePieza/useAtajosDeTeclado";
import { GrupoFormato } from "../../components/admin/editorDePieza/GrupoFormato";
import { GrupoLaPieza } from "../../components/admin/editorDePieza/GrupoLaPieza";
import { GrupoCuerpo } from "../../components/admin/editorDePieza/GrupoCuerpo";
import { GrupoArchivos } from "../../components/admin/editorDePieza/GrupoArchivos";
import { GrupoClasificacion } from "../../components/admin/editorDePieza/GrupoClasificacion";
import { GrupoPublicacion } from "../../components/admin/editorDePieza/GrupoPublicacion";
import { CampoSeo } from "../../components/admin/editorDePieza/CampoSeo";
import { EstadoDeLaPieza } from "../../components/admin/editorDePieza/EstadoDeLaPieza";
import { BotonesDeLaPieza } from "../../components/admin/editorDePieza/BotonesDeLaPieza";

/**
 * El editor de piezas del panel. Aquí quedan el estado del formulario, la carga, el
 * guardado y las acciones; los grupos del formulario, los datos y los hooks propios
 * viven en `components/admin/editorDePieza/` (lo que decide al guardar, en `guardado.js`).
 */
export const AdminPostEditor = () => {
    const { role } = useAuth();
    const canPublish = role === "publicador" || role === "admin";
    // En el teléfono cada campo es una fila que abre su propia hoja. Ver `CampoMovil`.
    const esMovil = useEsMovil();
    // Lo último que se cargó o guardó, para saber si hay algo sin guardar. `saltarGuarda`
    // deja pasar las salidas que hace el propio editor (tras crear o eliminar).
    const [base, setBase] = useState(null);
    // Sube cada vez que el formulario se abre (se carga del servidor o se empieza uno
    // nuevo): es cuando se ofrece la copia de este equipo (`useBorradorLocal`).
    const [apertura, setApertura] = useState(0);
    const saltarGuarda = useRef(false);
    const canCreate = Boolean(role);
    const { postId } = useParams();
    const { pathname, state: estadoDeRuta } = useLocation();
    // Recién publicada: se enseña el enlace y lo que se hace con él (`PiezaPublicada`).
    const [recienPublicada, setRecienPublicada] = useState(Boolean(estadoDeRuta?.recienPublicada));
    // Lo que hacen Ctrl+S y Ctrl+Enter, al día en cada pintado (ver más abajo).
    const atajos = useRef({ guardar: null, publicar: null });
    const isCreate = /\/admin\/posts\/new\/?$/.test(pathname);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [form, setForm] = useState(emptyForm);
    // El formulario del último pintado, para lo que vuelve de una petición: lo escrito
    // mientras tanto no se pisa (ver `aplicarRespuesta` en `guardado.js`).
    const formActual = useRef(form);
    formActual.current = form;
    const [vistaPrevia, setVistaPrevia] = useState(false);
    const [assets, setAssets] = useState({ image: null, video: null, document: null, audio: null, bylinePhoto: null });
    // El lector que la propuso, si la pieza salió de una propuesta aceptada. La firma
    // pública es la de los campos de aquí (se copió de su cuenta al aceptarla); esto
    // solo dice de quién es el crédito y si su cuenta cambió desde entonces.
    const [colaborador, setColaborador] = useState(null);
    const [loadState, setLoadState] = useState({ status: "idle", error: null });
    const [saveState, setSaveState] = useState({ status: "idle", message: "" });
    // La misma clave mientras la creación no cuaje. El caso que evita: se pulsa Crear,
    // la pieza se guarda, la respuesta se pierde por el camino, y quien escribe -- que
    // solo ve un error -- vuelve a pulsar. Sin esto acaba con dos piezas iguales en el
    // listado y sin saber cuál borrar. Al cuajar se navega al editor de la pieza nueva,
    // así que no hace falta renovarla.
    const { clave: claveDeCreacion } = useClaveIdempotente();
    // Clave aparte para la subida de video, y no la de crear la pieza: son dos
    // operaciones distintas y compartir la clave haria que la segunda recibiera la
    // respuesta guardada de la primera. Se renueva cuando una subida cuaja, porque a
    // partir de ahi lo que venga es otro video y no un reintento del mismo.
    const { clave: claveDeVideo, renovar: renovarClaveDeVideo } = useClaveIdempotente();
    const [actionState, setActionState] = useState({ status: "idle", message: "", kind: "" });
    // Borrando la pieza (ya confirmado): cuenta como `ocupado`. `enMarcha`, el candado de
    // guardar, publicar/despublicar y eliminar: ver `guardado.js`.
    const [eliminando, setEliminando] = useState(false);
    const enMarcha = useRef(false);
    // Con la pregunta de eliminar o la de quitar el vínculo abierta: también `ocupado`.
    const [preguntando, setPreguntando] = useState(false);
    const { confirm, ConfirmDialog } = useAdminConfirm();
    const flash = useFlashMessage();
    const { toastSuccess, toastError } = useAdminToast();

    const numericPostId = idDeLaPieza(postId);
    // La pieza abierta en el último pintado: la respuesta que llega tarde de otra no se
    // aplica aquí (ver `esOtraPieza` en `guardado.js`).
    const piezaAbierta = useRef(numericPostId);
    piezaAbierta.current = numericPostId;
    // «Traducir con Claude» (en segundo plano; se deja si se abre otra pieza): ver `useTraduccionDePieza`.
    const { traductorDisponible, traduciendo, versionEn, revisadaAhora, setRevisadaAhora, traducir, seCreo } =
        useTraduccionDePieza({ form, setForm, confirm, toastSuccess, toastError, piezaId: numericPostId, apertura });

    const loadPost = useCallback(async () => {
        if (isCreate || !numericPostId) {
            // `?format=noticia` comes from the "create" menu, so the newsroom lands
            // on the right form instead of picking the format twice.
            const requested = searchParams.get("format") || "";
            const inicial = { ...emptyForm(), format: requested };
            setForm(inicial);
            setBase(inicial);
            setApertura((n) => n + 1);
            saltarGuarda.current = false;
            setAssets({ image: null, video: null, document: null, audio: null, bylinePhoto: null });
            setColaborador(null);
            setLoadState({ status: "success", error: null });
            return;
        }
        setLoadState({ status: "loading", error: null });
        try {
            const post = await getAdminPost(numericPostId);
            setForm(postToForm(post));
            setBase(postToForm(post));
            setApertura((n) => n + 1);
            saltarGuarda.current = false;
            setAssets({
                image: post.image_asset ?? null,
                video: post.video_asset ?? null,
                document: post.document_asset ?? null,
                audio: post.audio_asset ?? null,
                bylinePhoto: post.byline_photo ?? null,
            });
            setColaborador(post.colaborador ?? null);
            setLoadState({ status: "success", error: null });
        } catch (err) {
            setLoadState({ status: "error", error: err });
        }
    }, [isCreate, numericPostId, searchParams]);

    const { formats, topics, placeGroups } = useTaxonomiaDelEditor();

    useEffect(() => {
        loadPost();
    }, [loadPost]);

    const currentFormat = useMemo(
        () => formats.find((f) => f.slug === form.format) ?? null,
        [formats, form.format]
    );

    useEffect(() => {
        const name = currentFormat?.name ?? "pieza";
        applyPageMeta({
            title: isCreate
                ? `Admin — Crear ${name.toLowerCase()}`
                : `Admin — Editar #${postId ?? ""}`,
            description: "Edición de contenido (SurEconomics).",
        });
    }, [isCreate, postId, currentFormat]);

    useEffect(() => {
        if (flash) toastSuccess(flash);
    }, [flash, toastSuccess]);

    // Cómo va la versión en inglés. Sale en /en con título y cuerpo; con uno solo es una
    // traducción a medias, y la pieza sigue saliendo en español: se dice aquí, no se
    // descubre en el sitio.
    const estadoIngles = estadoDelIngles(form);

    const handleChange = (field) => (e) => {
        const v = e.target.value;
        setForm((prev) => ({ ...prev, [field]: v }));
    };

    const setAsset = (slot, kind) => (assetId, asset) => {
        setForm((prev) => ({ ...prev, [slot]: assetId }));
        setAssets((prev) => ({ ...prev, [kind]: asset }));
    };

    /**
     * Sube un video a Stream y devuelve el asset, para que `AssetField` lo adjunte.
     *
     * Tres pasos, y el orden importa: si se anotara la fila antes de subir, un fallo a
     * mitad de camino dejaria en la biblioteca un video que no existe, y la entrevista
     * se podria publicar con un reproductor vacio.
     *
     * Al terminar se pregunta una vez por el estado. No se espera a que Stream acabe de
     * transcodificar -- puede tardar minutos en una entrevista larga y dejaria a un
     * editor mirando el formulario -- pero si no esta listo se le dice, que es distinto
     * de callarlo.
     */
    const subirVideo = async (file, { onProgress, onAviso } = {}) => {
        const fila = await subirVideoDeStream(file, {
            // Con la clave: si el editor pulsa dos veces, la segunda recibe la direccion
            // de la primera en vez de crear un segundo hueco de video que se factura solo.
            clave: claveDeVideo(),
            onProgress,
            onAviso,
            onProcesando: () =>
                toastSuccess(
                    "Video subido. Cloudflare esta procesandolo; en unos minutos se vera " +
                    "en la pieza.",
                    "Video"
                ),
        });
        // Cuajo: la proxima subida es otro video, no un reintento de este.
        renovarClaveDeVideo();
        return fila;
    };

    const shows = (field) => (FORMAT_FIELDS[form.format] ?? []).includes(field);
    const requiredMedia = currentFormat?.required_media ?? "none";

    // Donde se ofrece marcar la pieza como educativa: articulo y entrevista, que es lo
    // que se pidio. La segunda mitad de la condicion es lo que evita un callejon sin
    // salida -- si una pieza ya marcada cambia a un formato que no ofrece el
    // interruptor, sin esto quedaria con el sello puesto y sin forma de quitarlo.
    const muestraEducativo =
        form.format === "articulo" || form.format === "entrevista" || form.is_educational;

    // A URL pasted before the media library existed. Shown so an editor knows why
    // there is an image on a piece with nothing attached, and can clear it.
    const legacyImage = Boolean(form.featured_image_url && !form.image_asset_id);

    // Lo que usan guardar, publicar/despublicar y eliminar (`guardado.js`), con el
    // candado: una acción a la vez (ver `estaOcupado`).
    const dependencias = () => ({
        form,
        formActual,
        base,
        isCreate,
        numericPostId,
        piezaAbierta,
        // Same reason: no gendered adjective on a name that comes from data.
        label: currentFormat?.name ?? "La pieza",
        enMarcha,
        claveDeCreacion,
        alCrear: seCreo,
        createAdminPost,
        patchAdminPost,
        deleteAdminPost,
        navigate,
        saltarGuarda,
        borrador,
        confirm,
        setSaveState,
        setActionState,
        setForm,
        setBase,
        setColaborador,
        setAssets,
        setRecienPublicada,
        setEliminando,
        setPreguntando,
        toastSuccess,
        toastError,
    });

    // `publicar`: al crear, la pieza nace publicada. Antes eran dos pasos (crear el
    // borrador y, ya en la pantalla siguiente, publicar) para lo que casi siempre es uno.
    const guardar = (opciones) => guardarPieza(opciones, dependencias());

    const handleSave = () => guardar();

    // `enviado`: sobre qué formulario responde el servidor (ver `aplicarRespuesta`).
    const runAction = (kind, fn, successMessage, failureMessage, toastTitle, enviado) => () =>
        ejecutarAccion({ kind, fn, successMessage, failureMessage, toastTitle, enviado }, dependencias());

    // Publicar con cambios sin guardar los guarda antes: «Publicar» es la acción
    // principal de un borrador listo, y publicar la versión de antes sería una trampa.
    const guardarYPublicar = async (id) => {
        if (hayCambios(form, base)) {
            await patchAdminPost(id, formToPayload(form));
        }
        return publishAdminPost(id);
    };

    const handlePublish = runAction(
        "publish",
        guardarYPublicar,
        "Quedó publicada y ya es visible en el sitio.",
        "No se pudo publicar.",
        "Publicar"
    );

    const handleUnpublish = runAction(
        "unpublish",
        unpublishAdminPost,
        form.status === "scheduled"
            ? "Se canceló la programación: vuelve a ser un borrador."
            : "Se despublicó y ya no es visible en el sitio.",
        "No se pudo despublicar.",
        "Despublicar",
        // Despublicar no manda el formulario: lo que se haya escrito sin guardar se queda.
        base ?? form
    );

    const sePuedeProgramar = canPublish && !FORMATOS_SIN_PROGRAMAR.has(form.format);
    const programada = form.status === "scheduled";

    const { colaboradorOcupado, handleUsarSuCuenta, handleQuitarVinculo } = useFirmaDelColaborador({ dependencias });

    const handleDelete = () =>
        eliminarPieza({
            ...dependencias(),
            dialogo: {
                title: "Eliminar pieza",
                description: form.title.trim()
                    ? `¿Eliminar «${form.title.trim()}» de forma permanente? No se puede deshacer.`
                    : `¿Eliminar esta pieza de forma permanente? No se puede deshacer.`,
                confirmLabel: "Eliminar",
            },
        });

    // Salir con cambios sin guardar: un clic de más en el menú o en «Volver» se llevaba
    // lo escrito (en el computador no se preguntaba). Cerrar una hoja del teléfono no
    // cuenta: lo escrito sigue en el editor.
    const sinGuardar = hayCambios(form, base);
    // Ctrl+S guarda y Ctrl+Enter publica (Cmd en Mac): quien escribe no suelta el teclado.
    useAtajosDeTeclado(atajos);

    // Tema y lugar propuestos leyendo lo escrito (con reglas, sin IA): se aceptan con un toque.
    const sugerencias = useSugerenciasDeClasificacion({
        titulo: form.title,
        resumen: form.excerpt,
        contenido: form.content,
    });
    useGuardiaDeSalida(sinGuardar, confirm, {
        saltar: saltarGuarda,
        descripcion: "Hay cambios en esta pieza que todavía no se guardaron.",
    });

    // Copia en este equipo de lo que no se ha guardado, por si se cierra la pestaña o se
    // cae el navegador: vuelve al abrir la pieza otra vez. No sustituye a «Guardar».
    const claveDelBorrador = claveDelBorradorDe({ loadState, base, isCreate, postId });
    const borrador = useBorradorLocal({
        clave: claveDelBorrador,
        valores: form,
        base,
        aplicar: setForm,
        normalizar: normalizarPieza,
        apertura,
    });

    const feedback = avisoDelFormulario(actionState, saveState);

    if (isCreate && !canCreate) {
        return <EmptyState title="Sin acceso" description="Hace falta una cuenta del panel para crear contenido nuevo." />;
    }

    if (loadState.status === "loading") {
        return <LoadingState title="Cargando…" />;
    }

    if (loadState.status === "error") {
        return (
            <>
                <ErrorState title="No se pudo cargar la pieza" error={loadState.error} onRetry={loadPost} />
                <p style={{ marginTop: "1rem" }}>
                    <Link to="/admin/posts" className="se-link">
                        Volver al listado
                    </Link>
                </p>
            </>
        );
    }

    if (!isCreate && !numericPostId) {
        return <EmptyState title="Ruta no válida" description="Falta el identificador de la pieza." />;
    }

    const {
        missingMedia,
        temasElegidos,
        lugaresElegidos,
        nPalabras,
        nFuentes,
        muestraPortada,
        faltaFechaDePortada,
        portadaHastaIso,
        resumenDeEstado,
        faltas,
        chequeo,
    } = estadoDeLaPieza({ form, requiredMedia, canPublish, programada, legacyImage, topics, placeGroups });

    const publicarEsPrincipal = canPublish && form.status === "draft" && !faltas.length;
    const ocupado = estaOcupado({ saveState, actionState, eliminando, colaboradorOcupado, preguntando });
    atajos.current = {
        guardar: form.format && !ocupado ? handleSave : null,
        publicar:
            publicarEsPrincipal && !ocupado ? (isCreate ? () => guardar({ publicar: true }) : handlePublish) : null,
    };

    // «Publicación» (estado, fecha, portada): en el teléfono, entre las demás filas; en el
    // computador, en la columna de la derecha con el estado y los botones, abierta, que es
    // donde se mira al publicar (lo pidió Ramón el 9-nov-2026).
    const grupoPublicacion = (
        <GrupoPublicacion
            esMovil={esMovil}
            form={form}
            setForm={setForm}
            handleChange={handleChange}
            canPublish={canPublish}
            sePuedeProgramar={sePuedeProgramar}
            programada={programada}
            resumenDeEstado={resumenDeEstado}
            faltaFechaDePortada={faltaFechaDePortada}
            muestraPortada={muestraPortada}
            portadaHastaIso={portadaHastaIso}
            missingMedia={missingMedia}
            requiredMedia={requiredMedia}
        />
    );

    return (
        <main role="main" className={esMovil ? "se-editor-movil" : "se-editor-escritorio"}>
            <CabeceraDePagina
              titulo={
                <>
                  {/* "Crear"/"Editar" + the name works for every format;
                      "nueva informe" would not. */}
                  {isCreate
                      ? currentFormat ? `Crear ${currentFormat.name.toLowerCase()}` : "Crear pieza"
                      : `Editar ${currentFormat?.name?.toLowerCase() ?? "pieza"} #${postId}`}
                </>
              }
              dato={
                <>
                  Estado:{" "}
                  {form.status === "published"
                      ? "publicado"
                      : programada
                        ? `programado para el ${fechaDeCaracas(form.published_at) || "…"} (hora de Caracas)`
                        : "borrador"}
                </>
              }
              acciones={
                <>
                  <Link to="/admin/posts" className="se-link">
                      Volver al listado
                  </Link>
                </>
              }
              guia={recorridoEditor}
            />

            {recienPublicada && form.status === "published" && form.slug ? (
                <PiezaPublicada
                    titulo={form.title.trim()}
                    ruta={rutaDePieza({ formatoApi: form.format, slug: form.slug })}
                    onCerrar={() => setRecienPublicada(false)}
                />
            ) : null}

            {borrador.recuperadoEn ? (
                <p className="se-editor-recuperado" role="status">
                    Recuperamos lo que estaba sin guardar (copia de las {horaCorta(borrador.recuperadoEn)}).
                    Revíselo y guarde, o{" "}
                    <button type="button" className="se-editor-recuperado__descartar" onClick={borrador.descartar}>
                        descártelo
                    </button>
                    .
                </p>
            ) : null}

            <div className="se-editor-rejilla">
            <div className="se-editor-rejilla__pieza">
            <GrupoFormato
                esMovil={esMovil}
                isCreate={isCreate}
                form={form}
                setForm={setForm}
                setBase={setBase}
                formats={formats}
                currentFormat={currentFormat}
                handleChange={handleChange}
            />

            {form.format ? (
                <>
                    <GrupoLaPieza
                        esMovil={esMovil}
                        form={form}
                        setForm={setForm}
                        handleChange={handleChange}
                        currentFormat={currentFormat}
                        assets={assets}
                        setAsset={setAsset}
                        colaborador={colaborador}
                        colaboradorOcupado={colaboradorOcupado}
                        handleUsarSuCuenta={handleUsarSuCuenta}
                        handleQuitarVinculo={handleQuitarVinculo}
                        nFuentes={nFuentes}
                        shows={shows}
                    />

                    <GrupoCuerpo
                        esMovil={esMovil}
                        form={form}
                        setForm={setForm}
                        handleChange={handleChange}
                        nPalabras={nPalabras}
                        estadoIngles={estadoIngles}
                        traductorDisponible={traductorDisponible}
                        traducir={traducir}
                        traduciendo={traduciendo}
                        versionEn={versionEn}
                        revisadaAhora={revisadaAhora}
                        setRevisadaAhora={setRevisadaAhora}
                    />

                    <GrupoArchivos
                        esMovil={esMovil}
                        form={form}
                        setForm={setForm}
                        assets={assets}
                        setAsset={setAsset}
                        requiredMedia={requiredMedia}
                        legacyImage={legacyImage}
                        subirVideo={subirVideo}
                    />

                    <GrupoClasificacion
                        esMovil={esMovil}
                        form={form}
                        setForm={setForm}
                        sugerencias={sugerencias}
                        topics={topics}
                        placeGroups={placeGroups}
                        temasElegidos={temasElegidos}
                        lugaresElegidos={lugaresElegidos}
                        muestraEducativo={muestraEducativo}
                    />

                    {esMovil ? grupoPublicacion : null}

                    <CampoSeo esMovil={esMovil} form={form} handleChange={handleChange} />
                </>
            ) : null}
            </div>

            {form.format ? (
                <aside className="se-editor-rejilla__estado" aria-label="Estado y acciones de la pieza">
                    {!esMovil ? (
                        <EstadoDeLaPieza
                            form={form}
                            resumenDeEstado={resumenDeEstado}
                            sinGuardar={sinGuardar}
                            borrador={borrador}
                            isCreate={isCreate}
                            faltas={faltas}
                        />
                    ) : null}

                    {!esMovil ? <ListaDeComprobacion titulo="Antes de publicar" puntos={chequeo} /> : null}

                    {!esMovil ? grupoPublicacion : null}

                    <VistaPreviaDePieza
                        abierta={vistaPrevia}
                        onCerrar={() => setVistaPrevia(false)}
                        form={form}
                        assets={assets}
                        topics={topics}
                        formato={currentFormat}
                    />

                    <AdminFormFeedback tone={feedback?.tone} message={feedback?.message} />

                    <BotonesDeLaPieza
                        esMovil={esMovil}
                        form={form}
                        faltas={faltas}
                        setVistaPrevia={setVistaPrevia}
                        publicarEsPrincipal={publicarEsPrincipal}
                        handleSave={handleSave}
                        saveState={saveState}
                        ocupado={ocupado}
                        programada={programada}
                        isCreate={isCreate}
                        canPublish={canPublish}
                        guardar={guardar}
                        handlePublish={handlePublish}
                        actionState={actionState}
                        sinGuardar={sinGuardar}
                        handleUnpublish={handleUnpublish}
                        handleDelete={handleDelete}
                    />
                </aside>
            ) : null}
            </div>

            <ConfirmDialog />
            <RecorridoVista recorrido={recorridoEditor} />
        </main>
    );
};
