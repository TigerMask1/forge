import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  X,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Clipboard,
  ExternalLink,
  Zap,
  Server,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiSettings, ApiProvider } from "@shared/schema";

const apiRequest = async (method: string, url: string, body?: any) => {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }
  return response;
};

interface ProviderConfig {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultUrl: string;
  models: string[];
  apiKeyPlaceholder: string;
  docsUrl: string;
}

const providerConfig: Record<ApiProvider, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    description: "GPT-4o and latest models",
    icon: Sparkles,
    defaultUrl: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
    apiKeyPlaceholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude 3.5 & Claude 3 Opus",
    icon: Zap,
    defaultUrl: "https://api.anthropic.com/v1",
    models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-sonnet-20240229"],
    apiKeyPlaceholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  custom: {
    name: "Custom Endpoint",
    description: "Colab, vLLM, or any OpenAI-compatible API",
    icon: Server,
    defaultUrl: "",
    models: [],
    apiKeyPlaceholder: "Your API key or token",
    docsUrl: "",
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
  const [activeTab, setActiveTab] = useState<"config" | "docs">("config");

  useEffect(() => {
    if (provider !== "custom") {
      setBaseUrl(providerConfig[provider].defaultUrl);
      if (providerConfig[provider].models.length > 0) {
        setModel(providerConfig[provider].models[0]);
      }
    }
  }, [provider]);

  const handlePaste = async (field: "apiKey" | "baseUrl" | "model") => {
    try {
      const text = await navigator.clipboard.readText();
      switch (field) {
        case "apiKey":
          setApiKey(text.trim());
          break;
        case "baseUrl":
          setBaseUrl(text.trim());
          break;
        case "model":
          setCustomModel(text.trim());
          break;
      }
    } catch (err) {
      console.error("Failed to read clipboard");
    }
  };

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const settings: ApiSettings = {
        provider,
        apiKey,
        baseUrl: provider === "custom" ? baseUrl : providerConfig[provider].defaultUrl,
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

  const isValid = provider === "custom" 
    ? (baseUrl.trim() && customModel.trim())
    : apiKey.trim();
  const config = providerConfig[provider];
  const Icon = config.icon;

  return (
    <Dialog open={isApiSettingsOpen} onOpenChange={toggleApiSettings}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gray-50/50">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            API Configuration
          </DialogTitle>
          <DialogDescription>
            Connect your AI model provider to enable the autonomous agent
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "config" | "docs")} className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 p-0 px-6">
            <TabsTrigger
              value="config"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent"
            >
              Configuration
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="m-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Provider</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(providerConfig) as ApiProvider[]).map((key) => {
                      const cfg = providerConfig[key];
                      const ProviderIcon = cfg.icon;
                      return (
                        <Card
                          key={key}
                          className={cn(
                            "p-4 cursor-pointer transition-all hover:shadow-md",
                            provider === key
                              ? "ring-2 ring-gray-900 bg-gray-50"
                              : "hover:bg-gray-50"
                          )}
                          onClick={() => setProvider(key)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              provider === key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                            )}>
                              <ProviderIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{cfg.name}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">{cfg.description}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="apiKey" className="text-sm font-medium">
                      API Key {provider === "custom" && <span className="text-gray-400 font-normal">(optional)</span>}
                    </Label>
                    {config.docsUrl && (
                      <a
                        href={config.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
                      >
                        Get API key <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="apiKey"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={config.apiKeyPlaceholder}
                        className="pr-10 font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handlePaste("apiKey")}
                      className="shrink-0"
                      title="Paste from clipboard"
                    >
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {provider === "custom" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="baseUrl" className="text-sm font-medium">
                        Base URL / Endpoint
                      </Label>
                      <a
                        href="/colab-setup"
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        Get free endpoint <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="baseUrl"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://your-colab-endpoint.gradio.live"
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handlePaste("baseUrl")}
                        className="shrink-0"
                        title="Paste from clipboard"
                      >
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Need a free endpoint? <a href="/colab-setup" className="text-blue-600 hover:underline">Click here</a> for Google Colab setup code
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="model" className="text-sm font-medium">
                    Model
                  </Label>
                  {provider === "custom" ? (
                    <div className="flex gap-2">
                      <Input
                        id="model"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        placeholder="model-name or path"
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handlePaste("model")}
                        className="shrink-0"
                        title="Paste from clipboard"
                      >
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="font-mono text-sm">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {config.models.map((m) => (
                          <SelectItem key={m} value={m} className="font-mono">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {testStatus !== "idle" && (
                  <div
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg",
                      testStatus === "success" && "bg-green-50 text-green-800",
                      testStatus === "error" && "bg-red-50 text-red-800",
                      testStatus === "testing" && "bg-gray-50 text-gray-600"
                    )}
                  >
                    {testStatus === "testing" && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {testStatus === "success" && <Check className="h-4 w-4" />}
                    {testStatus === "error" && <AlertCircle className="h-4 w-4" />}
                    <span className="text-sm">
                      {testStatus === "testing" && "Testing connection..."}
                      {testStatus === "success" && "Connection successful!"}
                      {testStatus === "error" && (testError || "Connection failed")}
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="docs" className="m-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Quick Start Guide</h3>
                  
                  <div className="space-y-4">
                    <Card className="p-4 space-y-2">
                      <h4 className="font-medium text-sm">OpenAI</h4>
                      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Go to platform.openai.com and sign in</li>
                        <li>Navigate to API Keys section</li>
                        <li>Create a new secret key</li>
                        <li>Copy and paste it above</li>
                      </ol>
                    </Card>

                    <Card className="p-4 space-y-2">
                      <h4 className="font-medium text-sm">Anthropic (Claude)</h4>
                      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Go to console.anthropic.com</li>
                        <li>Navigate to API Keys</li>
                        <li>Create a new key</li>
                        <li>Copy and paste it above</li>
                      </ol>
                    </Card>

                    <Card className="p-4 space-y-2 bg-blue-50 border-blue-200">
                      <h4 className="font-medium text-sm text-blue-900">Google Colab (Free - No API Key!)</h4>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Visit the <a href="/colab-setup" className="underline font-medium">Free AI Setup page</a></li>
                        <li>Copy the ready-to-use code</li>
                        <li>Paste into Google Colab and run</li>
                        <li>Copy the generated URL back here</li>
                        <li>No API key needed - it's completely free!</li>
                      </ol>
                      <a 
                        href="/colab-setup" 
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 mt-2"
                      >
                        Go to setup page <ExternalLink className="w-3 h-3" />
                      </a>
                    </Card>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Custom Commands</h4>
                    <p className="text-sm text-gray-600">
                      Once connected, you can use special commands in the agent chat:
                    </p>
                    <div className="mt-3 space-y-2">
                      <code className="block text-xs bg-gray-100 p-2 rounded">/search &lt;pattern&gt; - Search code files</code>
                      <code className="block text-xs bg-gray-100 p-2 rounded">/run &lt;command&gt; - Execute terminal command</code>
                      <code className="block text-xs bg-gray-100 p-2 rounded">/create &lt;file&gt; - Create a new file</code>
                      <code className="block text-xs bg-gray-100 p-2 rounded">/help - Show all commands</code>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              {apiSettings && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTest} disabled={!isValid}>
                {testStatus === "testing" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValid}
                className="bg-gray-900 hover:bg-gray-800"
              >
                <Check className="h-4 w-4 mr-2" />
                Save & Connect
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
