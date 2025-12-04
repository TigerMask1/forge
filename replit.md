# AgentForge - Multi-Modal Agentic Coding Platform

## Overview
AgentForge is an advanced multi-modal autonomous coding agent platform that enables users to build complex applications using AI. Users can connect their own API endpoints (OpenAI, Anthropic, or custom Google Colab hosted models) and leverage professionally designed prompts for maximum output quality.

## Current State
- **Status**: Fully functional development environment
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

### 3. Advanced Agent System
- Multi-mode prompts (Master, Planning, Implementation, Review, Debug)
- File change parsing and detection
- Command extraction from responses
- Prompt chain execution

### 4. Command Center Terminal
- Built-in commands: help, ls, cat, search, pwd, echo, env
- Command history with arrow key navigation
- Tab completion
- File search and browsing capabilities

### 5. Code Search
- Regex support
- Case sensitivity toggle
- File grouping
- Click-to-open results

### 6. Activity Logs
- Combined agent and terminal logs
- Filter by level (info, warn, error, success)
- Timestamp display

### 7. Prompt Chain Designer
- Visual prompt chain editor
- Multiple step types (extract, transform, validate, implement)
- Sequential execution

## Project Structure
```
client/
  src/
    components/    # React UI components
    pages/         # Page components (home, ide)
    hooks/         # Custom React hooks
    lib/           # Utilities and state management
server/
  index.ts         # Express server entry point
  routes.ts        # API routes
  openai-service.ts # AI model integration
  agent-prompts.ts  # System prompts
shared/
  schema.ts        # Shared TypeScript types
```

## Technology Stack
- Frontend: React 18, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express, TypeScript
- State: Zustand with persistence
- API: OpenAI SDK (compatible with multiple providers)
- Build: Vite

## User Preferences
- Theme: Light mode default with dark mode toggle
- UI Style: Minimalist white design with subtle gray accents
