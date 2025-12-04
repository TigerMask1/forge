import { useCallback, useEffect, useRef } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import { X, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { editor } from "monaco-editor";

export function CodeEditor() {
  const {
    currentProject,
    openTabs,
    activeTabId,
    theme,
    setActiveTab,
    closeTab,
    updateFileContent,
    markTabDirty,
  } = useAppStore();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const activeFile =
    activeTabId && currentProject
      ? currentProject.files[activeTabId]
      : null;

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  const handleEditorChange: OnChange = useCallback(
    (value) => {
      if (activeTabId && value !== undefined) {
        updateFileContent(activeTabId, value);
        markTabDirty(activeTabId, true);
      }
    },
    [activeTabId, updateFileContent, markTabDirty]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (activeTabId) {
          markTabDirty(activeTabId, false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabId, markTabDirty]);

  if (openTabs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background text-muted-foreground">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-medium mb-2">No file open</h2>
          <p className="text-sm text-muted-foreground/70">
            Select a file from the explorer to start editing, or create a new file
            to begin your project.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            <kbd className="px-2 py-1 bg-muted rounded">Ctrl/Cmd + N</kbd>
            <span className="text-muted-foreground/50">New file</span>
            <kbd className="px-2 py-1 bg-muted rounded ml-4">Ctrl/Cmd + P</kbd>
            <span className="text-muted-foreground/50">Quick open</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="code-editor">
      {/* Tab bar */}
      <div className="border-b bg-muted/30">
        <ScrollArea className="w-full">
          <div className="flex">
            {openTabs.map((tab) => (
              <div
                key={tab.fileId}
                className={cn(
                  "group flex items-center gap-2 px-4 py-2 border-r cursor-pointer text-sm min-w-[120px] max-w-[200px]",
                  activeTabId === tab.fileId
                    ? "bg-background border-b-2 border-b-primary"
                    : "hover-elevate"
                )}
                onClick={() => setActiveTab(tab.fileId)}
                data-testid={`tab-${tab.fileId}`}
              >
                <span className="truncate flex-1">{tab.fileName}</span>
                {tab.isDirty && (
                  <Circle className="h-2 w-2 fill-current text-amber-500" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.fileId);
                  }}
                  data-testid={`button-close-tab-${tab.fileId}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        {activeFile && (
          <Editor
            height="100%"
            language={activeFile.language || "plaintext"}
            value={activeFile.content || ""}
            theme={theme === "dark" ? "vs-dark" : "vs"}
            onMount={handleEditorMount}
            onChange={handleEditorChange}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              fontLigatures: true,
              minimap: { enabled: true, scale: 1 },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              renderLineHighlight: "all",
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
              tabSize: 2,
              wordWrap: "on",
              automaticLayout: true,
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              padding: { top: 16, bottom: 16 },
            }}
          />
        )}
      </div>
    </div>
  );
}
