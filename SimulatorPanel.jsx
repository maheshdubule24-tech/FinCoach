import React, { useState, useContext } from "react";
import { format as formatCurrency } from "currency-formatter"; // optional; or use your formatCurrency

export default function SimulatorPanel({ user, onResult }) {
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState(3);
  const [loading, setLoading] = useState(false);
  const [sim, setSim] = useState(null);

  const runSim = async () => {
    if (!amount) return;
    setLoading(true);
    // local simulation logic (fast)
    const monthlyFree = Math.max(user.income - user.expenses, 1);
    const impactPercent = ((parseFloat(amount) / monthlyFree) * 100).toFixed(1);
    const safe = parseFloat(amount) < monthlyFree * 0.5;
    const delayMonths = Math.round(parseFloat(amount) / monthlyFree);
    const newBalance = user.balance - parseFloat(amount);
    const out = {
      safe,
      impactPercent,
      delayMonths,
      newBalance,
      projection: Array.from({ length: months }).map((_,i)=> Math.round(user.balance + (user.income - user.expenses) * (i+1) - amount*(i===0?1:0)))
    };
    setSim(out);
    setLoading(false);
    onResult && onResult(out);

    // also ask server AI for a friendly suggestion (non-blocking)
    try {
      fetch("/api/ai/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("fc_token")}` },
        body: JSON.stringify({ user: `Simulate: If I spend ${amount} INR now, what happens?` })
      })
      .then(r=>r.json())
      .then(d => {
        // optional: attach server recommendations to result
        setSim(s => ({ ...s, aiAdvice: d.aiResponse }));
      })
      .catch(()=>{});
    } catch(e){}
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-md">
      <h4 className="font-semibold mb-2">What-If Simulator</h4>
      <div className="space-y-2">
        <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Amount (e.g. 40000)" className="w-full p-2 border rounded" />
        <div className="flex items-center gap-2">
          <label className="text-sm">Projection months</label>
          <input type="range" min="1" max="12" value={months} onChange={(e)=>setMonths(e.target.value)} />
          <span className="text-xs">{months} months</span>
        </div>
        <button onClick={runSim} className="bg-indigo-600 text-white px-3 py-2 rounded">{loading ? "Simulating..." : "Run Simulation"}</button>

        {sim && (
          <div className="mt-3 p-3 bg-gray-50 rounded">
            <div className="text-sm">Safe? <strong>{sim.safe ? "Likely safe" : "Risky"}</strong></div>
            <div className="text-sm">Savings impact: <strong>{sim.impactPercent}%</strong></div>
            <div className="text-sm">Estimated goal delay: <strong>{sim.delayMonths} months</strong></div>
            <div className="text-sm">New balance (immediate): <strong>₹{sim.newBalance}</strong></div>
            {sim.aiAdvice && <div className="mt-2 text-xs p-2 bg-white border rounded">{sim.aiAdvice}</div>}
          </div>
        )}
      </div>
    </div>
  );
}