import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Lock, Mail, Shield } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    if (data) {
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      showError("Failed to update profile");
    } else {
      showSuccess("Profile updated successfully");
    }
    setLoading(false);
  };

  const handleSetPin = async () => {
    if (pin.length !== 4) {
      showError("PIN must be 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      showError("PINs do not match");
      return;
    }

    // Store PIN in local storage (encrypted in production)
    localStorage.setItem("echo:pin", pin);
    setPinEnabled(true);
    setPin("");
    setConfirmPin("");
    showSuccess("PIN set successfully");
  };

  const handleDisablePin = () => {
    localStorage.removeItem("echo:pin");
    setPinEnabled(false);
    showSuccess("PIN disabled");
  };

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile Header */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-4 border-fuchsia-500/40">
                <AvatarFallback className="bg-fuchsia-600/30 text-fuchsia-200 text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {firstName || lastName ? `${firstName} ${lastName}` : "Your Profile"}
                </h1>
                <p className="text-slate-400">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-fuchsia-400" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-slate-400">
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
                <Input
                  id="firstName"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                <Input
                  id="lastName"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                className="bg-slate-800 border-slate-700 text-slate-400"
                value={user?.email || ""}
                disabled
              />
              <p className="text-xs text-slate-500">Email cannot be changed</p>
            </div>
            <Button
              onClick={handleSaveProfile}
              className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Security - PIN Setup */}
        <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-fuchsia-400" />
              Security
            </CardTitle>
            <CardDescription className="text-slate-400">
              Set up a PIN for quick access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div>
                <Label className="text-white">PIN Lock</Label>
                <p className="text-sm text-slate-400">
                  Require a 4-digit PIN to access Echo
                </p>
              </div>
              <Switch
                checked={pinEnabled}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    handleDisablePin();
                  }
                }}
              />
            </div>

            {!pinEnabled && (
              <div className="space-y-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="grid gap-2">
                  <Label htmlFor="pin" className="text-slate-300 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    New PIN (4 digits)
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPin" className="text-slate-300">Confirm PIN</Label>
                  <Input
                    id="confirmPin"
                    type="password"
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                  />
                </div>
                <Button
                  onClick={handleSetPin}
                  className="w-full bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                  disabled={pin.length !== 4 || confirmPin.length !== 4}
                >
                  Set PIN
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}