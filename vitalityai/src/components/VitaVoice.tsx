"use client";

import { useState, useRef, useEffect } from "react";
import VitaFace from "./VitaFace";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Volume2 } from "lucide-react";

export default function VitaVoice({
  messages,
  setMessages,
  isTyping = false,
}: {
  messages: any[];
  setMessages: any;
  isTyping?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const storedInfo = localStorage.getItem("vita_user_info");
    if (storedInfo) {
      setUserInfo(JSON.parse(storedInfo));
    }
    
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setIsSupported(false);
      } else if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
      }
    }

    // Cleanup on unmount
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsSpeaking(false);
    setIsThinking(false);
    setListening(false);
  };

  const startListening = () => {
    if (!isSupported) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    
    const recognition = recognitionRef.current;
    if (!recognition) return;

    // If already speaking or thinking, stop everything first so we can talk
    if (isSpeaking || isThinking) {
      stopAudio();
      // Give a small delay to ensure state is reset before starting
      setTimeout(() => startListening(), 100);
      return;
    }

    if (listening) return;

    try {
      setListening(true);
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition", e);
      setListening(false);
    }

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
        body: JSON.stringify({ 
          messages: updatedMessages,
          userInfo: userInfo // Pass user info
        }),
      });

      if (!res.ok) {
        console.error("API Error:", res.status, res.statusText);
        const errorText = await res.text();
        let errorMessage = "Something went wrong.";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          // ignore json parse error
        }
        
        setMessages((prev: any[]) => [
          ...prev,
          { role: "assistant", content: `Error: ${errorMessage}` },
        ]);
        
        setListening(false);
        setIsThinking(false);
        return;
      }

      const data = await res.json();
      const fullReply = data.reply;

      // Add empty placeholder for typing animation
      let typingMsg = { role: "assistant", content: "" };
      setMessages((prev: any[]) => [...prev, typingMsg]);

      setIsThinking(false);
      // setIsSpeaking(true); // Moved down to sync with audio

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
        setIsSpeaking(true);
        audio.play().catch(() => setIsSpeaking(false));

        // TYPEWRITER SYNCED TO SPEECH
        for (let i = 0; i < fullReply.length; i++) {
          // Check if we should stop (e.g. user clicked stop)
          if (!audioRef.current || audioRef.current.paused) break;

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
    <div className="flex flex-col items-center space-y-4 w-full">
      <VitaFace isSpeaking={isSpeaking || isTyping} isThinking={isThinking} />

      <div className="flex items-center gap-4">
        <Button
          onClick={startListening}
          disabled={listening || isThinking}
          className={`h-14 px-8 rounded-full text-lg font-medium transition-all duration-300 shadow-lg flex items-center gap-2 ${
            listening
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {listening ? (
            <>
              <Mic className="w-6 h-6 animate-bounce" />
              Listening...
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" />
              Talk to Vita
            </>
          )}
        </Button>

        {(isSpeaking || isThinking) && (
          <Button
            onClick={stopAudio}
            variant="destructive"
            className="h-14 w-14 rounded-full p-0 flex items-center justify-center shadow-lg"
            title="Stop"
          >
            <Square className="w-6 h-6 fill-current" />
          </Button>
        )}
      </div>

      {!isSupported && (
        <p className="text-red-500 text-sm">Voice not supported in this browser</p>
      )}

      <div className="h-6 text-sm font-medium text-gray-500">
        {isThinking && (
          <span className="flex items-center gap-2 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            Vita is thinking...
          </span>
        )}
        {isSpeaking && (
          <span className="flex items-center gap-2 text-blue-600">
            <Volume2 className="w-4 h-4" />
            Vita is speaking...
          </span>
        )}
      </div>
    </div>
  );
}
