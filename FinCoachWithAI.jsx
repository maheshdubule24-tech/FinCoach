// src/page/FinCoachWithAI.jsx
import React, { useState, useEffect, useContext, createContext, useRef } from "react";
import { Zap, Mic, Send, CreditCard, Target, TrendingUp, Activity, Bell } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

import SimulatorPanel from "../components/SimulatorPanel.jsx";
import AnomalyBadge from "../components/AnomalyBadge.jsx";
import RazorPayButton from "../components/RazorPayButton.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import ProfileDropdown from "../components/ProfileDropdown.jsx";

function cn(...inputs){ return twMerge(clsx(inputs)); }

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

// minimal blank user until backend fetch
const INITIAL_USER_DATA = {};

class FinCoachBrain {
  constructor(userData) { this.userData = userData || {}; }

  calculateHealthScore() {
    const income = this.userData.income || 1;
    const expenses = this.userData.expenses || 1;
    const savingsRatio = (income - expenses) / Math.max(income, 1);
    const liquidityScore = (this.userData.balance || 0) > (expenses * 3) ? 30 : 15;
    const debtScore = (this.userData.credit_score || 600) > 750 ? 30 : 15;
    const investmentScore = savingsRatio > 0.2 ? 40 : Math.max(0, Math.round(savingsRatio * 200));
    return Math.min(Math.round(liquidityScore + debtScore + investmentScore), 100);
  }

  simulatePurchase(amount) {
    const monthlyFreeCash = Math.max((this.userData.income || 0) - (this.userData.expenses || 0), 1);
    const isSafe = amount < monthlyFreeCash * 0.5;
    return {
      safe: isSafe,
      impactPercent: Math.round((amount / Math.max(monthlyFreeCash,1)) * 100),
      delayedGoal: (this.userData.goals?.[1]?.name) || "Next goal",
      delayDays: Math.round(amount / (monthlyFreeCash / 30)),
    };
  }

  async reason(prompt) {
    const steps = [];
    steps.push({ type: "thought", content: "Preparing prompt for AI." });

    const lower = (prompt || "").toLowerCase();
    if (lower.includes("afford") || lower.includes("buy")) {
      steps.push({ type: "action", content: "Local simulatePurchase()" });
      const amount = parseInt((prompt.match(/\d+/) || [0])[0] || 0);
      const impact = this.simulatePurchase(amount);
      steps.push({ type: "observation", content: impact.safe ? "Local simulation says safe." : "Local warns about goal delay." });
    }

    steps.push({ type: "thought", content: "Sending to server AI..." });

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("fc_token") || "";
      const res = await fetch("/api/ai/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ user: prompt })
      });

      if (!res.ok) {
        const txt = await res.text();
        steps.push({ type: "observation", content: `AI service error: ${res.status}` });
        return { steps, response: `AI error: ${txt}` };
      }

      const payload = await res.json();
      steps.push({ type: "observation", content: "AI response received." });
      return { steps, response: payload.aiResponse || "Empty AI reply" };
    } catch (err) {
      steps.push({ type: "observation", content: `Network error: ${err.message}` });
      return { steps, response: `Network error: ${err.message}` };
    }
  }

  async detectAnomalies() {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("fc_token") || "";
      const res = await fetch("/api/finances/analyze", { headers: { Authorization: token ? `Bearer ${token}` : "" }});
      if (!res.ok) return [];
      const { anomalies } = await res.json();
      return anomalies || [];
    } catch {
      return [];
    }
  }
}

const FinancialContext = createContext(null);

export const useFinancial = () => React.useContext(FinancialContext);

const FinancialProvider = ({ children }) => {
  const [user, setUser] = useState(INITIAL_USER_DATA);
  const [brain, setBrain] = useState(new FinCoachBrain(INITIAL_USER_DATA));
  const [score, setScore] = useState(0);

  useEffect(()=> {
    setScore(brain.calculateHealthScore());
  }, [user, brain]);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token") || localStorage.getItem("fc_token");
      if (!token) return;
      try {
        const res = await fetch("/api/finances/me", { headers: { Authorization: `Bearer ${token}` }});
        if (!res.ok) return;
        const d = await res.json();
        if (d?.user) {
          setUser(d.user);
          setBrain(new FinCoachBrain(d.user));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    })();
  }, []);

  // update brain whenever user changes
  useEffect(() => {
    setBrain(new FinCoachBrain(user));
    setScore(prev => {
      try { return new FinCoachBrain(user).calculateHealthScore(); } catch { return prev; }
    });
  }, [user]);

  const value = { user, setUser, brain, score };
  return <FinancialContext.Provider value={value}>{children}</FinancialContext.Provider>;
};


const HealthGauge = ({ score }) => (
  <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
    <svg className="w-full h-full" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <motion.circle
        cx="50" cy="50" r="45" fill="none"
        stroke={score > 70 ? "#10b981" : score > 40 ? "#f59e0b" : "#ef4444"}
        strokeWidth="8" strokeLinecap="round" strokeDasharray="283"
        initial={{ strokeDashoffset: 283 }}
        animate={{ strokeDashoffset: 283 - (283 * Math.max(0, Math.min(100, score))) / 100 }}
        transition={{ duration: 1.2 }} transform="rotate(-90 50 50)" />
    </svg>
    <div className="absolute text-center">
      <span className="text-4xl font-bold text-gray-800">{score}</span>
      <p className="text-xs text-gray-500 uppercase tracking-wider">Health Score</p>
    </div>
  </div>
);

const AgentLog = ({ logs }) => (
  <div className="mt-4 p-3 bg-black/85 rounded-xl font-mono text-xs text-green-300 border border-green-900">
    <div className="flex items-center mb-2 border-b border-gray-800 pb-1">
      <Activity size={12} className="mr-2 animate-pulse" />
      <span>FINCOACH CORE // TRACE</span>
    </div>
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {logs.map((log, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
          className={cn("p-1 pl-2 border-l-2",
            log.type === "thought" ? "border-blue-500 text-blue-300" :
            log.type === "action" ? "border-yellow-500 text-yellow-300" : "border-purple-500 text-purple-300"
          )}>
          <span className="opacity-50 uppercase mr-2">[{log.type}]</span>
          {log.content}
        </motion.div>
      ))}
    </div>
  </div>
);

const VoiceOverlay = ({ isOpen, onClose, onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  useEffect(()=>{
    if (!isOpen) return;
    setTranscript("Listening...");
    setIsListening(true);
    const t = setTimeout(()=>{ setTranscript("Can I afford the new iPhone?"); setIsListening(false); setTimeout(()=>{ onResult("Can I afford the new iPhone?"); onClose(); },900); }, 2200);
    return ()=>clearTimeout(t);
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center" initial={{ opacity:0 }} animate={{ opacity:1 }}>
      <div className="w-36 h-36 rounded-full bg-indigo-600 flex items-center justify-center relative">
        {isListening && (<>
          <motion.div className="absolute inset-0 rounded-full border-4 border-indigo-400" animate={{ scale: [1, 1.6], opacity: [1,0] }} transition={{ repeat: Infinity, duration: 1.4 }} />
          <motion.div className="absolute inset-0 rounded-full border-4 border-indigo-300" animate={{ scale: [1,2], opacity: [0.8,0] }} transition={{ repeat: Infinity, duration: 1.6, delay:0.5 }} />
        </>)}
        <Mic size={48} className="text-white z-10" />
      </div>
      <p className="mt-6 text-lg text-white">{transcript}</p>
      <button onClick={onClose} className="mt-8 text-gray-300 hover:text-white">Cancel</button>
    </motion.div>
  );
};

const DashboardContent = () => {
  const { user, setUser, brain, score } = useContext(FinancialContext);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [logs, setLogs] = useState([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(()=> {
    const name = user?.name || "there";
    setMessages([{ role: "agent", content: `Hello ${name}, I'm FinCoach. Ask me anything about your finances.` }]);
  }, [user?.name]);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, logs]);

  useEffect(()=>{ // fetch anomalies
    (async ()=> {
      const token = localStorage.getItem("token") || localStorage.getItem("fc_token");
      if (!token) return;
      try {
        const res = await fetch("/api/finances/analyze", { headers: { Authorization: `Bearer ${token}` }});
        if (res.ok){ const d = await res.json(); setAnomalies(d.anomalies || []); }
      } catch (err) { /* ignore */ }
    })();
  }, []);

  const handleAsk = async (query) => {
    if (!query?.trim()) return;
    setMessages((p)=>[...p, { role: "user", content: query }]);
    setInput("");
    setThinking(true);
    setLogs([]);

    const result = await brain.reason(query);

    for (const step of result.steps) {
      setLogs(prev => [...prev, step]);
      // small delay so user sees steps
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 120));
    }
    setMessages(p => [...p, { role: "agent", content: result.response }]);
    setThinking(false);
  };

  const handleVoiceResult = (text) => { setTimeout(()=>handleAsk(text), 50); };

  const onSimResult = (sim) => {
    setMessages(p => [...p, { role: "agent", content: `Simulator result: ${sim.safe ? "Likely safe" : "Risky"}. Impact ${sim.impactPercent}%`} ]);
    setLogs(prev => [...prev, { type: "action", content: "What-If simulation ran" }]);
  };

  // profile dropdown callbacks
  const handleProfileUpdate = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden flex">
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 flex-col hidden md:flex">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-8 border-b border-gray-100">
          <Zap className="text-indigo-600" />
          <span className="ml-2 font-bold text-xl hidden lg:block">FinCoach</span>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-2">
          {[
            { icon: Activity, label: "Dashboard", active: true },
            { icon: CreditCard, label: "Transactions" },
            { icon: Target, label: "Goals" },
            { icon: Target, label: "Insurance" }
          ].map((item, i) => (
            <button
              key={i}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-colors",
                item.active ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-100"
              )}
              type="button"
            >
              <item.icon size={20} />
              <span className="ml-3 font-medium hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 h-screen overflow-hidden flex flex-col relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center md:hidden"><Zap className="text-indigo-600 mr-2" /><span className="font-bold text-lg">FinCoach</span></div>
          <div className="hidden md:block"><h2 className="text-lg font-semibold text-gray-800">Overview</h2></div>
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-2 rounded-full text-gray-600"><Bell size={20} /></div>
            <ProfileDropdown user={user} onUpdate={handleProfileUpdate} onLogout={handleLogout} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
              <h3 className="text-gray-500 font-medium text-sm mb-4">Financial Health Score</h3>
              <HealthGauge score={score} />
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-indigo-200 text-sm mb-1">Total Balance</p>
                  <h3 className="text-3xl font-bold">{formatCurrency(user?.balance)}</h3>
                  <div className="mt-4 flex items-center text-sm text-indigo-100 bg-indigo-500/30 w-fit px-2 py-1 rounded-lg">
                    <TrendingUp size={14} className="mr-1" /> +12% vs last month
                  </div>
                </div>
                <Activity className="absolute -bottom-4 -right-4 text-indigo-500 opacity-50" size={120} />
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Monthly Savings</p>
                <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(Math.max((user?.income || 0) - (user?.expenses || 0), 0))}</h3>
                <div className="h-32 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{ day: 1, val: 1000 }, { day: 5, val: 1200 }, { day: 10, val: 900 }, { day: 15, val: 2500 }, { day: 20, val: 3100 }, { day: 25, val: 3800 }]}>
                      <defs><linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient></defs>
                      <Area type="monotone" dataKey="val" stroke="#4f46e5" fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col md:flex-row h-[520px]">
            <div className="flex-1 flex flex-col bg-gray-50/50">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" /><span className="font-semibold text-gray-700">AI Financial Coach</span></div>
                <button onClick={()=>setVoiceMode(true)} type="button" className="p-2 hover:bg-indigo-50 rounded-full text-indigo-600 transition-colors"><Mic size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m,i)=>(
                  <div key={i} className={cn("flex w-full", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] p-3 rounded-2xl text-sm shadow-sm", m.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-800 rounded-tl-none")}>
                      {m.content}
                    </div>
                  </div>
                ))}

                {thinking && (<div className="flex justify-start"><div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
                </div></div>)}

                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={(e)=>{ e.preventDefault(); handleAsk(input); }} className="flex gap-2">
                  <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask about budget, goals, or spending..." className="flex-1 bg-gray-100 border-none rounded-xl px-4 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors"><Send size={18} /></button>
                </form>
              </div>
            </div>

            <div className="w-full md:w-96 bg-gray-900 p-4 border-l border-gray-800 overflow-y-auto">
              <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">System Internals</h4>

              <div className="mb-4">
                <p className="text-gray-500 text-xs mb-2">WHAT-IF SIMULATOR</p>
                <SimulatorPanel user={user} onResult={onSimResult} />
              </div>

              <div className="mb-6">
                <p className="text-gray-500 text-xs mb-2">ACTIVE GOALS CONTEXT</p>
                {user?.goals?.map((g)=>(
                  <div key={g.id} className="mb-3">
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>{g.name}</span>
                      <span>{Math.round((g.current / Math.max(g.target,1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(g.current / Math.max(g.target,1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <AnomalyBadge anomalies={anomalies} />
              <AgentLog logs={logs} />
            </div>
          </div>
        </div>
      </main>

      <VoiceOverlay isOpen={voiceMode} onClose={()=>setVoiceMode(false)} onResult={(t)=>{ setVoiceMode(false); setTimeout(()=>handleAsk(t),50); }} />
    </div>
  );
};

export default function FinCoachWithAIPage() {
  return (
    <FinancialProvider>
      <DashboardContent />
    </FinancialProvider>
  );
}