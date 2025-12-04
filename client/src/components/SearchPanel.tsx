import { useState, useMemo } from "react";
import { Search, File, Code, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface SearchResult {
  fileId: string;
  filePath: string;
  fileName: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export function SearchPanel() {
  const { currentProject, openTab } = useAppStore();
  const [query, setQuery] = useState("");
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const results = useMemo(() => {
    if (!query.trim() || !currentProject) return [];

    const searchResults: SearchResult[] = [];
    let searchRegex: RegExp;

    try {
      if (isRegex) {
        searchRegex = new RegExp(query, caseSensitive ? "g" : "gi");
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        searchRegex = new RegExp(escaped, caseSensitive ? "g" : "gi");
      }
    } catch {
      return [];
    }

    for (const file of Object.values(currentProject.files)) {
      if (file.type === "folder" || !file.content) continue;

      const lines = file.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        searchRegex.lastIndex = 0;
        const match = searchRegex.exec(line);

        if (match) {
          searchResults.push({
            fileId: file.id,
            filePath: file.path,
            fileName: file.name,
            lineNumber: i + 1,
            lineContent: line,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
        }
      }
    }

    return searchResults.slice(0, 100);
  }, [query, currentProject, isRegex, caseSensitive]);

  const resultsByFile = useMemo(() => {
    const grouped: Record<string, SearchResult[]> = {};
    for (const result of results) {
      if (!grouped[result.filePath]) {
        grouped[result.filePath] = [];
      }
      grouped[result.filePath].push(result);
    }
    return grouped;
  }, [results]);

  const handleResultClick = (result: SearchResult) => {
    if (!currentProject) return;
    const file = currentProject.files[result.fileId];
    if (file) {
      openTab(file);
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="search-panel">
      <div className="p-3 border-b space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Code Search</span>
        </div>

        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in files..."
            className="pr-8"
            data-testid="search-input"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setQuery("")}
              data-testid="search-clear-button"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isRegex ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setIsRegex(!isRegex)}
            data-testid="search-regex-toggle"
          >
            .*
          </Button>
          <Button
            variant={caseSensitive ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setCaseSensitive(!caseSensitive)}
            data-testid="search-case-toggle"
          >
            Aa
          </Button>
          {results.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {!query.trim() ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Enter a search term</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No results found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(resultsByFile).map(([filePath, fileResults]) => (
                <div key={filePath} className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-muted-foreground">
                    <File className="h-3.5 w-3.5" />
                    <span className="truncate">{filePath}</span>
                    <span className="text-xs bg-muted px-1.5 rounded">
                      {fileResults.length}
                    </span>
                  </div>
                  
                  {fileResults.map((result, idx) => (
                    <button
                      key={`${result.filePath}-${result.lineNumber}-${idx}`}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded text-sm",
                        "hover:bg-muted/50 transition-colors",
                        "flex items-start gap-2"
                      )}
                      onClick={() => handleResultClick(result)}
                    >
                      <span className="text-muted-foreground font-mono text-xs w-6 shrink-0">
                        {result.lineNumber}
                      </span>
                      <code className="font-mono text-xs flex-1 truncate">
                        {result.lineContent.slice(0, result.matchStart)}
                        <span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200 px-0.5 rounded">
                          {result.lineContent.slice(result.matchStart, result.matchEnd)}
                        </span>
                        {result.lineContent.slice(result.matchEnd)}
                      </code>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
