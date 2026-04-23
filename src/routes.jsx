import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Article } from "./pages/Article";
import { Category } from "./pages/Category";
import { Subscribe } from "./pages/Subscribe";
import { QuienesSomos } from "./pages/QuienesSomos";
import { Articulos } from "./pages/Articulos";
import { Informes } from "./pages/Informes";
import { Consultoria } from "./pages/Consultoria";
import { Contacto } from "./pages/Contacto";
import { NotFound } from "./pages/NotFound";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminPostsList } from "./pages/admin/AdminPostsList";
import { AdminPostEditor } from "./pages/admin/AdminPostEditor";
import { AdminCategoriesList } from "./pages/admin/AdminCategoriesList";
import { AdminCategoryEditor } from "./pages/admin/AdminCategoryEditor";
import { AdminTagsList } from "./pages/admin/AdminTagsList";
import { AdminTagEditor } from "./pages/admin/AdminTagEditor";
import { AdminHeadlinesList } from "./pages/admin/AdminHeadlinesList";
import { AdminHeadlineEditor } from "./pages/admin/AdminHeadlineEditor";
import { AdminCommentsList } from "./pages/admin/AdminCommentsList";
import { AdminSubmissionsList } from "./pages/admin/AdminSubmissionsList";
import { AdminSubmissionDetail } from "./pages/admin/AdminSubmissionDetail";
import { AdminCollaborationSettings } from "./pages/admin/AdminCollaborationSettings";
import { AdminUsersList } from "./pages/admin/AdminUsersList";
import { AdminUserDetail } from "./pages/admin/AdminUserDetail";
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
            { path: "articulo/:slug", element: <Article /> },
            { path: "categoria/:slug", element: <Category /> },
            { path: "suscribirse", element: <Subscribe /> },
            { path: "quienes-somos", element: <QuienesSomos /> },
            { path: "articulos", element: <Articulos /> },
            { path: "informes", element: <Informes /> },
            { path: "consultoria", element: <Consultoria /> },
            { path: "contacto", element: <Contacto /> },
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
        element: <AdminLogin />,
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
                    { path: "categories", element: <AdminCategoriesList /> },
                    { path: "categories/new", element: <AdminCategoryEditor /> },
                    { path: "categories/:id", element: <AdminCategoryEditor /> },
                    { path: "tags", element: <AdminTagsList /> },
                    { path: "tags/new", element: <AdminTagEditor /> },
                    { path: "tags/:id", element: <AdminTagEditor /> },
                    { path: "headlines", element: <AdminHeadlinesList /> },
                    { path: "headlines/new", element: <AdminHeadlineEditor /> },
                    { path: "headlines/:id", element: <AdminHeadlineEditor /> },
                    { path: "comments", element: <AdminCommentsList /> },
                    { path: "submissions", element: <AdminSubmissionsList /> },
                    { path: "submissions/:id", element: <AdminSubmissionDetail /> },
                    { path: "settings/collaboration", element: <AdminCollaborationSettings /> },
                    { path: "users", element: <AdminUsersList /> },
                    { path: "users/:id", element: <AdminUserDetail /> },
                ],
            },
        ],
    },
]);
