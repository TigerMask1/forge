import { Check, X, FileCode, Plus, Minus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface DiffLineProps {
  type: "unchanged" | "added" | "removed";
  content: string;
  lineNumber: number;
}

function DiffLine({ type, content, lineNumber }: DiffLineProps) {
  return (
    <div
      className={cn(
        "flex font-mono text-sm",
        type === "added" && "bg-green-500/10",
        type === "removed" && "bg-red-500/10"
      )}
    >
      <span className="w-12 px-2 py-0.5 text-right text-muted-foreground border-r select-none">
        {lineNumber}
      </span>
      <span className="w-6 px-1 py-0.5 text-center border-r select-none">
        {type === "added" && <Plus className="h-3 w-3 text-green-500 inline" />}
        {type === "removed" && <Minus className="h-3 w-3 text-red-500 inline" />}
      </span>
      <span className="flex-1 px-2 py-0.5 whitespace-pre">{content}</span>
    </div>
  );
}

function parseDiff(originalContent: string, newContent: string) {
  const originalLines = originalContent.split("\n");
  const newLines = newContent.split("\n");
  const result: DiffLineProps[] = [];
  
  let lineNumber = 1;
  const maxLines = Math.max(originalLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i];
    const newLine = newLines[i];
    
    if (origLine === newLine) {
      result.push({
        type: "unchanged",
        content: origLine || "",
        lineNumber: lineNumber++,
      });
    } else {
      if (origLine !== undefined) {
        result.push({
          type: "removed",
          content: origLine,
          lineNumber: lineNumber,
        });
      }
      if (newLine !== undefined) {
        result.push({
          type: "added",
          content: newLine,
          lineNumber: lineNumber++,
        });
      }
    }
  }
  
  return result;
}

export function DiffViewer() {
  const { pendingChanges, approveChange, rejectChange, clearPendingChanges } =
    useAppStore();

  const activePendingChanges = pendingChanges.filter(
    (c) => c.status === "pending"
  );

  if (activePendingChanges.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center mb-4">
          <FileCode className="h-6 w-6 text-muted-foreground/70" />
        </div>
        <h3 className="text-base font-medium mb-1">No pending changes</h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          When the agent makes changes to your files, they will appear here for
          review before being applied.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="diff-viewer">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Pending Changes</span>
          <Badge variant="secondary">{activePendingChanges.length}</Badge>
        </div>
        {activePendingChanges.length > 1 && (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                activePendingChanges.forEach((c) => approveChange(c.id))
              }
              data-testid="button-approve-all"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Approve All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearPendingChanges}
              data-testid="button-reject-all"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reject All
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {activePendingChanges.map((change) => {
            const diffLines = parseDiff(
              change.originalContent,
              change.newContent
            );
            const addedCount = diffLines.filter((l) => l.type === "added").length;
            const removedCount = diffLines.filter(
              (l) => l.type === "removed"
            ).length;

            return (
              <Card key={change.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{change.filePath}</span>
                    <Badge
                      variant={
                        change.changeType === "create"
                          ? "default"
                          : change.changeType === "delete"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {change.changeType === "create" && (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      {change.changeType === "modify" && (
                        <Edit className="h-3 w-3 mr-1" />
                      )}
                      {change.changeType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      <span className="text-green-500">+{addedCount}</span>
                      {" / "}
                      <span className="text-red-500">-{removedCount}</span>
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => approveChange(change.id)}
                      data-testid={`button-approve-${change.id}`}
                    >
                      <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rejectChange(change.id)}
                      data-testid={`button-reject-${change.id}`}
                    >
                      <X className="h-3.5 w-3.5 mr-1 text-red-500" />
                      Reject
                    </Button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-auto">
                  {diffLines.map((line, i) => (
                    <DiffLine key={i} {...line} />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
