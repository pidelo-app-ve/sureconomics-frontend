import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Subscribe } from "./pages/Subscribe";
import { QuienesSomos } from "./pages/QuienesSomos";
import { Articulos } from "./pages/Articulos";
import { Informes } from "./pages/Informes";
import { Pieza } from "./pages/Pieza";
import { PiezaRedirect } from "./pages/PiezaRedirect";
import { Explorar } from "./pages/Explorar";
import { Consultoria } from "./pages/Consultoria";
import { Contacto } from "./pages/Contacto";
import { NotFound } from "./pages/NotFound";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminPostsList } from "./pages/admin/AdminPostsList";
import { AdminPostEditor } from "./pages/admin/AdminPostEditor";
import { AdminTopicsList } from "./pages/admin/AdminTopicsList";
import { AdminPlacesList } from "./pages/admin/AdminPlacesList";
import { AdminMediaLibrary } from "./pages/admin/AdminMediaLibrary";
import { AdminMarketTicker } from "./pages/admin/AdminMarketTicker";
import { AdminCommentsList } from "./pages/admin/AdminCommentsList";
import { AdminSubmissionsList } from "./pages/admin/AdminSubmissionsList";
import { AdminSubmissionDetail } from "./pages/admin/AdminSubmissionDetail";
import { AdminCollaborationSettings } from "./pages/admin/AdminCollaborationSettings";
import { AdminUsersList } from "./pages/admin/AdminUsersList";
import { AdminUserDetail } from "./pages/admin/AdminUserDetail";
import { AdminStaffList } from "./pages/admin/AdminStaffList";
import { AdminMiPerfil } from "./pages/admin/AdminMiPerfil";
import { RequireAdmin } from "./components/admin/RequireAdmin";
import { CuentaEntrar } from "./pages/cuenta/CuentaEntrar";
import { CuentaRegistro } from "./pages/cuenta/CuentaRegistro";
import { CuentaVerificarEmail } from "./pages/cuenta/CuentaVerificarEmail";
import { CuentaSolicitarCodigo } from "./pages/cuenta/CuentaSolicitarCodigo";
import { CuentaDashboardLayout } from "./pages/cuenta/CuentaDashboardLayout";
import { CuentaDashboardHome } from "./pages/cuenta/CuentaDashboardHome";
import { CuentaPerfil } from "./pages/cuenta/CuentaPerfil";
import { CuentaMarcadores } from "./pages/cuenta/CuentaMarcadores";
import { CuentaEnviosList } from "./pages/cuenta/CuentaEnviosList";
import { CuentaEnviosNuevo } from "./pages/cuenta/CuentaEnviosNuevo";
import { CuentaEnvioDetail } from "./pages/cuenta/CuentaEnvioDetail";
import { CuentaEnvioEditar } from "./pages/cuenta/CuentaEnvioEditar";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        errorElement: <NotFound />,
        children: [
            { index: true, element: <Home /> },
            { path: "suscribirse", element: <Subscribe /> },
            { path: "quienes-somos", element: <QuienesSomos /> },
            { path: "articulos", element: <Articulos /> },
            { path: "informes", element: <Informes /> },
            { path: "explorar", element: <Explorar /> },
            // Everything published before the redesign lives at "articulo/<slug>".
            // Those addresses are indexed and shared, so they redirect to wherever
            // the piece sits now instead of 404ing. Same for "categoria/<slug>":
            // categories no longer exist, and the nearest thing a reader wanted is
            // the cross-format explorer.
            { path: "articulo/:slug", element: <PiezaRedirect /> },
            { path: "categoria/:slug", element: <Navigate to="/explorar" replace /> },
            // One detail page for all five formats; the format sits in the path so
            // the URL reads as what it is.
            { path: "noticias/:slug", element: <Pieza /> },
            { path: "articulos/:slug", element: <Pieza /> },
            { path: "editorial/:slug", element: <Pieza /> },
            { path: "entrevistas/:slug", element: <Pieza /> },
            { path: "informes/:slug", element: <Pieza /> },
            { path: "consultoria", element: <Consultoria /> },
            { path: "contacto", element: <Contacto /> },
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
        element: <CuentaDashboardLayout />,
        children: [
            { index: true, element: <CuentaDashboardHome /> },
            { path: "perfil", element: <CuentaPerfil /> },
            { path: "marcadores", element: <CuentaMarcadores /> },
            { path: "envios", element: <CuentaEnviosList /> },
            { path: "envios/nuevo", element: <CuentaEnviosNuevo /> },
            { path: "envios/:id/editar", element: <CuentaEnvioEditar /> },
            { path: "envios/:id", element: <CuentaEnvioDetail /> },
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
                element: <AdminLayout />,
                children: [
                    { index: true, element: <Navigate to="posts" replace /> },
                    { path: "posts", element: <AdminPostsList /> },
                    { path: "posts/new", element: <AdminPostEditor /> },
                    { path: "posts/:postId", element: <AdminPostEditor /> },
                    // The two axes. Neither has a create route: topics are a
                    // closed list of fourteen and places only grow by country,
                    // which the Lugares screen does inline.
                    { path: "topics", element: <AdminTopicsList /> },
                    { path: "places", element: <AdminPlacesList /> },
                    { path: "media", element: <AdminMediaLibrary /> },
                    { path: "cinta", element: <AdminMarketTicker /> },
                    { path: "comments", element: <AdminCommentsList /> },
                    { path: "submissions", element: <AdminSubmissionsList /> },
                    { path: "submissions/:id", element: <AdminSubmissionDetail /> },
                    { path: "settings/collaboration", element: <AdminCollaborationSettings /> },
                    { path: "users", element: <AdminUsersList /> },
                    { path: "users/:id", element: <AdminUserDetail /> },
                    { path: "staff", element: <AdminStaffList /> },
                    { path: "perfil", element: <AdminMiPerfil /> },
                ],
            },
        ],
    },
]);
