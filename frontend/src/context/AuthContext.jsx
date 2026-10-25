import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // restore session on first load
  useEffect(() => {
    const token = localStorage.getItem('hp_token');
    if (!token) return setLoading(false);
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('hp_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('hp_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (form) => {
    const { data } = await api.post('/auth/register', form);
    localStorage.setItem('hp_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hp_token');
    setUser(null);
  }, []);

  const isStaff = user && ['admin', 'staff'].includes(user.role);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}
