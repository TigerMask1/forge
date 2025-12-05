import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { testConnection, chatWithAgent, parseApiError } from "./openai-service";
import { apiSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { createOrchestrator } from "./orchestrator";
import { executeSandboxCommand } from "./sandbox";
import type { SandboxCommand } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Test API connection
  app.post("/api/test-connection", async (req, res) => {
    try {
      const settings = apiSettingsSchema.parse(req.body);
      const result = await testConnection(settings);
      res.json(result);
    } catch (error: any) {
      console.error("Test connection error:", error);
      
      // Check if it's a Zod validation error
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid settings",
          details: error.errors,
        });
      }
      
      // Return the error message for display
      res.status(400).json({
        error: error.message || "Failed to connect to API",
      });
    }
  });

  // Chat with AI agent
  app.post("/api/agent/chat", async (req, res) => {
    try {
      const { message, projectId, apiSettings, context } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!apiSettings) {
        return res.status(400).json({ error: "API settings are required" });
      }

      // Validate API settings
      const settings = apiSettingsSchema.parse(apiSettings);

      // Call the AI agent
      const result = await chatWithAgent(settings, message, context);

      res.json(result);
    } catch (error: any) {
      console.error("Agent chat error:", error);

      // Check if it's a Zod validation error
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid settings",
          details: error.errors,
        });
      }

      // Return the error for the client to handle
      res.status(400).json({
        error: error.message || "Failed to process request",
      });
    }
  });

  // Execute prompt chain
  app.post("/api/agent/execute-chain", async (req, res) => {
    try {
      const { chain, input, apiSettings, context } = req.body;

      if (!chain || !chain.steps || chain.steps.length === 0) {
        return res.status(400).json({ error: "Valid prompt chain is required" });
      }

      if (!apiSettings) {
        return res.status(400).json({ error: "API settings are required" });
      }

      const settings = apiSettingsSchema.parse(apiSettings);

      // Execute chain steps sequentially
      const results: Array<{ stepId: string; output: string }> = [];
      let currentInput = input;
      let currentContext = context;

      for (const step of chain.steps) {
        // Build prompt from template
        let prompt = step.userPromptTemplate;
        prompt = prompt.replace("{{task}}", currentInput);
        prompt = prompt.replace("{{context}}", JSON.stringify(currentContext));
        prompt = prompt.replace("{{previousOutput}}", results.length > 0 ? results[results.length - 1].output : "");

        // Execute step
        const result = await chatWithAgent(settings, prompt, {
          ...currentContext,
          previousMessages: [],
        });

        results.push({
          stepId: step.id,
          output: result.message,
        });

        // Use output as input for next step
        currentInput = result.message;
      }

      res.json({
        success: true,
        results,
        finalOutput: results[results.length - 1]?.output,
      });
    } catch (error: any) {
      console.error("Execute chain error:", error);
      
      res.status(400).json({
        error: error.message || "Failed to execute prompt chain",
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Streaming agent endpoint (SSE)
  app.post("/api/agent/stream", async (req: Request, res: Response) => {
    try {
      const { message, projectId, apiSettings, context } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!apiSettings) {
        return res.status(400).json({ error: "API settings are required" });
      }

      const settings = apiSettingsSchema.parse(apiSettings);

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.setHeader("Content-Encoding", "none");
      res.flushHeaders();
      
      // Disable Nagle's algorithm for real-time delivery
      if (res.socket) {
        res.socket.setNoDelay(true);
      }

      // Create and run orchestrator
      const orchestrator = createOrchestrator(
        res,
        settings,
        projectId || "default",
        message
      );

      // Handle client disconnect
      req.on("close", () => {
        orchestrator.abort();
      });

      await orchestrator.execute({
        files: context?.files || [],
      });

      res.end();
    } catch (error: any) {
      console.error("Stream error:", error);
      
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.write(`data: ${JSON.stringify({ type: "error", error: error.message, timestamp: new Date().toISOString() })}\n\n`);
        res.end();
      }
    }
  });

  // Sandbox command execution
  app.post("/api/sandbox/execute", async (req: Request, res: Response) => {
    try {
      const command: SandboxCommand = {
        id: Math.random().toString(36).substring(2, 15),
        type: req.body.type,
        args: req.body.args || {},
        status: "pending",
      };

      const result = await executeSandboxCommand(command);
      res.json(result);
    } catch (error: any) {
      console.error("Sandbox error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get sandbox logs
  app.get("/api/sandbox/logs", async (req: Request, res: Response) => {
    try {
      const lines = parseInt(req.query.lines as string) || 50;
      const result = await executeSandboxCommand({
        id: "logs",
        type: "get_logs",
        args: { lines },
        status: "pending",
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get preview URL
  app.get("/api/sandbox/preview", async (req: Request, res: Response) => {
    try {
      const result = await executeSandboxCommand({
        id: "preview",
        type: "get_preview",
        args: {},
        status: "pending",
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return httpServer;
}
