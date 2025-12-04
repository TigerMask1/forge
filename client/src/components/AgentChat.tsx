import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileCode,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

interface ChatMessageProps {
  message: Message;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser && "bg-accent/30"
      )}
      data-testid={`message-${message.id}`}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser
            ? "bg-primary text-primary-foreground"
            : isSystem
            ? "bg-amber-500/10 text-amber-500"
            : "bg-accent text-foreground"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isSystem ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser ? "You" : isSystem ? "System" : "Agent"}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.stepId && (
            <Badge variant="secondary" className="text-xs">
              {message.stepId}
            </Badge>
          )}
        </div>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        {message.isStreaming && (
          <Loader2 className="h-4 w-4 animate-spin mt-2" />
        )}
        {message.fileChanges && message.fileChanges.length > 0 && (
          <div className="mt-3 space-y-2">
            <span className="text-xs text-muted-foreground font-medium">
              File changes:
            </span>
            {message.fileChanges.map((change, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded-md"
              >
                <FileCode className="h-3.5 w-3.5" />
                <span className="font-mono">{change.filePath}</span>
                <Badge
                  variant={
                    change.changeType === "create"
                      ? "default"
                      : change.changeType === "delete"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {change.changeType}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AgentChat() {
  const {
    messages,
    isAgentRunning,
    currentStepId,
    apiSettings,
    apiError,
    currentProject,
    addMessage,
    setAgentRunning,
    setApiError,
    toggleApiSettings,
  } = useAppStore();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/agent/chat", {
        message: content,
        projectId: currentProject?.id,
        apiSettings,
      });
      return response.json() as Promise<{ message: string; fileChanges?: any[] }>;
    },
    onSuccess: (data: { message: string; fileChanges?: any[] }) => {
      addMessage({
        role: "assistant",
        content: data.message,
        fileChanges: data.fileChanges,
      });
      setAgentRunning(false);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "An error occurred";
      
      // Parse error type from message
      let errorType: "rate_limit" | "quota_exceeded" | "invalid_key" | "network_error" | "unknown" = "unknown";
      if (errorMessage.includes("rate limit")) {
        errorType = "rate_limit";
      } else if (errorMessage.includes("quota") || errorMessage.includes("exceeded")) {
        errorType = "quota_exceeded";
      } else if (errorMessage.includes("invalid") || errorMessage.includes("API key")) {
        errorType = "invalid_key";
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        errorType = "network_error";
      }

      setApiError({
        type: errorType,
        message: errorMessage,
      });
      
      addMessage({
        role: "system",
        content: `Error: ${errorMessage}`,
      });
      setAgentRunning(false);
    },
  });

  const handleSend = () => {
    if (!input.trim() || isAgentRunning) return;
    
    if (!apiSettings) {
      toggleApiSettings();
      return;
    }

    const content = input.trim();
    setInput("");
    addMessage({ role: "user", content });
    setAgentRunning(true);
    setApiError(null);
    sendMessageMutation.mutate(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col" data-testid="agent-chat">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Agent</span>
          {isAgentRunning && (
            <Badge variant="secondary" className="text-xs">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              {currentStepId || "Processing"}
            </Badge>
          )}
        </div>
        {apiSettings ? (
          <Badge
            variant="outline"
            className="text-xs cursor-pointer"
            onClick={toggleApiSettings}
          >
            <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
            {apiSettings.provider}
          </Badge>
        ) : (
          <Badge
            variant="destructive"
            className="text-xs cursor-pointer"
            onClick={toggleApiSettings}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            No API configured
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-medium mb-1">Start a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Describe what you want to build and the agent will help you
              implement it step by step.
            </p>
            {!apiSettings && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={toggleApiSettings}
                data-testid="button-configure-api"
              >
                Configure API
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {apiError && (
        <div className="px-3 py-2 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">
              {apiError.type === "rate_limit"
                ? "Rate limit reached"
                : apiError.type === "quota_exceeded"
                ? "API quota exceeded"
                : apiError.type === "invalid_key"
                ? "Invalid API key"
                : "Error"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {apiError.message}
          </p>
        </div>
      )}

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              apiSettings
                ? "Describe what you want to build..."
                : "Configure API to start chatting"
            }
            className="min-h-[80px] resize-none"
            disabled={!apiSettings || isAgentRunning}
            data-testid="input-agent-message"
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </span>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || !apiSettings || isAgentRunning}
            data-testid="button-send-message"
          >
            {isAgentRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
