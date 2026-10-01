import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Subscribe } from "./pages/Subscribe";
import { Entorno } from "./pages/Entorno";
import { BoletinBaja } from "./pages/BoletinBaja";
import { QuienesSomos } from "./pages/QuienesSomos";
import { Articulos } from "./pages/Articulos";
import { Informes } from "./pages/Informes";
import { Audiovisual } from "./pages/Audiovisual";
import { Pieza } from "./pages/Pieza";
import { PiezaRedirect } from "./pages/PiezaRedirect";
import { Explorar } from "./pages/Explorar";
import { Educacion } from "./pages/Educacion";
import { Anunciate } from "./pages/Anunciate";
import { EducacionModulo } from "./pages/EducacionModulo";
import { EducacionLeccion } from "./pages/EducacionLeccion";
import { EducacionPagoVuelta } from "./pages/EducacionPagoVuelta";
import { Consultoria } from "./pages/Consultoria";
import { Contacto } from "./pages/Contacto";
import { Cookies } from "./pages/Cookies";
import { NotFound } from "./pages/NotFound";
import { RequireAdmin } from "./components/admin/RequireAdmin";
import { CuentaEntrar } from "./pages/cuenta/CuentaEntrar";
import { CuentaRegistro } from "./pages/cuenta/CuentaRegistro";
import { CuentaVerificarEmail } from "./pages/cuenta/CuentaVerificarEmail";
import { CuentaSolicitarCodigo } from "./pages/cuenta/CuentaSolicitarCodigo";

/**
 * Una página que se descarga al entrar en ella, no con el resto del sitio.
 *
 * El panel de administración y el área de cuenta son casi la mitad del código -- y
 * traen el editor de texto (TipTap), lo más pesado de todo --, pero sólo los usa la
 * redacción y quien tiene sesión. Antes iban en el mismo archivo que la portada, y cada
 * lector se descargaba el panel entero para leer una noticia. Con `lazy` del router cada
 * página va en su propio archivo y se pide la primera vez que alguien la abre.
 */
const pagina = (cargar, nombre) => async () => ({ Component: (await cargar())[nombre] });

export const router = createBrowserRouter([
    // La puerta del boletín desde Instagram. Fuera de `Layout` a propósito: sin
    // cabecera ni menú, una sola cosa que hacer. Ver `pages/Entorno.jsx`.
    { path: "/entorno", element: <Entorno />, errorElement: <NotFound /> },
    {
        path: "/",
        element: <Layout />,
        errorElement: <NotFound />,
        children: [
            { index: true, element: <Home /> },
            { path: "suscribirse", element: <Subscribe /> },
            // A donde apunta el enlace de baja de cada boletin. Sin sesion: el
            // token de la direccion es la unica credencial. Ver `BoletinBaja`.
            { path: "boletin/baja", element: <BoletinBaja /> },
            { path: "quienes-somos", element: <QuienesSomos /> },
            { path: "articulos", element: <Articulos /> },
            { path: "informes", element: <Informes /> },
            // «Al punto»: entrevistas y podcast juntos. Antes cada uno era un filtro de
            // /articulos; esas direcciones redirigen aquí (ver `Articulos`).
            { path: "audiovisual", element: <Audiovisual /> },
            { path: "explorar", element: <Explorar /> },
            // Cruza los seis formatos, como /explorar, pero por un valor de la pieza
            // en vez de por los filtros. De ahi su propia ruta y no un parametro mas.
            { path: "educacion", element: <Educacion /> },
            // La pagina de venta del inventario. Publica y sin publicidad propia:
            // no declara ningun espacio, asi que no pide ninguno.
            { path: "anunciate", element: <Anunciate /> },
            // La vuelta del pago va ANTES que "/educacion/:slug": si fuera despues, la
            // ruta comodin se tragaria "pago" como si fuera el slug de un modulo.
            { path: "educacion/pago/volver", element: <EducacionPagoVuelta /> },
            { path: "educacion/:slug", element: <EducacionModulo /> },
            { path: "educacion/:slug/:leccionSlug", element: <EducacionLeccion /> },
            // Everything published before the redesign lives at "articulo/<slug>".
            // Those addresses are indexed and shared, so they redirect to wherever
            // the piece sits now instead of 404ing. Same for "categoria/<slug>":
            // categories no longer exist, and the nearest thing a reader wanted is
            // the cross-format explorer.
            { path: "articulo/:slug", element: <PiezaRedirect /> },
            { path: "categoria/:slug", element: <Navigate to="/explorar" replace /> },
            // One detail page for all six formats; the format sits in the path so
            // the URL reads as what it is.
            { path: "noticias/:slug", element: <Pieza /> },
            { path: "articulos/:slug", element: <Pieza /> },
            { path: "editorial/:slug", element: <Pieza /> },
            { path: "entrevistas/:slug", element: <Pieza /> },
            { path: "informes/:slug", element: <Pieza /> },
            { path: "podcast/:slug", element: <Pieza /> },
            { path: "consultoria", element: <Consultoria /> },
            { path: "contacto", element: <Contacto /> },
            { path: "cookies", element: <Cookies /> },
            { path: "backoffice", element: <Navigate to="/cuenta/entrar" replace /> },
            { path: "cuenta/entrar", element: <CuentaEntrar /> },
            { path: "cuenta/registro", element: <CuentaRegistro /> },
            { path: "cuenta/verificar-email", element: <CuentaVerificarEmail /> },
            { path: "cuenta/solicitar-codigo", element: <CuentaSolicitarCodigo /> },
            { path: "*", element: <NotFound /> },
        ],
    },
    {
        path: "/cuenta",
        lazy: pagina(() => import("./pages/cuenta/CuentaDashboardLayout"), "CuentaDashboardLayout"),
        children: [
            { index: true, lazy: pagina(() => import("./pages/cuenta/CuentaDashboardHome"), "CuentaDashboardHome") },
            { path: "perfil", lazy: pagina(() => import("./pages/cuenta/CuentaPerfil"), "CuentaPerfil") },
            { path: "lo-mio", lazy: pagina(() => import("./pages/cuenta/CuentaLoMio"), "CuentaLoMio") },
            { path: "marcadores", lazy: pagina(() => import("./pages/cuenta/CuentaMarcadores"), "CuentaMarcadores") },
            { path: "envios", lazy: pagina(() => import("./pages/cuenta/CuentaEnviosList"), "CuentaEnviosList") },
            { path: "envios/nuevo", lazy: pagina(() => import("./pages/cuenta/CuentaEnviosNuevo"), "CuentaEnviosNuevo") },
            { path: "envios/:id/editar", lazy: pagina(() => import("./pages/cuenta/CuentaEnvioEditar"), "CuentaEnvioEditar") },
            { path: "envios/:id", lazy: pagina(() => import("./pages/cuenta/CuentaEnvioDetail"), "CuentaEnvioDetail") },
        ],
    },
    {
        path: "/admin/login",
        element: <Navigate to="/cuenta/entrar" replace />,
    },
    {
        path: "/admin",
        element: <RequireAdmin />,
        children: [
            {
                lazy: pagina(() => import("./pages/admin/AdminLayout"), "AdminLayout"),
                children: [
                    { index: true, element: <Navigate to="posts" replace /> },
                    { path: "posts", lazy: pagina(() => import("./pages/admin/AdminPostsList"), "AdminPostsList") },
                    { path: "posts/new", lazy: pagina(() => import("./pages/admin/AdminPostEditor"), "AdminPostEditor") },
                    { path: "posts/:postId", lazy: pagina(() => import("./pages/admin/AdminPostEditor"), "AdminPostEditor") },
                    // The two axes. Neither has a create route: topics are a
                    // closed list of fourteen and places only grow by country,
                    // which the Lugares screen does inline.
                    { path: "topics", lazy: pagina(() => import("./pages/admin/AdminTopicsList"), "AdminTopicsList") },
                    { path: "places", lazy: pagina(() => import("./pages/admin/AdminPlacesList"), "AdminPlacesList") },
                    { path: "media", lazy: pagina(() => import("./pages/admin/AdminMediaLibrary"), "AdminMediaLibrary") },
                    { path: "cinta", lazy: pagina(() => import("./pages/admin/AdminMarketTicker"), "AdminMarketTicker") },
                    // Solo las fotos del equipo: los nombres y los cargos viven en
                    // el codigo, y esta pantalla no los toca.
                    { path: "equipo", lazy: pagina(() => import("./pages/admin/AdminEquipo"), "AdminEquipo") },
                    // Las publicaciones de redes que se destacan al pie de todas
                    // las vistas. Curadas a mano: ver `redes_service.py`.
                    { path: "redes", lazy: pagina(() => import("./pages/admin/AdminRedes"), "AdminRedes") },
                    // La vuelta de TikTok tras dar permiso: es la Redirect URI de Login Kit,
                    // así que la dirección no puede cambiar sin cambiarla también allí.
                    { path: "redes/tiktok", lazy: pagina(() => import("./pages/admin/AdminRedesTikTok"), "AdminRedesTikTok") },
                    { path: "educacion", lazy: pagina(() => import("./pages/admin/AdminEducacion"), "AdminEducacion") },
                    { path: "publicidad", lazy: pagina(() => import("./pages/admin/AdminPublicidad"), "AdminPublicidad") },
                    { path: "analitica", lazy: pagina(() => import("./pages/admin/AdminAnalitica"), "AdminAnalitica") },
                    { path: "comments", lazy: pagina(() => import("./pages/admin/AdminCommentsList"), "AdminCommentsList") },
                    { path: "boletin", lazy: pagina(() => import("./pages/admin/AdminNewsletterList"), "AdminNewsletterList") },
                    // Los numeros de "Entorno en Viñetas". La lista de suscriptores se
                    // queda en `boletin`, donde ya la buscaba la redaccion.
                    { path: "boletin/numeros", lazy: pagina(() => import("./pages/admin/AdminBoletin"), "AdminBoletin") },
                    { path: "submissions", lazy: pagina(() => import("./pages/admin/AdminSubmissionsList"), "AdminSubmissionsList") },
                    { path: "submissions/:id", lazy: pagina(() => import("./pages/admin/AdminSubmissionDetail"), "AdminSubmissionDetail") },
                    { path: "settings/collaboration", lazy: pagina(() => import("./pages/admin/AdminCollaborationSettings"), "AdminCollaborationSettings") },
                    { path: "users", lazy: pagina(() => import("./pages/admin/AdminUsersList"), "AdminUsersList") },
                    { path: "users/:id", lazy: pagina(() => import("./pages/admin/AdminUserDetail"), "AdminUserDetail") },
                    { path: "staff", lazy: pagina(() => import("./pages/admin/AdminStaffList"), "AdminStaffList") },
                    { path: "perfil", lazy: pagina(() => import("./pages/admin/AdminMiPerfil"), "AdminMiPerfil") },
                ],
            },
        ],
    },
]);
