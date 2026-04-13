import { createBrowserRouter } from "react-router-dom";
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
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { RequireAdmin } from "./components/admin/RequireAdmin";

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
            { path: "*", element: <NotFound /> },
        ],
    },
    {
        path: "/admin/login",
        element: <AdminLogin />,
    },
    {
        path: "/admin",
        element: <RequireAdmin />,
        children: [{ index: true, element: <AdminDashboard /> }],
    },
]);
