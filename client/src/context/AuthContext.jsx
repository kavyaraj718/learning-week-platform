import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/index.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from a stored token on first load.
  useEffect(() => {
    const token = localStorage.getItem('lw_token');
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then((r) => setUser(r.user))
      .catch(() => localStorage.removeItem('lw_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await authApi.login({ email, password });
    localStorage.setItem('lw_token', r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const register = useCallback(async (body) => {
    const r = await authApi.register(body);
    localStorage.setItem('lw_token', r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lw_token');
    setUser(null);
  }, []);

  // Let pages refresh the cached user (e.g. after earning points).
  const refreshUser = useCallback(async () => {
    try {
      const r = await authApi.me();
      setUser(r.user);
      return r.user;
    } catch { return null; }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
