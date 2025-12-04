import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { WorkflowPhase } from "@shared/schema";

const PHASE_CONFIG: Record<WorkflowPhase, { 
  label: string; 
  emoji: string;
  description: string;
}> = {
  idle: { label: "Ready", emoji: "", description: "Waiting for input" },
  analyzing: { label: "Analyzing", emoji: "", description: "Understanding the situation" },
  planning: { label: "Planning", emoji: "", description: "Creating approach" },
  structuring: { label: "Structuring", emoji: "", description: "Breaking into tasks" },
  executing: { label: "Executing", emoji: "", description: "Writing code" },
  reviewing: { label: "Reviewing", emoji: "", description: "Supervisor check" },
  completed: { label: "Done", emoji: "", description: "All tasks complete" },
  failed: { label: "Failed", emoji: "", description: "Error occurred" },
};

const PHASE_ORDER: WorkflowPhase[] = [
  "analyzing",
  "planning",
  "structuring",
  "executing",
  "reviewing",
  "completed",
];

function MinimalLoader({ phase }: { phase: WorkflowPhase }) {
  if (phase === "idle" || phase === "completed" || phase === "failed") {
    return null;
  }

  return (
    <div className="relative w-4 h-4">
      {phase === "analyzing" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {phase === "planning" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
          <div className="absolute w-3 h-3 border border-current rounded-full animate-ping opacity-50" />
        </div>
      )}
      {phase === "structuring" && (
        <div className="absolute inset-0 flex items-center justify-center gap-0.5">
          <div className="w-1 h-3 bg-current rounded-sm animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="w-1 h-2 bg-current rounded-sm animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="w-1 h-3 bg-current rounded-sm animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      )}
      {phase === "executing" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3">
            <svg viewBox="0 0 12 12" className="animate-pulse">
              <path 
                d="M2 2L10 6L2 10V2Z" 
                fill="currentColor" 
                className="opacity-80"
              />
            </svg>
          </div>
        </div>
      )}
      {phase === "reviewing" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-current rounded-sm animate-pulse" />
          <div className="absolute w-1.5 h-1.5 bg-current rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
}

export function PhaseIndicator() {
  const { currentPhase, isStreaming } = useAppStore();

  if (!isStreaming && currentPhase === "idle") {
    return null;
  }

  const config = PHASE_CONFIG[currentPhase];
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div 
      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 border"
      data-testid="phase-indicator"
    >
      <MinimalLoader phase={currentPhase} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-xs text-muted-foreground">{config.description}</span>
        </div>
        
        {currentPhase !== "idle" && currentPhase !== "failed" && (
          <div className="flex gap-1 mt-1.5">
            {PHASE_ORDER.map((phase, index) => (
              <div
                key={phase}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  index < currentIndex
                    ? "bg-green-500"
                    : index === currentIndex
                    ? "bg-primary animate-pulse"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function InlinePhaseLoader({ phase }: { phase: WorkflowPhase }) {
  const config = PHASE_CONFIG[phase];
  
  if (phase === "idle" || phase === "completed") {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <MinimalLoader phase={phase} />
      <span className="text-xs">{config.label}...</span>
    </span>
  );
}
