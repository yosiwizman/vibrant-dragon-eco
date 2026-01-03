import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, MessageSquare, X, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/state/preferences";
import { showError, showSuccess } from "@/utils/toast";
import { buildSystemPrompt, parseToolCalls, executeTool } from "@/services/orchestrator";

export default function MicButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Don't show on voice or chat pages
  if (location.pathname === "/voice" || location.pathname === "/chat") {
    return null;
  }

  const handleMicClick = () => {
    navigate("/voice");
  };

  const handleChatClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuickSend = async () => {
    if (!quickInput.trim() || !user || !preferences.openaiApiKey) {
      if (!preferences.openaiApiKey) {
        showError("Please set your OpenAI API key in Settings");
      }
      return;
    }

    setIsProcessing(true);

    try {
      const systemPrompt = buildSystemPrompt();
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${preferences.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: quickInput },
          ],
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process request");
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Check for tool calls
      const toolCalls = parseToolCalls(aiResponse);
      
      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const result = await executeTool(user.id, toolCall);
          if (result.success) {
            showSuccess(`Done: ${toolCall.tool.replace(/_/g, " ")}`);
          } else {
            showError(result.error || "Action failed");
          }
        }
      } else {
        // No tool calls, just show a brief response
        showSuccess("Message received");
      }

      setQuickInput("");
      setIsExpanded(false);
    } catch (error: any) {
      showError(error.message || "Failed to process");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuickSend();
    }
    if (e.key === "Escape") {
      setIsExpanded(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Quick Input */}
      {isExpanded && (
        <div className="flex items-center gap-2 p-2 rounded-full bg-slate-900/95 border border-fuchsia-500/30 backdrop-blur-lg shadow-2xl animate-in slide-in-from-bottom-2">
          <Input
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Quick command..."
            className="w-64 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-full"
            disabled={isProcessing}
            autoFocus
          />
          <Button
            size="icon"
            onClick={handleQuickSend}
            disabled={isProcessing || !quickInput.trim()}
            className="rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 h-9 w-9"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(false)}
            className="rounded-full text-slate-400 hover:text-white h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Chat Button */}
        <button
          onClick={handleChatClick}
          className={`h-12 w-12 rounded-full flex items-center justify-center shadow-xl transition-all ${
            isExpanded 
              ? "bg-slate-700 text-white" 
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
          aria-label="Quick message"
          title="Quick message"
        >
          <MessageSquare className="h-5 w-5" />
        </button>

        {/* Mic Button */}
        <button
          onClick={handleMicClick}
          className="h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all bg-fuchsia-600 text-white hover:bg-fuchsia-500 hover:scale-105 active:scale-95"
          aria-label="Open voice chat"
          title="Open voice chat"
        >
          <Mic className="h-7 w-7" />
          <span className="absolute -z-10 h-24 w-24 rounded-full blur-2xl bg-fuchsia-500/40" />
        </button>
      </div>
    </div>
  );
}