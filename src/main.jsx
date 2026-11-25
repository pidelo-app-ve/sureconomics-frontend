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
import { UserAuthProvider } from "./features/cuenta";
import { ProveedorDeMarcadores } from "./context/MarcadoresContext";
import { ProveedorDeTemasSeguidos } from "./context/TemasSeguidosContext";

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
                        <ProveedorDeTemasSeguidos>
                            <RouterProvider router={router} />
                        </ProveedorDeTemasSeguidos>
                    </ProveedorDeMarcadores>
                </UserAuthProvider>
            </AuthProvider>
        </React.StrictMode>
    );
}

// Render the Main component into the root DOM element.
const montar = () => ReactDOM.createRoot(document.getElementById('root')).render(<Main />)

// La portada y las piezas llegan con lo de arriba ya pintado dentro de `#root`
// (`api/portada.js`, `api/pieza.js`), y React lo reemplaza al montar. En `/en` la primera
// navegación espera antes al diccionario inglés (el `loader` de `routes.jsx`), y mientras
// tanto el router no pinta nada: montar enseguida dejaba la página en blanco medio segundo
// entre lo del HTML y la página (medido en la portada con el teléfono del laboratorio). Se
// monta cuando el router ya sabe qué pintar; en español eso es enseguida.
if (router.state.initialized) {
    montar()
} else {
    const dejar = router.subscribe((estado) => {
        if (!estado.initialized) return
        dejar()
        montar()
    })
}
