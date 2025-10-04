import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedCompany = localStorage.getItem('company');

    if (token && savedUser && savedCompany) {
      setUser(JSON.parse(savedUser));
      setCompany(JSON.parse(savedCompany));
      
      // Verify token is still valid
      try {
        await api.get('/auth/me');
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  };

  const login = (userData, companyData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('company', JSON.stringify(companyData));
    setUser(userData);
    setCompany(companyData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    setUser(null);
    setCompany(null);
  };

  const value = {
    user,
    company,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};