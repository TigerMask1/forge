import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  FileCode,
  FileText,
  FileJson,
  FileCog,
  Trash2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import type { FileNode } from "@shared/schema";
import { cn } from "@/lib/utils";

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  
  const iconMap: Record<string, typeof FileCode> = {
    js: FileCode,
    jsx: FileCode,
    ts: FileCode,
    tsx: FileCode,
    py: FileCode,
    rb: FileCode,
    go: FileCode,
    rs: FileCode,
    java: FileCode,
    json: FileJson,
    md: FileText,
    txt: FileText,
    yml: FileCog,
    yaml: FileCog,
    toml: FileCog,
    env: FileCog,
  };
  
  return iconMap[ext] || File;
}

interface FileTreeItemProps {
  file: FileNode;
  depth: number;
}

function FileTreeItem({ file, depth }: FileTreeItemProps) {
  const {
    currentProject,
    expandedFolders,
    selectedFileId,
    toggleFolder,
    setSelectedFile,
    openTab,
    deleteFile,
    renameFile,
  } = useAppStore();

  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const isExpanded = expandedFolders.has(file.id);
  const isSelected = selectedFileId === file.id;
  const isFolder = file.type === "folder";
  const FileIcon = isFolder
    ? isExpanded
      ? FolderOpen
      : Folder
    : getFileIcon(file.name);

  const handleClick = () => {
    setSelectedFile(file.id);
    if (isFolder) {
      toggleFolder(file.id);
    } else {
      openTab(file);
    }
  };

  const handleRename = () => {
    if (newName.trim() && newName !== file.name) {
      renameFile(file.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const children =
    isFolder && file.children && currentProject
      ? file.children
          .map((childId) => currentProject.files[childId])
          .filter(Boolean)
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
            return a.name.localeCompare(b.name);
          })
      : [];

  return (
    <div data-testid={`file-tree-item-${file.id}`}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "flex items-center gap-1 py-1 px-2 cursor-pointer hover-elevate rounded-md text-sm",
              isSelected && "bg-accent"
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={handleClick}
            data-testid={`file-item-${file.id}`}
          >
            {isFolder && (
              <span className="w-4 h-4 flex items-center justify-center text-muted-foreground">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </span>
            )}
            {!isFolder && <span className="w-4" />}
            <FileIcon
              className={cn(
                "h-4 w-4 flex-shrink-0",
                isFolder ? "text-amber-500" : "text-muted-foreground"
              )}
            />
            {isRenaming ? (
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                className="h-6 py-0 px-1 text-sm"
                autoFocus
                data-testid="input-rename-file"
              />
            ) : (
              <span className="truncate">{file.name}</span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setIsRenaming(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => deleteFile(file.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isFolder && isExpanded && (
        <div>
          {children.map((child) => (
            <FileTreeItem key={child.id} file={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer() {
  const { currentProject, createFile } = useAppStore();
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState<"file" | "folder">("file");

  const rootFiles = currentProject
    ? currentProject.rootFileIds
        .map((id) => currentProject.files[id])
        .filter(Boolean)
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
    : [];

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      createFile(newFileName.trim(), newFileType, null);
      setNewFileName("");
      setIsNewFileDialogOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="file-explorer">
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Explorer
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setNewFileType("file");
              setIsNewFileDialogOpen(true);
            }}
            data-testid="button-new-file"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setNewFileType("folder");
              setIsNewFileDialogOpen(true);
            }}
            data-testid="button-new-folder"
          >
            <Folder className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {rootFiles.length > 0 ? (
            rootFiles.map((file) => (
              <FileTreeItem key={file.id} file={file} depth={0} />
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <Folder className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No files yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Create a new file or folder to get started
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {newFileType === "file" ? "File" : "Folder"}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder={newFileType === "file" ? "filename.ts" : "folder-name"}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
            data-testid="input-new-file-name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFileDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFile} data-testid="button-create-file">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
