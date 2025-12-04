import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Server,
  Play,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLAB_CODE_SIMPLE = `# AgentForge Simple Setup - OpenAI-Compatible API
# Uses localtunnel for instant public URL (no account needed)
# Runs Microsoft Phi-2 - fast and smart for coding tasks

!pip install -q transformers accelerate torch flask flask-cors

# Step 1: Load the model
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

print("Loading model... (first run takes 2-3 minutes)")

model_name = "microsoft/phi-2"

tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto",
    trust_remote_code=True
)

print("Model loaded successfully!")

# Step 2: Create OpenAI-compatible API server
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def generate_response(prompt, max_tokens=512, temperature=0.7):
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    response = response[len(prompt):].strip()
    return response

@app.route('/v1/chat/completions', methods=['POST', 'OPTIONS'])
def chat_completions():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        messages = data.get('messages', [])
        max_tokens = data.get('max_tokens', data.get('max_completion_tokens', 512))
        temperature = data.get('temperature', 0.7)
        
        # Build prompt from messages
        prompt = ""
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'system':
                prompt += f"System: {content}\\n\\n"
            elif role == 'user':
                prompt += f"User: {content}\\n\\n"
            elif role == 'assistant':
                prompt += f"Assistant: {content}\\n\\n"
        
        prompt += "Assistant: "
        
        response_text = generate_response(prompt, max_tokens, temperature)
        
        return jsonify({
            "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model_name,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": len(tokenizer.encode(prompt)),
                "completion_tokens": len(tokenizer.encode(response_text)),
                "total_tokens": len(tokenizer.encode(prompt)) + len(tokenizer.encode(response_text))
            }
        })
    except Exception as e:
        return jsonify({"error": {"message": str(e), "type": "server_error"}}), 500

@app.route('/v1/models', methods=['GET'])
def list_models():
    return jsonify({
        "object": "list",
        "data": [{
            "id": model_name,
            "object": "model",
            "owned_by": "microsoft"
        }]
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": model_name})

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "AgentForge API is running", "model": model_name})

# Step 3: Start server and create public URL
def run_server():
    app.run(host='0.0.0.0', port=5000, threaded=True)

server_thread = threading.Thread(target=run_server)
server_thread.daemon = True
server_thread.start()

time.sleep(2)

# Install and run localtunnel for public URL
!npm install -g localtunnel > /dev/null 2>&1

import subprocess
import re

print("\\n" + "="*60)
print("CREATING PUBLIC URL...")
print("="*60)

# Run localtunnel and capture URL
proc = subprocess.Popen(
    ['lt', '--port', '5000'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

time.sleep(5)

# Try to get the URL from localtunnel output
for line in proc.stdout:
    if 'your url is:' in line.lower() or 'loca.lt' in line:
        url = line.strip().split()[-1]
        print("\\n" + "="*60)
        print("YOUR ENDPOINT IS READY!")
        print("="*60)
        print(f"\\n🚀 Public URL: {url}")
        print(f"\\n📋 Copy this to AgentForge Custom Endpoint:")
        print(f"   Endpoint: {url}/v1")
        print(f"   Model: {model_name}")
        print("\\n✅ No API key needed - leave it empty!")
        print("\\n⚠️  Note: This is a public endpoint. Keep the Colab tab open.")
        print("="*60)
        break

# Keep running
while True:
    time.sleep(60)`;

const COLAB_CODE_CLOUDFLARE = `# AgentForge Setup with Cloudflare Tunnel (Most Stable)
# Uses cloudflared for reliable public URL (no account needed)
# Best option for longer sessions

!pip install -q transformers accelerate torch flask flask-cors

# Step 1: Load the model
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

print("Loading model... (first run takes 2-3 minutes)")

model_name = "microsoft/phi-2"

tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto",
    trust_remote_code=True
)

print("Model loaded successfully!")

# Step 2: Create OpenAI-compatible API
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
import uuid

app = Flask(__name__)
CORS(app)

def generate_response(prompt, max_tokens=512, temperature=0.7):
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    response = response[len(prompt):].strip()
    return response

@app.route('/v1/chat/completions', methods=['POST', 'OPTIONS'])
def chat_completions():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        messages = data.get('messages', [])
        max_tokens = data.get('max_tokens', data.get('max_completion_tokens', 512))
        temperature = data.get('temperature', 0.7)
        
        prompt = ""
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'system':
                prompt += f"System: {content}\\n\\n"
            elif role == 'user':
                prompt += f"User: {content}\\n\\n"
            elif role == 'assistant':
                prompt += f"Assistant: {content}\\n\\n"
        
        prompt += "Assistant: "
        response_text = generate_response(prompt, max_tokens, temperature)
        
        return jsonify({
            "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model_name,
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": response_text},
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": len(tokenizer.encode(prompt)),
                "completion_tokens": len(tokenizer.encode(response_text)),
                "total_tokens": len(tokenizer.encode(prompt)) + len(tokenizer.encode(response_text))
            }
        })
    except Exception as e:
        return jsonify({"error": {"message": str(e)}}), 500

@app.route('/v1/models', methods=['GET'])
def list_models():
    return jsonify({"object": "list", "data": [{"id": model_name, "object": "model", "owned_by": "microsoft"}]})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": model_name})

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "AgentForge API running", "model": model_name})

# Step 3: Start server
def run_server():
    app.run(host='0.0.0.0', port=5000, threaded=True)

server_thread = threading.Thread(target=run_server)
server_thread.daemon = True
server_thread.start()
time.sleep(2)

# Step 4: Install and run cloudflared
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
!chmod +x cloudflared

import subprocess
import re

print("\\n" + "="*60)
print("CREATING CLOUDFLARE TUNNEL...")
print("="*60)

proc = subprocess.Popen(
    ['./cloudflared', 'tunnel', '--url', 'http://localhost:5000'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Cloudflare outputs to stderr
for line in proc.stderr:
    match = re.search(r'https://[a-zA-Z0-9-]+\\.trycloudflare\\.com', line)
    if match:
        url = match.group(0)
        print("\\n" + "="*60)
        print("YOUR ENDPOINT IS READY!")
        print("="*60)
        print(f"\\n🚀 Public URL: {url}")
        print(f"\\n📋 Copy this to AgentForge Custom Endpoint:")
        print(f"   Endpoint: {url}/v1")
        print(f"   Model: {model_name}")
        print("\\n✅ No API key needed - leave it empty!")
        print("\\n⚠️  Keep Colab tab open. Cloudflare tunnels are very stable!")
        print("="*60)
        break

while True:
    time.sleep(60)`;

export default function ColabSetup() {
  const [copiedSimple, setCopiedSimple] = useState(false);
  const [copiedCloudflare, setCopiedCloudflare] = useState(false);
  const [expandedSection, setExpandedSection] = useState<"cloudflare" | "simple" | null>("simple");

  const handleCopy = async (code: string, type: "cloudflare" | "simple") => {
    try {
      await navigator.clipboard.writeText(code);
      if (type === "cloudflare") {
        setCopiedCloudflare(true);
        setTimeout(() => setCopiedCloudflare(false), 2000);
      } else {
        setCopiedSimple(true);
        setTimeout(() => setCopiedSimple(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to AgentForge
            </Button>
          </Link>
          <a
            href="https://colab.research.google.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              Open Google Colab
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 mb-6">
            <Server className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free AI Endpoint Setup
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Run powerful AI models for free using Google Colab. No API keys, no tokens, 
            no cost - just copy the code and run it.
          </p>
        </div>

        <div className="grid gap-6 mb-12">
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-1">How It Works</h3>
                <ol className="text-green-800 space-y-2 text-sm">
                  <li><span className="font-medium">1.</span> Copy the code below</li>
                  <li><span className="font-medium">2.</span> Open Google Colab and create a new notebook</li>
                  <li><span className="font-medium">3.</span> Paste the code and click "Run All"</li>
                  <li><span className="font-medium">4.</span> Wait for the model to load (2-3 minutes)</li>
                  <li><span className="font-medium">5.</span> Copy the generated URL back to AgentForge</li>
                </ol>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === "simple" ? null : "simple")}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quick Setup with LocalTunnel</h3>
                  <p className="text-sm text-gray-600">No account needed - instant public URL</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Easiest
                </span>
                {expandedSection === "simple" ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {expandedSection === "simple" && (
              <div className="border-t">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
                  <span className="text-sm text-gray-400 font-mono">colab_simple_setup.py</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(COLAB_CODE_SIMPLE, "simple")}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    {copiedSimple ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <ScrollArea className="h-[400px]">
                  <pre className="p-4 text-sm font-mono text-gray-300 bg-gray-950 overflow-x-auto">
                    <code>{COLAB_CODE_SIMPLE}</code>
                  </pre>
                </ScrollArea>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === "cloudflare" ? null : "cloudflare")}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Server className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Cloudflare Tunnel (Most Stable)</h3>
                  <p className="text-sm text-gray-600">Best for longer sessions - very reliable connection</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                  Recommended
                </span>
                {expandedSection === "cloudflare" ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {expandedSection === "cloudflare" && (
              <div className="border-t">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
                  <span className="text-sm text-gray-400 font-mono">colab_cloudflare_setup.py</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(COLAB_CODE_CLOUDFLARE, "cloudflare")}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    {copiedCloudflare ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <ScrollArea className="h-[400px]">
                  <pre className="p-4 text-sm font-mono text-gray-300 bg-gray-950 overflow-x-auto">
                    <code>{COLAB_CODE_CLOUDFLARE}</code>
                  </pre>
                </ScrollArea>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">After Running the Code</h3>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                <span>Wait for the model to download and load (first run takes 2-3 min)</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                <span>Copy the public URL shown in the output</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                <span>In AgentForge, select "Custom Endpoint"</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium flex-shrink-0">4</span>
                <span>Paste the URL in the endpoint field</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium flex-shrink-0">5</span>
                <span>Enter "microsoft/phi-2" as the model name</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium flex-shrink-0">6</span>
                <span>Leave API key empty - it's not needed!</span>
              </li>
            </ol>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Tips for Best Performance</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Enable GPU in Colab: Runtime → Change runtime type → T4 GPU</span>
              </li>
              <li className="flex gap-3">
                <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Keep the Colab tab open while using AgentForge</span>
              </li>
              <li className="flex gap-3">
                <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Free Colab sessions last ~12 hours before needing restart</span>
              </li>
              <li className="flex gap-3">
                <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>Phi-2 is fast and smart - great balance for coding tasks</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card className="mt-6 p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">Security Note</h4>
              <p className="text-sm text-amber-800">
                The tunnel creates a public endpoint accessible from anywhere. This is fine for personal use, 
                but avoid sending sensitive data. The endpoint is only active while your Colab session is running.
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-12 text-center">
          <Link href="/">
            <Button size="lg" className="bg-gray-900 hover:bg-gray-800">
              Return to AgentForge
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
