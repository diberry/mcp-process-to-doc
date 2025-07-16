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
import { AGENT_INSTRUCTIONS } from "./instructions.js";

// Import simplified persistence
import { SimpleState, initializeRun, loadPreviousResults } from "./simple-persistence.js";
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
  const content = `
Please follow your instructions from create-docs.prompt.md to complete the full documentation process. You have all the necessary files uploaded and ready to work with.

CRITICAL REQUIREMENTS:
1. You must use the code interpreter tool to execute code - do not just describe what you would do
2. You must create the final output files (new.md, updated tools.json) in your working directory so they can be downloaded
3. After creating files, use the file browser or list files to show what you created

Your uploaded files include:
- azmcp-commands.md (engineering team's command reference)
- tools.json (content team's current tool definitions)  
- new.md.template (format for organizing findings)
- create-docs.prompt.md (your full instructions)
- editorial-review.md (editorial standards)
${hasExistingNewMd ? '- new.md (previous results to build upon)' : ''}

Write all intermediate work, logs, and analysis to the agent notes directory: ${agentNotesDir.replace(/\\/g, '/')}

IMPORTANT: At the end, create these files in your working directory for download:
- new.md (following the template format)
- tools.json (updated with new tools)

Begin now - follow your instructions exactly as written.
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
 * Download any files created by the agent during code execution
 * @param {AgentsClient} client - The client to use for file operations
 * @param {string} threadId - The thread ID to check for generated files
 * @param {any[]} messagesArray - Array of messages to search for files
 * @param {string} contentDir - Directory where content files should be saved
 * @param {string} sourceOfTruthDir - Directory where persistent files should be saved
 * @returns {Promise<string[]>} Paths to the saved files
 */
async function saveGeneratedFiles(client: AgentsClient, threadId: string, messagesArray: any[], contentDir: string, sourceOfTruthDir: string): Promise<string[]> {
async function saveGeneratedFiles(client: AgentsClient, threadId: string, messagesArray: any[], contentDir: string, sourceOfTruthDir: string): Promise<string[]> {
  const savedFilePaths = [];
  
  console.log(`\n=== DOWNLOADING AGENT-GENERATED FILES ===`);
  
  // Look for direct file attachments in messages
  const assistantMessages = messagesArray.filter((msg) => msg.role === "assistant");
  console.log(`Found ${assistantMessages.length} assistant messages to check for files`);
  
  for (let i = 0; i < assistantMessages.length; i++) {
    const message = assistantMessages[i];
    console.log(`\n--- Checking assistant message ${i + 1} ---`);
    
    if (message.content) {
      for (const content of message.content) {
        if (content.type === "file" && content.file?.fileId) {
          try {
            const fileId = content.file.fileId;
            const fileInfo = await client.files.get(fileId);
            const fileName = fileInfo.filename;
            const localFilePath = path.join(contentDir, fileName);
            
            console.log(`Downloading file attachment: ${fileName} (ID: ${fileId})`);
            
            const fileContent = await client.files.getContent(fileId).asNodeStream();
            if (fileContent && fileContent.body) {
              const chunks = [];
              for await (const chunk of fileContent.body) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }
              const buffer = Buffer.concat(chunks);
              fs.writeFileSync(localFilePath, buffer);
              console.log(`✓ Downloaded and saved file to ${localFilePath}`);
              savedFilePaths.push(localFilePath);
              
              // If this is new.md, also save it persistently in source-of-truth for next run
              if (fileName === "new.md") {
                const persistentPath = path.join(sourceOfTruthDir, "new.md");
                fs.writeFileSync(persistentPath, buffer);
                console.log(`✓ Saved persistent copy to ${persistentPath} for future runs`);
              }
            }
          } catch (error) {
            console.error(`Error downloading file attachment:`, error);
          }
        }
      }
    }
  }
  
  console.log(`\n=== DOWNLOAD COMPLETE: Saved ${savedFilePaths.length} files ===`);
  return savedFilePaths;
}
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
  
  // Load the current agent instructions from the prompt file
  const agentInstructions = await fs.promises.readFile(config.sourceFilePaths.createDocsPromptPath, "utf8");
  
  try {
    if (typeof client.updateAgent === 'function') {
      await client.updateAgent(existingAgentId, {
        instructions: agentInstructions,
        toolResources: codeInterpreterTool.resources,
      });
      console.log(`Successfully updated agent with new instructions and file IDs: ${fileIds.join(', ')}`);
    } else {
      console.log("Agent update method not available - proceeding with existing agent as-is");
      console.log("WARNING: Agent may have outdated instructions!");
    }
  } catch (error) {
    console.log(`Warning: Could not update agent: ${error.message}`);
    console.log("Proceeding with existing agent configuration...");
  }
  
  console.log("✓ Azure AI agent setup completed");
  return existingAgentId;
}

/**
 * Execute the documentation generation process
 */
export async function executeDocumentationGeneration(client: AgentsClient, agentId: string, runState: any, hasPreviousResults: boolean): Promise<{ threadId: string, messages: any[] }> {
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
  return { threadId: thread.id, messages };
}

/**
 * Process and save AI response and generated files
 */
export async function processAIResponse(client: AgentsClient, threadId: string, messages: any[]): Promise<string[]> {
  console.log("Processing AI response...");
  
  try {
    // Save raw AI response for debugging
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    if (assistantMessages.length > 0) {
      const rawResponseFile = config.runFilePaths.rawResponseFilePath;
      const latestResponse = assistantMessages[0];
      console.log(`Latest assistant message content preview:`, extractTextPreview(latestResponse.content));
      
      fs.writeFileSync(rawResponseFile, JSON.stringify(latestResponse, null, 2));
      console.log(`Saved raw AI response to: ${rawResponseFile}`);
    }
    
    const savedFilePaths = await saveGeneratedFiles(client, threadId, messages, config.runPaths.contentDir, config.runPaths.sourceOfTruthDir);
    
    console.log("✓ AI response processed successfully");
    console.log(`Returning ${savedFilePaths?.length || 0} saved file paths`);
    return savedFilePaths || [];
  } catch (error) {
    console.error("Error in processAIResponse:", error);
    return [];
  }
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
  if (savedFilePaths && Array.isArray(savedFilePaths)) {
    savedFilePaths.forEach(filePath => console.log(`- ${filePath}`));
  } else {
    console.log("- No files were generated or saved");
    console.log(`- savedFilePaths value: ${savedFilePaths}`);
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
    const { threadId, messages } = await executeDocumentationGeneration(client, agentId, runState, hasPreviousResults);
    
    // Step 7: Process AI response and save generated files
    const savedFilePaths = await processAIResponse(client, threadId, messages);
    
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