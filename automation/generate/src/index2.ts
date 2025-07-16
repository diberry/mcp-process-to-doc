// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * This application creates an AI agent that helps manage Azure MCP documentation
 * by comparing engineering and content team files, identifying new tools and operations,
 * and preparing documentation files.
 *
 * @summary An AI agent for Azure MCP documentation management
 */
// @ts-nocheck
import type {
  MessageDeltaChunk,
  MessageDeltaTextContent,
  MessageTextContent,
  ThreadRun,
} from "@azure/ai-agents";
import {
  RunStreamEvent,
  MessageStreamEvent,
  DoneEvent,
  ErrorEvent,
  AgentsClient,
  isOutputOfType,
  ToolUtility,
} from "@azure/ai-agents";
import { DefaultAzureCredential } from "@azure/identity";

import * as fs from "fs";
import * as path from "node:path";
import * as https from "https";
import "dotenv/config";
import { ReadableStream } from "stream/web";
import { Buffer } from "buffer";

// Import simplified persistence
import { SimpleState, initializeRun, loadPreviousResults, createAgentInstructions } from "./simple-persistence.js";
// Import configuration
import { getRunConfiguration } from "./config.js";

/*

folder structure:

automation/
  ├── generate/
  │   ├── src/
  │   │   └── index2.ts
  │   ├── generated/
  │   │   ├── <timestamp>/
  │   │   │   └── source-of-truth/
  │   │   │       ├── azmcp-commands.md
  │   │   │       └── tools.json
  │   │   │   └── content/
  │   │   │       ├── tools.json
  │   │   │       ├── tool.md
  │   │   │       ├── tool-partial.md
  ├── node_modules/
  ├── package.json
  └── .gitignore

*/

// Initialize configuration for this run
const config = getRunConfiguration();

console.log(`Using repository root path: ${config.paths.repoRootPath}`);
console.log(`Timestamped directory: ${config.runPaths.timestampedDir}`);
console.log(`Source of truth directory: ${config.runPaths.sourceOfTruthDir}`);
console.log(`Content directory: ${config.runPaths.contentDir}`);
console.log(`Run timestamp: ${config.timestamp}`);

/**
 * Ensure required directories exist
 */
function ensureDirectoriesExist(): void {
  if (!fs.existsSync(config.paths.generatedBaseDir)) {
    fs.mkdirSync(config.paths.generatedBaseDir, { recursive: true });
    console.log(`Created generated base directory: ${config.paths.generatedBaseDir}`);
  }
  if (!fs.existsSync(config.runPaths.timestampedDir)) {
    fs.mkdirSync(config.runPaths.timestampedDir, { recursive: true });
    console.log(`Created timestamped directory: ${config.runPaths.timestampedDir}`);
  }
  if (!fs.existsSync(config.runPaths.sourceOfTruthDir)) {
    fs.mkdirSync(config.runPaths.sourceOfTruthDir, { recursive: true });
    console.log(`Created source of truth directory: ${config.runPaths.sourceOfTruthDir}`);
  }
  if (!fs.existsSync(config.runPaths.contentDir)) {
    fs.mkdirSync(config.runPaths.contentDir, { recursive: true });
    console.log(`Created content directory: ${config.runPaths.contentDir}`);
  }
}

/**
 * Initialize the Azure AI Client
 * @returns {AgentsClient} The initialized client
 */
function initializeClient(): AgentsClient {
  return new AgentsClient(config.azure.projectEndpoint, new DefaultAzureCredential());
}

/**
 * Download a file from GitHub
 * @param {string} url - The URL of the file to download
 * @param {string} localPath - Local path to save the file
 * @returns {Promise<void>}
 */
async function downloadGitHubFile(url: string, localPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(localPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded file to ${localPath}`);
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlinkSync(localPath);
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Read file contents from disk
 * @param {string} filePath - Path to the file to read
 * @returns {Promise<string>} The file contents
 */
async function readFile(filePath: string): Promise<string> {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Write content to a file
 * @param {string} filePath - Path where the file should be written
 * @param {string} content - Content to write to the file
 * @returns {Promise<void>}
 */
async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`File written to ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Upload files to the Azure Agents service
 * @param {AgentsClient} client - The client to use for file upload
 * @param {string[]} filePaths - Paths to the files to upload
 * @returns {Promise<any[]>} The uploaded file information
 */
async function uploadFiles(client: AgentsClient, filePaths: string[]): Promise<any[]> {
  const uploadedFiles = [];
  
  for (const filePath of filePaths) {
    try {
      const localFileStream = fs.createReadStream(filePath);
      const fileName = path.basename(filePath);
      
      const localFile = await client.files.upload(localFileStream, "assistants", {
        fileName: fileName,
      });
      console.log(`Uploaded ${fileName}, file ID: ${localFile.id}`);
      uploadedFiles.push(localFile);
    } catch (error) {
      console.error(`Error uploading file ${filePath}:`, error);
      throw error;
    }
  }
  
  return uploadedFiles;
}

/**
 * Create an agent specialized for MCP documentation work
 * @param {AgentsClient} client - The client to use for agent creation
 * @param {string[]} fileIds - IDs of files to attach to the agent
 * @returns {Promise<any>} The created agent
 */
async function createDocumentationAgent(client: AgentsClient, fileIds: string[]): Promise<any> {
  const codeInterpreterTool = ToolUtility.createCodeInterpreterTool(fileIds);
  
  const agentInstructions = `
You are an expert Azure documentation specialist with deep knowledge of Azure services and documentation standards.
Your task is to analyze Azure MCP (Model Context Protocol) information provided by the engineering team to identify new tools and operations.

You have access to the following files:
- azmcp-commands.md: Engineering team's command reference
- tools.json: Content team's current tool definitions
- new.template.md: Template for organizing new findings
- create-docs.prompt.md: Documentation creation guidelines
- editorial-review.md: Editorial review process and standards

Follow these steps:
1. Compare the engineering team's azmcp-commands.md file with the content team's tools.json to find new tools/commands.
2. Identify completely new tool categories that don't exist in tools.json.
3. Identify new operations for existing tool categories.
4. Create properly formatted output in new.md based on new.template.md format.
5. Update tools.json with the new tools and operations while maintaining the existing structure.
6. Follow the guidelines in create-docs.prompt.md and editorial-review.md for documentation standards.
7. Research and add documentation URLs for each new tool to understand proper branding and terminology.

Use JavaScript/TypeScript, JSON processing capabilities, and markdown parsing to accomplish this task.
`;

  const agent = await client.createAgent(config.azure.modelDeploymentName, {
    name: "azure-mcp-documentation-agent",
    instructions: agentInstructions,
    tools: [codeInterpreterTool.definition],
    toolResources: codeInterpreterTool.resources,
  });
  
  console.log(`Created documentation agent, agent ID: ${agent.id}`);
  return agent;
}

/**
 * Create a documentation agent with a specific model and simplified persistence
 * @param {AgentsClient} client - The client to use for agent creation
 * @param {string[]} fileIds - IDs of files to attach to the agent
 * @param {string} modelName - The model deployment name to use
 * @param {string} agentNotesDir - Directory where agent should write notes
 * @param {boolean} hasPreviousResults - Whether previous results are available
 * @returns {Promise<any>} The created agent
 */
async function createDocumentationAgentWithModel(
  client: AgentsClient, 
  fileIds: string[], 
  modelName: string, 
  agentNotesDir: string, 
  hasPreviousResults: boolean = false
): Promise<any> {
  const codeInterpreterTool = ToolUtility.createCodeInterpreterTool(fileIds);
  
  const agentInstructions = createAgentInstructions(agentNotesDir, hasPreviousResults ? "previous-new.md" : undefined);

  const agent = await client.createAgent(modelName, {
    name: "azure-mcp-documentation-agent",
    instructions: agentInstructions,
    tools: [codeInterpreterTool.definition],
    toolResources: codeInterpreterTool.resources,
  });
  
  console.log(`Created documentation agent with model ${modelName}, agent ID: ${agent.id}`);
  return agent;
}

/**
 * Create a new thread
 * @param {AgentsClient} client - The client to use for thread creation
 * @returns {Promise<any>} The created thread
 */
async function createThread(client: AgentsClient): Promise<any> {
  const thread = await client.threads.create();
  console.log(`Created thread, thread ID: ${thread.id}`);
  return thread;
}

/**
 * Send a message to the thread with specific documentation task
 * @param {AgentsClient} client - The client to use for message creation
 * @param {string} threadId - The ID of the thread to send the message to
 * @param {boolean} hasExistingNewMd - Whether new.md already exists from previous runs
 * @returns {Promise<any>} The created message
 */
async function sendDocumentationTask(client: AgentsClient, threadId: string, agentNotesDir: string, hasExistingNewMd: boolean = false): Promise<any> {
  const baseAnalysisCode = `
import re
import json
import os

# Create agent notes directory and write initial log
os.makedirs("${agentNotesDir.replace(/\\/g, '/')}", exist_ok=True)

print("=== ANALYZING AZURE MCP TOOLS ===")
print("Available files:", os.listdir("."))

# Log to agent notes
with open("${agentNotesDir.replace(/\\/g, '/')}/analysis-log.txt", "w") as log_file:
    log_file.write("Starting Azure MCP analysis\\n")
    log_file.write(f"Available files: {os.listdir('.')}\\n")

# Load azmcp-commands.md
with open('azmcp-commands.md', 'r') as f:
    commands_content = f.read()

# Load tools.json  
with open('tools.json', 'r') as f:
    tools_data = json.load(f)

# Extract function names from commands
command_functions = re.findall(r'mcp_azure_mcp_ser_azmcp-[a-zA-Z0-9_-]+', commands_content)

# Extract function names from tools
tool_functions = []
if isinstance(tools_data, list):
    for tool in tools_data:
        if 'function' in tool:
            tool_functions.append(tool['function'])

# Find new functions
new_functions = sorted(set(command_functions) - set(tool_functions))

print(f"\\nFound {len(command_functions)} total functions in commands")
print(f"Found {len(tool_functions)} existing functions in tools")
print(f"Found {len(new_functions)} NEW functions")

# Save detailed analysis to agent notes
with open("${agentNotesDir.replace(/\\/g, '/')}/function-analysis.txt", "w") as analysis_file:
    analysis_file.write(f"Total functions: {len(command_functions)}\\n")
    analysis_file.write(f"Existing functions: {len(tool_functions)}\\n")
    analysis_file.write(f"New functions: {len(new_functions)}\\n\\n")
    analysis_file.write("New function list:\\n")
    for i, func in enumerate(new_functions, 1):
        analysis_file.write(f"{i}. {func}\\n")
`;

  const existingFileHandling = hasExistingNewMd ? `
# Check if new.md already exists and load it
existing_new_functions = []
if os.path.exists('new.md'):
    print("\\n=== FOUND EXISTING new.md FILE ===")
    with open('new.md', 'r') as f:
        existing_content = f.read()
    
    # Extract existing function names from the file
    existing_lines = existing_content.split('\\n')
    for line in existing_lines:
        if line.strip() and (line.startswith('- mcp_') or line.split('. ', 1)[-1].startswith('mcp_')):
            # Handle both "- function_name" and "1. function_name" formats
            func_name = line.split('mcp_', 1)[-1].split()[0] if 'mcp_' in line else ''
            if func_name:
                existing_new_functions.append(f"mcp_{func_name}")
    
    print(f"Found {len(existing_new_functions)} functions in existing new.md")
    
    # Combine with newly found functions (remove duplicates)
    all_new_functions = sorted(set(new_functions + existing_new_functions))
    print(f"Total unique new functions after merge: {len(all_new_functions)}")
    new_functions = all_new_functions
else:
    print("\\nNo existing new.md file found - creating fresh analysis")
` : `
print("\\nNo existing new.md file to check - creating fresh analysis")
`;

  const content = `
EXECUTE CODE IMMEDIATELY - DO NOT PLAN OR DESCRIBE

You must IMMEDIATELY execute this Python code using the code interpreter tool. Do not provide explanations or plans first. Just run the code:

${baseAnalysisCode}
${existingFileHandling}

# Create new.md with detailed information
new_md_content = f"""# New Azure MCP Functions Analysis

## Summary
- **Total functions in azmcp-commands.md**: {len(command_functions)}
- **Existing functions in tools.json**: {len(tool_functions)}
- **New functions discovered**: {len(new_functions)}

## New Functions List

"""

for i, func in enumerate(new_functions, 1):
    new_md_content += f"{i}. {func}\\n"

# Save to new.md
with open('new.md', 'w') as f:
    f.write(new_md_content)

print("\\n=== COMPLETE CONTENTS OF new.md ===")
print(new_md_content)
print("=== END OF new.md ===")

print(f"\\nFirst 10 new functions:")
for i, func in enumerate(new_functions[:10], 1):
    print(f"{i}. {func}")
    
print(f"\\nTotal functions saved to new.md: {len(new_functions)}")

# List all files in current directory to confirm new.md was created
import os
print("\\n=== FILES IN CURRENT DIRECTORY ===")
for file in os.listdir('.'):
    print(f"- {file}")
print("=== END FILE LIST ===")
`;

  const message = await client.messages.create(threadId, "user", content);
  console.log(`Created documentation task message, message ID: ${message.id}`);
  return message;
}

/**
 * Send a continuation message to an existing thread
 * @param {AgentsClient} client - The client to use for message creation
 * @param {string} threadId - The ID of the thread to send the message to
 * @param {boolean} hasExistingNewMd - Whether new.md already exists from previous runs
 * @returns {Promise<any>} The created message
 */
async function sendContinuationTask(client: AgentsClient, threadId: string, hasExistingNewMd: boolean = false): Promise<any> {
  const content = `
Continue from where we left off. You should have access to the files from our previous conversation including any new.md file we created.

IMPORTANT: Use the code interpreter to execute this Python code (do not just describe it):

import os
print("=== CURRENT WORKSPACE STATUS ===")
print("Available files:", os.listdir("."))

# Check if new.md exists and show its contents
if os.path.exists('new.md'):
    print("\\n=== EXISTING new.md CONTENTS ===")
    with open('new.md', 'r') as f:
        content = f.read()
    print(content)
    print("=== END OF new.md ===")
    
    # Count functions in it
    lines = content.split('\\n')
    function_count = len([line for line in lines if line.strip() and ('mcp_azure_mcp_ser_azmcp-' in line)])
    print(f"\\nFunction count in existing new.md: {function_count}")
else:
    print("\\nNo new.md file found - we need to create it fresh")
    
    # Run the analysis
    import re
    import json
    
    # Load files and do analysis
    with open('azmcp-commands.md', 'r') as f:
        commands_content = f.read()
    with open('tools.json', 'r') as f:
        tools_data = json.load(f)
    
    command_functions = re.findall(r'mcp_azure_mcp_ser_azmcp-[a-zA-Z0-9_-]+', commands_content)
    tool_functions = []
    if isinstance(tools_data, list):
        for tool in tools_data:
            if 'function' in tool:
                tool_functions.append(tool['function'])
    
    new_functions = sorted(set(command_functions) - set(tool_functions))
    
    print(f"Found {len(new_functions)} new functions to document")
    print("First 5:", new_functions[:5] if new_functions else "None")
`;

  const message = await client.messages.create(threadId, "user", content);
  console.log(`Created continuation message, message ID: ${message.id}`);
  return message;
}

/**
 * Process a run stream and handle different event types
 * @param {AgentsClient} client - The client to use for run stream processing
 * @param {string} threadId - The ID of the thread to run
 * @param {string} agentId - The ID of the agent to run
 */
async function processRunStream(client: AgentsClient, threadId: string, agentId: string): Promise<void> {
  console.log("Starting agent processing...");
  console.log(`Thread ID: ${threadId}, Agent ID: ${agentId}`);
  
  try {
    const streamEventMessages = await client.runs.create(threadId, agentId).stream();
    console.log("Stream created successfully");

    for await (const eventMessage of streamEventMessages) {
      console.log(`Event type: ${eventMessage.event}`);
      switch (eventMessage.event) {
        case RunStreamEvent.ThreadRunCreated:
          console.log(`ThreadRun status: ${(eventMessage.data as ThreadRun).status}`);
          break;
        case RunStreamEvent.ThreadRunInProgress:
          console.log("ThreadRun is in progress...");
          break;
        case RunStreamEvent.ThreadRunRequiresAction:
          console.log("ThreadRun requires action");
          console.log("Required action:", JSON.stringify(eventMessage.data, null, 2));
          break;
        case "thread.run.step.created":
          console.log("Run step created");
          console.log("Step details:", JSON.stringify(eventMessage.data, null, 2));
          break;
        case "thread.run.step.in_progress":
          console.log("Run step in progress");
          console.log("Step details:", JSON.stringify(eventMessage.data, null, 2));
          break;
        case "thread.run.step.completed":
          console.log("Run step completed");
          console.log("Step details:", JSON.stringify(eventMessage.data, null, 2));
          break;
        case MessageStreamEvent.ThreadMessageDelta:
          {
            const messageDelta = eventMessage.data as MessageDeltaChunk;
            messageDelta.delta.content.forEach((contentPart) => {
              if (contentPart.type === "text") {
                const textContent = contentPart as MessageDeltaTextContent;
                const textValue = textContent.text?.value || "No text";
                console.log(`Assistant: ${textValue}`);
              }
            });
          }
          break;
        case RunStreamEvent.ThreadRunCompleted:
          console.log("Documentation task completed");
          break;
        case RunStreamEvent.ThreadRunFailed:
          console.log("ThreadRun failed");
          console.log("Failure details:", JSON.stringify(eventMessage.data, null, 2));
          break;
        case RunStreamEvent.ThreadRunCancelled:
          console.log("ThreadRun was cancelled");
          break;
        case ErrorEvent.Error:
          console.log(`An error occurred. Data: ${eventMessage.data}`);
          break;
        case DoneEvent.Done:
          console.log("Stream completed.");
          break;
        default:
          console.log(`Unhandled event: ${eventMessage.event}`);
          break;
      }
    }
  } catch (error) {
    console.error("Error in processRunStream:", error);
  }
}

/**
 * Extract a text preview from an AI message content array or plain text
 * @param {any} messageContent - The message content array from an AI response or plain text
 * @param {number} maxLength - Maximum length of the preview (default: 200)
 * @returns {string} A preview of the text content or a fallback message
 */
function extractTextPreview(messageContent: any, maxLength: number = 200): string {
  // Handle plain string input
  if (typeof messageContent === 'string') {
    return messageContent.length > maxLength ? messageContent.slice(0, maxLength) + '...' : messageContent;
  }
  
  // Handle array input (AI message content)
  if (!messageContent || !Array.isArray(messageContent) || messageContent.length === 0) {
    return "No content found";
  }
  
  const textContent = messageContent.find(content => content.type === 'text');
  if (!textContent || !textContent.text || !textContent.text.value) {
    return "No text content found";
  }
  
  const text = textContent.text.value;
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

/**
 * Extract and save generated files from the assistant's message
 * @param {AgentsClient} client - The client to use for file operations
 * @param {any[]} messagesArray - Array of messages to search for files
 * @param {string} contentDir - Directory where content files should be saved
 * @param {string} sourceOfTruthDir - Directory where persistent files should be saved
 * @returns {Promise<string[]>} Paths to the saved files
 */
async function saveGeneratedFiles(client: AgentsClient, messagesArray: any[], contentDir: string, sourceOfTruthDir: string): Promise<string[]> {
  const savedFilePaths = [];
  
  console.log(`\n=== DEBUGGING: Found ${messagesArray.length} total messages ===`);
  
  // Get the assistant's message(s)
  const assistantMessages = messagesArray.filter((msg) => msg.role === "assistant");
  console.log(`Found ${assistantMessages.length} assistant messages`);
  
  if (!assistantMessages.length) {
    console.log("No assistant messages found");
    return savedFilePaths;
  }

  for (let i = 0; i < assistantMessages.length; i++) {
    const message = assistantMessages[i];
    console.log(`\n--- Processing assistant message ${i + 1} ---`);
    console.log(`Message content length: ${message.content?.length || 0}`);
    
    if (message.content) {
      message.content.forEach((content, idx) => {
        console.log(`Content ${idx + 1}: type="${content.type}"`);
        if (content.type === "text" && content.text?.value) {
          const textLength = content.text.value.length;
          console.log(`  Text content length: ${textLength}`);
          console.log(`  Contains code blocks: ${content.text.value.includes("```")}`);
          console.log(`  First 200 chars: ${extractTextPreview([content])}...`);
        } else if (content.type === "file") {
          console.log(`  File ID: ${content.file?.fileId}`);
        }
      });
    }

    // Look for any file attachments in the message
    const fileOutputs = message.content.filter(content => 
      (content.type === "file" && content.file?.fileId) || 
      (content.type === "text" && content.text?.value.includes("```"))
    );
    
    console.log(`Found ${fileOutputs.length} potential file outputs in this message`);
    
    if (!fileOutputs.length) {
      console.log("No file outputs found in this assistant message");
      continue;
    }

    // Process each file output
    for (const output of fileOutputs) {
      try {
        if (output.type === "file" && output.file?.fileId) {
          // Handle direct file attachment
          const fileId = output.file.fileId;
          const fileInfo = await client.files.get(fileId);
          const fileName = fileInfo.filename;
          const localFilePath = path.join(contentDir, fileName);
          
          console.log(`Processing file attachment: ${fileName}`);
          
          const fileContent = await client.files.getContent(fileId).asNodeStream();
          if (fileContent && fileContent.body) {
            const chunks = [];
            for await (const chunk of fileContent.body) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            const buffer = Buffer.concat(chunks);
            fs.writeFileSync(localFilePath, buffer);
            console.log(`✓ Saved file to ${localFilePath}`);
            savedFilePaths.push(localFilePath);
          }
        } else if (output.type === "text") {
          // Extract files from code blocks in text
          const text = output.text.value;
          console.log(`Processing text content for code blocks...`);
          
          // More comprehensive regex to catch different code block formats
          const patterns = [
            // Python execution output with file content (new.md content displayed)
            /=== COMPLETE CONTENTS OF new\.md ===\s*\n([\s\S]*?)\n=== END OF new\.md ===/gi,
            // Standard format with filename
            /```(?:json|markdown|md|javascript|js)?\s*(?:filename:\s*)?([^\n\s]+\.(?:json|md|js))\s*\n([\s\S]*?)```/gi,
            // Format with just the extension
            /```(json|markdown|md)\s*\n([\s\S]*?)```/gi,
            // Any code block containing JSON or markdown
            /```(?:json|markdown|md|javascript|js)?\s*\n([\s\S]*?)```/gi
          ];
          
          let foundFiles = false;
          
          for (const pattern of patterns) {
            const matches = [...text.matchAll(pattern)];
            console.log(`Pattern found ${matches.length} matches`);
            
            for (const match of matches) {
              foundFiles = true;
              let fileName = "";
              let content = "";
              
              // Check if this is the special case of Python execution output showing new.md content
              if (match[0].includes("=== COMPLETE CONTENTS OF new.md ===")) {
                fileName = "new.md";
                content = match[1];
                console.log(`Found new.md content from Python execution output`);
              } else if (match.length === 3 && match[1] && match[2]) {
                // Pattern with filename
                fileName = match[1];
                content = match[2];
              } else if (match.length === 3 && (match[1] === 'json' || match[1] === 'markdown' || match[1] === 'md')) {
                // Pattern with extension only
                content = match[2];
                if (match[1] === 'json') {
                  fileName = "updated-tools.json";
                } else {
                  fileName = "new.md";
                }
              } else if (match.length === 2) {
                // Any code block
                content = match[1];
                // Guess filename from content
                if (content.includes("{") && content.includes("}")) {
                  fileName = "updated-tools.json";
                } else if (content.includes("# New Azure MCP") || content.includes("# New") || content.includes("## ")) {
                  fileName = "new.md";
                } else {
                  fileName = "documentation-research.md";
                }
              }
              
              if (fileName && content && content.trim()) {
                console.log(`Found code block for file: ${fileName}`);
                console.log(`Content length: ${content.length}`);
                console.log(`Content preview: ${extractTextPreview(content, 100)}`);
                
                const localFilePath = path.join(contentDir, fileName);
                fs.writeFileSync(localFilePath, content.trim());
                console.log(`✓ Extracted and saved file to ${localFilePath}`);
                savedFilePaths.push(localFilePath);
                
                // If this is new.md, also save it persistently in source-of-truth for next run
                if (fileName === "new.md") {
                  const persistentPath = path.join(sourceOfTruthDir, "new.md");
                  fs.writeFileSync(persistentPath, content.trim());
                  console.log(`✓ Saved persistent copy to ${persistentPath} for future runs`);
                }
              }
            }
            
            if (foundFiles) break; // Stop after first successful pattern
          }
          
          if (!foundFiles) {
            console.log("No code blocks found in text content");
          }
        }
      } catch (error) {
        console.error("Error saving generated file:", error);
      }
    }
  }
  
  console.log(`\n=== DEBUGGING COMPLETE: Saved ${savedFilePaths.length} files ===`);
  return savedFilePaths;
}

/**
 * Get all messages from a thread
 * @param {AgentsClient} client - The client to use for message retrieval
 * @param {string} threadId - The ID of the thread to get messages from
 * @returns {Promise<any[]>} Array of messages
 */
async function getThreadMessages(client: AgentsClient, threadId: string): Promise<any[]> {
  console.log("\n=== RETRIEVING THREAD MESSAGES ===");
  const messagesIterator = client.messages.list(threadId);
  const messagesArray = [];
  
  for await (const m of messagesIterator) {
    console.log(`Message: role="${m.role}", content_length=${m.content?.length || 0}`);
    messagesArray.push(m);
  }
  
  console.log(`Total messages retrieved: ${messagesArray.length}`);
  return messagesArray;
}

/**
 * Clean up resources
 * @param {AgentsClient} client - The client to use for resource cleanup
 * @param {any} agent - The agent to delete
 * @param {any[]} uploadedFiles - The files to delete
 */
async function cleanupResources(client: AgentsClient, agent: any, uploadedFiles: any[]): Promise<void> {
  // Delete the uploaded files
  for (const file of uploadedFiles) {
    await client.files.delete(file.id);
    console.log(`Deleted file, file ID : ${file.id}`);
  }
  
  // Delete the agent
  await client.deleteAgent(agent.id);
  console.log(`Deleted agent, agent ID: ${agent.id}`);
}

/**
 * Initialize the run state and check for previous results
 */
export async function initializeRunState(): Promise<{ runState: any, hasPreviousResults: boolean, previousResultsPath?: string }> {
  console.log("Initializing run state...");
  
  // Initialize simplified persistence
  const runState = initializeRun(config.paths.repoRootPath, config.timestamp);
  
  // Check for previous successful results
  const previousResultsPath = loadPreviousResults(config.paths.repoRootPath);
  const hasPreviousResults = !!previousResultsPath;
  
  if (hasPreviousResults) {
    console.log(`Found previous results: ${previousResultsPath}`);
  }
  
  // Ensure required directories exist
  ensureDirectoriesExist();
  
  console.log("✓ Run state initialized successfully");
  return { runState, hasPreviousResults, previousResultsPath };
}

/**
 * Download and prepare source files from GitHub
 */
export async function prepareSourceFiles(): Promise<{ commandsFilePath: string, toolsJsonFilePath: string, toolsJsonBackupPath: string }> {
  console.log("Preparing source files...");
  
  // Prepare local files in source-of-truth directory
  const commandsFilePath = config.runFilePaths.commandsFilePath;
  const toolsJsonFilePath = config.runFilePaths.toolsJsonFilePath;
  const toolsJsonBackupPath = config.runFilePaths.toolsJsonBackupPath;
  
  // Download files from GitHub
  console.log("Downloading source files...");
  await downloadGitHubFile(config.urls.engineeringTeamCommandsUrl, commandsFilePath);
  await downloadGitHubFile(config.urls.contentTeamToolsUrl, toolsJsonFilePath);
  
  // Make a backup of the tools.json file in the timestamped directory
  fs.copyFileSync(toolsJsonFilePath, toolsJsonBackupPath);
  console.log(`Backed up tools.json to ${toolsJsonBackupPath}`);
  
  console.log("✓ Source files prepared successfully");
  return { commandsFilePath, toolsJsonFilePath, toolsJsonBackupPath };
}

/**
 * Prepare files for upload to Azure AI
 */
export async function prepareFilesForUpload(sourceFiles: { commandsFilePath: string, toolsJsonFilePath: string }, hasPreviousResults: boolean, previousResultsPath?: string): Promise<string[]> {
  console.log("Preparing files for upload...");
  
  const filesToUpload = [
    sourceFiles.commandsFilePath, 
    sourceFiles.toolsJsonFilePath, 
    config.sourceFilePaths.templateFilePath,
    config.sourceFilePaths.createDocsPromptPath,
    config.sourceFilePaths.editorialReviewPath
  ];
  
  // Add previous results if available
  if (hasPreviousResults && previousResultsPath) {
    filesToUpload.push(previousResultsPath);
    console.log(`Including previous results in upload: ${previousResultsPath}`);
  }
  
  console.log(`✓ Prepared ${filesToUpload.length} files for upload`);
  return filesToUpload;
}

/**
 * Setup and configure Azure AI agent
 */
export async function setupAzureAgent(client: AgentsClient, uploadedFiles: any[]): Promise<string> {
  console.log("Setting up Azure AI agent...");
  
  const existingAgentId = config.azure.agentId;
  if (!existingAgentId) {
    throw new Error("AZURE_AI_AGENT environment variable is required");
  }
  
  console.log(`Using existing agent with ID: ${existingAgentId}`);
  
  // Update the existing agent's tool resources with the new files
  const fileIds = uploadedFiles.map(file => file.id);
  const codeInterpreterTool = ToolUtility.createCodeInterpreterTool(fileIds);
  
  try {
    if (typeof client.updateAgent === 'function') {
      await client.updateAgent(existingAgentId, {
        toolResources: codeInterpreterTool.resources,
      });
      console.log(`Successfully updated agent with file IDs: ${fileIds.join(', ')}`);
    } else {
      console.log("Agent update method not available - proceeding with existing agent as-is");
    }
  } catch (error) {
    console.log(`Warning: Could not update agent tool resources: ${error.message}`);
    console.log("Proceeding with existing agent configuration...");
  }
  
  console.log("✓ Azure AI agent setup completed");
  return existingAgentId;
}

/**
 * Execute the documentation generation process
 */
export async function executeDocumentationGeneration(client: AgentsClient, agentId: string, runState: any, hasPreviousResults: boolean): Promise<any[]> {
  console.log("Executing documentation generation...");
  
  // Always create a new thread for fresh start
  console.log("Creating new thread for fresh start");
  const thread = await client.threads.create({});
  console.log(`Created thread, thread ID: ${thread.id}`);
  
  // Send documentation task with agent notes directory
  await sendDocumentationTask(client, thread.id, runState.agentNotesDir, hasPreviousResults);
  
  // Process the run stream
  await processRunStream(client, thread.id, agentId);
  
  // Get messages and save any generated files
  const messages = await getThreadMessages(client, thread.id);
  
  console.log("✓ Documentation generation completed");
  return messages;
}

/**
 * Process and save AI response and generated files
 */
export async function processAIResponse(client: AgentsClient, messages: any[]): Promise<string[]> {
  console.log("Processing AI response...");
  
  // Save raw AI response for debugging
  const assistantMessages = messages.filter(msg => msg.role === 'assistant');
  if (assistantMessages.length > 0) {
    const rawResponseFile = config.runFilePaths.rawResponseFilePath;
    const latestResponse = assistantMessages[0];
    
    // Extract text content for preview using utility function
    const textPreview = extractTextPreview(latestResponse.content);
    console.log(`Latest assistant message content preview:`, textPreview);
    
    fs.writeFileSync(rawResponseFile, JSON.stringify(latestResponse, null, 2));
    console.log(`Saved raw AI response to: ${rawResponseFile}`);
  }
  
  const savedFilePaths = await saveGeneratedFiles(client, messages, config.runPaths.contentDir, config.runPaths.sourceOfTruthDir);
  
  console.log("✓ AI response processed successfully");
  return savedFilePaths;
}

/**
 * Clean up Azure resources
 */
export async function cleanupAzureResources(client: AgentsClient, uploadedFiles: any[], agentId: string): Promise<void> {
  console.log("Cleaning up Azure resources...");
  
  // Clean up resources - only delete files, not the existing agent
  for (const file of uploadedFiles) {
    await client.files.delete(file.id);
    console.log(`Deleted file, file ID : ${file.id}`);
  }
  console.log(`Using existing agent ${agentId} - not deleting`);
  
  console.log("✓ Azure resources cleaned up successfully");
}

/**
 * Print final summary of the documentation process
 */
export function printSummary(savedFilePaths: string[], runState: any): void {
  console.log("\nSUMMARY:");
  console.log("Documentation processing complete.");
  console.log("Source files downloaded to:", config.runPaths.sourceOfTruthDir);
  console.log("Generated files saved to:", config.runPaths.contentDir);
  console.log("Agent notes saved to:", runState.agentNotesDir);
  console.log("Files generated:");
  savedFilePaths.forEach(filePath => console.log(`- ${filePath}`));
}

/**
 * Main function that orchestrates the entire process
 */
export async function main(): Promise<void> {
  try {
    // Step 1: Initialize run state and check for previous results
    const { runState, hasPreviousResults, previousResultsPath } = await initializeRunState();
    
    // Step 2: Download and prepare source files
    const sourceFiles = await prepareSourceFiles();
    
    // Step 3: Prepare files for upload
    const filesToUpload = await prepareFilesForUpload(sourceFiles, hasPreviousResults, previousResultsPath);
    
    // Step 4: Initialize Azure AI client and upload files
    const client = initializeClient();
    const uploadedFiles = await uploadFiles(client, filesToUpload);
    
    // Step 5: Setup and configure Azure AI agent
    const agentId = await setupAzureAgent(client, uploadedFiles);
    
    // Step 6: Execute documentation generation process
    const messages = await executeDocumentationGeneration(client, agentId, runState, hasPreviousResults);
    
    // Step 7: Process AI response and save generated files
    const savedFilePaths = await processAIResponse(client, messages);
    
    // Step 8: Clean up Azure resources
    await cleanupAzureResources(client, uploadedFiles, agentId);
    
    // Step 9: Print final summary
    printSummary(savedFilePaths, runState);
    
  } catch (error) {
    console.error("An error occurred during the documentation process:", error);
    throw error; // Re-throw to allow caller to handle
  }
}

main().catch((err) => {
  console.error("The application encountered an error:", err);
});