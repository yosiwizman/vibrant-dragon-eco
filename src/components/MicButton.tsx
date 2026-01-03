import { useNavigate, useLocation } from "react-router-dom";
import { Mic } from "lucide-react";

export default function MicButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on voice page since it has its own controls
  if (location.pathname === "/voice") {
    return null;
  }

  const handleClick = () => {
    navigate("/voice");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all bg-fuchsia-600 text-white hover:bg-fuchsia-500 hover:scale-105 active:scale-95"
      aria-label="Open voice chat"
      title="Open voice chat"
    >
      <Mic className="h-7 w-7" />
      <span className="absolute -z-10 h-24 w-24 rounded-full blur-2xl bg-fuchsia-500/40" />
    </button>
  );
}