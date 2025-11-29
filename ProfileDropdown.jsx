// src/components/ProfileDropdown.jsx
import React, { useState, useEffect } from "react";
import { LogOut, Edit3 } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../Context/AuthContext.jsx";

export default function ProfileDropdown({ onLogoutRedirect = null }) {
  const { user, updateUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    kycStatus: "not_started",
    balance: 0,
    income: 0,
    expenses: 0,
    credit_score: 0,
    bank_accounts: [],
    upi_ids: [],
  });

  // sync incoming user
  useEffect(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      kycStatus: user?.kycStatus || "not_started",
      balance: user?.balance ?? 0,
      income: user?.income ?? 0,
      expenses: user?.expenses ?? 0,
      credit_score: user?.credit_score ?? 0,
      bank_accounts: user?.bank_accounts || [],
      upi_ids: user?.upi_ids || [],
    });
  }, [user]);

  const toggleOpen = () => setOpen((v) => !v);
  const handleChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // banks / upi
  const addBank = () => setForm((f) => ({ ...f, bank_accounts: [...f.bank_accounts, { id: Date.now(), bank: "", accMask: "" }] }));
  const updateBank = (idx, k) => (e) => {
    setForm((f) => {
      const c = [...f.bank_accounts];
      c[idx] = { ...c[idx], [k]: e.target.value };
      return { ...f, bank_accounts: c };
    });
  };
  const removeBank = (idx) => setForm((f) => ({ ...f, bank_accounts: f.bank_accounts.filter((_, i) => i !== idx) }));

  const addUpi = () => setForm((f) => ({ ...f, upi_ids: [...f.upi_ids, ""] }));
  const updateUpi = (idx) => (e) => {
    setForm((f) => {
      const c = [...f.upi_ids];
      c[idx] = e.target.value;
      return { ...f, upi_ids: c };
    });
  };
  const removeUpi = (idx) => setForm((f) => ({ ...f, upi_ids: f.upi_ids.filter((_, i) => i !== idx) }));

  const saveProfile = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/finances/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(form),
      });

      const payload = await res.json();
      if (!res.ok) {
        alert(payload.error || payload.message || "Save failed");
        return;
      }

      // update global user so dashboard updates immediately
      if (payload.user) updateUser(payload.user);
      else updateUser(form); // fallback

      setEditing(false);
      alert("Profile updated");
    } catch (err) {
      console.error(err);
      alert("Network error while saving");
    }
  };

  const handleLogout = () => {
    logout();
    if (onLogoutRedirect) onLogoutRedirect();
  };

  return (
    <div className="relative">
      <button onClick={toggleOpen} className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100">
        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
          {(user?.name || "U")[0]}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50">
          <div className="p-4 border-b">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {(user?.name || "U")[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{user?.name || "Unnamed"}</div>
                <div className="text-xs text-gray-500">{user?.email || "no-email"}</div>
                <div className="text-xs text-gray-500 mt-1">Credit score: <span className="font-medium">{user?.credit_score ?? "-"}</span></div>
                <div className="text-xs text-gray-500">KYC: <span className={clsx("font-medium", user?.kycStatus === "verified" ? "text-green-500" : "text-yellow-500")}>{user?.kycStatus || "not_started"}</span></div>
              </div>
              <button onClick={() => setEditing(true)} className="p-2 rounded-md hover:bg-gray-100">
                <Edit3 size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-3 pb-6 space-y-2">
            <div className="text-xs font-semibold text-gray-600">Linked accounts</div>

            {(user?.bank_accounts || []).map((b, i) => (
              <div key={i} className="text-sm">
                <div className="font-medium">{b.bank || "Bank"}</div>
                <div className="text-xs text-gray-500">{b.accMask || "XXXX-1234"}</div>
              </div>
            ))}

            {(user?.upi_ids || []).map((u, i) => (
              <div key={i} className="text-sm text-gray-600">{u}</div>
            ))}

            {!user?.bank_accounts?.length && !user?.upi_ids?.length && <div className="text-xs text-gray-400">No accounts linked</div>}

            <button className="w-full text-sm bg-indigo-600 text-white p-2 rounded-lg font-medium hover:bg-indigo-700 mt-3" onClick={() => setEditing(true)}>Open profile</button>
            <button className="w-full mt-2 border p-2 rounded-lg text-sm flex items-center gap-2 justify-center" onClick={handleLogout}><LogOut size={14} /> Logout</button>
          </div>

          {editing && (
            <div className="p-4 border-t bg-gray-50 max-h-[65vh] overflow-y-auto">
              <div className="font-semibold mb-2">Edit profile</div>

              <div className="space-y-3">
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" className="w-full border p-2 rounded-lg text-sm" />
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" className="w-full border p-2 rounded-lg text-sm" />
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="w-full border p-2 rounded-lg text-sm" />

                <input type="number" value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: Number(e.target.value) }))} placeholder="Total Balance (₹)" className="w-full border p-2 rounded-lg text-sm" />

                <input type="number" value={form.income} onChange={(e) => setForm((f) => ({ ...f, income: Number(e.target.value) }))} placeholder="Monthly Income (₹)" className="w-full border p-2 rounded-lg text-sm" />

                <input type="number" value={form.expenses} onChange={(e) => setForm((f) => ({ ...f, expenses: Number(e.target.value) }))} placeholder="Monthly Expenses (₹)" className="w-full border p-2 rounded-lg text-sm" />

                <input type="number" value={form.credit_score} onChange={(e) => setForm((f) => ({ ...f, credit_score: Number(e.target.value) }))} placeholder="Credit Score" className="w-full border p-2 rounded-lg text-sm" />

                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Address" className="w-full border p-2 rounded-lg text-sm" />

                <div>
                  <div className="flex justify-between items-center text-xs text-gray-600">Bank Accounts <button onClick={addBank} className="text-indigo-600 text-xs">+ Add</button></div>
                  <div className="mt-2 space-y-2">
                    {form.bank_accounts.map((b, idx) => (
                      <div key={b.id || idx} className="flex items-center gap-2">
                        <input placeholder="Bank" value={b.bank} onChange={updateBank(idx, "bank")} className="flex-1 border p-2 rounded-lg text-sm" />
                        <input placeholder="XXXX-1234" value={b.accMask} onChange={updateBank(idx, "accMask")} className="w-32 border p-2 rounded-lg text-sm" />
                        <button className="text-red-500" onClick={() => removeBank(idx)}>X</button>
                      </div>
                    ))}
                    {!form.bank_accounts.length && <div className="text-xs text-gray-400">No bank accounts</div>}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs text-gray-600">UPI IDs <button onClick={addUpi} className="text-indigo-600 text-xs">+ Add</button></div>
                  <div className="mt-2 space-y-2">
                    {form.upi_ids.map((u, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input value={u} onChange={updateUpi(idx)} placeholder="example@upi" className="flex-1 border p-2 rounded-lg text-sm" />
                        <button className="text-red-500" onClick={() => removeUpi(idx)}>X</button>
                      </div>
                    ))}
                    {!form.upi_ids.length && <div className="text-xs text-gray-400">No UPI IDs</div>}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button onClick={saveProfile} className="flex-1 bg-indigo-600 text-white p-2 rounded-lg text-sm">Save</button>
                  <button onClick={() => setEditing(false)} className="flex-1 border p-2 rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}