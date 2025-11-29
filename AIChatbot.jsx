// frontend/src/components/AIChatbot.jsx
import React, { useState } from "react";
import { askAI } from "../api/ai";

export default function AIChatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hello! I'm your AI financial coach. Ask me anything." }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    // Add user message
    const newMessages = [...messages, { from: "user", text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await askAI(text);
      setMessages([...newMessages, { from: "ai", text: reply }]);
    } catch (err) {
      console.error("askAI error:", err);
      setMessages([
        ...newMessages,
        { from: "ai", text: "Sorry, the AI service is unreachable." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ minHeight: 300, border: "1px solid #ddd", padding: 12, borderRadius: 8, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "8px 0", textAlign: m.from === "user" ? "right" : "left" }}>
            <div style={{
              display: "inline-block",
              padding: "8px 12px",
              borderRadius: 12,
              background: m.from === "user" ? "#e6f7ff" : "#f4f4f5"
            }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", marginTop: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your financial question..."
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button onClick={handleSend} disabled={loading} style={{ marginLeft: 8, padding: "8px 12px" }}>
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}