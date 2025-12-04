import { useState } from "react";
import {
  Settings,
  Plus,
  Trash2,
  ChevronDown,
  Save,
  FileCode,
  Shield,
  Code,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import type { AgentConfig } from "@shared/schema";

interface ListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}

function ListEditor({ items, onChange, placeholder }: ListEditorProps) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onChange([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs gap-1">
            {item}
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="ml-1 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function AgentConfigPanel() {
  const { currentProject, updateAgentConfig } = useAppStore();
  const { toast } = useToast();

  const config = currentProject?.agentConfig;

  if (!config) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center mb-4">
          <Settings className="h-6 w-6 text-muted-foreground/70" />
        </div>
        <h3 className="text-base font-medium mb-1">No project selected</h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Create or select a project to configure the agent settings.
        </p>
      </div>
    );
  }

  const handleSave = () => {
    toast({
      title: "Configuration saved",
      description: "AGENTS.md has been updated with your changes.",
    });
  };

  return (
    <div className="h-full flex flex-col" data-testid="agent-config-panel">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Agent Configuration</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="h-3.5 w-3.5 mr-1" />
          Save
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <Accordion type="multiple" defaultValue={["basic", "code-style"]} className="space-y-2">
            {/* Basic Info */}
            <AccordionItem value="basic" className="border rounded-lg px-3">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  <span className="text-sm font-medium">Project Info</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Project Name</Label>
                  <Input
                    value={config.projectName}
                    onChange={(e) =>
                      updateAgentConfig({ projectName: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={config.description || ""}
                    onChange={(e) =>
                      updateAgentConfig({ description: e.target.value })
                    }
                    className="min-h-[60px] text-sm"
                    placeholder="Describe your project..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tech Stack</Label>
                  <ListEditor
                    items={config.techStack}
                    onChange={(techStack) => updateAgentConfig({ techStack })}
                    placeholder="Add technology..."
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Code Style */}
            <AccordionItem value="code-style" className="border rounded-lg px-3">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span className="text-sm font-medium">Code Style</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-green-600">Do's</Label>
                  <ListEditor
                    items={config.codeStyle.dos}
                    onChange={(dos) =>
                      updateAgentConfig({
                        codeStyle: { ...config.codeStyle, dos },
                      })
                    }
                    placeholder="Add a best practice..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-red-600">Don'ts</Label>
                  <ListEditor
                    items={config.codeStyle.donts}
                    onChange={(donts) =>
                      updateAgentConfig({
                        codeStyle: { ...config.codeStyle, donts },
                      })
                    }
                    placeholder="Add an anti-pattern..."
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Safety Rules */}
            <AccordionItem value="safety" className="border rounded-lg px-3">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Safety Rules</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-green-600">
                    Allowed Without Prompt
                  </Label>
                  <ListEditor
                    items={config.safetyRules.allowedWithoutPrompt}
                    onChange={(allowedWithoutPrompt) =>
                      updateAgentConfig({
                        safetyRules: {
                          ...config.safetyRules,
                          allowedWithoutPrompt,
                        },
                      })
                    }
                    placeholder="Add allowed action..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-amber-600">
                    Requires Approval
                  </Label>
                  <ListEditor
                    items={config.safetyRules.requiresApproval}
                    onChange={(requiresApproval) =>
                      updateAgentConfig({
                        safetyRules: { ...config.safetyRules, requiresApproval },
                      })
                    }
                    placeholder="Add restricted action..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-red-600">Never Modify</Label>
                  <ListEditor
                    items={config.safetyRules.neverModify}
                    onChange={(neverModify) =>
                      updateAgentConfig({
                        safetyRules: { ...config.safetyRules, neverModify },
                      })
                    }
                    placeholder="Add protected path..."
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Project Structure */}
            <AccordionItem value="structure" className="border rounded-lg px-3">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  <span className="text-sm font-medium">Project Structure</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Define key paths and their descriptions to help the agent
                  understand your project layout.
                </p>
                <div className="space-y-2">
                  {Object.entries(config.projectStructure).map(
                    ([path, desc], i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={path}
                          className="h-8 text-sm font-mono flex-1"
                          placeholder="/src/..."
                          onChange={(e) => {
                            const newStructure = { ...config.projectStructure };
                            delete newStructure[path];
                            newStructure[e.target.value] = desc;
                            updateAgentConfig({ projectStructure: newStructure });
                          }}
                        />
                        <Input
                          value={desc}
                          className="h-8 text-sm flex-[2]"
                          placeholder="Description..."
                          onChange={(e) => {
                            updateAgentConfig({
                              projectStructure: {
                                ...config.projectStructure,
                                [path]: e.target.value,
                              },
                            });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const newStructure = { ...config.projectStructure };
                            delete newStructure[path];
                            updateAgentConfig({ projectStructure: newStructure });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => {
                      updateAgentConfig({
                        projectStructure: {
                          ...config.projectStructure,
                          "": "",
                        },
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Path
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}
