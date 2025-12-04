import { useState, useEffect } from "react";
import {
  Settings,
  Key,
  Link,
  Cpu,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import type { ApiProvider, ApiSettings } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const providerConfig: Record<
  ApiProvider,
  { name: string; defaultUrl: string; models: string[] }
> = {
  openai: {
    name: "OpenAI",
    defaultUrl: "https://api.openai.com/v1",
    models: ["gpt-5", "gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  },
  anthropic: {
    name: "Anthropic",
    defaultUrl: "https://api.anthropic.com",
    models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-opus-20240229"],
  },
  custom: {
    name: "Custom Endpoint",
    defaultUrl: "",
    models: [],
  },
};

export function ApiSettingsModal() {
  const { apiSettings, isApiSettingsOpen, toggleApiSettings, setApiSettings, setApiError } =
    useAppStore();

  const [provider, setProvider] = useState<ApiProvider>(
    apiSettings?.provider || "openai"
  );
  const [apiKey, setApiKey] = useState(apiSettings?.apiKey || "");
  const [baseUrl, setBaseUrl] = useState(
    apiSettings?.baseUrl || providerConfig[provider].defaultUrl
  );
  const [model, setModel] = useState(
    apiSettings?.model || providerConfig[provider].models[0] || ""
  );
  const [customModel, setCustomModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">(
    "idle"
  );
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    if (provider !== "custom") {
      setBaseUrl(providerConfig[provider].defaultUrl);
      setModel(providerConfig[provider].models[0] || "");
    }
  }, [provider]);

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const settings: ApiSettings = {
        provider,
        apiKey,
        baseUrl: provider === "custom" ? baseUrl : undefined,
        model: provider === "custom" ? customModel : model,
      };
      const response = await apiRequest("POST", "/api/test-connection", settings);
      return response.json() as Promise<{ success: boolean }>;
    },
    onSuccess: () => {
      setTestStatus("success");
      setTestError(null);
    },
    onError: (error: Error) => {
      setTestStatus("error");
      setTestError(error.message);
    },
  });

  const handleTest = () => {
    setTestStatus("testing");
    testConnectionMutation.mutate();
  };

  const handleSave = () => {
    const settings: ApiSettings = {
      provider,
      apiKey,
      baseUrl: provider === "custom" ? baseUrl : providerConfig[provider].defaultUrl,
      model: provider === "custom" ? customModel : model,
    };
    setApiSettings(settings);
    setApiError(null);
    toggleApiSettings();
  };

  const handleRemove = () => {
    setApiSettings(null);
    setProvider("openai");
    setApiKey("");
    setBaseUrl(providerConfig.openai.defaultUrl);
    setModel(providerConfig.openai.models[0]);
    setCustomModel("");
    toggleApiSettings();
  };

  const isValid = apiKey.trim() && (provider !== "custom" || (baseUrl.trim() && customModel.trim()));

  return (
    <Dialog open={isApiSettingsOpen} onOpenChange={toggleApiSettings}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your AI provider to enable the agent. Your API key is stored
            locally and never sent to our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Provider selection */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(providerConfig) as ApiProvider[]).map((p) => (
                <Button
                  key={p}
                  variant={provider === p ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setProvider(p)}
                  data-testid={`button-provider-${p}`}
                >
                  <Cpu className="h-4 w-4 mr-2" />
                  {providerConfig[p].name}
                </Button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              <Key className="h-3.5 w-3.5 inline mr-1" />
              API Key
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${providerConfig[provider].name} API key`}
                data-testid="input-api-key"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Custom endpoint URL */}
          {provider === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="baseUrl">
                <Link className="h-3.5 w-3.5 inline mr-1" />
                Base URL
              </Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://your-endpoint.com/v1"
                data-testid="input-base-url"
              />
              <p className="text-xs text-muted-foreground">
                For Google Colab hosted models, use your Cloudflare tunnel URL
              </p>
            </div>
          )}

          {/* Model selection */}
          <div className="space-y-2">
            <Label>Model</Label>
            {provider === "custom" ? (
              <Input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="Model name (e.g., llama3.2:1b)"
                data-testid="input-custom-model"
              />
            ) : (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger data-testid="select-model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {providerConfig[provider].models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={!isValid || testStatus === "testing"}
              data-testid="button-test-connection"
            >
              {testStatus === "testing" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : testStatus === "success" ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : testStatus === "error" ? (
                <AlertCircle className="h-4 w-4 mr-2 text-destructive" />
              ) : null}
              Test Connection
            </Button>
            {testStatus === "success" && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                Connected
              </Badge>
            )}
          </div>
          {testError && (
            <p className="text-sm text-destructive">{testError}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          {apiSettings && (
            <Button variant="destructive" onClick={handleRemove}>
              Remove
            </Button>
          )}
          <Button variant="outline" onClick={toggleApiSettings}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            data-testid="button-save-api-settings"
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
