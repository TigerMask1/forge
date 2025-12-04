import { z } from "zod";

// File system types
export const fileTypeSchema = z.enum(["file", "folder"]);
export type FileType = z.infer<typeof fileTypeSchema>;

export const fileNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: fileTypeSchema,
  path: z.string(),
  content: z.string().optional(),
  children: z.array(z.string()).optional(),
  parentId: z.string().nullable(),
  isExpanded: z.boolean().optional(),
  language: z.string().optional(),
});
export type FileNode = z.infer<typeof fileNodeSchema>;

// Project configuration (AGENTS.md equivalent)
export const agentConfigSchema = z.object({
  projectName: z.string(),
  description: z.string().optional(),
  techStack: z.array(z.string()),
  projectStructure: z.record(z.string(), z.string()),
  codeStyle: z.object({
    dos: z.array(z.string()),
    donts: z.array(z.string()),
  }),
  safetyRules: z.object({
    allowedWithoutPrompt: z.array(z.string()),
    requiresApproval: z.array(z.string()),
    neverModify: z.array(z.string()),
  }),
  testPatterns: z.array(z.string()).optional(),
  lastUpdated: z.string(),
});
export type AgentConfig = z.infer<typeof agentConfigSchema>;

// API Provider configuration
export const apiProviderSchema = z.enum(["openai", "anthropic", "custom"]);
export type ApiProvider = z.infer<typeof apiProviderSchema>;

export const apiSettingsSchema = z.object({
  provider: apiProviderSchema,
  apiKey: z.string(),
  baseUrl: z.string().optional(),
  model: z.string(),
  maxTokens: z.number().optional(),
});
export type ApiSettings = z.infer<typeof apiSettingsSchema>;

// Prompt chain types
export const promptStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["extract", "transform", "validate", "implement", "refine", "custom"]),
  systemPrompt: z.string(),
  userPromptTemplate: z.string(),
  outputFormat: z.enum(["text", "json", "code"]).optional(),
  order: z.number(),
});
export type PromptStep = z.infer<typeof promptStepSchema>;

export const promptChainSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(promptStepSchema),
  isActive: z.boolean(),
});
export type PromptChain = z.infer<typeof promptChainSchema>;

// Conversation/Message types
export const messageRoleSchema = z.enum(["user", "assistant", "system"]);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const messageSchema = z.object({
  id: z.string(),
  role: messageRoleSchema,
  content: z.string(),
  timestamp: z.string(),
  isStreaming: z.boolean().optional(),
  stepId: z.string().optional(),
  fileChanges: z.array(z.object({
    filePath: z.string(),
    changeType: z.enum(["create", "modify", "delete"]),
    diff: z.string().optional(),
  })).optional(),
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  messages: z.array(messageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Conversation = z.infer<typeof conversationSchema>;

// Project types
export const projectStatusSchema = z.enum(["active", "paused", "completed", "error"]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: projectStatusSchema,
  files: z.record(z.string(), fileNodeSchema),
  rootFileIds: z.array(z.string()),
  agentConfig: agentConfigSchema.optional(),
  apiSettings: apiSettingsSchema.optional(),
  promptChains: z.array(promptChainSchema),
  activeConversationId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

// File change tracking for diff viewer
export const fileChangeSchema = z.object({
  id: z.string(),
  filePath: z.string(),
  originalContent: z.string(),
  newContent: z.string(),
  changeType: z.enum(["create", "modify", "delete"]),
  status: z.enum(["pending", "approved", "rejected"]),
  createdAt: z.string(),
});
export type FileChange = z.infer<typeof fileChangeSchema>;

// API Error types
export const apiErrorTypeSchema = z.enum([
  "invalid_key",
  "rate_limit",
  "quota_exceeded",
  "network_error",
  "model_not_found",
  "context_too_long",
  "server_error",
  "unknown",
]);
export type ApiErrorType = z.infer<typeof apiErrorTypeSchema>;

export const apiErrorSchema = z.object({
  type: apiErrorTypeSchema,
  message: z.string(),
  details: z.string().optional(),
  retryAfter: z.number().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

// Terminal output
export const terminalLineSchema = z.object({
  id: z.string(),
  type: z.enum(["input", "output", "error", "info"]),
  content: z.string(),
  timestamp: z.string(),
});
export type TerminalLine = z.infer<typeof terminalLineSchema>;

// Task status for agent workflow
export const taskStatusSchema = z.enum(["todo", "analyzing", "coding", "reviewing", "done", "failed"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

// Task priority
export const taskPrioritySchema = z.enum(["critical", "high", "medium", "low"]);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

// Agent task schema
export const agentTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assignee: z.enum(["planner", "worker", "supervisor"]),
  filePath: z.string().optional(),
  logs: z.array(z.string()),
  errorMessage: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
});
export type AgentTask = z.infer<typeof agentTaskSchema>;

// Workflow phase schema
export const workflowPhaseSchema = z.enum([
  "idle",
  "analyzing",
  "planning", 
  "structuring",
  "executing",
  "reviewing",
  "completed",
  "failed"
]);
export type WorkflowPhase = z.infer<typeof workflowPhaseSchema>;

// Agent run/workflow state
export const agentRunSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  phase: workflowPhaseSchema,
  tasks: z.array(agentTaskSchema),
  currentTaskId: z.string().nullable(),
  userGoal: z.string(),
  analysisResult: z.string().optional(),
  planningResult: z.string().optional(),
  supervisorFeedback: z.string().optional(),
  supervisorPassCount: z.number().default(0),
  maxSupervisorRetries: z.number().default(3),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  logs: z.array(z.object({
    timestamp: z.string(),
    level: z.enum(["info", "warn", "error", "debug"]),
    message: z.string(),
    phase: workflowPhaseSchema.optional(),
  })),
});
export type AgentRun = z.infer<typeof agentRunSchema>;

// Streaming chunk types for SSE
export const streamingEventTypeSchema = z.enum([
  "token",
  "phase_change",
  "task_update",
  "task_complete",
  "supervisor_feedback",
  "error",
  "complete",
  "log",
  "command_result",
  "preview_update"
]);
export type StreamingEventType = z.infer<typeof streamingEventTypeSchema>;

export const streamingChunkSchema = z.object({
  type: streamingEventTypeSchema,
  content: z.string().optional(),
  taskId: z.string().optional(),
  phase: workflowPhaseSchema.optional(),
  task: agentTaskSchema.optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});
export type StreamingChunk = z.infer<typeof streamingChunkSchema>;

// Sandbox command types
export const sandboxCommandTypeSchema = z.enum([
  "read_file",
  "write_file",
  "delete_file",
  "list_files",
  "execute_shell",
  "search_code",
  "get_logs",
  "lint_check",
  "get_preview"
]);
export type SandboxCommandType = z.infer<typeof sandboxCommandTypeSchema>;

export const sandboxCommandSchema = z.object({
  id: z.string(),
  type: sandboxCommandTypeSchema,
  args: z.record(z.string(), z.any()),
  status: z.enum(["pending", "running", "completed", "failed"]),
  result: z.any().optional(),
  error: z.string().optional(),
  executedAt: z.string().optional(),
});
export type SandboxCommand = z.infer<typeof sandboxCommandSchema>;

// Sandbox command result
export const sandboxResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  logs: z.array(z.string()).optional(),
})
export type SandboxResult = z.infer<typeof sandboxResultSchema>;

// Insert schemas for API
export const insertProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});
export type InsertProject = z.infer<typeof insertProjectSchema>;

export const insertFileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  type: fileTypeSchema,
  parentId: z.string().nullable(),
  content: z.string().optional(),
});
export type InsertFile = z.infer<typeof insertFileSchema>;

export const insertMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  role: messageRoleSchema.optional(),
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Default AGENTS.md config generator
export function generateDefaultAgentConfig(projectName: string): AgentConfig {
  return {
    projectName,
    description: "",
    techStack: [],
    projectStructure: {},
    codeStyle: {
      dos: [
        "Use TypeScript for type safety",
        "Follow consistent naming conventions",
        "Write modular, reusable code",
      ],
      donts: [
        "Do not use 'any' type",
        "Do not hard-code sensitive values",
        "Do not skip error handling",
      ],
    },
    safetyRules: {
      allowedWithoutPrompt: [
        "Read files",
        "List files",
        "Run linters",
      ],
      requiresApproval: [
        "Install packages",
        "Delete files",
        "Modify configuration",
      ],
      neverModify: [
        ".env files",
        "node_modules/",
        "dist/",
      ],
    },
    testPatterns: [],
    lastUpdated: new Date().toISOString(),
  };
}

// Default prompt chains
export function getDefaultPromptChains(): PromptChain[] {
  return [
    {
      id: "plan-act-reflect",
      name: "Plan-Act-Reflect",
      description: "Standard agentic workflow for complex tasks",
      isActive: true,
      steps: [
        {
          id: "plan",
          name: "Plan",
          type: "extract",
          order: 0,
          systemPrompt: "You are an expert software architect. Analyze the request and create a detailed implementation plan.",
          userPromptTemplate: "Create a step-by-step plan to implement: {{task}}\n\nProject context:\n{{context}}",
          outputFormat: "json",
        },
        {
          id: "implement",
          name: "Implement",
          type: "implement",
          order: 1,
          systemPrompt: "You are an expert software engineer. Implement the code according to the plan provided.",
          userPromptTemplate: "Implement step {{stepNumber}} of the plan:\n{{planStep}}\n\nRelevant files:\n{{files}}",
          outputFormat: "code",
        },
        {
          id: "reflect",
          name: "Reflect",
          type: "validate",
          order: 2,
          systemPrompt: "You are a code reviewer. Review the implementation and suggest improvements.",
          userPromptTemplate: "Review this implementation:\n{{implementation}}\n\nOriginal task: {{task}}\n\nProvide feedback and any necessary fixes.",
          outputFormat: "text",
        },
      ],
    },
    {
      id: "code-generation",
      name: "Direct Code Generation",
      description: "Quick code generation for simple tasks",
      isActive: false,
      steps: [
        {
          id: "generate",
          name: "Generate Code",
          type: "implement",
          order: 0,
          systemPrompt: "You are an expert programmer. Generate clean, efficient code.",
          userPromptTemplate: "Generate code for: {{task}}\n\nLanguage: {{language}}\n\nContext:\n{{context}}",
          outputFormat: "code",
        },
      ],
    },
  ];
}

// Legacy user types for compatibility
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
