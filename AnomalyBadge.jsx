import React from "react";

export default function AnomalyBadge({ anomalies = [] }) {
  if (!anomalies.length) return null;
  return (
    <div className="bg-red-50 border border-red-200 p-2 rounded">
      <div className="text-xs font-bold text-red-600">Alerts</div>
      <ul className="text-xs mt-2 space-y-1">
        {anomalies.map((a,i)=>(
          <li key={i} className="flex justify-between">
            <span>{a.type}</span>
            <span className="text-gray-500">{a.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}