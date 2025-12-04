import { useState } from "react";
import {
  FileText,
  Trash2,
  Filter,
  ChevronDown,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type LogLevel = "all" | "info" | "warn" | "error" | "success";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  source: string;
  message: string;
}

const levelIcons = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const levelColors = {
  info: "text-blue-500",
  warn: "text-yellow-500",
  error: "text-red-500",
  success: "text-green-500",
};

export function LogsPanel() {
  const { messages, terminalLines } = useAppStore();
  const [filterLevel, setFilterLevel] = useState<LogLevel>("all");

  const logs: LogEntry[] = [
    ...messages.map((m) => ({
      id: m.id,
      timestamp: m.timestamp,
      level: m.role === "system" ? "error" as const : "info" as const,
      source: m.role === "assistant" ? "Agent" : m.role === "user" ? "User" : "System",
      message: m.content.slice(0, 200) + (m.content.length > 200 ? "..." : ""),
    })),
    ...terminalLines.map((t) => ({
      id: t.id,
      timestamp: t.timestamp,
      level: t.type === "error" ? "error" as const : t.type === "info" ? "info" as const : "success" as const,
      source: "Terminal",
      message: t.content,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredLogs = filterLevel === "all" 
    ? logs 
    : logs.filter(log => log.level === filterLevel);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col" data-testid="logs-panel">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Activity Logs</span>
          <span className="text-xs text-muted-foreground">
            ({filteredLogs.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" data-testid="logs-filter-button">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-xs capitalize">{filterLevel}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterLevel("all")}>
                All Levels
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterLevel("info")}>
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                Info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterLevel("warn")}>
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                Warning
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterLevel("error")}>
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                Error
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterLevel("success")}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Success
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No logs yet</p>
              <p className="text-xs">Activity will appear here</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const Icon = levelIcons[log.level];
              return (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded text-sm",
                    "hover:bg-muted/50 transition-colors"
                  )}
                >
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", levelColors[log.level])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{log.source}</span>
                      <span>•</span>
                      <span>{formatTime(log.timestamp)}</span>
                    </div>
                    <p className="text-sm mt-0.5 break-words">{log.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
