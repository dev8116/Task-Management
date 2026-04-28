import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// choose per-tab storage
const storage = typeof window !== 'undefined' ? window.sessionStorage : null;
const STORAGE_KEY = 'flowtrack_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storage) return;
    const storedUser = storage.getItem(STORAGE_KEY);
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    if (storage) storage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const { data } = await API.post('/auth/forgot-password', { email });
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, forgotPassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};