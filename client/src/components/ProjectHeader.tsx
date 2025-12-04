import { useState } from "react";
import {
  Search,
  Settings,
  FolderPlus,
  Sparkles,
  Menu,
  ChevronDown,
  Check,
  PanelRight,
  Terminal,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "./ThemeToggle";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ProjectHeader() {
  const {
    currentProject,
    projects,
    toggleSidebar,
    toggleRightPanel,
    toggleTerminal,
    toggleCommandPalette,
    toggleApiSettings,
    setCurrentProject,
    createProject,
    isSidebarCollapsed,
    isRightPanelVisible,
  } = useAppStore();

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
      setNewProjectName("");
      setNewProjectDesc("");
      setIsNewProjectOpen(false);
    }
  };

  return (
    <header
      className="h-14 border-b bg-background flex items-center justify-between px-4 gap-4"
      data-testid="project-header"
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          data-testid="button-toggle-sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-lg hidden sm:inline">AgentForge</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 min-w-[140px] justify-between"
              data-testid="button-project-selector"
            >
              <span className="truncate">
                {currentProject?.name || "Select Project"}
              </span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => setCurrentProject(project)}
                data-testid={`menu-item-project-${project.id}`}
              >
                <span className="truncate flex-1">{project.name}</span>
                {currentProject?.id === project.id && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </DropdownMenuItem>
            ))}
            {projects.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => setIsNewProjectOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-xl hidden md:block">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground gap-2"
          onClick={toggleCommandPalette}
          data-testid="button-command-palette"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search files or commands...</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTerminal}
          className="hidden sm:inline-flex"
          data-testid="button-toggle-terminal-header"
        >
          <Terminal className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleApiSettings}
          data-testid="button-api-settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightPanel}
          className={cn(!isRightPanelVisible && "text-muted-foreground")}
          data-testid="button-toggle-right-panel"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

      {/* New Project Dialog */}
      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="my-awesome-project"
                data-testid="input-new-project-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDesc">Description (optional)</Label>
              <Textarea
                id="projectDesc"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="A brief description of your project..."
                className="min-h-[80px]"
                data-testid="input-new-project-desc"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProjectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              data-testid="button-create-project"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
