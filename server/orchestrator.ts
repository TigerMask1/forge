import type { Response } from "express";
import OpenAI from "openai";
import type { 
  ApiSettings, 
  AgentTask, 
  AgentRun, 
  WorkflowPhase,
  StreamingChunk,
  SandboxCommand,
  SandboxResult
} from "@shared/schema";
import { createOpenAIClient } from "./openai-service";
import { ORCHESTRATOR_PROMPTS } from "./orchestrator-prompts";
import { executeSandboxCommand } from "./sandbox";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function createTimestamp(): string {
  return new Date().toISOString();
}

export class AgentOrchestrator {
  private res: Response;
  private settings: ApiSettings;
  private client: OpenAI;
  private run: AgentRun;
  private aborted: boolean = false;

  constructor(res: Response, settings: ApiSettings, projectId: string, userGoal: string) {
    this.res = res;
    this.settings = settings;
    this.client = createOpenAIClient(settings);
    this.run = {
      id: generateId(),
      projectId,
      phase: "idle",
      tasks: [],
      currentTaskId: null,
      userGoal,
      supervisorPassCount: 0,
      maxSupervisorRetries: 3,
      startedAt: createTimestamp(),
      logs: [],
    };
  }

  private sendEvent(chunk: Omit<StreamingChunk, "timestamp">) {
    if (this.aborted) return;
    const event: StreamingChunk = {
      ...chunk,
      timestamp: createTimestamp(),
    };
    this.res.write(`data: ${JSON.stringify(event)}\n\n`);
    // Ensure immediate delivery of SSE events
    if (typeof (this.res as any).flush === 'function') {
      (this.res as any).flush();
    }
  }

  private log(level: "info" | "warn" | "error" | "debug", message: string) {
    this.run.logs.push({
      timestamp: createTimestamp(),
      level,
      message,
      phase: this.run.phase,
    });
    this.sendEvent({ type: "log", content: `[${level.toUpperCase()}] ${message}` });
  }

  private setPhase(phase: WorkflowPhase) {
    this.run.phase = phase;
    this.sendEvent({ type: "phase_change", phase });
    this.log("info", `Phase changed to: ${phase}`);
  }

  private async streamChat(
    systemPrompt: string,
    userMessage: string,
    onToken?: (token: string) => void
  ): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    try {
      // Use non-streaming for custom endpoints (like Google Colab) that may not support streaming
      if (this.settings.provider === "custom") {
        console.log("[Custom Endpoint] Making request to:", this.settings.baseUrl);
        console.log("[Custom Endpoint] Model:", this.settings.model);
        console.log("[Custom Endpoint] Message preview:", userMessage.slice(0, 100));
        
        const response = await this.client.chat.completions.create({
          model: this.settings.model || "gpt-4o",
          messages,
          max_tokens: 2048,
          temperature: 0.7,
          stream: false,
        });

        console.log("[Custom Endpoint] Raw response:", JSON.stringify(response).slice(0, 500));
        
        const content = response.choices[0]?.message?.content || "";
        console.log("[Custom Endpoint] Content length:", content.length);
        console.log("[Custom Endpoint] Content preview:", content.slice(0, 200));
        
        if (content) {
          console.log("[Custom Endpoint] Sending", Math.ceil(content.length / 50), "token chunks");
          // Send the entire response as tokens in chunks for UI display
          const chunkSize = 50;
          for (let i = 0; i < content.length; i += chunkSize) {
            if (this.aborted) break;
            const chunk = content.slice(i, i + chunkSize);
            if (onToken) onToken(chunk);
            this.sendEvent({ type: "token", content: chunk });
            console.log("[Custom Endpoint] Sent token chunk:", i, "/", content.length);
          }
          console.log("[Custom Endpoint] All token chunks sent");
        } else {
          console.log("[Custom Endpoint] WARNING: Empty content received");
        }
        return content;
      }

      // Use streaming for OpenAI and Anthropic which support it
      const stream = await this.client.chat.completions.create({
        model: this.settings.model || "gpt-4o",
        messages,
        max_tokens: 4096,
        temperature: 0.7,
        stream: true,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        if (this.aborted) break;
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          if (onToken) onToken(content);
          this.sendEvent({ type: "token", content });
        }
      }
      return fullResponse;
    } catch (error: any) {
      this.log("error", `API Error: ${error.message}`);
      throw error;
    }
  }

  async execute(context: { files?: { path: string; content: string }[] }): Promise<void> {
    try {
      // For custom endpoints (like Google Colab), use simplified single-phase execution
      // This is faster and more reliable for simpler models
      if (this.settings.provider === "custom") {
        await this.simplifiedExecute(context);
        return;
      }

      await this.analyzePhase(context);
      if (this.aborted) return;

      await this.planningPhase();
      if (this.aborted) return;

      await this.structuringPhase();
      if (this.aborted) return;

      await this.executionPhase(context);
      if (this.aborted) return;

      await this.reviewPhase(context);
      if (this.aborted) return;

      this.setPhase("completed");
      this.sendEvent({ type: "complete" });
    } catch (error: any) {
      this.setPhase("failed");
      this.sendEvent({ type: "error", error: error.message });
    }
  }

  // Simplified execution for custom endpoints - single AI call instead of multi-phase
  private async simplifiedExecute(context: { files?: { path: string; content: string }[] }): Promise<void> {
    this.setPhase("executing");

    const filesContext = context.files
      ?.slice(0, 3)
      .map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 500)}\n\`\`\``)
      .join("\n\n") || "";

    const systemPrompt = `You are a helpful coding assistant. Provide clear, concise responses.
When asked to create code, provide the complete implementation with file paths.
Format code blocks with the language name, like: \`\`\`javascript`;

    const userPrompt = `${this.run.userGoal}${filesContext ? `\n\nContext files:\n${filesContext}` : ""}`;

    try {
      await this.streamChat(systemPrompt, userPrompt);
      this.setPhase("completed");
      this.sendEvent({ type: "complete" });
    } catch (error: any) {
      this.setPhase("failed");
      this.sendEvent({ type: "error", error: error.message });
    }
  }

  private async analyzePhase(context: { files?: { path: string; content: string }[] }): Promise<void> {
    this.setPhase("analyzing");
    
    const filesContext = context.files
      ?.slice(0, 5)
      .map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 1000)}\n\`\`\``)
      .join("\n\n") || "No files provided";

    const userPrompt = `USER GOAL: ${this.run.userGoal}

CURRENT PROJECT FILES:
${filesContext}

Analyze the situation and provide your assessment.`;

    this.run.analysisResult = await this.streamChat(
      ORCHESTRATOR_PROMPTS.ANALYZER,
      userPrompt
    );
  }

  private async planningPhase(): Promise<void> {
    this.setPhase("planning");

    const userPrompt = `GOAL: ${this.run.userGoal}

ANALYSIS:
${this.run.analysisResult}

Create an implementation plan.`;

    this.run.planningResult = await this.streamChat(
      ORCHESTRATOR_PROMPTS.PLANNER,
      userPrompt
    );
  }

  private async structuringPhase(): Promise<void> {
    this.setPhase("structuring");

    const userPrompt = `GOAL: ${this.run.userGoal}

PLAN:
${this.run.planningResult}

Break down into prioritized tasks. Return as JSON array:
[{"title": "Task title", "description": "Brief description", "priority": "high|medium|low", "filePath": "optional/path.ts"}]`;

    const response = await this.streamChat(
      ORCHESTRATOR_PROMPTS.STRUCTURER,
      userPrompt
    );

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasksData = JSON.parse(jsonMatch[0]);
        this.run.tasks = tasksData.map((t: any, index: number) => ({
          id: generateId(),
          title: t.title,
          description: t.description,
          status: "todo" as const,
          priority: t.priority || "medium",
          assignee: "worker" as const,
          filePath: t.filePath,
          logs: [],
          createdAt: createTimestamp(),
          updatedAt: createTimestamp(),
        }));

        for (const task of this.run.tasks) {
          this.sendEvent({ type: "task_update", task, taskId: task.id });
        }
      }
    } catch (e) {
      this.log("warn", "Failed to parse tasks JSON, creating single task");
      this.run.tasks = [{
        id: generateId(),
        title: this.run.userGoal,
        description: response,
        status: "todo",
        priority: "high",
        assignee: "worker",
        logs: [],
        createdAt: createTimestamp(),
        updatedAt: createTimestamp(),
      }];
    }
  }

  private async executionPhase(context: { files?: { path: string; content: string }[] }): Promise<void> {
    this.setPhase("executing");

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sortedTasks = [...this.run.tasks].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    for (const task of sortedTasks) {
      if (this.aborted) break;
      await this.executeTask(task, context);
    }
  }

  private async executeTask(
    task: AgentTask,
    context: { files?: { path: string; content: string }[] }
  ): Promise<void> {
    this.run.currentTaskId = task.id;
    task.status = "analyzing";
    task.updatedAt = createTimestamp();
    this.sendEvent({ type: "task_update", task, taskId: task.id });

    const relevantFile = task.filePath 
      ? context.files?.find(f => f.path.includes(task.filePath!))
      : null;

    const analyzePrompt = `TASK: ${task.title}
${task.description ? `DESCRIPTION: ${task.description}` : ""}
${relevantFile ? `\nRELEVANT FILE (${relevantFile.path}):\n\`\`\`\n${relevantFile.content.slice(0, 2000)}\n\`\`\`` : ""}

Analyze this task and determine the best approach.`;

    const analysis = await this.streamChat(
      ORCHESTRATOR_PROMPTS.TASK_ANALYZER,
      analyzePrompt
    );
    task.logs.push(`Analysis: ${analysis.slice(0, 200)}...`);

    task.status = "coding";
    task.updatedAt = createTimestamp();
    this.sendEvent({ type: "task_update", task, taskId: task.id });

    const implementPrompt = `TASK: ${task.title}
ANALYSIS: ${analysis}
${relevantFile ? `\nFILE TO MODIFY (${relevantFile.path}):\n\`\`\`\n${relevantFile.content}\n\`\`\`` : ""}

Implement the solution. Output complete code with file paths.`;

    const implementation = await this.streamChat(
      ORCHESTRATOR_PROMPTS.WORKER,
      implementPrompt
    );
    task.logs.push(`Implementation completed`);

    task.status = "reviewing";
    task.updatedAt = createTimestamp();
    this.sendEvent({ type: "task_update", task, taskId: task.id });

    const lintResult = await this.checkSyntax(implementation);
    if (lintResult.errors.length > 0) {
      task.logs.push(`Syntax issues found: ${lintResult.errors.join(", ")}`);
      
      const fixPrompt = `The following code has syntax issues:
${implementation}

ERRORS:
${lintResult.errors.join("\n")}

Fix these issues and provide corrected code.`;

      await this.streamChat(ORCHESTRATOR_PROMPTS.WORKER, fixPrompt);
    }

    task.status = "done";
    task.completedAt = createTimestamp();
    task.updatedAt = createTimestamp();
    this.sendEvent({ type: "task_complete", task, taskId: task.id });
  }

  private async checkSyntax(code: string): Promise<{ errors: string[] }> {
    const errors: string[] = [];
    
    if (code.includes("```typescript") || code.includes("```ts")) {
      const codeBlocks = code.match(/```(?:typescript|ts)\n([\s\S]*?)```/g) || [];
      for (const block of codeBlocks) {
        const content = block.replace(/```(?:typescript|ts)\n/, "").replace(/```$/, "");
        
        if ((content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length) {
          errors.push("Mismatched curly braces");
        }
        if ((content.match(/\(/g) || []).length !== (content.match(/\)/g) || []).length) {
          errors.push("Mismatched parentheses");
        }
        if ((content.match(/\[/g) || []).length !== (content.match(/\]/g) || []).length) {
          errors.push("Mismatched brackets");
        }
      }
    }
    
    return { errors };
  }

  private async reviewPhase(context: { files?: { path: string; content: string }[] }): Promise<void> {
    this.setPhase("reviewing");
    
    let passed = false;
    let retries = 0;

    while (!passed && retries < this.run.maxSupervisorRetries && !this.aborted) {
      const completedTasks = this.run.tasks.filter(t => t.status === "done");
      const taskSummary = completedTasks
        .map(t => `- ${t.title}: ${t.logs.slice(-1)[0] || "Completed"}`)
        .join("\n");

      const reviewPrompt = `ORIGINAL GOAL: ${this.run.userGoal}

COMPLETED TASKS:
${taskSummary}

ANALYSIS RESULT:
${this.run.analysisResult?.slice(0, 500)}

Review the implementation. Check for:
1. Logic correctness
2. Code quality
3. Goal achievement
4. Missing functionality

Respond with either:
- "PASSED" if everything is correct
- "NEEDS_FIXES: [list of issues]" if changes are needed`;

      const feedback = await this.streamChat(
        ORCHESTRATOR_PROMPTS.SUPERVISOR,
        reviewPrompt
      );

      this.run.supervisorFeedback = feedback;
      this.sendEvent({ type: "supervisor_feedback", content: feedback });

      if (feedback.includes("PASSED")) {
        passed = true;
        this.run.supervisorPassCount++;
        this.log("info", "Supervisor approved the implementation");
      } else {
        retries++;
        this.log("info", `Supervisor requested fixes (attempt ${retries}/${this.run.maxSupervisorRetries})`);
        
        if (retries < this.run.maxSupervisorRetries) {
          const fixPrompt = `SUPERVISOR FEEDBACK:
${feedback}

Apply the requested fixes.`;

          await this.streamChat(ORCHESTRATOR_PROMPTS.WORKER, fixPrompt);
        }
      }
    }

    if (!passed) {
      this.log("warn", "Max supervisor retries reached, proceeding with current implementation");
    }
  }

  abort(): void {
    this.aborted = true;
    this.sendEvent({ type: "error", error: "Operation aborted by user" });
  }

  getRun(): AgentRun {
    return this.run;
  }
}

export function createOrchestrator(
  res: Response,
  settings: ApiSettings,
  projectId: string,
  userGoal: string
): AgentOrchestrator {
  return new AgentOrchestrator(res, settings, projectId, userGoal);
}
