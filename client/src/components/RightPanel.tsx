import { Bot, Settings, GitBranch, Layers, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { StreamingAgentChat } from "./StreamingAgentChat";
import { AgentConfigPanel } from "./AgentConfigPanel";
import { DiffViewer } from "./DiffViewer";
import { PromptChainDesigner } from "./PromptChainDesigner";
import { SearchPanel } from "./SearchPanel";
import { LogsPanel } from "./LogsPanel";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "agent" as const, label: "Agent", icon: Bot },
  { id: "search" as const, label: "Search", icon: Search },
  { id: "diff" as const, label: "Diff", icon: GitBranch },
  { id: "logs" as const, label: "Logs", icon: FileText },
  { id: "chains" as const, label: "Chains", icon: Layers },
  { id: "config" as const, label: "Config", icon: Settings },
];

export function RightPanel() {
  const { rightPanelMode, setRightPanelMode, pendingChanges, messages, terminalLines } = useAppStore();

  const pendingCount = pendingChanges.filter((c) => c.status === "pending").length;
  const logsCount = messages.length + terminalLines.length;

  return (
    <div className="h-full flex flex-col bg-background border-l" data-testid="right-panel">
      <div className="flex border-b bg-muted/30 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const showBadge = (tab.id === "diff" && pendingCount > 0) || (tab.id === "logs" && logsCount > 0);
          const badgeCount = tab.id === "diff" ? pendingCount : tab.id === "logs" ? logsCount : 0;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 min-w-0 rounded-none h-10 gap-1.5 relative px-2",
                rightPanelMode === tab.id && "bg-background border-b-2 border-b-primary"
              )}
              onClick={() => setRightPanelMode(tab.id)}
              data-testid={`button-panel-${tab.id}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline text-xs truncate">{tab.label}</span>
              {showBadge && badgeCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center text-[10px] bg-primary text-primary-foreground rounded-full px-1">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        {rightPanelMode === "agent" && <StreamingAgentChat />}
        {rightPanelMode === "config" && <AgentConfigPanel />}
        {rightPanelMode === "diff" && <DiffViewer />}
        {rightPanelMode === "chains" && <PromptChainDesigner />}
        {rightPanelMode === "search" && <SearchPanel />}
        {rightPanelMode === "logs" && <LogsPanel />}
      </div>
    </div>
  );
}
