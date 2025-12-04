import { useEffect } from "react";
import { useLocation } from "wouter";
import { ProjectHeader } from "@/components/ProjectHeader";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import { Terminal } from "@/components/Terminal";
import { RightPanel } from "@/components/RightPanel";
import { CommandPalette } from "@/components/CommandPalette";
import { TaskDropdown } from "@/components/TaskDropdown";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function IDE() {
  const [, setLocation] = useLocation();
  const {
    currentProject,
    projects,
    isSidebarCollapsed,
    isRightPanelVisible,
    createProject,
    setCurrentProject,
    theme,
  } = useAppStore();

  useEffect(() => {
    if (!currentProject && projects.length === 0) {
      setLocation("/");
      return;
    }
    
    if (!currentProject && projects.length > 0) {
      setCurrentProject(projects[0]);
    }
  }, [projects, currentProject, setCurrentProject, setLocation]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="ide-container">
      <ProjectHeader />

      <div className="flex-1 flex overflow-hidden">
        <div
          className={cn(
            "border-r bg-muted/30 transition-all duration-200 overflow-hidden",
            isSidebarCollapsed ? "w-0" : "w-64"
          )}
        >
          <FileExplorer />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CodeEditor />
          </div>
          <Terminal />
        </div>

        {isRightPanelVisible && (
          <div className="w-80 lg:w-96 overflow-hidden">
            <RightPanel />
          </div>
        )}
      </div>

      <CommandPalette />
      <TaskDropdown />
    </div>
  );
}
