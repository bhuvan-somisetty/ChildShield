import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// ── Global API helper with retry ───────────────────────────────────────────────
const apiFetch = async (url, options = {}, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      // Wait 1s before retry
      await new Promise(r => setTimeout(r, 1000));
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(() => localStorage.getItem('cs_token') || null);
  const [loading, setLoading]         = useState(true);
  const [childrenList, setChildrenList] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [isDemoMode, setIsDemoMode]   = useState(false);

  // Track whether we've done the initial validation already
  const validatedRef = useRef(false);

  // ── Token persistence ──────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      localStorage.setItem('cs_token', token);
    } else {
      localStorage.removeItem('cs_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  // ── Initial validation (runs once on mount) ────────────────────────────────
  useEffect(() => {
    if (validatedRef.current) return;
    validatedRef.current = true;

    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateToken = useCallback(async (jwt) => {
    try {
      const decoded = jwtDecode(jwt);
      // Token expired — clear it
      if (decoded.exp * 1000 < Date.now()) {
        setToken(null);
        return;
      }

      const res = await apiFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      if (!res.ok) {
        // 401/403 = invalid token → clear; 5xx = server issue → keep token
        if (res.status === 401 || res.status === 403) {
          setToken(null);
        }
        // For server errors (503, 500) we preserve the token and show loading done
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        await fetchChildren(jwt);
      } else {
        setToken(null);
      }
    } catch (err) {
      // Network error (server down, no internet) — DO NOT clear the token.
      // The user is still "logged in", the server is just unreachable.
      console.warn('[Auth] Network error during token validation — keeping session:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChildren = useCallback(async (jwt) => {
    try {
      const res = await apiFetch('/api/children', {
        headers: { Authorization: `Bearer ${jwt || token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.children) {
        setChildrenList(data.children);
        setActiveChild(prev => {
          // Keep existing active child if still in the list
          if (prev && data.children.find(c => c.id === prev.id)) return prev;
          return data.children[0] || null;
        });
      }
    } catch (err) {
      console.warn('[Auth] Could not fetch children:', err.message);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      if (data.user) setUser(data.user);
      await fetchChildren(data.token);
      return true;
    }
    throw new Error(data.error || 'Login failed');
  };

  const register = async (userData) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      if (data.user) setUser(data.user);
      return true;
    }
    throw new Error(data.error || 'Registration failed');
  };

  // Called by OAuthCallback after social login redirect
  const loginWithToken = useCallback((jwt, userObj) => {
    localStorage.setItem('cs_token', jwt);
    setToken(jwt);
    if (userObj) setUser(userObj);
    fetchChildren(jwt);
  }, [fetchChildren]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setChildrenList([]);
    setActiveChild(null);
    localStorage.removeItem('cs_token');
    localStorage.removeItem('child_session');
    validatedRef.current = false;
  }, []);

  // Update user in-memory after profile edits
  const updateUser = useCallback((updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, loginWithToken, logout,
      fetchChildren, updateUser,
      childrenList, activeChild, setActiveChild,
      isDemoMode, setIsDemoMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
