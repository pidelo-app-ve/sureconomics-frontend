// Antes que nada: `createBrowserRouter` arranca la primera navegación al evaluarse, y
// el `loader` de `/en` necesita saber ya cómo descargar el diccionario inglés.
import "./i18n/diccionarios";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Pieza } from "./pages/Pieza";
import { NotFound } from "./pages/NotFound";
import { RouteError } from "./pages/RouteError";
import { RequireAdmin } from "./components/admin/RequireAdmin";
import { ProveedorIdioma } from "./i18n/ProveedorIdioma";
import { Redirigir } from "./components/Enlace";
import { cargarIdioma } from "./i18n/motor";

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


/**
 * Las rutas públicas, con caminos relativos: se montan dos veces, en `/` (español) y en
 * `/en` (inglés), bajo un `ProveedorIdioma` cada una. Así una página existe en los dos
 * idiomas sin escribirla dos veces, y el idioma vive en la dirección, que es lo que
 * Google indexa. Ver `i18n/motor.js`.
 */
const rutasPublicas = () => [
    // La puerta del boletín desde Instagram. Fuera de `Layout` a propósito: sin
    // cabecera ni menú, una sola cosa que hacer. Ver `pages/Entorno.jsx`.
    { path: "entorno", lazy: pagina(() => import("./pages/Entorno"), "Entorno"), errorElement: <RouteError /> },
    // El Analista está EN PAUSA (octubre de 2026): la dirección lleva a /juegos, en el
    // idioma de la página, y el juego no se descarga. La página, el servicio y el panel
    // del ranking siguen en su sitio. Para volver a encenderlo, cambiar esta línea por
    // la de abajo (a pantalla completa y fuera de `Layout`: el juego abre pantallas fijas
    // que taparían la cabecera; ver `pages/ElAnalista.jsx`), y darle su tarjeta en
    // `pages/Juegos.jsx` y su línea en `api/sitemap.js`:
    // { path: "el-analista", lazy: pagina(() => import("./pages/ElAnalista"), "ElAnalistaPagina"), errorElement: <RouteError /> },
    { path: "el-analista", element: <Redirigir to="/juegos" replace /> },
    {
        element: <Layout />,
        errorElement: <RouteError />,
        children: [
            { index: true, element: <Home /> },
            { path: "suscribirse", lazy: pagina(() => import("./pages/Subscribe"), "Subscribe") },
            // A donde apunta el enlace de baja de cada boletin. Sin sesion: el
            // token de la direccion es la unica credencial. Ver `BoletinBaja`.
            { path: "boletin/baja", lazy: pagina(() => import("./pages/BoletinBaja"), "BoletinBaja") },
            { path: "quienes-somos", lazy: pagina(() => import("./pages/QuienesSomos"), "QuienesSomos") },
            { path: "articulos", lazy: pagina(() => import("./pages/Articulos"), "Articulos") },
            { path: "informes", lazy: pagina(() => import("./pages/Informes"), "Informes") },
            // «Al punto»: entrevistas y podcast juntos. Antes cada uno era un filtro de
            // /articulos; esas direcciones redirigen aquí (ver `Articulos`).
            { path: "audiovisual", lazy: pagina(() => import("./pages/Audiovisual"), "Audiovisual") },
            { path: "explorar", lazy: pagina(() => import("./pages/Explorar"), "Explorar") },
            // Cruza los seis formatos, como /explorar, pero por un valor de la pieza
            // en vez de por los filtros. De ahi su propia ruta y no un parametro mas.
            { path: "educacion", lazy: pagina(() => import("./pages/Educacion"), "Educacion") },
            // La pagina de venta del inventario. Publica y sin publicidad propia:
            // no declara ningun espacio, asi que no pide ninguno.
            { path: "anunciate", lazy: pagina(() => import("./pages/Anunciate"), "Anunciate") },
            // La vuelta del pago va ANTES que "/educacion/:slug": si fuera despues, la
            // ruta comodin se tragaria "pago" como si fuera el slug de un modulo.
            { path: "educacion/pago/volver", lazy: pagina(() => import("./pages/EducacionPagoVuelta"), "EducacionPagoVuelta") },
            { path: "educacion/:slug", lazy: pagina(() => import("./pages/EducacionModulo"), "EducacionModulo") },
            { path: "educacion/:slug/:leccionSlug", lazy: pagina(() => import("./pages/EducacionLeccion"), "EducacionLeccion") },
            // Everything published before the redesign lives at "articulo/<slug>".
            // Those addresses are indexed and shared, so they redirect to wherever
            // the piece sits now instead of 404ing. Same for "categoria/<slug>":
            // categories no longer exist, and the nearest thing a reader wanted is
            // the cross-format explorer.
            { path: "articulo/:slug", lazy: pagina(() => import("./pages/PiezaRedirect"), "PiezaRedirect") },
            { path: "categoria/:slug", element: <Navigate to="/explorar" replace /> },
            // One detail page for all six formats; the format sits in the path so
            // the URL reads as what it is.
            { path: "noticias/:slug", element: <Pieza /> },
            { path: "articulos/:slug", element: <Pieza /> },
            { path: "editorial/:slug", element: <Pieza /> },
            { path: "entrevistas/:slug", element: <Pieza /> },
            { path: "informes/:slug", element: <Pieza /> },
            { path: "podcast/:slug", element: <Pieza /> },
            { path: "consultoria", lazy: pagina(() => import("./pages/Consultoria"), "Consultoria") },
            { path: "contacto", lazy: pagina(() => import("./pages/Contacto"), "Contacto") },
            { path: "cookies", lazy: pagina(() => import("./pages/Cookies"), "Cookies") },
            // Todos los juegos del sitio, una tarjeta por juego. A ella lleva el botón
            // «Juegos» de la cabecera.
            { path: "juegos", lazy: pagina(() => import("./pages/Juegos"), "Juegos") },
            // El juego se descarga al abrir la página, no con el resto del sitio.
            { path: "pausa", lazy: pagina(() => import("./pages/Pausa"), "Pausa") },
            { path: "clave", lazy: pagina(() => import("./pages/Clave"), "ClavePage") },
            // El béisbol venezolano: juegos, marcadores y tabla. Carga perezosa, como los juegos.
            { path: "lvbp", lazy: pagina(() => import("./pages/Lvbp"), "Lvbp") },
            // Las monedas de la región: cuánto vale un dólar en cada una, según su banco central.
            { path: "monedas", lazy: pagina(() => import("./pages/Monedas"), "Monedas") },
            { path: "backoffice", element: <Navigate to="/cuenta/entrar" replace /> },
            { path: "cuenta/entrar", lazy: pagina(() => import("./pages/cuenta/CuentaEntrar"), "CuentaEntrar") },
            { path: "cuenta/registro", lazy: pagina(() => import("./pages/cuenta/CuentaRegistro"), "CuentaRegistro") },
            { path: "cuenta/verificar-email", lazy: pagina(() => import("./pages/cuenta/CuentaVerificarEmail"), "CuentaVerificarEmail") },
            { path: "cuenta/solicitar-codigo", lazy: pagina(() => import("./pages/cuenta/CuentaSolicitarCodigo"), "CuentaSolicitarCodigo") },
            { path: "*", element: <NotFound /> },
        ],
    },
    {
        path: "cuenta",
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
];

export const router = createBrowserRouter([
    { path: "/", element: <ProveedorIdioma lang="es" />, errorElement: <RouteError />, children: rutasPublicas() },
    {
        path: "/en",
        element: <ProveedorIdioma lang="en" />,
        errorElement: <RouteError />,
        // El diccionario en inglés se descarga antes de pintar: ni parpadeo ni textos
        // a medias. Es un archivo pequeño y se cachea; las visitas siguientes no esperan.
        loader: async () => {
            await cargarIdioma("en");
            return null;
        },
        children: rutasPublicas(),
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
                    { path: "analista", lazy: pagina(() => import("./pages/admin/AdminAnalista"), "AdminAnalista") },
                    // El catálogo de La Clave: las palabras de las que sale la del día.
                    { path: "juegos/palabras", lazy: pagina(() => import("./pages/admin/AdminJuegoPalabras"), "AdminJuegoPalabras") },
                    // Los juegos de la LVBP: cargar a mano lo que la API no da, corregir, sincronizar.
                    { path: "lvbp", lazy: pagina(() => import("./pages/admin/AdminLvbp"), "AdminLvbp") },
                    // Traducir al inglés, en lote, las piezas publicadas que no lo tienen.
                    { path: "traducciones", lazy: pagina(() => import("./pages/admin/AdminTraducciones"), "AdminTraducciones") },
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
