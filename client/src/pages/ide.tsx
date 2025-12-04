import { useEffect } from "react";
import { ProjectHeader } from "@/components/ProjectHeader";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import { Terminal } from "@/components/Terminal";
import { RightPanel } from "@/components/RightPanel";
import { CommandPalette } from "@/components/CommandPalette";
import { ApiSettingsModal } from "@/components/ApiSettingsModal";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function IDE() {
  const {
    currentProject,
    projects,
    isSidebarCollapsed,
    isRightPanelVisible,
    createProject,
    setCurrentProject,
    theme,
  } = useAppStore();

  // Initialize with a project if none exists
  useEffect(() => {
    if (projects.length === 0) {
      createProject("My Project", "A new AgentForge project");
    } else if (!currentProject) {
      setCurrentProject(projects[0]);
    }
  }, [projects, currentProject, createProject, setCurrentProject]);

  // Sync theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="ide-container">
      {/* Header */}
      <ProjectHeader />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "border-r bg-muted/30 transition-all duration-200 overflow-hidden",
            isSidebarCollapsed ? "w-0" : "w-64"
          )}
        >
          <FileExplorer />
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CodeEditor />
          </div>
          <Terminal />
        </div>

        {/* Right panel */}
        {isRightPanelVisible && (
          <div className="w-80 lg:w-96 overflow-hidden">
            <RightPanel />
          </div>
        )}
      </div>

      {/* Modals */}
      <CommandPalette />
      <ApiSettingsModal />
    </div>
  );
}
