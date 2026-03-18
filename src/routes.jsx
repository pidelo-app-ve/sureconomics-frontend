// Import necessary components and functions from react-router-dom.

import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { Article } from "./pages/Article";
import { Category } from "./pages/Category";
import { Subscribe } from "./pages/Subscribe";
import { QuienesSomos } from "./pages/QuienesSomos";
import { Articulos } from "./pages/Articulos";
import { Informes } from "./pages/Informes";
import { Consultoria } from "./pages/Consultoria";
import { Contacto } from "./pages/Contacto";

export const router = createBrowserRouter(
    createRoutesFromElements(
    // CreateRoutesFromElements function allows you to build route elements declaratively.
    // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
    // Root, on the contrary, create a sister Route, if you have doubts, try it!
    // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
    // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.

      // Root Route: All navigation will start from here.
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

        {/* Nested Routes: Defines sub-routes within the BaseHome component. */}
        <Route path="/" element={<Home />} />
        <Route path="/articulo/:slug" element={<Article />} />
        <Route path="/categoria/:slug" element={<Category />} />
        <Route path="/suscribirse" element={<Subscribe />} />
        <Route path="/quienes-somos" element={<QuienesSomos />} />
        <Route path="/articulos" element={<Articulos />} />
        <Route path="/informes" element={<Informes />} />
        <Route path="/consultoria" element={<Consultoria />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/single/:theId" element={<Single />} />
        <Route path="/demo" element={<Demo />} />
      </Route>
    )
);