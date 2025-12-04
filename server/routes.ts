import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { testConnection, chatWithAgent, parseApiError } from "./openai-service";
import { apiSettingsSchema } from "@shared/schema";
import { z } from "zod";

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

  return httpServer;
}
