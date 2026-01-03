import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface AITestButtonProps {
  apiKey: string;
  provider?: "openai" | "anthropic";
}

export default function AITestButton({ apiKey, provider = "openai" }: AITestButtonProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  const testConnection = async () => {
    if (!apiKey) {
      showError("Please enter an API key first");
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      if (provider === "openai") {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Say 'Hello! Connection successful.' in exactly those words." }],
            max_tokens: 20,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        setResult("success");
        showSuccess(`AI responded: "${content.substring(0, 50)}..."`);
      } else if (provider === "anthropic") {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 20,
            messages: [{ role: "user", content: "Say 'Hello! Connection successful.' in exactly those words." }],
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
        }

        const data = await response.json();
        const content = data.content[0].text;
        
        setResult("success");
        showSuccess(`AI responded: "${content.substring(0, 50)}..."`);
      }
    } catch (error: any) {
      setResult("error");
      showError(`Connection failed: ${error.message?.substring(0, 100) || "Unknown error"}`);
    }

    setTesting(false);
  };

  return (
    <Button
      onClick={testConnection}
      disabled={testing || !apiKey}
      variant="outline"
      className="border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/20"
    >
      {testing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Testing...
        </>
      ) : result === "success" ? (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
          Connected
        </>
      ) : result === "error" ? (
        <>
          <XCircle className="h-4 w-4 mr-2 text-red-400" />
          Failed
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Test AI
        </>
      )}
    </Button>
  );
}