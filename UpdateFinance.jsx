// src/pages/UpdateFinances.jsx
import React, { useState, useEffect } from "react";

export default function UpdateFinances() {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [balance, setBalance] = useState("");
  const [creditScore, setCreditScore] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  // Load existing data for the user
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:4000/api/finances/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.user) {
          setIncome(data.user.income || 0);
          setExpenses(data.user.expenses || 0);
          setBalance(data.user.balance || 0);
          setCreditScore(data.user.credit_score || 600);
        }
      } catch (err) {
        console.error("Failed to load user", err);
      }
    }
    fetchData();
  }, [token]);

  async function handleUpdate() {
    setMessage("");

    try {
      const res = await fetch("http://localhost:4000/api/finances/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          income: Number(income),
          expenses: Number(expenses),
          balance: Number(balance),
          creditScore: Number(creditScore),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("❌ Failed: " + (data.error || "Try again"));
        return;
      }

      setMessage("✅ Updated successfully!");
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Update Financial Information
        </h2>

        {message && (
          <p className="text-center mb-4 text-sm">{message}</p>
        )}

        <div className="space-y-4">

          <div>
            <label className="font-medium text-sm">Income</label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full border rounded-xl p-3 bg-gray-100"
            />
          </div>

          <div>
            <label className="font-medium text-sm">Expenses</label>
            <input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              className="w-full border rounded-xl p-3 bg-gray-100"
            />
          </div>

          <div>
            <label className="font-medium text-sm">Balance</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full border rounded-xl p-3 bg-gray-100"
            />
          </div>

          <div>
            <label className="font-medium text-sm">Credit Score</label>
            <input
              type="number"
              value={creditScore}
              onChange={(e) => setCreditScore(e.target.value)}
              className="w-full border rounded-xl p-3 bg-gray-100"
            />
          </div>

          <button
            onClick={handleUpdate}
            className="w-full bg-indigo-600 text-white p-3 rounded-xl mt-6 hover:bg-indigo-700"
          >
            Save Information
          </button>

        </div>
      </div>
    </div>
  );
}