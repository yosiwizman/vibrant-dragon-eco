import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProviderConfig, APIProvider } from "@/types/providers";
import { showSuccess, showError } from "@/utils/toast";
import {
  Brain, Mic, Volume2, Search, MapPin, Map, CloudSun, Cloud,
  Phone, Mail, Calendar, Shield, Zap, Sparkles, AudioLines,
  ChevronDown, ExternalLink, Check, Loader2, Link2
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Brain, Mic, Volume2, Search, MapPin, Map, CloudSun, Cloud,
  Phone, Mail, Calendar, Shield, Zap, Sparkles, AudioLines,
};

interface ProviderCardProps {
  config: ProviderConfig;
  provider?: APIProvider;
  onSave: (name: string, data: Partial<APIProvider>) => Promise<boolean>;
  onToggle: (name: string, enabled: boolean) => Promise<boolean>;
}

export default function ProviderCard({ config, provider, onSave, onToggle }: ProviderCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    config.fields.forEach(field => {
      if (field.key === "api_key" || field.key === "api_secret") {
        initial[field.key] = provider?.[field.key as keyof APIProvider] as string || "";
      } else {
        initial[field.key] = (provider?.config as any)?.[field.key] || "";
      }
    });
    return initial;
  });

  const IconComponent = ICON_MAP[config.icon] || Brain;
  const isEnabled = provider?.is_enabled || false;
  const hasApiKey = !!provider?.api_key;
  const isSyncedFromGeneral = (provider?.config as any)?.synced_from_general === true;

  const handleSave = async () => {
    setSaving(true);
    
    const apiKey = formData.api_key;
    const apiSecret = formData.api_secret;
    const configData: Record<string, any> = { category: config.category };
    
    config.fields.forEach(field => {
      if (field.key !== "api_key" && field.key !== "api_secret") {
        configData[field.key] = formData[field.key];
      }
    });

    const success = await onSave(config.name, {
      api_key: apiKey,
      api_secret: apiSecret,
      config: configData,
    });

    setSaving(false);
    
    if (success) {
      showSuccess(`${config.displayName} settings saved`);
    } else {
      showError("Failed to save settings");
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (enabled && !hasApiKey) {
      showError("Please configure API key first");
      setIsOpen(true);
      return;
    }
    
    const success = await onToggle(config.name, enabled);
    if (success) {
      showSuccess(`${config.displayName} ${enabled ? "enabled" : "disabled"}`);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isEnabled ? "bg-fuchsia-500/20" : "bg-slate-700"}`}>
                <IconComponent className={`h-5 w-5 ${isEnabled ? "text-fuchsia-400" : "text-slate-400"}`} />
              </div>
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2 flex-wrap">
                  {config.displayName}
                  {hasApiKey && (
                    <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                      <Check className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  )}
                  {isSyncedFromGeneral && (
                    <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                      <Link2 className="h-3 w-3 mr-1" />
                      Synced
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {config.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={!hasApiKey}
              />
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {config.fields.map(field => (
              <div key={field.key} className="grid gap-2">
                <Label className="text-slate-300 text-sm">{field.label}</Label>
                {field.type === "select" ? (
                  <Select
                    value={formData[field.key] || ""}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, [field.key]: value }))}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {field.options?.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-slate-700">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type === "password" ? "password" : "text"}
                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            
            <div className="flex items-center justify-between pt-2">
              {config.docsUrl && (
                <a
                  href={config.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Documentation
                </a>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}