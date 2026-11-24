import { translate } from "../i18n";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  authStatus,
  authMe,
  authLogout,
  authLogin,
  authRegister,
  isAxiosError,
  startOidcSignOut,
} from "../api";
import { toast } from "sonner";
import {
  clearOidcAutoLoginSuppression,
  suppressOidcAutoLogin,
} from "../utils/oidcLogout";
import { setDrawingCacheAccount } from "../utils/drawingCacheAccount";

export interface User {
  id: string;
  username?: string | null;
  email: string;
  name: string;
  role?: "ADMIN" | "USER" | string;
  mustResetPassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  sessionGeneration: number;
  loading: boolean;
  authEnabled: boolean | null;
  registrationEnabled: boolean;
  authStatusError: string | null;
  authMode: "local" | "hybrid" | "oidc_enforced";
  oidcEnabled: boolean;
  oidcEnforced: boolean;
  oidcProvider: string | null;
  bootstrapRequired: boolean;
  authOnboardingRequired: boolean;
  authOnboardingMode: "migration" | "fresh" | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    setupCode?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  retryAuthStatus: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = "excalidash-user";
const SESSION_CHANGE_KEY = "excalidash-session-change";
const AUTH_ENABLED_CACHE_KEY = "excalidash-auth-enabled";

const identityOf = (user: User | null) =>
  user?.id ?? null;

const storedIdentity = (value: string | null) => {
  try {
    return identityOf(value ? JSON.parse(value) : null);
  } catch {
    return identityOf(null);
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const currentUser = useRef<User | null>(null);
  const authRequestVersion = useRef(0);
  const [sessionGeneration, setSessionGeneration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [authStatusError, setAuthStatusError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<
    "local" | "hybrid" | "oidc_enforced"
  >("local");
  const [oidcEnabled, setOidcEnabled] = useState(false);
  const [oidcEnforced, setOidcEnforced] = useState(false);
  const [oidcProvider, setOidcProvider] = useState<string | null>(null);
  const [bootstrapRequired, setBootstrapRequired] = useState(false);
  const [authOnboardingRequired, setAuthOnboardingRequired] = useState(false);
  const [authOnboardingMode, setAuthOnboardingMode] = useState<
    "migration" | "fresh" | null
  >(null);
  const navigate = useNavigate();

  const resetSessionCaches = useCallback((userId: string | null) => {
    setDrawingCacheAccount(userId, true);
    setSessionGeneration((previous) => previous + 1);
  }, []);

  const applyUser = useCallback(
    (next: User | null, newSession = false) => {
      if (newSession || identityOf(currentUser.current) !== identityOf(next)) {
        resetSessionCaches(next?.id ?? null);
      }
      currentUser.current = next;
      setUser(next);
    },
    [resetSessionCaches],
  );

  const completeAuthChange = useCallback(
    (next: User | null) => {
      authRequestVersion.current++;
      applyUser(next, true);
      setLoading(false);
      if (next) {
        localStorage.setItem(USER_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(USER_KEY);
      }
      // A login to the same account can leave the stored user JSON unchanged.
      localStorage.setItem(
        SESSION_CHANGE_KEY,
        String(crypto.getRandomValues(new Uint32Array(1))[0]),
      );
    },
    [applyUser],
  );

  const loadUser = useCallback(async () => {
    const request = ++authRequestVersion.current;
    const isCurrent = () => request === authRequestVersion.current;
    setLoading(true);
    try {
      try {
        const statusResponse = await authStatus();
        if (!isCurrent()) return;
        setAuthStatusError(null);
        const enabled =
          typeof statusResponse?.authEnabled === "boolean"
            ? statusResponse.authEnabled
            : typeof statusResponse?.enabled === "boolean"
              ? statusResponse.enabled
              : true;
        setAuthEnabled(enabled);
        localStorage.setItem(AUTH_ENABLED_CACHE_KEY, String(enabled));
        setRegistrationEnabled(Boolean(statusResponse?.registrationEnabled));
        const nextAuthMode =
          statusResponse?.authMode === "hybrid" ||
          statusResponse?.authMode === "oidc_enforced"
            ? statusResponse.authMode
            : "local";
        setAuthMode(nextAuthMode);
        setOidcEnabled(Boolean(statusResponse?.oidcEnabled));
        setOidcEnforced(Boolean(statusResponse?.oidcEnforced));
        setOidcProvider(
          typeof statusResponse?.oidcProvider === "string"
            ? statusResponse.oidcProvider
            : null,
        );
        setBootstrapRequired(Boolean(statusResponse?.bootstrapRequired));
        setAuthOnboardingRequired(
          Boolean(statusResponse?.authOnboardingRequired),
        );
        setAuthOnboardingMode(
          statusResponse?.authOnboardingMode === "migration" ||
            statusResponse?.authOnboardingMode === "fresh"
            ? statusResponse.authOnboardingMode
            : null,
        );

        if (!enabled) {
          localStorage.removeItem(USER_KEY);
          applyUser(null);
          return;
        }
      } catch {
        if (!isCurrent()) return;
        const cachedAuthEnabled = localStorage.getItem(AUTH_ENABLED_CACHE_KEY);
        if (cachedAuthEnabled === "false") {
          setAuthStatusError(null);
          setAuthEnabled(false);
          setRegistrationEnabled(false);
          setAuthMode("local");
          setOidcEnabled(false);
          setOidcEnforced(false);
          setOidcProvider(null);
          setBootstrapRequired(false);
          setAuthOnboardingRequired(false);
          setAuthOnboardingMode(null);
          localStorage.removeItem(USER_KEY);
          applyUser(null);
          return;
        }
        setAuthStatusError(
          translate("common.auth.backendUnreachable"),
        );
        setAuthEnabled(null);
        setRegistrationEnabled(false);
        setAuthMode("local");
        setOidcEnabled(false);
        setOidcEnforced(false);
        setOidcProvider(null);
        setBootstrapRequired(false);
        setAuthOnboardingRequired(false);
        setAuthOnboardingMode(null);
        localStorage.removeItem(USER_KEY);
        applyUser(null);
        return;
      }

      try {
        const response = await authMe();
        if (!isCurrent()) return;
        clearOidcAutoLoginSuppression();
        applyUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      } catch {
        if (!isCurrent()) return;
        localStorage.removeItem(USER_KEY);
        applyUser(null);
      }
    } catch (error) {
      if (!isCurrent()) return;
      console.error("Failed to load user:", error);
      setAuthStatusError(
        translate("common.auth.initializeFailed"),
      );
      localStorage.removeItem(USER_KEY);
      applyUser(null);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (
        event.key === SESSION_CHANGE_KEY ||
        event.key === null ||
        (event.key === USER_KEY &&
          storedIdentity(event.oldValue) !== storedIdentity(event.newValue))
      ) {
        applyUser(null, true);
        void loadUser();
      }
    };
    if (typeof window === "undefined") return;
    window.addEventListener?.("storage", onStorage);
    return () => window.removeEventListener?.("storage", onStorage);
  }, [loadUser, applyUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        if (authEnabled === false) {
          throw new Error("Authentication is disabled");
        }
        const response = await authLogin(email, password);

        const { user: userData } = response;

        setAuthStatusError(null);
        setAuthEnabled(true);
        completeAuthChange(userData);
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          const message =
            typeof error.response?.data === "object" &&
            error.response.data !== null &&
            "message" in error.response.data &&
            typeof error.response.data.message === "string"
              ? error.response.data.message
              : "Login failed";
          throw new Error(message);
        }
        throw error instanceof Error ? error : new Error("Login failed");
      }
    },
    [authEnabled, completeAuthChange],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      setupCode?: string,
    ) => {
      try {
        if (authEnabled === false) {
          throw new Error("Authentication is disabled");
        }
        const response = await authRegister(email, password, name, setupCode);

        const { user: userData } = response;

        setAuthStatusError(null);
        setAuthEnabled(true);
        completeAuthChange(userData);
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          const message =
            typeof error.response?.data === "object" &&
            error.response.data !== null &&
            "message" in error.response.data &&
            typeof error.response.data.message === "string"
              ? error.response.data.message
              : "Registration failed";
          throw new Error(message);
        }
        throw error instanceof Error ? error : new Error("Registration failed");
      }
    },
    [authEnabled, completeAuthChange],
  );

  const logout = useCallback(async () => {
    let oidcLogout = false;
    try {
      oidcLogout = (await authLogout()).oidcLogout;
    } catch (error) {
      // Do not claim that the user signed out when the server session could
      // still be refreshed. This also avoids an enforced-OIDC redirect loop.
      console.error("Logout failed", error);
      toast.error(getApiErrorMessage(error, translate("common.auth.signOutFailed")));
      return;
    }
    suppressOidcAutoLogin();
    completeAuthChange(null);
    if (oidcLogout) {
      startOidcSignOut();
      return;
    }
    navigate("/login");
  }, [completeAuthChange, navigate]);

  const updateUser = useCallback(
    (updates: Partial<User>) => {
      if (!currentUser.current) return;
      const nextUser = { ...currentUser.current, ...updates };
      if (identityOf(currentUser.current) !== identityOf(nextUser)) {
        completeAuthChange(nextUser);
      } else {
        applyUser(nextUser);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      }
    },
    [applyUser, completeAuthChange],
  );

  const value = useMemo(
    () => ({
      user,
      sessionGeneration,
      loading,
      authEnabled,
      registrationEnabled,
      authStatusError,
      authMode,
      oidcEnabled,
      oidcEnforced,
      oidcProvider,
      bootstrapRequired,
      authOnboardingRequired,
      authOnboardingMode,
      login,
      register,
      logout,
      updateUser,
      retryAuthStatus: loadUser,
      isAuthenticated: !!user,
    }),
    [
      user,
      sessionGeneration,
      loading,
      authEnabled,
      registrationEnabled,
      authStatusError,
      authMode,
      oidcEnabled,
      oidcEnforced,
      oidcProvider,
      bootstrapRequired,
      authOnboardingRequired,
      authOnboardingMode,
      login,
      register,
      logout,
      updateUser,
      loadUser,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
