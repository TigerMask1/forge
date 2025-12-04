import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Project,
  FileNode,
  Message,
  ApiSettings,
  PromptChain,
  AgentConfig,
  FileChange,
  TerminalLine,
  ApiError,
} from "@shared/schema";
import { generateDefaultAgentConfig, getDefaultPromptChains } from "@shared/schema";

interface EditorTab {
  fileId: string;
  filePath: string;
  fileName: string;
  language: string;
  isDirty: boolean;
}

interface AppState {
  // Project state
  currentProject: Project | null;
  projects: Project[];
  
  // Editor state
  openTabs: EditorTab[];
  activeTabId: string | null;
  
  // File explorer state
  expandedFolders: Set<string>;
  selectedFileId: string | null;
  
  // Agent state
  messages: Message[];
  isAgentRunning: boolean;
  currentStepId: string | null;
  
  // API state
  apiSettings: ApiSettings | null;
  apiError: ApiError | null;
  isApiConfigured: boolean;
  
  // Terminal state
  terminalLines: TerminalLine[];
  isTerminalVisible: boolean;
  
  // File changes state
  pendingChanges: FileChange[];
  
  // UI state
  isSidebarCollapsed: boolean;
  isRightPanelVisible: boolean;
  rightPanelMode: "agent" | "config" | "diff" | "chains";
  isCommandPaletteOpen: boolean;
  isApiSettingsOpen: boolean;
  theme: "light" | "dark";
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  createProject: (name: string, description?: string) => Project;
  updateProject: (updates: Partial<Project>) => void;
  
  // File actions
  createFile: (name: string, type: "file" | "folder", parentId: string | null, content?: string) => FileNode;
  updateFileContent: (fileId: string, content: string) => void;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  toggleFolder: (folderId: string) => void;
  setSelectedFile: (fileId: string | null) => void;
  
  // Tab actions
  openTab: (file: FileNode) => void;
  closeTab: (fileId: string) => void;
  setActiveTab: (fileId: string) => void;
  markTabDirty: (fileId: string, isDirty: boolean) => void;
  
  // Message actions
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  
  // Agent actions
  setAgentRunning: (running: boolean) => void;
  setCurrentStep: (stepId: string | null) => void;
  
  // API actions
  setApiSettings: (settings: ApiSettings | null) => void;
  setApiError: (error: ApiError | null) => void;
  
  // Terminal actions
  addTerminalLine: (line: Omit<TerminalLine, "id" | "timestamp">) => void;
  clearTerminal: () => void;
  toggleTerminal: () => void;
  
  // File change actions
  addPendingChange: (change: Omit<FileChange, "id" | "createdAt">) => void;
  approveChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
  clearPendingChanges: () => void;
  
  // UI actions
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setRightPanelMode: (mode: "agent" | "config" | "diff" | "chains") => void;
  toggleCommandPalette: () => void;
  toggleApiSettings: () => void;
  setTheme: (theme: "light" | "dark") => void;
  
  // Prompt chain actions
  updatePromptChain: (chainId: string, updates: Partial<PromptChain>) => void;
  setActiveChain: (chainId: string) => void;
  
  // Agent config actions
  updateAgentConfig: (config: Partial<AgentConfig>) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    cpp: "cpp",
    c: "c",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    html: "html",
    css: "css",
    scss: "scss",
    less: "less",
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    dockerfile: "dockerfile",
    graphql: "graphql",
    vue: "vue",
    svelte: "svelte",
  };
  return langMap[ext] || "plaintext";
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProject: null,
      projects: [],
      openTabs: [],
      activeTabId: null,
      expandedFolders: new Set<string>(),
      selectedFileId: null,
      messages: [],
      isAgentRunning: false,
      currentStepId: null,
      apiSettings: null,
      apiError: null,
      isApiConfigured: false,
      terminalLines: [],
      isTerminalVisible: false,
      pendingChanges: [],
      isSidebarCollapsed: false,
      isRightPanelVisible: true,
      rightPanelMode: "agent",
      isCommandPaletteOpen: false,
      isApiSettingsOpen: false,
      theme: "light" as const,

      // Project actions
      setCurrentProject: (project) => set({ currentProject: project }),
      
      createProject: (name, description) => {
        const id = generateId();
        const now = new Date().toISOString();
        const agentConfig = generateDefaultAgentConfig(name);
        
        // Create root AGENTS.md file
        const agentsFileId = generateId();
        const agentsFile: FileNode = {
          id: agentsFileId,
          name: "AGENTS.md",
          type: "file",
          path: "/AGENTS.md",
          content: generateAgentsMdContent(agentConfig),
          parentId: null,
          language: "markdown",
        };
        
        const project: Project = {
          id,
          name,
          description,
          status: "active",
          files: { [agentsFileId]: agentsFile },
          rootFileIds: [agentsFileId],
          agentConfig,
          promptChains: getDefaultPromptChains(),
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          projects: [...state.projects, project],
          currentProject: project,
        }));
        
        return project;
      },
      
      updateProject: (updates) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updatedProject = {
            ...state.currentProject,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      // File actions
      createFile: (name, type, parentId, content = "") => {
        const state = get();
        if (!state.currentProject) throw new Error("No project selected");
        
        const id = generateId();
        const parentPath = parentId
          ? state.currentProject.files[parentId]?.path || ""
          : "";
        const path = `${parentPath}/${name}`;
        
        const file: FileNode = {
          id,
          name,
          type,
          path,
          content: type === "file" ? content : undefined,
          children: type === "folder" ? [] : undefined,
          parentId,
          isExpanded: false,
          language: type === "file" ? getLanguageFromFileName(name) : undefined,
        };
        
        set((state) => {
          if (!state.currentProject) return state;
          
          const files = { ...state.currentProject.files, [id]: file };
          let rootFileIds = [...state.currentProject.rootFileIds];
          
          if (parentId) {
            const parent = files[parentId];
            if (parent && parent.children) {
              files[parentId] = {
                ...parent,
                children: [...parent.children, id],
              };
            }
          } else {
            rootFileIds.push(id);
          }
          
          return {
            currentProject: {
              ...state.currentProject,
              files,
              rootFileIds,
              updatedAt: new Date().toISOString(),
            },
          };
        });
        
        return file;
      },
      
      updateFileContent: (fileId, content) => {
        set((state) => {
          if (!state.currentProject) return state;
          const file = state.currentProject.files[fileId];
          if (!file) return state;
          
          return {
            currentProject: {
              ...state.currentProject,
              files: {
                ...state.currentProject.files,
                [fileId]: { ...file, content },
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteFile: (fileId) => {
        set((state) => {
          if (!state.currentProject) return state;
          const file = state.currentProject.files[fileId];
          if (!file) return state;
          
          const files = { ...state.currentProject.files };
          const rootFileIds = state.currentProject.rootFileIds.filter(
            (id) => id !== fileId
          );
          
          // Remove from parent's children
          if (file.parentId) {
            const parent = files[file.parentId];
            if (parent && parent.children) {
              files[file.parentId] = {
                ...parent,
                children: parent.children.filter((id) => id !== fileId),
              };
            }
          }
          
          // Delete the file
          delete files[fileId];
          
          // Close tab if open
          const openTabs = state.openTabs.filter((t) => t.fileId !== fileId);
          const activeTabId =
            state.activeTabId === fileId
              ? openTabs[0]?.fileId || null
              : state.activeTabId;
          
          return {
            currentProject: {
              ...state.currentProject,
              files,
              rootFileIds,
              updatedAt: new Date().toISOString(),
            },
            openTabs,
            activeTabId,
          };
        });
      },
      
      renameFile: (fileId, newName) => {
        set((state) => {
          if (!state.currentProject) return state;
          const file = state.currentProject.files[fileId];
          if (!file) return state;
          
          const parentPath = file.parentId
            ? state.currentProject.files[file.parentId]?.path || ""
            : "";
          const newPath = `${parentPath}/${newName}`;
          
          return {
            currentProject: {
              ...state.currentProject,
              files: {
                ...state.currentProject.files,
                [fileId]: {
                  ...file,
                  name: newName,
                  path: newPath,
                  language: file.type === "file" ? getLanguageFromFileName(newName) : undefined,
                },
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      toggleFolder: (folderId) => {
        set((state) => {
          const expandedFolders = new Set(state.expandedFolders);
          if (expandedFolders.has(folderId)) {
            expandedFolders.delete(folderId);
          } else {
            expandedFolders.add(folderId);
          }
          return { expandedFolders };
        });
      },
      
      setSelectedFile: (fileId) => set({ selectedFileId: fileId }),

      // Tab actions
      openTab: (file) => {
        set((state) => {
          const existingTab = state.openTabs.find((t) => t.fileId === file.id);
          if (existingTab) {
            return { activeTabId: file.id };
          }
          
          const newTab: EditorTab = {
            fileId: file.id,
            filePath: file.path,
            fileName: file.name,
            language: file.language || "plaintext",
            isDirty: false,
          };
          
          return {
            openTabs: [...state.openTabs, newTab],
            activeTabId: file.id,
          };
        });
      },
      
      closeTab: (fileId) => {
        set((state) => {
          const tabIndex = state.openTabs.findIndex((t) => t.fileId === fileId);
          const openTabs = state.openTabs.filter((t) => t.fileId !== fileId);
          
          let activeTabId = state.activeTabId;
          if (activeTabId === fileId) {
            activeTabId =
              openTabs[tabIndex]?.fileId ||
              openTabs[tabIndex - 1]?.fileId ||
              null;
          }
          
          return { openTabs, activeTabId };
        });
      },
      
      setActiveTab: (fileId) => set({ activeTabId: fileId }),
      
      markTabDirty: (fileId, isDirty) => {
        set((state) => ({
          openTabs: state.openTabs.map((t) =>
            t.fileId === fileId ? { ...t, isDirty } : t
          ),
        }));
      },

      // Message actions
      addMessage: (message) => {
        const id = generateId();
        const timestamp = new Date().toISOString();
        set((state) => ({
          messages: [...state.messages, { ...message, id, timestamp }],
        }));
      },
      
      updateMessage: (messageId, updates) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
        }));
      },
      
      clearMessages: () => set({ messages: [] }),

      // Agent actions
      setAgentRunning: (running) => set({ isAgentRunning: running }),
      setCurrentStep: (stepId) => set({ currentStepId: stepId }),

      // API actions
      setApiSettings: (settings) =>
        set({ apiSettings: settings, isApiConfigured: settings !== null }),
      setApiError: (error) => set({ apiError: error }),

      // Terminal actions
      addTerminalLine: (line) => {
        const id = generateId();
        const timestamp = new Date().toISOString();
        set((state) => ({
          terminalLines: [...state.terminalLines, { ...line, id, timestamp }],
        }));
      },
      clearTerminal: () => set({ terminalLines: [] }),
      toggleTerminal: () =>
        set((state) => ({ isTerminalVisible: !state.isTerminalVisible })),

      // File change actions
      addPendingChange: (change) => {
        const id = generateId();
        const createdAt = new Date().toISOString();
        set((state) => ({
          pendingChanges: [...state.pendingChanges, { ...change, id, createdAt }],
        }));
      },
      
      approveChange: (changeId) => {
        set((state) => {
          const change = state.pendingChanges.find((c) => c.id === changeId);
          if (!change || !state.currentProject) return state;
          
          // Apply the change to the file
          const files = { ...state.currentProject.files };
          const fileEntry = Object.entries(files).find(
            ([, f]) => f.path === change.filePath
          );
          
          if (fileEntry) {
            files[fileEntry[0]] = { ...fileEntry[1], content: change.newContent };
          }
          
          return {
            currentProject: {
              ...state.currentProject,
              files,
              updatedAt: new Date().toISOString(),
            },
            pendingChanges: state.pendingChanges.map((c) =>
              c.id === changeId ? { ...c, status: "approved" as const } : c
            ),
          };
        });
      },
      
      rejectChange: (changeId) => {
        set((state) => ({
          pendingChanges: state.pendingChanges.map((c) =>
            c.id === changeId ? { ...c, status: "rejected" as const } : c
          ),
        }));
      },
      
      clearPendingChanges: () => set({ pendingChanges: [] }),

      // UI actions
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      toggleRightPanel: () =>
        set((state) => ({ isRightPanelVisible: !state.isRightPanelVisible })),
      setRightPanelMode: (mode) => set({ rightPanelMode: mode }),
      toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
      toggleApiSettings: () =>
        set((state) => ({ isApiSettingsOpen: !state.isApiSettingsOpen })),
      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        set({ theme });
      },

      // Prompt chain actions
      updatePromptChain: (chainId, updates) => {
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              promptChains: state.currentProject.promptChains.map((c) =>
                c.id === chainId ? { ...c, ...updates } : c
              ),
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      setActiveChain: (chainId) => {
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              promptChains: state.currentProject.promptChains.map((c) => ({
                ...c,
                isActive: c.id === chainId,
              })),
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      // Agent config actions
      updateAgentConfig: (config) => {
        set((state) => {
          if (!state.currentProject) return state;
          const newConfig = {
            ...state.currentProject.agentConfig!,
            ...config,
            lastUpdated: new Date().toISOString(),
          };
          
          // Update AGENTS.md file content
          const agentsFile = Object.values(state.currentProject.files).find(
            (f) => f.name === "AGENTS.md"
          );
          
          let files = state.currentProject.files;
          if (agentsFile) {
            files = {
              ...files,
              [agentsFile.id]: {
                ...agentsFile,
                content: generateAgentsMdContent(newConfig),
              },
            };
          }
          
          return {
            currentProject: {
              ...state.currentProject,
              agentConfig: newConfig,
              files,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
    }),
    {
      name: "agentforge-storage",
      partialize: (state) => ({
        projects: state.projects,
        apiSettings: state.apiSettings,
        theme: state.theme,
        messages: state.messages,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const data = JSON.parse(str);
            return data;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

// Helper function to generate AGENTS.md content
function generateAgentsMdContent(config: AgentConfig): string {
  return `# ${config.projectName}

${config.description || ""}

## Tech Stack
${config.techStack.map((t) => `- ${t}`).join("\n") || "- Not specified"}

## Project Structure
${
  Object.entries(config.projectStructure)
    .map(([path, desc]) => `- \`${path}\` - ${desc}`)
    .join("\n") || "- Structure not defined"
}

## Code Style

### Do
${config.codeStyle.dos.map((d) => `- ${d}`).join("\n")}

### Don't
${config.codeStyle.donts.map((d) => `- ${d}`).join("\n")}

## Safety Rules

### Allowed Without Prompt
${config.safetyRules.allowedWithoutPrompt.map((r) => `- ${r}`).join("\n")}

### Requires Approval
${config.safetyRules.requiresApproval.map((r) => `- ${r}`).join("\n")}

### Never Modify
${config.safetyRules.neverModify.map((r) => `- ${r}`).join("\n")}

${
  config.testPatterns?.length
    ? `## Test Patterns\n${config.testPatterns.map((t) => `- ${t}`).join("\n")}`
    : ""
}

---
*Last updated: ${config.lastUpdated}*
`;
}
