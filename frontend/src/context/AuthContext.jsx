import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cs_token') || null);
  const [loading, setLoading] = useState(true);
  const [childrenList, setChildrenList] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('cs_token', token);
      validateToken(token);
    } else {
      localStorage.removeItem('cs_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const validateToken = async (jwt) => {
    try {
      const decoded = jwtDecode(jwt);
      if (decoded.exp * 1000 < Date.now()) {
        setToken(null);
        return;
      }
      
      const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${jwt}` }});
      const data = await res.json();
      if(data.user) {
        setUser(data.user);
        await fetchChildren(jwt);
      } else {
        setToken(null);
      }
    } catch(err) {
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async (jwt) => {
    try {
      const res = await fetch('/api/children', { headers: { 'Authorization': `Bearer ${jwt}` }});
      const data = await res.json();
      if(data.children) {
        setChildrenList(data.children);
        if(data.children.length > 0) setActiveChild(data.children[0]);
      }
    } catch(err) { console.error(err); }
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if(res.ok) { setToken(data.token); return true; }
    throw new Error(data.error);
  };

  const register = async (userData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if(res.ok) { setToken(data.token); return true; }
    throw new Error(data.error);
  };

  const logout = () => {
    setToken(null);
    setChildrenList([]);
    setActiveChild(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, childrenList, activeChild, setActiveChild, isDemoMode, setIsDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};
