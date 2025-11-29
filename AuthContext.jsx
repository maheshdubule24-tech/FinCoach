// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // if token exists, fetch profile once (so app loads with user)
  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/finances/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setUser(null);
          setLoading(false);
          return;
        }
        const payload = await res.json();
        setUser(payload.user || null);
      } catch (err) {
        console.error("loadProfile error", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token]);

  const login = (jwt, userData) => {
    if (jwt) {
      localStorage.setItem("token", jwt);
      setToken(jwt);
    }
    if (userData) setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  // updateUser to instantly update UI (used by ProfileDropdown)
  const updateUser = (newUser) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;