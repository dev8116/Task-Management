import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('flowtrack_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      if (data.success) {
        localStorage.setItem('flowtrack_user', JSON.stringify(data.user));
        localStorage.setItem('flowtrack_token', data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Invalid email or password' };
    }
  };

  const logout = async () => {
    try { await logoutUser(); } catch (_) {}
    localStorage.removeItem('flowtrack_user');
    localStorage.removeItem('flowtrack_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);