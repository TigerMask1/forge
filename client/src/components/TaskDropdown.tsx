import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Circle,
  CheckCircle2,
  Code,
  Search,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AgentTask, TaskStatus, TaskPriority } from "@shared/schema";

const STATUS_CONFIG: Record<TaskStatus, { icon: typeof Circle; color: string; label: string }> = {
  todo: { icon: Circle, color: "text-muted-foreground", label: "To Do" },
  analyzing: { icon: Search, color: "text-blue-500", label: "Analyzing" },
  coding: { icon: Code, color: "text-amber-500", label: "Coding" },
  reviewing: { icon: Loader2, color: "text-purple-500", label: "Reviewing" },
  done: { icon: CheckCircle2, color: "text-green-500", label: "Done" },
  failed: { icon: AlertCircle, color: "text-destructive", label: "Failed" },
};

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bgColor: string }> = {
  critical: { color: "text-red-600 dark:text-red-400", bgColor: "bg-red-500/10" },
  high: { color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-500/10" },
  medium: { color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-500/10" },
  low: { color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10" },
};

function TaskItem({ task }: { task: AgentTask }) {
  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const StatusIcon = statusConfig.icon;
  const isAnimating = task.status === "analyzing" || task.status === "coding" || task.status === "reviewing";

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 border-b last:border-b-0",
        task.status === "done" && "opacity-60"
      )}
      data-testid={`task-item-${task.id}`}
    >
      <div className={cn("mt-0.5", statusConfig.color)}>
        <StatusIcon className={cn("h-4 w-4", isAnimating && "animate-pulse")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">{task.title}</span>
          <Badge 
            variant="outline" 
            className={cn("text-xs shrink-0", priorityConfig.color, priorityConfig.bgColor)}
          >
            {task.priority}
          </Badge>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        {task.filePath && (
          <span className="text-xs text-muted-foreground font-mono mt-1 block truncate">
            {task.filePath}
          </span>
        )}
      </div>
    </div>
  );
}

function TaskSection({ 
  title, 
  tasks, 
  icon: Icon,
  iconColor 
}: { 
  title: string; 
  tasks: AgentTask[];
  icon: typeof Circle;
  iconColor: string;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-4">
      <div className={cn("flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wide", iconColor)}>
        <Icon className="h-3.5 w-3.5" />
        <span>{title}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {tasks.length}
        </Badge>
      </div>
      <div className="divide-y">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export function TaskDropdown() {
  const { agentTasks, isTaskDropdownOpen, toggleTaskDropdown, currentPhase } = useAppStore();

  const groupedTasks = {
    active: agentTasks.filter(t => ["analyzing", "coding", "reviewing"].includes(t.status)),
    todo: agentTasks.filter(t => t.status === "todo"),
    done: agentTasks.filter(t => t.status === "done"),
    failed: agentTasks.filter(t => t.status === "failed"),
  };

  const activeCount = groupedTasks.active.length;
  const totalCount = agentTasks.length;
  const doneCount = groupedTasks.done.length;

  if (agentTasks.length === 0) return null;

  return (
    <div 
      className="fixed top-16 right-4 z-50"
      data-testid="task-dropdown"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTaskDropdown}
        className={cn(
          "gap-2 shadow-lg bg-background/95 backdrop-blur-sm border",
          activeCount > 0 && "border-amber-500/50"
        )}
        data-testid="button-toggle-tasks"
      >
        {activeCount > 0 ? (
          <div className="relative">
            <Code className="h-4 w-4 text-amber-500" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        <span className="text-xs">
          {doneCount}/{totalCount} Tasks
        </span>
        {isTaskDropdownOpen ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>

      {isTaskDropdownOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-80 rounded-lg border bg-background/95 backdrop-blur-sm shadow-xl"
          data-testid="task-dropdown-content"
        >
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Agent Tasks</span>
              <Badge variant="secondary" className="text-xs">
                Phase: {currentPhase}
              </Badge>
            </div>
            <div className="flex gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(doneCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round((doneCount / totalCount) * 100)}%
              </span>
            </div>
          </div>

          <ScrollArea className="max-h-96">
            <div className="p-1">
              <TaskSection
                title="In Progress"
                tasks={groupedTasks.active}
                icon={Loader2}
                iconColor="text-amber-500"
              />
              <TaskSection
                title="To Do"
                tasks={groupedTasks.todo}
                icon={Circle}
                iconColor="text-muted-foreground"
              />
              <TaskSection
                title="Completed"
                tasks={groupedTasks.done}
                icon={CheckCircle2}
                iconColor="text-green-500"
              />
              <TaskSection
                title="Failed"
                tasks={groupedTasks.failed}
                icon={AlertCircle}
                iconColor="text-destructive"
              />
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
