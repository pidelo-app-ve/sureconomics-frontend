import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/fuentes.css'
import './index.css'
import './styles/blog.css'
import './styles/accesibilidad.css'
import { RouterProvider } from "react-router-dom";  // Import RouterProvider to use the router
import { router } from "./routes";  // Import the router configuration test
// Registra el diccionario en español y deja preparado el inglés. Ver `i18n/motor.js`.
import "./i18n/diccionarios";
import { AuthProvider } from "./context/AuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import { ProveedorDeMarcadores } from "./context/MarcadoresContext";

import { recargarUnaVez } from "./lib/recargaTrasDespliegue";

// Vite avisa así cuando no puede precargar un trozo de código: casi siempre, una pestaña
// abierta desde antes del último despliegue. Recargar trae la versión nueva. Ver
// `lib/recargaTrasDespliegue.js`.
window.addEventListener("vite:preloadError", (evento) => {
    if (recargarUnaVez()) evento.preventDefault();
});

const Main = () => {
    return (
        <React.StrictMode>
            <AuthProvider>
                <UserAuthProvider>
                    <ProveedorDeMarcadores>
                        <RouterProvider router={router} />
                    </ProveedorDeMarcadores>
                </UserAuthProvider>
            </AuthProvider>
        </React.StrictMode>
    );
}

// Render the Main component into the root DOM element.
ReactDOM.createRoot(document.getElementById('root')).render(<Main />)
