import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-fuchsia-600/30 flex items-center justify-center ring-2 ring-fuchsia-400/40">
              <Bot className="h-8 w-8 text-fuchsia-300" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Welcome to Echo</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to access your personal AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#c026d3",
                    brandAccent: "#a21caf",
                    inputBackground: "#1e293b",
                    inputText: "#ffffff",
                    inputBorder: "#475569",
                    inputBorderFocus: "#c026d3",
                    inputBorderHover: "#c026d3",
                  },
                },
              },
              className: {
                container: "auth-container",
                button: "auth-button",
                input: "auth-input",
              },
            }}
            theme="dark"
            providers={[]}
            redirectTo={window.location.origin}
          />
        </CardContent>
      </Card>
    </div>
  );
}