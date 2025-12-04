import { useState } from "react";
import {
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play,
  Edit2,
  Check,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAppStore } from "@/lib/store";
import type { PromptChain, PromptStep } from "@shared/schema";
import { cn } from "@/lib/utils";

const stepTypeColors: Record<string, string> = {
  extract: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  transform: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  validate: "bg-green-500/10 text-green-500 border-green-500/20",
  implement: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  refine: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  custom: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

interface StepEditorProps {
  step: PromptStep;
  onUpdate: (step: PromptStep) => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function StepEditor({
  step,
  onUpdate,
  onDelete,
  isFirst,
  isLast,
}: StepEditorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Card className={cn("p-4", stepTypeColors[step.type])}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {step.order + 1}
              </Badge>
              <span className="font-medium text-sm">{step.name}</span>
              <Badge variant="secondary" className="text-xs capitalize">
                {step.type}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CollapsibleContent className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Step Name</Label>
                <Input
                  value={step.name}
                  onChange={(e) => onUpdate({ ...step, name: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Step Type</Label>
                <Select
                  value={step.type}
                  onValueChange={(value: PromptStep["type"]) =>
                    onUpdate({ ...step, type: value })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extract">Extract</SelectItem>
                    <SelectItem value="transform">Transform</SelectItem>
                    <SelectItem value="validate">Validate</SelectItem>
                    <SelectItem value="implement">Implement</SelectItem>
                    <SelectItem value="refine">Refine</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">System Prompt</Label>
              <Textarea
                value={step.systemPrompt}
                onChange={(e) =>
                  onUpdate({ ...step, systemPrompt: e.target.value })
                }
                className="min-h-[80px] text-sm font-mono"
                placeholder="Define the AI's role and behavior..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">
                User Prompt Template
                <span className="text-muted-foreground ml-1">
                  (use {"{{variable}}"} for placeholders)
                </span>
              </Label>
              <Textarea
                value={step.userPromptTemplate}
                onChange={(e) =>
                  onUpdate({ ...step, userPromptTemplate: e.target.value })
                }
                className="min-h-[80px] text-sm font-mono"
                placeholder="Enter the prompt template..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Output Format</Label>
              <Select
                value={step.outputFormat || "text"}
                onValueChange={(value: "text" | "json" | "code") =>
                  onUpdate({ ...step, outputFormat: value })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {!isLast && (
        <div className="flex justify-center py-2">
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export function PromptChainDesigner() {
  const { currentProject, updatePromptChain, setActiveChain } = useAppStore();
  const [editingChainId, setEditingChainId] = useState<string | null>(null);
  const [newChainName, setNewChainName] = useState("");

  const chains = currentProject?.promptChains || [];
  const activeChain = chains.find((c) => c.isActive);

  const handleUpdateStep = (chainId: string, stepIndex: number, step: PromptStep) => {
    const chain = chains.find((c) => c.id === chainId);
    if (!chain) return;

    const newSteps = [...chain.steps];
    newSteps[stepIndex] = step;
    updatePromptChain(chainId, { steps: newSteps });
  };

  const handleDeleteStep = (chainId: string, stepIndex: number) => {
    const chain = chains.find((c) => c.id === chainId);
    if (!chain) return;

    const newSteps = chain.steps
      .filter((_, i) => i !== stepIndex)
      .map((s, i) => ({ ...s, order: i }));
    updatePromptChain(chainId, { steps: newSteps });
  };

  const handleAddStep = (chainId: string) => {
    const chain = chains.find((c) => c.id === chainId);
    if (!chain) return;

    const newStep: PromptStep = {
      id: Math.random().toString(36).substring(2, 15),
      name: "New Step",
      type: "custom",
      order: chain.steps.length,
      systemPrompt: "",
      userPromptTemplate: "",
      outputFormat: "text",
    };

    updatePromptChain(chainId, { steps: [...chain.steps, newStep] });
  };

  return (
    <div className="h-full flex flex-col" data-testid="prompt-chain-designer">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Prompt Chains</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {chains.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No chains yet</p>
            </div>
          ) : (
            chains.map((chain) => (
              <Card key={chain.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    {editingChainId === chain.id ? (
                      <Input
                        value={newChainName}
                        onChange={(e) => setNewChainName(e.target.value)}
                        onBlur={() => {
                          if (newChainName.trim()) {
                            updatePromptChain(chain.id, { name: newChainName });
                          }
                          setEditingChainId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (newChainName.trim()) {
                              updatePromptChain(chain.id, { name: newChainName });
                            }
                            setEditingChainId(null);
                          }
                        }}
                        className="h-7 text-sm w-40"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-sm">{chain.name}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setNewChainName(chain.name);
                        setEditingChainId(chain.id);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {chain.isActive && (
                      <Badge variant="default" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Active
                      </Label>
                      <Switch
                        checked={chain.isActive}
                        onCheckedChange={() => setActiveChain(chain.id)}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 space-y-0">
                  {chain.steps.map((step, i) => (
                    <StepEditor
                      key={step.id}
                      step={step}
                      onUpdate={(updatedStep) =>
                        handleUpdateStep(chain.id, i, updatedStep)
                      }
                      onDelete={() => handleDeleteStep(chain.id, i)}
                      isFirst={i === 0}
                      isLast={i === chain.steps.length - 1}
                    />
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 border-dashed"
                    onClick={() => handleAddStep(chain.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>

                {chain.description && (
                  <div className="px-3 pb-3">
                    <p className="text-xs text-muted-foreground">
                      {chain.description}
                    </p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
