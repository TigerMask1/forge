import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Bot,
  Sparkles,
  ArrowRight,
  Settings,
  Zap,
  Code,
  FileCode,
  Terminal,
  Search,
  BookOpen,
  Layers,
  Server,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Zap,
    title: "Multi-Model Support",
    description: "Connect your own API endpoints - OpenAI, Anthropic, or custom hosted models",
  },
  {
    icon: Code,
    title: "Smart Code Generation",
    description: "Professional prompt chains designed for maximum output quality",
  },
  {
    icon: Terminal,
    title: "Command Center",
    description: "Powerful terminal that the agent can control and execute commands",
  },
  {
    icon: Search,
    title: "Code Intelligence",
    description: "Built-in code search and file management for the agent",
  },
  {
    icon: Layers,
    title: "Prompt Chains",
    description: "Orchestrated prompt sequences for complex multi-step tasks",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Custom commands and comprehensive documentation system",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { createProject, setCurrentProject, toggleApiSettings, apiSettings } = useAppStore();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const generateProjectName = (prompt: string): string => {
    const words = prompt.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'can', 'want', 'need', 'make', 'create', 'build'].includes(w))
      .slice(0, 3);
    
    if (words.length === 0) {
      return `Project-${Date.now().toString(36)}`;
    }
    
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    if (!apiSettings) {
      toggleApiSettings();
      return;
    }

    setIsCreating(true);
    
    const projectName = generateProjectName(prompt);
    const project = createProject(projectName, prompt.trim());
    setCurrentProject(project);
    
    setTimeout(() => {
      setLocation("/workspace");
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AgentForge</h1>
              <p className="text-xs text-gray-500">Autonomous Coding Agent</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/colab-setup">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <Server className="w-4 h-4 mr-2" />
                Free AI Setup
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleApiSettings()}
              className="text-gray-600 hover:text-gray-900"
            >
              <Settings className="w-4 h-4 mr-2" />
              {apiSettings ? "API Connected" : "Configure API"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 text-gray-600 text-sm font-medium border border-gray-100">
              <Sparkles className="w-4 h-4 text-gray-400" />
              Multi-Model Agentic Platform
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Build anything with AI
            </h2>
            
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Describe what you want to build. Your autonomous agent will plan, design, 
              and implement it completely.
            </p>
          </div>

          <Card className="relative overflow-hidden shadow-xl border-gray-200 bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white pointer-events-none" />
            
            <div className="relative p-6 space-y-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <FileCode className="w-4 h-4" />
                <span>Describe your project</span>
              </div>
              
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="I want to build a real-time dashboard with authentication, data visualization, and API integration..."
                className={cn(
                  "min-h-[140px] resize-none border-0 bg-transparent p-0",
                  "text-lg text-gray-900 placeholder:text-gray-400",
                  "focus-visible:ring-0 focus-visible:ring-offset-0"
                )}
              />
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <kbd className="px-2 py-1 rounded bg-gray-100 font-mono">⌘</kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 rounded bg-gray-100 font-mono">Enter</kbd>
                  <span>to start</span>
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isCreating}
                  className={cn(
                    "gap-2 px-6",
                    "bg-gray-900 hover:bg-gray-800 text-white",
                    "shadow-lg shadow-gray-900/20"
                  )}
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Start Building
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {!apiSettings && (
            <div className="text-center space-y-3">
              <Button
                variant="outline"
                onClick={() => toggleApiSettings()}
                className="gap-2 text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                Connect your API to get started
              </Button>
              <p className="text-sm text-gray-400">
                No API key? <Link href="/colab-setup" className="text-blue-600 hover:underline">Get a free AI endpoint</Link> using Google Colab
              </p>
            </div>
          )}
        </div>
      </main>

      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Powerful Features
            </h3>
            <p className="text-gray-500">
              Everything you need for autonomous code generation
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="p-6 border-gray-100 bg-white hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-gray-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-400">
          <p>AgentForge - Autonomous Coding Agent Platform</p>
        </div>
      </footer>
    </div>
  );
}
