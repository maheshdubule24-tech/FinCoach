import React, { useState } from "react";

export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [editing, setEditing] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* HEADER CARD */}
        <div className="bg-white shadow-md rounded-2xl p-6 flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold">
            {user.name?.[0] || "U"}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <button
              onClick={() => setEditing(true)}
              className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* FINANCIAL DETAILS */}
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Financial Details</h3>

          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <p><strong>Monthly Income:</strong> ₹ {user.income || 0}</p>
            <p><strong>Monthly Expenses:</strong> ₹ {user.expenses || 0}</p>
            <p><strong>Current Balance:</strong> ₹ {user.balance || 0}</p>
            <p><strong>Credit Score:</strong> {user.credit_score || 0}</p>
          </div>

          <button
            onClick={() => window.location.href = "/update-finances"}
            className="mt-4 bg-gray-800 text-white px-4 py-2 rounded-xl"
          >
            Update Financial Data
          </button>
        </div>

        {/* SECURITY SETTINGS */}
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Security</h3>

          <div className="space-y-3 text-gray-700">
            <p>🔒 Change Password</p>
            <p>📱 Two-Factor Authentication (Coming Soon)</p>
            <p>🌐 Google Login Connected</p>
          </div>
        </div>

        {/* PREFERENCES */}
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Preferences</h3>

          <div className="space-y-3 text-gray-700">
            <p>🔔 Notification Settings</p>
            <p>🤖 AI Coach Behavior Settings</p>
            <p>🎨 Theme: Light / Dark</p>
            <p>🌍 Language Preference</p>
          </div>
        </div>

        {/* DANGER ZONE */}
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h3>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-xl"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}