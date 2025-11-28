"use client";

import { useState } from "react";
import VitaVoice from "./VitaVoice";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function VitaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: input };

    const MEMORY_LIMIT = 12;
    const updatedMessages = [...messages.slice(-MEMORY_LIMIT), userMsg];

    setMessages(updatedMessages);
    setInput("");

    const res = await fetch("/api/vita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updatedMessages }),
    });

    const data = await res.json();
    const fullReply = data.reply;

    // Add initial empty assistant message
    let typingMessage: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, typingMessage]);

    // Typewriter animation
    for (let i = 0; i < fullReply.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 8)); // typing speed
      typingMessage = {
        role: "assistant",
        content: fullReply.slice(0, i + 1),
      };

      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = typingMessage;
        return newMsgs;
      });
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Chat Window */}
      <div className="mb-4 h-[400px] overflow-y-auto bg-white p-4 rounded-xl shadow">
        {messages.map((m, i) => (
          <p key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={`inline-block px-3 py-2 rounded-xl mb-2 ${
                m.role === "user" ? "bg-blue-200" : "bg-gray-200"
              }`}
            >
              {m.content}
            </span>
          </p>
        ))}
      </div>

      {/* Input Field */}
      <div className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded-xl"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Vita anything..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded-xl"
        >
          Send
        </button>
      </div>

      {/* Voice Component */}
      <div className="mt-4">
        <VitaRealtimeVoice messages={messages} setMessages={setMessages} />
      </div>
    </div>
  );
}
