// src/pages/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  // while we fetch profile, block routing (optional)
  if (loading) return null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}