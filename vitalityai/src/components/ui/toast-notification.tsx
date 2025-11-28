"use client";

import * as React from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<{ message: string; type: ToastType; id: number } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
                toast.type === "success"
                  ? "bg-green-600 text-white border-green-500"
                  : toast.type === "error"
                  ? "bg-red-600 text-white border-red-500"
                  : "bg-gray-900 text-white border-gray-700"
              }`}
            >
              <span className="font-medium">{toast.message}</span>
              <button onClick={() => setToast(null)} className="opacity-80 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
