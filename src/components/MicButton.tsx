import { useState } from "react";
import { Mic, Square } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

export default function MicButton() {
  const [listening, setListening] = useState(false);

  const toggle = async () => {
    if (!listening) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setListening(true);
        showSuccess("Mic ready (push-to-talk).");
      } catch {
        showError("Microphone unavailable or permission denied.");
      }
    } else {
      setListening(false);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all
        ${listening 
          ? "bg-fuchsia-600 text-white ring-4 ring-fuchsia-400/50 shadow-fuchsia-500/50" 
          : "bg-slate-800 text-white border-2 border-fuchsia-500/40 hover:bg-slate-700 hover:border-fuchsia-400"
        }
      `}
      aria-label="Push to talk"
      title="Push to talk"
    >
      {listening ? <Square className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
      <span
        className={`absolute -z-10 h-24 w-24 rounded-full blur-2xl transition
          ${listening ? "bg-fuchsia-500/50" : "bg-fuchsia-500/20"}
        `}
      />
    </button>
  );
}