"use client";

import { useRef, useState } from "react";

export default function VitaStreamVoice({ messages, setMessages }: any) {
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);

  if (typeof window !== "undefined" && !recognitionRef.current) {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SR();
    recognitionRef.current.lang = "en-US";
  }

  const startListening = () => {
    if (listening || thinking || speaking) return;

    const recognition = recognitionRef.current;
    setListening(true);
    recognition.start();

    recognition.onresult = async (e: any) => {
      const userText = e.results[0][0].transcript;
      recognition.stop();
      setListening(false);

      const MEMORY = 12;
      const newMessages = [
        ...messages.slice(-MEMORY),
        { role: "user", content: userText },
      ];
      setMessages(newMessages);

      // START STREAMING TEXT
      setThinking(true);

      const res = await fetch("/api/vita-stream", {
        method: "POST",
        body: JSON.stringify({ messages: newMessages }),
      });

      const reader = res.body!.getReader();
      let assistantText = "";

      // placeholder assistant bubble
      setMessages((prev: any) => [...prev, { role: "assistant", content: "" }]);

      // stream text chunks
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantText += chunk;

        setMessages((prev: any) => {
          const copy = [...prev];
          copy[copy.length - 1].content = assistantText;
          return copy;
        });
      }

      setThinking(false);
      setSpeaking(true);

      // STREAM AUDIO FOR THE FINAL TEXT
      const tts = await fetch("/api/tts-stream", {
        method: "POST",
        body: JSON.stringify({ text: assistantText }),
      });

      const audioStream = tts.body!;
      const audioContext = new AudioContext();
      const reader2 = audioStream.getReader();

      const playChunk = async ({ value, done }: any) => {
        if (done) {
          setSpeaking(false);
          return;
        }

        const buffer = await value.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(buffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();

        reader2.read().then(playChunk);
      };

      reader2.read().then(playChunk);
    };
  };

  return (
    <button
      onClick={startListening}
      disabled={listening || thinking || speaking}
      className="px-6 py-3 bg-purple-600 text-white rounded-xl"
    >
      {listening
        ? "Listening…"
        : thinking
        ? "Vita is thinking… ✨"
        : speaking
        ? "Vita is talking… 🔊"
        : "Talk to Vita 🎤"}
    </button>
  );
}
