import { useState } from "react";
import { Mic, Square } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

export default function MicButton() {
  const [listening, setListening] = useState(false);

  const toggle = async () => {
    if (!listening) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop immediately; this is a UI/permission primer for MVP
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
      className={`fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all backdrop-blur
        ${listening ? "bg-fuchsia-500 text-white ring-2 ring-fuchsia-300/50" : "bg-white/10 text-white border border-white/20 hover:bg-white/20"}
      `}
      aria-label="Push to talk"
      title="Push to talk"
    >
      {listening ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      <span
        className={`absolute -z-10 h-20 w-20 rounded-full blur-2xl transition
          ${listening ? "bg-fuchsia-500/40" : "bg-transparent"}
        `}
      />
    </button>
  );
}