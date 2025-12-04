import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  AlertCircle,
  CheckCircle,
  FileCode,
  Sparkles,
  Square,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PhaseIndicator, InlinePhaseLoader } from "./PhaseIndicator";
import type { Message, StreamingChunk, AgentTask } from "@shared/schema";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

function TypewriterText({ content }: { content: string }) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 8);
      return () => clearTimeout(timer);
    }
  }, [content, currentIndex]);

  useEffect(() => {
    if (content.length < displayedContent.length) {
      setDisplayedContent(content);
      setCurrentIndex(content.length);
    }
  }, [content, displayedContent.length]);

  return (
    <span className="whitespace-pre-wrap">
      {displayedContent}
      {currentIndex < content.length && (
        <span className="inline-block w-2 h-4 bg-foreground/80 animate-pulse ml-0.5" />
      )}
    </span>
  );
}

function ChatMessage({ message, isStreaming }: ChatMessageProps) {
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
        <div className="text-sm">
          {isStreaming && !isUser ? (
            <TypewriterText content={message.content} />
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}
        </div>
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

export function StreamingAgentChat() {
  const {
    messages,
    isAgentRunning,
    isStreaming,
    currentPhase,
    streamingContent,
    apiSettings,
    apiError,
    currentProject,
    agentTasks,
    addMessage,
    updateMessage,
    setAgentRunning,
    setApiError,
    toggleApiSettings,
    setCurrentPhase,
    setAgentTasks,
    updateAgentTask,
    appendStreamingContent,
    clearStreamingContent,
    setIsStreaming,
    toggleTaskDropdown,
  } = useAppStore();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const handleStream = useCallback(async (content: string) => {
    if (!apiSettings) return;

    setAgentRunning(true);
    setIsStreaming(true);
    clearStreamingContent();
    setCurrentPhase("analyzing");

    const messageId = Math.random().toString(36).substring(2, 15);
    setStreamingMessageId(messageId);
    
    addMessage({
      role: "assistant",
      content: "",
      isStreaming: true,
    });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          projectId: currentProject?.id,
          apiSettings,
          context: {
            files: currentProject?.files
              ? Object.values(currentProject.files)
                  .filter(f => f.type === "file" && f.content)
                  .slice(0, 5)
                  .map(f => ({ path: f.path, content: f.content || "" }))
              : [],
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Stream failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const chunk: StreamingChunk = JSON.parse(line.slice(6));
              
              switch (chunk.type) {
                case "token":
                  if (chunk.content) {
                    fullContent += chunk.content;
                    appendStreamingContent(chunk.content);
                  }
                  break;
                case "phase_change":
                  if (chunk.phase) {
                    setCurrentPhase(chunk.phase);
                  }
                  break;
                case "task_update":
                  if (chunk.task) {
                    const task = chunk.task;
                    const currentTasks = useAppStore.getState().agentTasks;
                    const exists = currentTasks.find(t => t.id === task.id);
                    if (exists) {
                      setAgentTasks(currentTasks.map(t => t.id === task.id ? task : t));
                    } else {
                      setAgentTasks([...currentTasks, task]);
                    }
                  }
                  break;
                case "task_complete":
                  if (chunk.task) {
                    updateAgentTask(chunk.task.id, chunk.task);
                  }
                  break;
                case "supervisor_feedback":
                  if (chunk.content) {
                    addMessage({
                      role: "system",
                      content: `Supervisor: ${chunk.content}`,
                    });
                  }
                  break;
                case "error":
                  setApiError({
                    type: "unknown",
                    message: chunk.error || "Unknown error",
                  });
                  break;
                case "complete":
                  setCurrentPhase("completed");
                  break;
              }
            } catch (e) {
              console.error("Failed to parse chunk:", e);
            }
          }
        }
      }

      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        updateMessage(lastMessage.id, {
          content: fullContent,
          isStreaming: false,
        });
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setApiError({
          type: "unknown",
          message: error.message,
        });
        addMessage({
          role: "system",
          content: `Error: ${error.message}`,
        });
      }
    } finally {
      setAgentRunning(false);
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  }, [apiSettings, currentProject, messages, addMessage, updateMessage, setAgentRunning, setApiError, setCurrentPhase, setAgentTasks, updateAgentTask, appendStreamingContent, clearStreamingContent, setIsStreaming]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isAgentRunning) return;
    
    if (!apiSettings) {
      toggleApiSettings();
      return;
    }

    const content = input.trim();
    setInput("");
    addMessage({ role: "user", content });
    setApiError(null);
    handleStream(content);
  }, [input, isAgentRunning, apiSettings, addMessage, setApiError, toggleApiSettings, handleStream]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

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
  }, [messages, streamingContent]);

  const displayMessages = messages.map(msg => {
    if (msg.isStreaming && streamingMessageId) {
      return { ...msg, content: streamingContent };
    }
    return msg;
  });

  return (
    <div className="h-full flex flex-col" data-testid="streaming-agent-chat">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Agent</span>
          {isStreaming && (
            <InlinePhaseLoader phase={currentPhase} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {agentTasks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTaskDropdown}
              className="gap-1"
              data-testid="button-show-tasks"
            >
              <ListTodo className="h-4 w-4" />
              <span className="text-xs">{agentTasks.filter(t => t.status === "done").length}/{agentTasks.length}</span>
            </Button>
          )}
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
              No API
            </Badge>
          )}
        </div>
      </div>

      {isStreaming && currentPhase !== "idle" && (
        <div className="p-3 border-b">
          <PhaseIndicator />
        </div>
      )}

      <ScrollArea className="flex-1" ref={scrollRef}>
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-medium mb-1">Start a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Describe what you want to build and the agent will analyze, plan, and implement it step by step.
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
            {displayMessages.map((message, index) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isStreaming={message.isStreaming && index === displayMessages.length - 1}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {apiError && (
        <div className="px-3 py-2 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Error</span>
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
          {isAgentRunning ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStop}
              data-testid="button-stop-agent"
            >
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || !apiSettings}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
