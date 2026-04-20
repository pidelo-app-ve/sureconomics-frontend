import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import 'flag-icons/css/flag-icons.min.css'
import './styles/blog.css'
import { RouterProvider } from "react-router-dom";  // Import RouterProvider to use the router
import { router } from "./routes";  // Import the router configuration test
import { StoreProvider } from './hooks/useGlobalReducer';  // Import the StoreProvider for global state management
import { LanguageProvider } from "./i18n/LanguageProvider";
import { AuthProvider } from "./context/AuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";

const Main = () => {
    return (
        <React.StrictMode>  
            {/* Provide global state to all components */}
            <LanguageProvider>
              <StoreProvider> 
                  <AuthProvider>
                    <UserAuthProvider>
                      <RouterProvider router={router} />
                    </UserAuthProvider>
                  </AuthProvider>
              </StoreProvider>
            </LanguageProvider>
        </React.StrictMode>
    );
}

// Render the Main component into the root DOM element.
ReactDOM.createRoot(document.getElementById('root')).render(<Main />)
