// Antes que nada: `createBrowserRouter` arranca la primera navegación al evaluarse, y
// el `loader` de `/en` necesita saber ya cómo descargar el diccionario inglés.
import "./i18n/diccionarios";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Pieza } from "./pages/Pieza";
import { RouteError } from "./pages/RouteError";
import { RequireAdmin } from "./components/admin/RequireAdmin";
import { ProveedorIdioma } from "./i18n/ProveedorIdioma";
import { Redirigir } from "./components/Enlace";
import { IDIOMA_BASE, cargarIdioma, cargarZonas } from "./i18n/motor";
import { esperarHojas } from "./lib/esperarHojas";

/**
 * Una página que se descarga al entrar en ella, no con el resto del sitio.
 *
 * El panel de administración y el área de cuenta son casi la mitad del código -- y
 * traen el editor de texto (TipTap), lo más pesado de todo --, pero sólo los usa la
 * redacción y quien tiene sesión. Antes iban en el mismo archivo que la portada, y cada
 * lector se descargaba el panel entero para leer una noticia. Con `lazy` del router cada
 * página va en su propio archivo y se pide la primera vez que alguien la abre.
 *
 * Con el código vienen sus textos: las zonas del diccionario que usa (`zonas`, en el
 * idioma de su rama), pedidas a la vez y antes de pintar, así que nunca se ve una clave
 * en lugar del texto. `npm run i18n` comprueba que cada página pida las que usa.
 *
 * Y sus estilos: si una hoja que la página necesita ya estaba pedida desde otra (la del
 * buscador, que la portada precarga) y sigue bajando, se espera a que llegue
 * (`esperarHojas`). Si no, la página se pintaría sin ella hasta entonces.
 */
const pagina = (cargar, nombre, { zonas = [], lang = IDIOMA_BASE } = {}) => async () => {
    const [modulo] = await Promise.all([cargar(), cargarZonas(lang, zonas)]);
    await esperarHojas();
    return { Component: modulo[nombre] };
};


/**
 * Las rutas públicas, con caminos relativos: se montan dos veces, en `/` (español) y en
 * `/en` (inglés), bajo un `ProveedorIdioma` cada una. Así una página existe en los dos
 * idiomas sin escribirla dos veces, y el idioma vive en la dirección, que es lo que
 * Google indexa. Ver `i18n/motor.js`.
 *
 * **Una ruta nueva aquí va también en `vercel.json`**, en la lista de las que van a
 * `/index.html`. Lo que no está en esa lista responde 404 desde el borde
 * (`api/no-encontrada.js`): la página se seguiría viendo, pero el buscador la olvidaría.
 * `npm run test:rutas` lo comprueba.
 *
 * Exportadas para las pruebas (`routes.pantalla.test.mjs`).
 */
export const rutasPublicas = (lang) => [
    // La puerta del boletín desde Instagram. Fuera de `Layout` a propósito: sin
    // cabecera ni menú, una sola cosa que hacer. Ver `features/boletin/Entorno.jsx`.
    { path: "entorno", lazy: pagina(() => import("./features/boletin/Entorno"), "Entorno", { zonas: ["boletin"], lang }), errorElement: <RouteError /> },
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
            { path: "suscribirse", lazy: pagina(() => import("./features/boletin/Subscribe"), "Subscribe", { zonas: ["boletin"], lang }) },
            // A donde apunta el enlace de baja de cada boletin. Sin sesion: el
            // token de la direccion es la unica credencial. Ver `BoletinBaja`.
            { path: "boletin/baja", lazy: pagina(() => import("./features/boletin/BoletinBaja"), "BoletinBaja", { zonas: ["boletin"], lang }) },
            { path: "quienes-somos", lazy: pagina(() => import("./pages/QuienesSomos"), "QuienesSomos", { zonas: ["paginas"], lang }) },
            { path: "articulos", lazy: pagina(() => import("./pages/Articulos"), "Articulos", { zonas: ["listados"], lang }) },
            { path: "informes", lazy: pagina(() => import("./pages/Informes"), "Informes", { zonas: ["listados"], lang }) },
            // «Al punto»: entrevistas y podcast juntos. Antes cada uno era un filtro de
            // /articulos; esas direcciones redirigen aquí (ver `Articulos`).
            { path: "audiovisual", lazy: pagina(() => import("./pages/Audiovisual"), "Audiovisual", { zonas: ["listados"], lang }) },
            { path: "explorar", lazy: pagina(() => import("./pages/Explorar"), "Explorar", { zonas: ["listados"], lang }) },
            // Cruza los seis formatos, como /explorar, pero por un valor de la pieza
            // en vez de por los filtros. De ahi su propia ruta y no un parametro mas.
            { path: "educacion", lazy: pagina(() => import("./pages/Educacion"), "Educacion", { zonas: ["educacion"], lang }) },
            // La pagina de venta del inventario. Publica y sin publicidad propia:
            // no declara ningun espacio, asi que no pide ninguno.
            { path: "anunciate", lazy: pagina(() => import("./pages/Anunciate"), "Anunciate", { zonas: ["paginas"], lang }) },
            // La vuelta del pago va ANTES que "/educacion/:slug": si fuera despues, la
            // ruta comodin se tragaria "pago" como si fuera el slug de un modulo.
            { path: "educacion/pago/volver", lazy: pagina(() => import("./pages/EducacionPagoVuelta"), "EducacionPagoVuelta", { zonas: ["educacion"], lang }) },
            { path: "educacion/:slug", lazy: pagina(() => import("./pages/EducacionModulo"), "EducacionModulo", { zonas: ["educacion"], lang }) },
            { path: "educacion/:slug/:leccionSlug", lazy: pagina(() => import("./pages/EducacionLeccion"), "EducacionLeccion", { zonas: ["educacion"], lang }) },
            // Everything published before the redesign lives at "articulo/<slug>".
            // Those addresses are indexed and shared, so they redirect to wherever
            // the piece sits now instead of 404ing. Same for "categoria/<slug>":
            // categories no longer exist, and the nearest thing a reader wanted is
            // the cross-format explorer. En su idioma (`Redirigir`): `/en/categoria/x`
            // iba a `/explorar` en español.
            { path: "articulo/:slug", lazy: pagina(() => import("./pages/PiezaRedirect"), "PiezaRedirect", { lang }) },
            { path: "categoria/:slug", element: <Redirigir to="/explorar" replace /> },
            // One detail page for all six formats; the format sits in the path so
            // the URL reads as what it is.
            { path: "noticias/:slug", element: <Pieza /> },
            { path: "articulos/:slug", element: <Pieza /> },
            { path: "editorial/:slug", element: <Pieza /> },
            { path: "entrevistas/:slug", element: <Pieza /> },
            { path: "informes/:slug", element: <Pieza /> },
            { path: "podcast/:slug", element: <Pieza /> },
            { path: "consultoria", lazy: pagina(() => import("./pages/Consultoria"), "Consultoria", { zonas: ["paginas"], lang }) },
            { path: "contacto", lazy: pagina(() => import("./pages/Contacto"), "Contacto", { zonas: ["paginas"], lang }) },
            { path: "cookies", lazy: pagina(() => import("./features/analitica/Cookies"), "Cookies", { zonas: ["paginas"], lang }) },
            // Todos los juegos del sitio, una tarjeta por juego. A ella lleva el botón
            // «Juegos» de la cabecera.
            { path: "juegos", lazy: pagina(() => import("./pages/Juegos"), "Juegos", { zonas: ["juegos"], lang }) },
            // El juego se descarga al abrir la página, no con el resto del sitio.
            { path: "pausa", lazy: pagina(() => import("./pages/Pausa"), "Pausa", { zonas: ["juegos"], lang }) },
            { path: "clave", lazy: pagina(() => import("./pages/Clave"), "ClavePage", { zonas: ["juegos"], lang }) },
            // El béisbol venezolano: juegos, marcadores y tabla. Carga perezosa, como los juegos.
            { path: "lvbp", lazy: pagina(() => import("./pages/Lvbp"), "Lvbp", { zonas: ["lvbp"], lang }) },
            // Las monedas de la región: cuánto vale un dólar en cada una, según su banco central.
            { path: "monedas", lazy: pagina(() => import("./features/monedas/Monedas"), "Monedas", { zonas: ["monedas"], lang }) },
            // Los titulares en caliente: título, resumen y su fuente, cada 10 minutos.
            { path: "ultima-hora", lazy: pagina(() => import("./features/titulares/UltimaHora"), "UltimaHora", { zonas: ["titulares"], lang }) },
            // El resumen diario, en tres ediciones: la última, las de un día o una (adonde
            // llevan Telegram y WhatsApp).
            { path: "resumen", lazy: pagina(() => import("./pages/Resumen"), "Resumen", { zonas: ["resumen"], lang }) },
            { path: "resumen/:fecha", lazy: pagina(() => import("./pages/Resumen"), "Resumen", { zonas: ["resumen"], lang }) },
            { path: "resumen/:fecha/:edicion", lazy: pagina(() => import("./pages/Resumen"), "Resumen", { zonas: ["resumen"], lang }) },
            // La vieja puerta del equipo. En su idioma (`Redirigir`): `/en/backoffice` iba a
            // `/cuenta/entrar` en español.
            { path: "backoffice", element: <Redirigir to="/cuenta/entrar" replace /> },
            { path: "cuenta/entrar", lazy: pagina(() => import("./features/cuenta/pages/CuentaEntrar"), "CuentaEntrar", { zonas: ["cuenta"], lang }) },
            { path: "cuenta/registro", lazy: pagina(() => import("./features/cuenta/pages/CuentaRegistro"), "CuentaRegistro", { zonas: ["cuenta"], lang }) },
            { path: "cuenta/verificar-email", lazy: pagina(() => import("./features/cuenta/pages/CuentaVerificarEmail"), "CuentaVerificarEmail", { zonas: ["cuenta"], lang }) },
            { path: "cuenta/solicitar-codigo", lazy: pagina(() => import("./features/cuenta/pages/CuentaSolicitarCodigo"), "CuentaSolicitarCodigo", { zonas: ["cuenta"], lang }) },
            // «¿Olvidó su contraseña?»: código por correo y contraseña nueva (equipo y lectores).
            { path: "cuenta/recuperar", lazy: pagina(() => import("./features/cuenta/pages/CuentaRecuperar"), "CuentaRecuperar", { zonas: ["cuenta"], lang }) },
            // La 404 también se descarga al llegar a ella (y con ella, su juego).
            { path: "*", lazy: pagina(() => import("./pages/NotFound"), "NotFound", { zonas: ["juegos"], lang }) },
        ],
    },
    {
        path: "cuenta",
        lazy: pagina(() => import("./features/cuenta/pages/CuentaDashboardLayout"), "CuentaDashboardLayout", { zonas: ["cuenta"], lang }),
        children: [
            { index: true, lazy: pagina(() => import("./features/cuenta/pages/CuentaDashboardHome"), "CuentaDashboardHome", { zonas: ["cuenta"], lang }) },
            { path: "perfil", lazy: pagina(() => import("./features/cuenta/pages/CuentaPerfil"), "CuentaPerfil", { zonas: ["cuenta"], lang }) },
            { path: "lo-mio", lazy: pagina(() => import("./features/cuenta/pages/CuentaLoMio"), "CuentaLoMio", { zonas: ["cuenta", "educacion"], lang }) },
            { path: "marcadores", lazy: pagina(() => import("./features/cuenta/pages/CuentaMarcadores"), "CuentaMarcadores", { zonas: ["cuenta"], lang }) },
            // Los temas que sigue y lo nuevo de ellos («Siga este tema»).
            { path: "temas", lazy: pagina(() => import("./features/cuenta/pages/CuentaTemas"), "CuentaTemas", { zonas: ["cuenta"], lang }) },
            { path: "envios", lazy: pagina(() => import("./features/cuenta/pages/CuentaEnviosList"), "CuentaEnviosList", { zonas: ["cuenta"], lang }) },
            { path: "envios/nuevo", lazy: pagina(() => import("./features/cuenta/pages/CuentaEnviosNuevo"), "CuentaEnviosNuevo", { zonas: ["cuenta"], lang }) },
            { path: "envios/:id/editar", lazy: pagina(() => import("./features/cuenta/pages/CuentaEnvioEditar"), "CuentaEnvioEditar", { zonas: ["cuenta"], lang }) },
            { path: "envios/:id", lazy: pagina(() => import("./features/cuenta/pages/CuentaEnvioDetail"), "CuentaEnvioDetail", { zonas: ["cuenta"], lang }) },
        ],
    },
];

export const router = createBrowserRouter([
    { path: "/", element: <ProveedorIdioma lang="es" />, errorElement: <RouteError />, children: rutasPublicas("es") },
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
        children: rutasPublicas("en"),
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
                    { path: "posts/new", lazy: pagina(() => import("./pages/admin/AdminPostEditor"), "AdminPostEditor", { zonas: ["cuenta"] }) },
                    { path: "posts/:postId", lazy: pagina(() => import("./pages/admin/AdminPostEditor"), "AdminPostEditor", { zonas: ["cuenta"] }) },
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
                    // El canal de YouTube de la casa: «En la calle» y «Nuestro canal».
                    { path: "canal", lazy: pagina(() => import("./pages/admin/AdminCanal"), "AdminCanal") },
                    // La vuelta de TikTok tras dar permiso: es la Redirect URI de Login Kit,
                    // así que la dirección no puede cambiar sin cambiarla también allí.
                    { path: "redes/tiktok", lazy: pagina(() => import("./pages/admin/AdminRedesTikTok"), "AdminRedesTikTok") },
                    { path: "educacion", lazy: pagina(() => import("./pages/admin/AdminEducacion"), "AdminEducacion", { zonas: ["cuenta"] }) },
                    { path: "publicidad", lazy: pagina(() => import("./features/publicidad/admin/AdminPublicidad"), "AdminPublicidad") },
                    { path: "analitica", lazy: pagina(() => import("./features/analitica/admin/AdminAnalitica"), "AdminAnalitica") },
                    { path: "comments", lazy: pagina(() => import("./pages/admin/AdminCommentsList"), "AdminCommentsList") },
                    { path: "analista", lazy: pagina(() => import("./pages/admin/AdminAnalista"), "AdminAnalista") },
                    // El catálogo de La Clave: las palabras de las que sale la del día.
                    { path: "juegos/palabras", lazy: pagina(() => import("./pages/admin/AdminJuegoPalabras"), "AdminJuegoPalabras") },
                    // Los juegos de la LVBP: cargar a mano lo que la API no da, corregir, sincronizar.
                    { path: "lvbp", lazy: pagina(() => import("./pages/admin/AdminLvbp"), "AdminLvbp") },
                    // Traducir al inglés, en lote, las piezas publicadas que no lo tienen.
                    { path: "traducciones", lazy: pagina(() => import("./pages/admin/AdminTraducciones"), "AdminTraducciones") },
                    { path: "titulares", lazy: pagina(() => import("./features/titulares/admin/AdminTitulares"), "AdminTitulares") },
                    // Lo que la redacción debería mirar hoy: los avisos y lo que se avisaría ahora.
                    { path: "avisos", lazy: pagina(() => import("./pages/admin/AdminAvisos"), "AdminAvisos") },
                    { path: "resumen", lazy: pagina(() => import("./pages/admin/AdminResumen"), "AdminResumen") },
                    { path: "boletin", lazy: pagina(() => import("./features/boletin/admin/AdminNewsletterList"), "AdminNewsletterList") },
                    // Los numeros de "Entorno en Viñetas". La lista de suscriptores se
                    // queda en `boletin`, donde ya la buscaba la redaccion.
                    { path: "boletin/numeros", lazy: pagina(() => import("./features/boletin/admin/AdminBoletin"), "AdminBoletin", { zonas: ["cuenta"] }) },
                    { path: "submissions", lazy: pagina(() => import("./pages/admin/AdminSubmissionsList"), "AdminSubmissionsList", { zonas: ["cuenta"] }) },
                    { path: "submissions/:id", lazy: pagina(() => import("./pages/admin/AdminSubmissionDetail"), "AdminSubmissionDetail", { zonas: ["cuenta"] }) },
                    // Era una página con una sola casilla; ahora es un interruptor en Propuestas.
                    { path: "settings/collaboration", element: <Navigate to="/admin/submissions" replace /> },
                    { path: "users", lazy: pagina(() => import("./pages/admin/AdminUsersList"), "AdminUsersList") },
                    { path: "users/:id", lazy: pagina(() => import("./pages/admin/AdminUserDetail"), "AdminUserDetail", { zonas: ["cuenta"] }) },
                    { path: "staff", lazy: pagina(() => import("./pages/admin/AdminStaffList"), "AdminStaffList") },
                    { path: "perfil", lazy: pagina(() => import("./pages/admin/AdminMiPerfil"), "AdminMiPerfil") },
                ],
            },
        ],
    },
], {
    // El paso a React Router 7, uno a uno (ver su guía «Upgrading from v6»): cada
    // opción enciende ya en la 6 algo que en la 7 es lo normal.
    future: {
        // Un enlace relativo (`to="."`, `to="../x"`) dentro de una ruta `*` se resuelve
        // desde la dirección entera, no desde el padre. Aquí no hay ninguno.
        v7_relativeSplatPath: true,
        // Los «fetchers» (useFetcher) se quedan vivos hasta que terminan aunque el
        // componente que los creó desaparezca. Aquí no se usa ninguno.
        v7_fetcherPersist: true,
        // useNavigation().formMethod en mayúsculas ("POST"). Solo se lee su .state
        // (el aviso «Abriendo…» del panel), que no cambia.
        v7_normalizeFormMethod: true,
        // Cómo arranca el router cuando la primera página aún espera algo (el
        // diccionario de /en, el código de una página perezosa). main.jsx monta React
        // solo con router.state.initialized, que sigue llegando igual.
        v7_partialHydration: true,
        // Tras una «action» que falla, no se vuelven a pedir los datos de la página.
        // El sitio no tiene «actions»: los formularios llaman a la API ellos mismos.
        v7_skipActionErrorRevalidation: true,
    },
});
