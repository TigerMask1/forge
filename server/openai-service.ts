import OpenAI from "openai";
import type { ApiSettings, ApiError, ApiErrorType } from "@shared/schema";

// Parse API errors into structured format
export function parseApiError(error: any): ApiError {
  const message = error?.message || "Unknown error occurred";
  let type: ApiErrorType = "unknown";
  let retryAfter: number | undefined;

  // Check for specific error patterns
  if (message.includes("401") || message.includes("Unauthorized") || message.includes("invalid api key") || message.includes("Invalid API key")) {
    type = "invalid_key";
  } else if (message.includes("429") || message.includes("rate limit") || message.includes("Rate limit")) {
    type = "rate_limit";
    // Try to extract retry-after header
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
      return "API quota exceeded. Your API key has reached its usage limit. Please check your billing settings.";
    case "model_not_found":
      return "The specified model was not found. Please check the model name and try again.";
    case "context_too_long":
      return "The request is too long. Try reducing the amount of code or context provided.";
    case "network_error":
      return "Network error. Please check your internet connection or endpoint URL.";
    case "server_error":
      return "The API server is experiencing issues. Please try again later.";
    default:
      return originalMessage || "An unexpected error occurred.";
  }
}

// Create OpenAI client with custom settings
export function createOpenAIClient(settings: ApiSettings): OpenAI {
  const config: any = {
    apiKey: settings.apiKey,
  };

  // Handle different providers
  if (settings.provider === "anthropic") {
    // For Anthropic, we'd use a different library, but for now support via compatible endpoint
    config.baseURL = settings.baseUrl || "https://api.anthropic.com/v1";
  } else if (settings.provider === "custom") {
    // Custom endpoint (e.g., Google Colab hosted models)
    config.baseURL = settings.baseUrl;
  } else {
    // OpenAI
    config.baseURL = settings.baseUrl || "https://api.openai.com/v1";
  }

  return new OpenAI(config);
}

// Test API connection
export async function testConnection(settings: ApiSettings): Promise<{ success: boolean; message?: string }> {
  try {
    const client = createOpenAIClient(settings);
    
    // Simple test request
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

// System prompt for the agentic coding assistant
const AGENT_SYSTEM_PROMPT = `You are an expert software engineer assistant working within a coding sandbox environment. Your role is to help users build, modify, and understand code.

CAPABILITIES:
- Analyze and understand code structure
- Generate high-quality, well-documented code
- Explain code and architectural decisions
- Suggest improvements and best practices
- Follow the user's coding style and preferences

BEHAVIOR:
- Always provide complete, working code solutions
- Use modern best practices and patterns
- Include helpful comments when appropriate
- Consider edge cases and error handling
- Respect the project's existing structure and conventions

When asked to create or modify files, provide the complete code and clearly indicate the file path.

RESPONSE FORMAT:
- Be concise but thorough
- Use markdown code blocks with language hints
- Explain your reasoning when making design decisions
- If you need more context, ask specific questions`;

// Chat with the AI agent
export async function chatWithAgent(
  settings: ApiSettings,
  userMessage: string,
  context?: {
    projectName?: string;
    files?: { path: string; content: string }[];
    agentConfig?: any;
    previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  }
): Promise<{ message: string; fileChanges?: any[] }> {
  try {
    const client = createOpenAIClient(settings);

    // Build context message
    let contextMessage = "";
    if (context?.projectName) {
      contextMessage += `Project: ${context.projectName}\n`;
    }
    if (context?.agentConfig) {
      contextMessage += `\nProject Configuration:\n${JSON.stringify(context.agentConfig, null, 2)}\n`;
    }
    if (context?.files && context.files.length > 0) {
      contextMessage += "\n\nRelevant files:\n";
      for (const file of context.files) {
        contextMessage += `\n--- ${file.path} ---\n${file.content}\n`;
      }
    }

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
    ];

    // Add context if available
    if (contextMessage) {
      messages.push({ role: "system", content: `Context:\n${contextMessage}` });
    }

    // Add previous messages for conversation continuity
    if (context?.previousMessages) {
      for (const msg of context.previousMessages.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await client.chat.completions.create({
      model: settings.model || "gpt-5",
      messages,
      max_completion_tokens: 4096,
    });

    const assistantMessage = response.choices[0]?.message?.content || "";

    // Parse file changes from the response (look for code blocks with file paths)
    const fileChanges = parseFileChanges(assistantMessage);

    return {
      message: assistantMessage,
      fileChanges: fileChanges.length > 0 ? fileChanges : undefined,
    };
  } catch (error: any) {
    const parsedError = parseApiError(error);
    throw new Error(parsedError.message);
  }
}

// Parse file changes from AI response
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

  // Look for patterns like:
  // ```typescript filename.ts
  // or
  // File: path/to/file.ts
  // ```typescript

  const codeBlockRegex = /```(\w+)?\s*(?:(?:\/\/|#)\s*)?([^\n`]+\.[a-zA-Z]+)?\n([\s\S]*?)```/g;
  const fileHeaderRegex = /(?:File|Create|Modify|Update):\s*([^\n]+\.[a-zA-Z]+)\s*\n```(\w+)?\n([\s\S]*?)```/gi;

  // First try to find explicit file headers
  let match;
  while ((match = fileHeaderRegex.exec(content)) !== null) {
    const filePath = match[1].trim();
    const fileContent = match[3];
    
    changes.push({
      filePath,
      changeType: content.toLowerCase().includes("create") ? "create" : "modify",
      content: fileContent,
    });
  }

  return changes;
}
