import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Bot, Mail, Loader2, AlertCircle, Sparkles, Send } from "lucide-react";
import { showSuccess } from "@/utils/toast";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMagicLinkLoading(true);
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Please enter your email address");
      setIsMagicLinkLoading(false);
      return;
    }

    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (magicLinkError) {
        console.error("Magic link error:", magicLinkError);
        setError(magicLinkError.message);
        return;
      }

      setMessage("✨ Magic link sent! Check your email and click the link to sign in.");
      showSuccess("Magic link sent to your email!");
    } catch (err: unknown) {
      console.error("Magic link exception:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          setError("This email is already registered. Please sign in instead.");
        } else if (data.session) {
          showSuccess("Account created successfully!");
          navigate("/");
        } else {
          setMessage("Check your email for the confirmation link.");
        }
      }
    } catch (err: unknown) {
      console.error("Signup exception:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        if (signInError.message.includes("Email not confirmed")) {
          setError("Email not confirmed. Try using Magic Link instead!");
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.session) {
        showSuccess("Signed in successfully!");
        navigate("/");
      }
    } catch (err: unknown) {
      console.error("Sign in exception:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-fuchsia-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
        <CardHeader className="text-center pb-4">
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
        <CardContent className="space-y-5">
          {/* Magic Link Section - Primary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-fuchsia-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Recommended: Magic Link</span>
            </div>
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="magic-email" className="text-slate-300">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email Address
                </Label>
                <Input
                  id="magic-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  disabled={isMagicLinkLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                disabled={isMagicLinkLoading}
              >
                {isMagicLinkLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-slate-500 text-center">
              No password needed! We'll send a secure link to your email.
            </p>
          </div>

          <div className="relative">
            <Separator className="bg-slate-700" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 px-2 text-xs text-slate-500">
              or use password
            </span>
          </div>

          {/* Password Auth Section - Secondary */}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="signin" className="data-[state=active]:bg-slate-700 text-xs">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-slate-700 text-xs">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-slate-400 text-xs">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-slate-400 text-xs">
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 h-9"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-400 text-xs">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-400 text-xs">
                    Password (min 6 characters)
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 h-9"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-sm">
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}