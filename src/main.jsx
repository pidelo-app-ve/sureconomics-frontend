import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/blog.css'
import './styles/accesibilidad.css'
import { RouterProvider } from "react-router-dom";  // Import RouterProvider to use the router
import { router } from "./routes";  // Import the router configuration test
import { StoreProvider } from './hooks/useGlobalReducer';  // Import the StoreProvider for global state management
// Registra el diccionario en español y deja preparado el inglés. Ver `i18n/motor.js`.
import "./i18n/diccionarios";
import { AuthProvider } from "./context/AuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import { ProveedorDeMarcadores } from "./context/MarcadoresContext";

const Main = () => {
    return (
        <React.StrictMode>  
            {/* Provide global state to all components */}
              <StoreProvider> 
                  <AuthProvider>
                    <UserAuthProvider>
                        <ProveedorDeMarcadores>
                      <RouterProvider router={router} />
                    </ProveedorDeMarcadores>
                    </UserAuthProvider>
                  </AuthProvider>
              </StoreProvider>
        </React.StrictMode>
    );
}

// Render the Main component into the root DOM element.
ReactDOM.createRoot(document.getElementById('root')).render(<Main />)
