"use client";

import { useState, useEffect } from "react";
import VitaVoice from "./VitaVoice";
import DailyGoals from "./DailyGoals";
import BodyVisualizer from "./BodyVisualizer";
import NutritionDashboard from "./NutritionDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function VitaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedInfo = localStorage.getItem("vita_user_info");
    if (storedInfo) {
      setUserInfo(JSON.parse(storedInfo));
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: input };

    const MEMORY_LIMIT = 12;
    const updatedMessages = [...messages.slice(-MEMORY_LIMIT), userMsg];

    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true); // Start typing state immediately to prevent double sends if we disabled input

    try {
      // Gather context
      const dailyGoals = localStorage.getItem("vita_daily_goals");
      const bodyFat = localStorage.getItem("vita_body_fat");
      
      const contextInfo = {
        ...userInfo,
        dailyGoals: dailyGoals ? JSON.parse(dailyGoals) : [],
        bodyFat: bodyFat ? parseFloat(bodyFat) : null
      };

      const res = await fetch("/api/vita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: updatedMessages,
          userInfo: contextInfo // Pass full context
        }),
      });

      if (!res.ok) {
        console.error("API Error:", res.status, res.statusText);
        const errorText = await res.text();
        let errorMsg = "Something went wrong.";
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error || errorMsg;
        } catch (e) {
          // ignore
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${errorMsg}` },
        ]);
        setIsTyping(false);
        return;
      }

      const data = await res.json();
      const fullReply = data.reply || "I'm sorry, I couldn't generate a response.";

      // Add initial empty assistant message
      let typingMessage: ChatMessage = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, typingMessage]);

      // Typewriter animation
      for (let i = 0; i < fullReply.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 20)); // Slightly faster typing
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
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Failed to connect to the server." },
      ]);
    } finally {
      setIsTyping(false); // Ensure typing stops
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
      
      {/* Left Column: Nutrition & Goals */}
      <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-y-auto pr-2">
        <NutritionDashboard />
        <DailyGoals />
      </div>

      {/* Middle Column: Chat & Voice (Takes up 2 columns) */}
      <div className="lg:col-span-2 flex flex-col gap-6 h-full">
        <div className="flex-1 bg-white rounded-xl shadow flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p>Start chatting with Vita!</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    m.role === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && messages.length > 0 && messages[messages.length - 1].role === "assistant" && messages[messages.length - 1].content === "" && (
               <div className="flex justify-start">
                 <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3">
                   <span className="animate-pulse">...</span>
                 </div>
               </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <input
                className="flex-1 border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isTyping && sendMessage()}
                placeholder="Ask Vita anything..."
                disabled={isTyping}
              />
              <Button onClick={sendMessage} disabled={isTyping || !input.trim()} className="bg-blue-600 hover:bg-blue-700 h-auto px-6 rounded-xl">
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="bg-white p-6 rounded-xl shadow">
          <VitaVoice messages={messages} setMessages={setMessages} isTyping={isTyping} />
        </div>
      </div>

      {/* Right Column: Profile & Visualizer */}
      <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-y-auto pr-2">
        {/* User Info Summary */}
        {userInfo && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">My Profile</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/onboarding")}>
                Edit
              </Button>
            </CardHeader>
            <CardContent className="text-sm grid grid-cols-2 gap-2">
              <p><span className="font-medium text-gray-500">Age:</span> {userInfo.age}</p>
              <p><span className="font-medium text-gray-500">Height:</span> {userInfo.height}cm</p>
              <p><span className="font-medium text-gray-500">Weight:</span> {userInfo.weight}kg</p>
              <p><span className="font-medium text-gray-500">Goal:</span> {userInfo.goal}</p>
            </CardContent>
          </Card>
        )}

        {/* Body Visualizer */}
        <BodyVisualizer userInfo={userInfo} />
      </div>
    </div>
  );
}

