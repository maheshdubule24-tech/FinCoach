import axios from "axios";

export const askAI = async (userMessage) => {
  const reply = await axios.post(
    "http://localhost:4000/api/ai/chat",
    { message: userMessage },
    { headers: { Authorization: "" } } // Prevent JWT from breaking
  );

  return reply.data.reply;
};