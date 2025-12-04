import { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  Play,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const BUILT_IN_COMMANDS: Record<string, { description: string; handler: (args: string[], context: any) => string }> = {
  help: {
    description: "Show available commands",
    handler: () => {
      return `Available Commands:
  help              - Show this help message
  clear             - Clear terminal output
  ls [path]         - List files in directory
  cat <file>        - Display file contents
  pwd               - Print working directory
  echo <text>       - Print text to terminal
  search <pattern>  - Search in files
  create <file>     - Create a new file
  mkdir <dir>       - Create a new directory
  rm <file>         - Delete a file (requires confirmation)
  env               - Show environment info
  agent <message>   - Send a message to the AI agent`;
    },
  },
  clear: {
    description: "Clear the terminal",
    handler: () => "CLEAR",
  },
  pwd: {
    description: "Print working directory",
    handler: () => "/project",
  },
  env: {
    description: "Show environment info",
    handler: () => {
      return `Environment: Development
Node: v20.x
Platform: AgentForge Virtual Environment
Workspace: /project`;
    },
  },
  echo: {
    description: "Print text",
    handler: (args) => args.join(" ") || "",
  },
  ls: {
    description: "List files",
    handler: (args, context) => {
      const project = context.currentProject;
      if (!project) return "No project loaded";
      
      const files = Object.values(project.files) as any[];
      const targetPath = args[0] || "/";
      
      const matchingFiles = files.filter((f: any) => {
        if (targetPath === "/") return f.parentId === null;
        return f.path.startsWith(targetPath);
      });
      
      if (matchingFiles.length === 0) return `No files found in ${targetPath}`;
      
      return matchingFiles.map((f: any) => {
        const prefix = f.type === "folder" ? "[dir]" : "[file]";
        return `${prefix} ${f.name}`;
      }).join("\n");
    },
  },
  cat: {
    description: "Show file contents",
    handler: (args, context) => {
      const fileName = args[0];
      if (!fileName) return "Usage: cat <filename>";
      
      const project = context.currentProject;
      if (!project) return "No project loaded";
      
      const file = Object.values(project.files).find((f: any) => 
        f.name === fileName || f.path === fileName || f.path.endsWith(`/${fileName}`)
      ) as any;
      
      if (!file) return `File not found: ${fileName}`;
      if (file.type === "folder") return `${fileName} is a directory`;
      
      return file.content || "(empty file)";
    },
  },
  search: {
    description: "Search in files",
    handler: (args, context) => {
      const pattern = args[0];
      if (!pattern) return "Usage: search <pattern>";
      
      const project = context.currentProject;
      if (!project) return "No project loaded";
      
      const results: string[] = [];
      const regex = new RegExp(pattern, "gi");
      
      for (const file of Object.values(project.files) as any[]) {
        if (file.type === "folder" || !file.content) continue;
        
        const lines = file.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            results.push(`${file.path}:${i + 1}: ${lines[i].trim().slice(0, 60)}`);
          }
        }
      }
      
      if (results.length === 0) return `No matches found for "${pattern}"`;
      return `Found ${results.length} match(es):\n${results.slice(0, 20).join("\n")}${results.length > 20 ? `\n... and ${results.length - 20} more` : ""}`;
    },
  },
};

export function Terminal() {
  const {
    terminalLines,
    isTerminalVisible,
    currentProject,
    toggleTerminal,
    addTerminalLine,
    clearTerminal,
  } = useAppStore();

  const [command, setCommand] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    addTerminalLine({ type: "input", content: `$ ${trimmedCmd}` });
    setCommandHistory((prev) => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    const parts = trimmedCmd.split(" ");
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const builtInCmd = BUILT_IN_COMMANDS[cmdName];
    if (builtInCmd) {
      const result = builtInCmd.handler(args, { currentProject });
      if (result === "CLEAR") {
        clearTerminal();
      } else if (result) {
        addTerminalLine({ type: "output", content: result });
      }
    } else if (cmdName === "create") {
      const fileName = args.join(" ");
      if (!fileName) {
        addTerminalLine({ type: "error", content: "Usage: create <filename>" });
      } else {
        addTerminalLine({ type: "info", content: `Creating file: ${fileName}` });
        addTerminalLine({ type: "output", content: `File "${fileName}" created. Open it in the file explorer.` });
      }
    } else if (cmdName === "mkdir") {
      const dirName = args.join(" ");
      if (!dirName) {
        addTerminalLine({ type: "error", content: "Usage: mkdir <dirname>" });
      } else {
        addTerminalLine({ type: "info", content: `Creating directory: ${dirName}` });
        addTerminalLine({ type: "output", content: `Directory "${dirName}" created.` });
      }
    } else if (cmdName === "agent") {
      const message = args.join(" ");
      if (!message) {
        addTerminalLine({ type: "error", content: "Usage: agent <message>" });
      } else {
        addTerminalLine({ type: "info", content: `Sending to agent: "${message}"` });
        addTerminalLine({ type: "output", content: "Agent message queued. Check the Agent panel for response." });
      }
    } else {
      addTerminalLine({
        type: "info",
        content: `Command: ${cmdName} (simulated in virtual environment)`,
      });
      addTerminalLine({
        type: "output",
        content: `Executed: ${trimmedCmd}`,
      });
    }

    setCommand("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(command);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || "");
      } else {
        setHistoryIndex(-1);
        setCommand("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parts = command.split(" ");
      const partial = parts[parts.length - 1].toLowerCase();
      
      if (parts.length === 1) {
        const matches = Object.keys(BUILT_IN_COMMANDS).filter(cmd => cmd.startsWith(partial));
        if (matches.length === 1) {
          setCommand(matches[0]);
        } else if (matches.length > 1) {
          addTerminalLine({ type: "info", content: matches.join("  ") });
        }
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines]);

  useEffect(() => {
    if (isTerminalVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTerminalVisible]);

  if (!isTerminalVisible) return null;

  return (
    <div
      className={cn(
        "border-t bg-card transition-all duration-200",
        isMaximized ? "fixed inset-0 z-50" : isExpanded ? "h-64" : "h-10"
      )}
      data-testid="terminal"
    >
      <div className="flex items-center justify-between h-10 px-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Command Center</span>
          <span className="text-xs text-muted-foreground">
            {terminalLines.length} lines
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearTerminal}
            title="Clear terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
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
            title="Close terminal"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {(isExpanded || isMaximized) && (
        <div className={cn(
          "flex flex-col",
          isMaximized ? "h-[calc(100%-2.5rem)]" : "h-[calc(100%-2.5rem)]"
        )}>
          <ScrollArea className="flex-1 bg-gray-950" ref={scrollRef}>
            <div className="p-3 font-mono text-sm space-y-0.5">
              {terminalLines.length === 0 ? (
                <div className="text-gray-500">
                  <p>AgentForge Command Center v1.0</p>
                  <p>Type 'help' for available commands.</p>
                </div>
              ) : (
                terminalLines.map((line) => (
                  <div
                    key={line.id}
                    className={cn(
                      "whitespace-pre-wrap break-all",
                      line.type === "input" && "text-green-400",
                      line.type === "output" && "text-gray-300",
                      line.type === "error" && "text-red-400",
                      line.type === "info" && "text-blue-400"
                    )}
                  >
                    {line.content}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center gap-2 p-2 border-t bg-gray-900">
            <span className="text-green-400 font-mono text-sm">$</span>
            <Input
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-8 bg-transparent border-0 font-mono text-sm text-gray-200 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Enter command..."
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={() => executeCommand(command)}
              disabled={!command.trim()}
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
