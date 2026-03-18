import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/blog.css'
import { RouterProvider } from "react-router-dom";  // Import RouterProvider to use the router
import { router } from "./routes";  // Import the router configuration test
import { StoreProvider } from './hooks/useGlobalReducer';  // Import the StoreProvider for global state management
import { LanguageProvider } from "./i18n/LanguageProvider";

const Main = () => {
    return (
        <React.StrictMode>  
            {/* Provide global state to all components */}
            <LanguageProvider>
              <StoreProvider> 
                  {/* Set up routing for the application */}
                  <RouterProvider router={router}>
                  </RouterProvider>
              </StoreProvider>
            </LanguageProvider>
        </React.StrictMode>
    );
}

// Render the Main component into the root DOM element.
ReactDOM.createRoot(document.getElementById('root')).render(<Main />)
