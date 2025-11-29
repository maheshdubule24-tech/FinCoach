import React, { useState } from "react";
import { askAI } from "../api/ai"; // ← your backend API call

export default function AIChatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hello! I'm your AI financial coach. How can I help?" }
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user's message
    const newMessages = [
      ...messages,
      { from: "user", text: input }
    ];
    setMessages(newMessages);

    // Call backend AI
    const reply = await askAI(input);

    // Add AI reply
    setMessages([
      ...newMessages,
      { from: "ai", text: reply }
    ]);

    // Clear input
    setInput("");
  };

  return (
    <div className="chatbot-box">
      <div className="chat-window">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={msg.from === "user" ? "msg-user" : "msg-ai"}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your financial question..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}