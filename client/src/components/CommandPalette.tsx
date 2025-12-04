import { useState, useEffect, useMemo } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  File,
  Folder,
  Settings,
  Terminal,
  Plus,
  Moon,
  Sun,
  Trash2,
  Bot,
  FileCode,
  Layers,
  GitBranch,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    toggleCommandPalette,
    currentProject,
    openTab,
    toggleTerminal,
    toggleApiSettings,
    setRightPanelMode,
    toggleRightPanel,
    theme,
    setTheme,
    createFile,
    clearMessages,
  } = useAppStore();

  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggleCommandPalette]);

  const files = useMemo(() => {
    if (!currentProject) return [];
    return Object.values(currentProject.files)
      .filter((f) => f.type === "file")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [currentProject]);

  const filteredFiles = useMemo(() => {
    if (!search) return files.slice(0, 10);
    const lowerSearch = search.toLowerCase();
    return files
      .filter(
        (f) =>
          f.name.toLowerCase().includes(lowerSearch) ||
          f.path.toLowerCase().includes(lowerSearch)
      )
      .slice(0, 10);
  }, [files, search]);

  const handleSelect = (action: string) => {
    toggleCommandPalette();
    setSearch("");

    switch (action) {
      case "new-file":
        createFile("untitled.ts", "file", null);
        break;
      case "new-folder":
        createFile("new-folder", "folder", null);
        break;
      case "toggle-terminal":
        toggleTerminal();
        break;
      case "api-settings":
        toggleApiSettings();
        break;
      case "show-agent":
        setRightPanelMode("agent");
        toggleRightPanel();
        break;
      case "show-config":
        setRightPanelMode("config");
        toggleRightPanel();
        break;
      case "show-diff":
        setRightPanelMode("diff");
        toggleRightPanel();
        break;
      case "show-chains":
        setRightPanelMode("chains");
        toggleRightPanel();
        break;
      case "toggle-theme":
        setTheme(theme === "light" ? "dark" : "light");
        break;
      case "clear-chat":
        clearMessages();
        break;
    }
  };

  const handleFileSelect = (fileId: string) => {
    toggleCommandPalette();
    setSearch("");
    const file = currentProject?.files[fileId];
    if (file) {
      openTab(file);
    }
  };

  return (
    <CommandDialog
      open={isCommandPaletteOpen}
      onOpenChange={toggleCommandPalette}
    >
      <CommandInput
        placeholder="Search files or type a command..."
        value={search}
        onValueChange={setSearch}
        data-testid="input-command-palette"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {filteredFiles.length > 0 && (
          <CommandGroup heading="Files">
            {filteredFiles.map((file) => (
              <CommandItem
                key={file.id}
                value={file.path}
                onSelect={() => handleFileSelect(file.id)}
              >
                <FileCode className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {file.path}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem value="new-file" onSelect={() => handleSelect("new-file")}>
            <Plus className="h-4 w-4 mr-2" />
            New File
          </CommandItem>
          <CommandItem
            value="new-folder"
            onSelect={() => handleSelect("new-folder")}
          >
            <Folder className="h-4 w-4 mr-2" />
            New Folder
          </CommandItem>
          <CommandItem
            value="toggle-terminal"
            onSelect={() => handleSelect("toggle-terminal")}
          >
            <Terminal className="h-4 w-4 mr-2" />
            Toggle Terminal
          </CommandItem>
          <CommandItem
            value="api-settings"
            onSelect={() => handleSelect("api-settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            API Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Panels">
          <CommandItem
            value="show-agent"
            onSelect={() => handleSelect("show-agent")}
          >
            <Bot className="h-4 w-4 mr-2" />
            Show Agent Chat
          </CommandItem>
          <CommandItem
            value="show-config"
            onSelect={() => handleSelect("show-config")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Show Agent Config
          </CommandItem>
          <CommandItem
            value="show-diff"
            onSelect={() => handleSelect("show-diff")}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Show Diff Viewer
          </CommandItem>
          <CommandItem
            value="show-chains"
            onSelect={() => handleSelect("show-chains")}
          >
            <Layers className="h-4 w-4 mr-2" />
            Show Prompt Chains
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem
            value="toggle-theme"
            onSelect={() => handleSelect("toggle-theme")}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 mr-2" />
            ) : (
              <Sun className="h-4 w-4 mr-2" />
            )}
            Toggle Theme
          </CommandItem>
          <CommandItem
            value="clear-chat"
            onSelect={() => handleSelect("clear-chat")}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat History
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
