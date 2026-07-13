import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import PropTypes from "prop-types";
import { ADMIN_AUTH_SYNC_EVENT, loginAdmin as loginApi, registerAdmin as registerApi } from "../lib/api";
import {
    clearStoredAuth,
    persistAuth,
    readStoredAuth,
} from "../lib/authStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(() => readStoredAuth());

    useEffect(() => {
        const syncFromStorage = () => {
            setAuth(readStoredAuth());
        };
        window.addEventListener(ADMIN_AUTH_SYNC_EVENT, syncFromStorage);
        return () => window.removeEventListener(ADMIN_AUTH_SYNC_EVENT, syncFromStorage);
    }, []);

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

    const register = useCallback(async (email, password, name) => {
        const data = await registerApi(email, password, name);
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

    const getAccessToken = useCallback(() => readStoredAuth().accessToken, []);
    const getRefreshToken = useCallback(() => readStoredAuth().refreshToken, []);

    const value = useMemo(
        () => ({
            accessToken: auth.accessToken,
            refreshToken: auth.refreshToken,
            accessExpiresAt: auth.accessExpiresAt,
            isAuthenticated: Boolean(auth.accessToken),
            getAccessToken,
            getRefreshToken,
            login,
            register,
            logout,
        }),
        [auth, getAccessToken, getRefreshToken, login, register, logout]
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
