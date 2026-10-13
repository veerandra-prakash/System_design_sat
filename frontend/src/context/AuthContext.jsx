import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { updateSocketAuth, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ambulance_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ambulance_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ambulance_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.data?.user) {
            setUser(res.data.data.user);
            localStorage.setItem('ambulance_user', JSON.stringify(res.data.data.user));
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, token: authToken } = res.data.data;
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('ambulance_token', authToken);
    localStorage.setItem('ambulance_user', JSON.stringify(loggedInUser));
    updateSocketAuth();
    return loggedInUser;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { user: newUser, token: authToken } = res.data.data;
    setUser(newUser);
    setToken(authToken);
    localStorage.setItem('ambulance_token', authToken);
    localStorage.setItem('ambulance_user', JSON.stringify(newUser));
    updateSocketAuth();
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ambulance_token');
    localStorage.removeItem('ambulance_user');
    disconnectSocket();
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('ambulance_user', JSON.stringify(updatedUser));
  };

  // Demo one-click fast switcher
  const demoLogin = async (role = 'patient') => {
    const creds = {
      patient: { email: 'patient@ambulance.com', password: 'patient123' },
      driver: { email: 'driver1@ambulance.com', password: 'driver123' },
      admin: { email: 'admin@ambulance.com', password: 'admin123' }
    };
    const target = creds[role] || creds.patient;
    return login(target.email, target.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        demoLogin,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isDriver: user?.role === 'driver',
        isPatient: user?.role === 'patient'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
