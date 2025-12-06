"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function VitaFace({ isSpeaking, isThinking }: { isSpeaking: boolean; isThinking: boolean }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    // Try multiple extensions
    const extensions = ["jpg", "jpeg", "png", "webp"];
    
    const checkImage = async (ext: string) => {
      return new Promise<string | null>((resolve) => {
        const img = new Image();
        const src = `/vita.${ext}`;
        img.src = src;
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
      });
    };

    const findImage = async () => {
      for (const ext of extensions) {
        const found = await checkImage(ext);
        if (found) {
          setImageSrc(found);
          return;
        }
      }
      setImageSrc(null);
    };

    findImage();
  }, []);

  if (!imageSrc) {
    // Fallback to CSS Animated Face if image is missing
    return (
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-blue-200 rounded-full shadow-lg border-4 border-blue-300 flex flex-col items-center justify-center overflow-hidden">
          {/* Eyes Container */}
          <div className="flex gap-8 mb-4 z-10">
            {/* Left Eye */}
            <div className="relative w-4 h-6 bg-gray-800 rounded-full overflow-hidden">
              {isThinking && (
                <motion.div 
                  className="absolute inset-0 bg-blue-400 opacity-50"
                  animate={{ height: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            
            {/* Right Eye */}
            <div className="relative w-4 h-6 bg-gray-800 rounded-full overflow-hidden">
              {isThinking && (
                <motion.div 
                  className="absolute inset-0 bg-blue-400 opacity-50"
                  animate={{ height: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                />
              )}
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>

          {/* Mouth */}
          <div className="relative z-10">
            {isSpeaking ? (
              <motion.div
                className="w-10 bg-gray-700 rounded-full"
                animate={{ 
                  height: [6, 16, 6, 20, 8],
                  width: [40, 36, 40, 34, 38]
                }}
                transition={{ 
                  duration: 0.4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            ) : (
              <div className="w-8 h-1.5 bg-gray-700 rounded-full opacity-60" />
            )}
          </div>

          {/* Cheeks */}
          <div className="absolute top-20 left-6 w-4 h-3 bg-pink-300 rounded-full opacity-40 blur-sm" />
          <div className="absolute top-20 right-6 w-4 h-3 bg-pink-300 rounded-full opacity-40 blur-sm" />
        </div>

        {/* Glow Effect when Thinking */}
        {isThinking && (
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-400 -z-10"
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        {/* Helper Text */}
        <div className="absolute -bottom-12 left-0 right-0 text-center text-xs text-red-500 font-bold bg-white/80 p-1 rounded shadow-sm">
          Image missing!<br/>
          Add vita.jpg to public folder
        </div>
      </div>
    );
  }

  return (
  <div className="relative w-48 h-48 mx-auto mb-6">
    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-blue-500 shadow-xl bg-black">
      {/* Base face (static) */}
      <img
        src={imageSrc}
        alt="Vita"
        className="w-full h-full object-cover"
      />

      {/* Fixed band around the mouth */}
      <div
        className="absolute inset-0 z-10"
        style={{
          clipPath: "inset(70.5% 40% 24% 42%)",
          rotate: "4deg",
          x: 9
        }}
      >
        {/* Black fill that grows/shrinks smoothly */}
        <motion.div
          className="w-full h-full bg-black"
          style={{
            transformOrigin: "50% 0%", // grow down from top
          }}
          initial={{ scaleY: 0 }}
          animate={
            isSpeaking
              ? { scaleY: [0, 1, 1, 0] } // open → hold → close
              : { scaleY: 0 }
          }
          transition={{
            duration: 0.55,
            times: [0, 0.35, 0.7, 1],
            repeat: isSpeaking ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Mouth-only overlay that moves DOWN in sync */}
      <motion.div
        className="absolute inset-0 z-20"
        style={{
          clipPath: "inset(71% 39% 20% 37%)",
          transformOrigin: "50% 0%",
          rotate: "6deg",
          x: 13
        }}
        initial={{ y: 0 }}
        animate={
          isSpeaking
            ? { y: [0, 8, 0] } // drop → hold → rise
            : { y: 0 }
        }
        transition={{
          duration: 0.55,
          times: [0, 0.35, 0.7, 1],
          repeat: isSpeaking ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <img
          src={imageSrc}
          alt="Vita mouth"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Thinking Overlay */}
      {isThinking && (
        <div className="absolute inset-0 bg-blue-500/20 animate-pulse z-30 pointer-events-none" />
      )}
    </div>
  </div>
);


}
