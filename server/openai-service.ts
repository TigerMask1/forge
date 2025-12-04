import OpenAI from "openai";
import type { ApiSettings, ApiError, ApiErrorType } from "@shared/schema";
import { getSystemPrompt, buildContextPrompt } from "./agent-prompts";

export function parseApiError(error: any): ApiError {
  const message = error?.message || "Unknown error occurred";
  let type: ApiErrorType = "unknown";
  let retryAfter: number | undefined;

  if (message.includes("401") || message.includes("Unauthorized") || message.includes("invalid api key") || message.includes("Invalid API key")) {
    type = "invalid_key";
  } else if (message.includes("429") || message.includes("rate limit") || message.includes("Rate limit")) {
    type = "rate_limit";
    const retryMatch = message.match(/retry after (\d+)/i);
    if (retryMatch) {
      retryAfter = parseInt(retryMatch[1], 10);
    }
  } else if (message.includes("quota") || message.includes("exceeded") || message.includes("insufficient_quota")) {
    type = "quota_exceeded";
  } else if (message.includes("model") && (message.includes("not found") || message.includes("does not exist"))) {
    type = "model_not_found";
  } else if (message.includes("context") || message.includes("maximum context length") || message.includes("too long")) {
    type = "context_too_long";
  } else if (message.includes("fetch") || message.includes("network") || message.includes("ENOTFOUND") || message.includes("ECONNREFUSED")) {
    type = "network_error";
  } else if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("Internal Server Error")) {
    type = "server_error";
  }

  return {
    type,
    message: getErrorMessage(type, message),
    details: message,
    retryAfter,
  };
}

function getErrorMessage(type: ApiErrorType, originalMessage: string): string {
  switch (type) {
    case "invalid_key":
      return "Invalid API key. Please check your API key and try again.";
    case "rate_limit":
      return "Rate limit exceeded. Please wait a moment before trying again.";
    case "quota_exceeded":
      return "API quota exceeded. Your API key has reached its usage limit.";
    case "model_not_found":
      return "The specified model was not found. Please check the model name.";
    case "context_too_long":
      return "The request is too long. Try reducing the context provided.";
    case "network_error":
      return "Network error. Check your connection or endpoint URL.";
    case "server_error":
      return "The API server is experiencing issues. Please try again later.";
    default:
      return originalMessage || "An unexpected error occurred.";
  }
}

export function createOpenAIClient(settings: ApiSettings): OpenAI {
  const config: any = {
    apiKey: settings.apiKey || "not-needed",
  };

  if (settings.provider === "anthropic") {
    config.baseURL = settings.baseUrl || "https://api.anthropic.com/v1";
  } else if (settings.provider === "custom") {
    config.baseURL = settings.baseUrl;
    if (!settings.apiKey) {
      config.apiKey = "not-needed";
    }
  } else {
    config.baseURL = settings.baseUrl || "https://api.openai.com/v1";
  }

  return new OpenAI(config);
}

export async function testConnection(settings: ApiSettings): Promise<{ success: boolean; message?: string }> {
  try {
    const client = createOpenAIClient(settings);
    
    const response = await client.chat.completions.create({
      model: settings.model,
      messages: [{ role: "user", content: "Hello" }],
      max_completion_tokens: 5,
    });

    if (response.choices && response.choices.length > 0) {
      return { success: true };
    }

    return { success: false, message: "No response from API" };
  } catch (error: any) {
    const parsedError = parseApiError(error);
    throw new Error(parsedError.message);
  }
}

interface AgentContext {
  projectName?: string;
  description?: string;
  files?: { path: string; content: string }[];
  agentConfig?: any;
  previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  mode?: 'master' | 'planning' | 'implementation' | 'review' | 'debug' | 'file_management';
}

export async function chatWithAgent(
  settings: ApiSettings,
  userMessage: string,
  context?: AgentContext
): Promise<{ message: string; fileChanges?: any[]; commands?: any[] }> {
  try {
    const client = createOpenAIClient(settings);

    const mode = context?.mode || detectMode(userMessage);
    const systemPrompt = getSystemPrompt(mode);
    
    let contextPrompt = "";
    if (context?.projectName || context?.files || context?.agentConfig) {
      contextPrompt = buildContextPrompt({
        projectName: context.projectName,
        description: context.description,
        files: context.files,
        agentConfig: context.agentConfig,
      });
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    if (contextPrompt) {
      messages.push({ role: "system", content: `CURRENT PROJECT CONTEXT:\n${contextPrompt}` });
    }

    if (context?.previousMessages) {
      for (const msg of context.previousMessages.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: userMessage });

    const response = await client.chat.completions.create({
      model: settings.model || "gpt-4o",
      messages,
      max_completion_tokens: 8192,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0]?.message?.content || "";

    const fileChanges = parseFileChanges(assistantMessage);
    const commands = parseCommands(assistantMessage);

    return {
      message: assistantMessage,
      fileChanges: fileChanges.length > 0 ? fileChanges : undefined,
      commands: commands.length > 0 ? commands : undefined,
    };
  } catch (error: any) {
    const parsedError = parseApiError(error);
    throw new Error(parsedError.message);
  }
}

function detectMode(message: string): 'master' | 'planning' | 'implementation' | 'review' | 'debug' | 'file_management' {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('/plan') || lowerMessage.includes('create a plan') || lowerMessage.includes('design')) {
    return 'planning';
  }
  if (lowerMessage.includes('/review') || lowerMessage.includes('review this') || lowerMessage.includes('check this code')) {
    return 'review';
  }
  if (lowerMessage.includes('/debug') || lowerMessage.includes('fix this') || lowerMessage.includes('error') || lowerMessage.includes('bug')) {
    return 'debug';
  }
  if (lowerMessage.includes('/create') || lowerMessage.includes('/file') || lowerMessage.includes('create file')) {
    return 'file_management';
  }
  if (lowerMessage.includes('implement') || lowerMessage.includes('build') || lowerMessage.includes('code')) {
    return 'implementation';
  }
  
  return 'master';
}

function parseFileChanges(content: string): Array<{
  filePath: string;
  changeType: "create" | "modify" | "delete";
  content?: string;
}> {
  const changes: Array<{
    filePath: string;
    changeType: "create" | "modify" | "delete";
    content?: string;
  }> = [];

  const patterns = [
    /```(?:\w+)?\s*\n\/\/\s*File:\s*([^\n]+)\n([\s\S]*?)```/gi,
    /```(?:\w+)?\s*\n#\s*File:\s*([^\n]+)\n([\s\S]*?)```/gi,
    /(?:Create|File|Modify|Update):\s*`?([^\n`]+\.[a-zA-Z]+)`?\s*\n```(?:\w+)?\n([\s\S]*?)```/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[2];
      
      if (!changes.find(c => c.filePath === filePath)) {
        changes.push({
          filePath,
          changeType: content.toLowerCase().includes("create") ? "create" : "modify",
          content: fileContent,
        });
      }
    }
  }

  return changes;
}

function parseCommands(content: string): Array<{
  type: 'terminal' | 'search' | 'create' | 'delete';
  command: string;
}> {
  const commands: Array<{
    type: 'terminal' | 'search' | 'create' | 'delete';
    command: string;
  }> = [];

  const terminalPattern = /```(?:bash|sh|shell|terminal)\n([\s\S]*?)```/gi;
  let match;
  while ((match = terminalPattern.exec(content)) !== null) {
    const lines = match[1].trim().split('\n');
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        commands.push({
          type: 'terminal',
          command: line.trim(),
        });
      }
    }
  }

  return commands;
}

export async function executePromptChain(
  settings: ApiSettings,
  chain: { steps: any[] },
  input: string,
  context?: AgentContext
): Promise<{ results: any[]; finalOutput: string }> {
  const results: any[] = [];
  let currentInput = input;
  let currentContext = context;

  for (const step of chain.steps) {
    let prompt = step.userPromptTemplate;
    prompt = prompt.replace("{{task}}", currentInput);
    prompt = prompt.replace("{{context}}", JSON.stringify(currentContext));
    prompt = prompt.replace("{{previousOutput}}", results.length > 0 ? results[results.length - 1].output : "");

    const mode = step.type === 'extract' ? 'planning' 
               : step.type === 'implement' ? 'implementation'
               : step.type === 'validate' ? 'review'
               : 'master';

    const result = await chatWithAgent(settings, prompt, {
      ...currentContext,
      mode,
      previousMessages: [],
    });

    results.push({
      stepId: step.id,
      stepName: step.name,
      output: result.message,
      fileChanges: result.fileChanges,
      commands: result.commands,
    });

    currentInput = result.message;
  }

  return {
    results,
    finalOutput: results[results.length - 1]?.output || "",
  };
}
