import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";
import { USER_AUTH_SYNC_EVENT, dispatchUserAuthSync, refreshUserTokens } from "../lib/userApi";
import { clearUserAuth, persistUserAuth, readUserAuth } from "../lib/userAuthStorage";
import * as userAuthService from "../services/userAuthService";

const UserAuthContext = createContext(null);

export const UserAuthProvider = ({ children }) => {
  const [tokensSnapshot, setTokensSnapshot] = useState(() => readUserAuth());
  const [profile, setProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState("idle");

  useEffect(() => {
    const onSync = () => setTokensSnapshot(readUserAuth());
    window.addEventListener(USER_AUTH_SYNC_EVENT, onSync);
    return () => window.removeEventListener(USER_AUTH_SYNC_EVENT, onSync);
  }, []);

  const isAuthenticated = Boolean(tokensSnapshot.accessToken);

  const loadProfile = useCallback(async () => {
    if (!readUserAuth().accessToken) {
      setProfile(null);
      setProfileStatus("idle");
      return null;
    }
    setProfileStatus("loading");
    try {
      const me = await userAuthService.fetchMe();
      setProfile(me);
      setProfileStatus("success");
      return me;
    } catch (err) {
      setProfile(null);
      const status = err?.status;
      if (status === 403 || status === 401) {
        setProfileStatus("unverified");
      } else {
        setProfileStatus("error");
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    if (readUserAuth().accessToken) {
      loadProfile().catch(() => {});
    }
  }, [loadProfile]);

  const persistFromTokenResponse = useCallback((tokens) => {
    if (!tokens?.accessToken || !tokens?.refreshToken) return;
    persistUserAuth({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
    dispatchUserAuthSync();
    setTokensSnapshot(readUserAuth());
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { tokens } = await userAuthService.loginUser(email, password);
      if (!tokens?.accessToken) {
        const err = new Error("Respuesta de inicio de sesión inválida");
        err.status = 401;
        throw err;
      }
      persistFromTokenResponse(tokens);
      try {
        const me = await loadProfile();
        return { profile: me };
      } catch (err) {
        return { profile: null, error: err };
      }
    },
    [loadProfile, persistFromTokenResponse]
  );

  const register = useCallback(
    async (payload) => {
      const { tokens, user } = await userAuthService.registerUser(payload);
      if (tokens?.accessToken) {
        persistFromTokenResponse(tokens);
        try {
          const me = await loadProfile();
          return { profile: me, tokens };
        } catch (err) {
          return { profile: user ?? null, error: err, tokens };
        }
      }
      return { profile: user ?? null, tokens: null };
    },
    [loadProfile, persistFromTokenResponse]
  );

  const logout = useCallback(async () => {
    await userAuthService.logoutUserRemote();
    clearUserAuth();
    dispatchUserAuthSync();
    setTokensSnapshot(readUserAuth());
    setProfile(null);
    setProfileStatus("idle");
  }, []);

  const refreshSession = useCallback(async () => {
    await refreshUserTokens();
    setTokensSnapshot(readUserAuth());
    return loadProfile();
  }, [loadProfile]);

  const isEmailVerified = Boolean(profile?.isEmailVerified);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isEmailVerified,
      profile,
      profileStatus,
      login,
      register,
      logout,
      loadProfile,
      refreshSession,
    }),
    [
      isAuthenticated,
      isEmailVerified,
      profile,
      profileStatus,
      login,
      register,
      logout,
      loadProfile,
      refreshSession,
    ]
  );

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
};

UserAuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useUserAuth = () => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) {
    throw new Error("useUserAuth must be used within UserAuthProvider");
  }
  return ctx;
};
