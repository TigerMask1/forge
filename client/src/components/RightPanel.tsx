import { Bot, Settings, GitBranch, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { AgentChat } from "./AgentChat";
import { AgentConfigPanel } from "./AgentConfigPanel";
import { DiffViewer } from "./DiffViewer";
import { PromptChainDesigner } from "./PromptChainDesigner";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "agent" as const, label: "Agent", icon: Bot },
  { id: "config" as const, label: "Config", icon: Settings },
  { id: "diff" as const, label: "Diff", icon: GitBranch },
  { id: "chains" as const, label: "Chains", icon: Layers },
];

export function RightPanel() {
  const { rightPanelMode, setRightPanelMode, pendingChanges } = useAppStore();

  const pendingCount = pendingChanges.filter((c) => c.status === "pending").length;

  return (
    <div className="h-full flex flex-col bg-background border-l" data-testid="right-panel">
      {/* Tab bar */}
      <div className="flex border-b bg-muted/30">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const showBadge = tab.id === "diff" && pendingCount > 0;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 rounded-none h-10 gap-2 relative",
                rightPanelMode === tab.id && "bg-background border-b-2 border-b-primary"
              )}
              onClick={() => setRightPanelMode(tab.id)}
              data-testid={`button-panel-${tab.id}`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden lg:inline text-xs">{tab.label}</span>
              {showBadge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {rightPanelMode === "agent" && <AgentChat />}
        {rightPanelMode === "config" && <AgentConfigPanel />}
        {rightPanelMode === "diff" && <DiffViewer />}
        {rightPanelMode === "chains" && <PromptChainDesigner />}
      </div>
    </div>
  );
}
