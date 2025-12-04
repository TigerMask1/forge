import { useRef, useEffect, useState } from "react";
import {
  Terminal as TerminalIcon,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Terminal() {
  const {
    terminalLines,
    isTerminalVisible,
    toggleTerminal,
    addTerminalLine,
    clearTerminal,
  } = useAppStore();

  const [command, setCommand] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCommand = () => {
    if (!command.trim()) return;

    addTerminalLine({ type: "input", content: `$ ${command}` });

    // Simulate command execution
    setTimeout(() => {
      addTerminalLine({
        type: "info",
        content: `Command "${command}" executed (simulated)`,
      });
    }, 100);

    setCommand("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines]);

  if (!isTerminalVisible) return null;

  return (
    <div
      className={cn(
        "border-t bg-card transition-all duration-200",
        isExpanded ? "h-64" : "h-10"
      )}
      data-testid="terminal"
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between h-10 px-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearTerminal}
            data-testid="button-clear-terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="button-toggle-terminal-expand"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleTerminal}
            data-testid="button-close-terminal"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col h-[calc(100%-40px)]">
          <ScrollArea className="flex-1 p-2" ref={scrollRef}>
            <div className="font-mono text-sm space-y-1">
              {terminalLines.length === 0 ? (
                <span className="text-muted-foreground">
                  Terminal ready. Type a command...
                </span>
              ) : (
                terminalLines.map((line) => (
                  <div
                    key={line.id}
                    className={cn(
                      "leading-relaxed",
                      line.type === "input" && "text-foreground",
                      line.type === "output" && "text-muted-foreground",
                      line.type === "error" && "text-destructive",
                      line.type === "info" && "text-blue-500"
                    )}
                    data-testid={`terminal-line-${line.id}`}
                  >
                    {line.content}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground">$</span>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCommand()}
                placeholder="Enter command..."
                className="font-mono text-sm h-8 border-0 focus-visible:ring-0 bg-transparent"
                data-testid="input-terminal-command"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
