import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { SandboxCommand, SandboxResult, SandboxCommandType } from "@shared/schema";

const execAsync = promisify(exec);

const ALLOWED_COMMANDS = [
  "ls", "cat", "head", "tail", "grep", "find", "wc",
  "npm", "npx", "node", "tsc", "eslint", "prettier"
];

const SANDBOX_ROOT = process.cwd();
const MAX_OUTPUT_LENGTH = 10000;

function sanitizePath(filePath: string): string {
  const normalized = path.normalize(filePath);
  const resolved = path.resolve(SANDBOX_ROOT, normalized);
  
  if (!resolved.startsWith(SANDBOX_ROOT)) {
    throw new Error("Path traversal not allowed");
  }
  
  const forbidden = ["node_modules", ".env", ".git", "dist"];
  for (const dir of forbidden) {
    if (resolved.includes(dir)) {
      throw new Error(`Access to ${dir} is not allowed`);
    }
  }
  
  return resolved;
}

function isCommandAllowed(command: string): boolean {
  const baseCommand = command.split(" ")[0];
  return ALLOWED_COMMANDS.some(allowed => 
    baseCommand === allowed || baseCommand.endsWith(`/${allowed}`)
  );
}

export async function executeSandboxCommand(command: SandboxCommand): Promise<SandboxResult> {
  const { type, args } = command;
  
  try {
    switch (type) {
      case "read_file":
        return await readFile(args.path);
      case "write_file":
        return await writeFile(args.path, args.content);
      case "delete_file":
        return await deleteFile(args.path);
      case "list_files":
        return await listFiles(args.path || ".");
      case "execute_shell":
        return await executeShell(args.command);
      case "search_code":
        return await searchCode(args.pattern, args.path);
      case "get_logs":
        return await getLogs(args.lines || 50);
      case "lint_check":
        return await lintCheck(args.path);
      case "get_preview":
        return await getPreview();
      default:
        return { success: false, error: `Unknown command type: ${type}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message, logs: [error.stack] };
  }
}

async function readFile(filePath: string): Promise<SandboxResult> {
  const safePath = sanitizePath(filePath);
  
  if (!fs.existsSync(safePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }
  
  const content = fs.readFileSync(safePath, "utf-8");
  return { success: true, data: content };
}

async function writeFile(filePath: string, content: string): Promise<SandboxResult> {
  const safePath = sanitizePath(filePath);
  const dir = path.dirname(safePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(safePath, content, "utf-8");
  return { success: true, data: { path: filePath, written: true } };
}

async function deleteFile(filePath: string): Promise<SandboxResult> {
  const safePath = sanitizePath(filePath);
  
  if (!fs.existsSync(safePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }
  
  fs.unlinkSync(safePath);
  return { success: true, data: { path: filePath, deleted: true } };
}

async function listFiles(dirPath: string): Promise<SandboxResult> {
  const safePath = sanitizePath(dirPath);
  
  if (!fs.existsSync(safePath)) {
    return { success: false, error: `Directory not found: ${dirPath}` };
  }
  
  const entries = fs.readdirSync(safePath, { withFileTypes: true });
  const files = entries.map(entry => ({
    name: entry.name,
    type: entry.isDirectory() ? "directory" : "file",
    path: path.join(dirPath, entry.name),
  }));
  
  return { success: true, data: files };
}

async function executeShell(command: string): Promise<SandboxResult> {
  if (!isCommandAllowed(command)) {
    return { success: false, error: `Command not allowed: ${command.split(" ")[0]}` };
  }
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: SANDBOX_ROOT,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
    
    const output = (stdout + stderr).slice(0, MAX_OUTPUT_LENGTH);
    return { success: true, data: output, logs: stderr ? [stderr] : undefined };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message,
      data: error.stdout?.slice(0, MAX_OUTPUT_LENGTH),
      logs: [error.stderr?.slice(0, MAX_OUTPUT_LENGTH)]
    };
  }
}

async function searchCode(pattern: string, searchPath: string = "."): Promise<SandboxResult> {
  const safePath = sanitizePath(searchPath);
  const escapedPattern = pattern.replace(/['"]/g, "");
  
  try {
    const { stdout } = await execAsync(
      `grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "${escapedPattern}" ${safePath}`,
      { cwd: SANDBOX_ROOT, timeout: 10000 }
    );
    
    const matches = stdout.split("\n").filter(Boolean).slice(0, 50);
    return { success: true, data: matches };
  } catch (error: any) {
    if (error.code === 1) {
      return { success: true, data: [] };
    }
    return { success: false, error: error.message };
  }
}

async function getLogs(lines: number = 50): Promise<SandboxResult> {
  const logFiles = [
    "/tmp/logs",
    "logs",
    ".logs"
  ];
  
  const logs: string[] = [];
  
  for (const logDir of logFiles) {
    try {
      const fullPath = path.join(SANDBOX_ROOT, logDir);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        for (const file of files.slice(-5)) {
          const filePath = path.join(fullPath, file);
          if (fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath, "utf-8");
            const recentLines = content.split("\n").slice(-lines);
            logs.push(`=== ${file} ===\n${recentLines.join("\n")}`);
          }
        }
      }
    } catch {
      continue;
    }
  }
  
  return { success: true, data: logs.length > 0 ? logs : ["No logs found"] };
}

async function lintCheck(filePath: string): Promise<SandboxResult> {
  const safePath = sanitizePath(filePath);
  
  if (!fs.existsSync(safePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }
  
  const content = fs.readFileSync(safePath, "utf-8");
  const issues: string[] = [];
  
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes("console.log") && !filePath.includes("test")) {
      issues.push(`Line ${i + 1}: console.log statement found`);
    }
    if (line.includes("any") && filePath.endsWith(".ts")) {
      issues.push(`Line ${i + 1}: 'any' type usage`);
    }
    if (line.length > 120) {
      issues.push(`Line ${i + 1}: Line exceeds 120 characters`);
    }
  }
  
  const braceCount = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
  if (braceCount !== 0) {
    issues.push(`Mismatched braces: ${braceCount > 0 ? "missing" : "extra"} ${Math.abs(braceCount)} closing brace(s)`);
  }
  
  return { 
    success: issues.length === 0, 
    data: issues.length === 0 ? "No issues found" : issues 
  };
}

async function getPreview(): Promise<SandboxResult> {
  return { 
    success: true, 
    data: {
      url: `http://localhost:${process.env.PORT || 5000}`,
      status: "running"
    }
  };
}
