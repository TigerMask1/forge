# AgentForge - Multi-Modal Agentic Coding Platform

## Overview
AgentForge is an advanced multi-modal autonomous coding agent platform that enables users to build complex applications using AI. Users can connect their own API endpoints (OpenAI, Anthropic, or custom Google Colab hosted models) and leverage professionally designed prompts for maximum output quality.

## Current State
- **Status**: Fully functional development environment with streaming agent support
- **Last Updated**: December 2024

## Key Features

### 1. Homepage
- Minimalist white design with centered prompt input
- Auto-generates project names from user prompts
- Feature highlights showcasing platform capabilities

### 2. Multi-Model API Support
- OpenAI (GPT-4o, GPT-4)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
- Custom endpoints (Google Colab, vLLM, any OpenAI-compatible API)
- Paste buttons for easy configuration
- Connection testing

### 3. Advanced Autonomous Agent System
- **Streaming Responses**: Real-time SSE streaming with typewriter animation
- **Workflow Phases**: Analyze → Plan → Structure → Execute → Review
- **Task Management**: Floating dropdown showing tasks by status (todo/coding/reviewed/done)
- **Supervisor Review Loop**: Automatic code review with feedback until approval
- **Sandbox Environment**: Whitelisted shell commands, file operations, log access
- Multi-mode prompts (Master, Planning, Implementation, Review, Debug)
- File change parsing and detection
- Command extraction from responses
- Prompt chain execution

### 4. Orchestrator Service
- Token-optimized prompts for efficiency
- Planner, Worker, and Supervisor agents
- Priority-based task execution
- Syntax/LSP validation between tasks
- Automatic retry on supervisor feedback

### 5. Command Center Terminal
- Built-in commands: help, ls, cat, search, pwd, echo, env
- Command history with arrow key navigation
- Tab completion
- File search and browsing capabilities

### 6. Code Search
- Regex support
- Case sensitivity toggle
- File grouping
- Click-to-open results

### 7. Activity Logs
- Combined agent and terminal logs
- Filter by level (info, warn, error, success)
- Timestamp display

### 8. Prompt Chain Designer
- Visual prompt chain editor
- Multiple step types (extract, transform, validate, implement)
- Sequential execution

## Project Structure
```
client/
  src/
    components/
      StreamingAgentChat.tsx  # SSE streaming chat with typewriter
      TaskDropdown.tsx        # Floating task management UI
      PhaseIndicator.tsx      # Workflow phase indicators
      AgentChat.tsx           # Original chat component
      ...other components
    pages/                    # Page components (home, ide)
    hooks/                    # Custom React hooks
    lib/
      store.ts               # Zustand state with streaming support
server/
  index.ts                   # Express server entry point
  routes.ts                  # API routes including /api/agent/stream
  orchestrator.ts            # Agent orchestration service
  orchestrator-prompts.ts    # Optimized agent prompts
  sandbox.ts                 # Sandbox command executor
  openai-service.ts          # AI model integration
  agent-prompts.ts           # Legacy system prompts
shared/
  schema.ts                  # Types including Task, Run, StreamingChunk
render.yaml                  # Render.com deployment config
```

## Technology Stack
- Frontend: React 18, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express, TypeScript
- State: Zustand with persistence
- API: OpenAI SDK (compatible with multiple providers)
- Streaming: Server-Sent Events (SSE)
- Build: Vite
- Deployment: Render.com ready

## User Preferences
- Theme: Light mode default with dark mode toggle
- UI Style: Minimalist white design with subtle gray accents
