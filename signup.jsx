// src/page/Register.jsx

import React, { useState } from "react";
import { useAuth } from "../Context/AuthContext";   
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const { login } = useAuth();     
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Registration failed");
        return;
      }

      // ⭐ Save token using AuthContext
      login(data.token);

      // Redirect to dashboard
      navigate("/dashboard");

    } catch (error) {
      setErr("Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Create FinCoach Account
        </h2>

        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          
          <div>
            <label className="text-sm">Full Name</label>
            <input
              type="text"
              className="w-full border rounded-xl p-3 mt-1 bg-gray-50"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Email</label>
            <input
              type="email"
              className="w-full border rounded-xl p-3 mt-1 bg-gray-50"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Password</label>
            <input
              type="password"
              className="w-full border rounded-xl p-3 mt-1 bg-gray-50"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="w-full bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700">
            Register
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}