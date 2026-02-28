import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token y cargar usuario
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
      apiService.getCurrentUser()
        .then(data => {
          setUser(data.user);
          setLoading(false);
        })
        .catch(() => {
          // Token inválido, limpiar
          apiService.logout();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiService.login(email, password);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const register = async (userData) => {
    try {
      const data = await apiService.register(userData);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw new Error(error.message || 'Error al registrar usuario');
    }
  };

  const isAdmin = () => user?.role === 'admin';
  const isClient = () => user?.role === 'client';

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAdmin,
    isClient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
