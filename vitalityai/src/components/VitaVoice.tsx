"use client";

import { useState, useRef } from "react";

export default function VitaVoice({
  messages,
  setMessages,
}: {
  messages: any[];
  setMessages: any;
}) {
  const [listening, setListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Setup speech recognition once
  if (typeof window !== "undefined" && !recognitionRef.current) {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
  }

  const startListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    // Don't allow input while Vita is busy
    if (listening || isThinking || isSpeaking) return;

    setListening(true);
    recognition.start();

    recognition.onresult = async (e: any) => {
      const userMessage = e.results[0][0].transcript;

      recognition.stop();
      setListening(false);
      setIsThinking(true);

      // Add user message
      const userMsg = { role: "user", content: userMessage };
      const MEMORY_LIMIT = 12;
      const updatedMessages = [...messages.slice(-MEMORY_LIMIT), userMsg];
      setMessages(updatedMessages);

      // Send full memory to Vita
      const res = await fetch("/api/vita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      const fullReply = data.reply;

      // Add empty placeholder for typing animation
      let typingMsg = { role: "assistant", content: "" };
      setMessages((prev: any[]) => [...prev, typingMsg]);

      setIsThinking(false);
      setIsSpeaking(true);

      // ---- TTS REQUEST ----
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullReply }),
      });

      const audioBlob = await ttsRes.blob();
      const audioURL = URL.createObjectURL(audioBlob);

      // Stop previous audio if still playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioURL);
      audioRef.current = audio;

      // Wait for audio metadata to load so we know duration
      audio.onloadedmetadata = async () => {
        const audioDuration = audio.duration; // seconds
        const totalChars = fullReply.length;

        // Calculate perfect typing delay
        const delayPerChar = (audioDuration * 1000) / totalChars;

        // Start audio + typing together
        audio.play().catch(() => setIsSpeaking(false));

        // TYPEWRITER SYNCED TO SPEECH
        for (let i = 0; i < fullReply.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, delayPerChar));

          typingMsg = {
            role: "assistant",
            content: fullReply.slice(0, i + 1),
          };

          setMessages((prev: any[]) => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = typingMsg;
            return newMsgs;
          });
        }

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioURL);
        };
      };
    };

    recognition.onerror = () => {
      recognition.stop();
      setListening(false);
    };

    recognition.onend = () => setListening(false);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={startListening}
        disabled={listening || isThinking || isSpeaking}
        className={`px-6 py-3 rounded-xl text-white ${
          listening || isThinking || isSpeaking
            ? "bg-gray-400"
            : "bg-blue-600"
        }`}
      >
        {listening
          ? "Listening..."
          : isThinking
          ? "Vita is thinking… ✨"
          : isSpeaking
          ? "Vita is talking… 🔊"
          : "Talk to Vita 🎤"}
      </button>

      {isThinking && (
        <p className="text-gray-500 text-sm">✨ Vita is thinking…</p>
      )}
      {isSpeaking && (
        <p className="text-gray-500 text-sm">🔊 Vita is responding…</p>
      )}
    </div>
  );
}
