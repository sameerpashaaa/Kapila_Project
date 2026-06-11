import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../api";
import { clearAccessToken, setAccessToken, setUnauthorizedHandler } from "../api/authToken";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const permissions = useMemo(() => new Set(user?.permissions || []), [user]);
  const roles = user?.roles || [];
  const departments = user?.departments || [];

  const applySession = useCallback((session) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    sessionStorage.removeItem("kapila_active_session");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    
    let isReloadOrHistory = false;
    try {
      const navigationEntries = performance.getEntriesByType("navigation");
      if (navigationEntries.length > 0) {
        const type = navigationEntries[0].type;
        isReloadOrHistory = type === "reload" || type === "back_forward";
      } else if (window.performance && window.performance.navigation) {
        const type = window.performance.navigation.type;
        isReloadOrHistory = type === 1 || type === 2; // 1: TYPE_RELOAD, 2: TYPE_BACK_FORWARD
      }
    } catch (e) {
      // Default to false if performance API is unavailable
    }

    if (isReloadOrHistory && sessionStorage.getItem("kapila_active_session") === "true") {
      api.auth.refresh()
        .then((res) => applySession(res.data))
        .catch(() => clearSession())
        .finally(() => setLoading(false));
    } else {
      clearSession();
      setLoading(false);
    }
  }, [applySession, clearSession]);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    applySession(res.data);
    sessionStorage.setItem("kapila_active_session", "true");
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      clearSession();
    }
  };

  const refreshSession = async () => {
    const res = await api.auth.me();
    setUser(res.data);
    return res.data;
  };

  const hasPermission = useCallback((permission) => {
    if (!permission) return true;
    if (roles.some((role) => role.key === "admin")) return true;
    return permissions.has(permission);
  }, [permissions, roles]);

  const hasAnyPermission = useCallback((items) => items.some((permission) => hasPermission(permission)), [hasPermission]);

  const canAccessDepartment = useCallback((deptName) => {
    if (!deptName || roles.some((role) => role.key === "admin" || role.key === "manager")) return true;
    return departments.some((dept) => dept.name?.toLowerCase() === String(deptName).toLowerCase());
  }, [departments, roles]);

  return (
    <AuthContext.Provider value={{
      user,
      roles,
      permissions,
      departments,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      refreshSession,
      hasPermission,
      hasAnyPermission,
      canAccessDepartment,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
