import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import PropTypes from "prop-types";
import { loginAdmin as loginApi } from "../lib/api";
import {
    clearStoredAuth,
    persistAuth,
    readStoredAuth,
} from "../lib/authStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(() => readStoredAuth());

    const login = useCallback(async (email, password) => {
        const data = await loginApi(email, password);
        persistAuth({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
        });
        setAuth(readStoredAuth());
        return data;
    }, []);

    const logout = useCallback(() => {
        clearStoredAuth();
        setAuth({
            accessToken: null,
            refreshToken: null,
            accessExpiresAt: null,
        });
    }, []);

    const value = useMemo(
        () => ({
            accessToken: auth.accessToken,
            refreshToken: auth.refreshToken,
            accessExpiresAt: auth.accessExpiresAt,
            isAuthenticated: Boolean(auth.accessToken),
            login,
            logout,
        }),
        [auth, login, logout]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
};
