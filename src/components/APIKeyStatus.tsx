"use client";

import { Link } from "react-router-dom";
import { useOpenAIKey } from "@/hooks/useOpenAIKey";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, CheckCircle2, AlertCircle, Settings } from "lucide-react";

interface APIKeyStatusProps {
  showWhenConfigured?: boolean;
  compact?: boolean;
}

export default function APIKeyStatus({ showWhenConfigured = false, compact = false }: APIKeyStatusProps) {
  const { hasKey, source } = useOpenAIKey();

  // Don't show anything if key is configured and we don't want to show it
  if (hasKey && !showWhenConfigured) {
    return null;
  }

  if (hasKey) {
    if (compact) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          API Key Configured
        </Badge>
      );
    }

    return (
      <Alert className="border-green-500/30 bg-green-500/10">
        <CheckCircle2 className="h-4 w-4 text-green-400" />
        <AlertTitle className="text-green-400">OpenAI API Key Configured</AlertTitle>
        <AlertDescription className="text-green-300/80">
          Your API key is set up and ready to use.
          {source === "providers" && " (from API Providers)"}
        </AlertDescription>
      </Alert>
    );
  }

  if (compact) {
    return (
      <Link to="/settings">
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 cursor-pointer hover:bg-yellow-500/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Add API Key
        </Badge>
      </Link>
    );
  }

  return (
    <Alert className="border-yellow-500/30 bg-yellow-500/10">
      <Key className="h-4 w-4 text-yellow-400" />
      <AlertTitle className="text-yellow-400">OpenAI API Key Required</AlertTitle>
      <AlertDescription className="text-yellow-300/80">
        <p className="mb-3">
          To use voice features, chat, and AI capabilities, you need to add your OpenAI API key.
        </p>
        <Link to="/settings">
          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-500 text-white">
            <Settings className="h-4 w-4 mr-2" />
            Go to Settings
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}