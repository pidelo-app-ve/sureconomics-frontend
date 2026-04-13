import { useAuth } from "../../context/AuthContext";

export const AdminDashboard = () => {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <main className="se-blog se-admin-shell" role="main">
            <div className="se-container">
                <header className="se-admin-shell__header">
                    <h1 className="se-heading-section">Panel</h1>
                    <button
                        type="button"
                        className="se-btn se-btn--secondary"
                        onClick={handleLogout}
                    >
                        Cerrar sesión
                    </button>
                </header>
                <p className="se-text-body">El contenido del panel se añadirá aquí.</p>
            </div>
        </main>
    );
};
