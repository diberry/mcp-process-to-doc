// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Configuration module for Azure MCP documentation automation
 * Centralizes all configuration values, paths, and environment variables
 */

import * as path from "node:path";
import "dotenv/config";
import { run } from "node:test";

/**
 * Azure AI Configuration
 */
export const azureConfig = {
  projectEndpoint: process.env.AZURE_AI_PROJECTS_ENDPOINT,
  modelDeploymentName: process.env.MODEL_DEPLOYMENT_NAME,
  agentId: process.env.AZURE_AI_AGENT,
} as const;

/**
 * Path Configuration
 */
export const pathConfig = {
  // Base paths
  repoRootPath: path.join(__dirname, "../../../"),
  generatedBaseDir: path.join(__dirname, "../generated"),
  
  // Directory names
  sourceOfTruthDirName: "source-of-truth",
  contentDirName: "content",
  agentNotesDirName: "agent-notes",
  
  // Template and documentation files (relative to repo root)
  templateFileName: "new.template.md",
  createDocsPromptFileName: "create-docs.prompt.md",
  editorialReviewFileName: "editorial-review.md",
  toolsBackupFileName: "tools.json.bak",
} as const;

/**
 * External URLs Configuration
 */
export const urlConfig = {
  engineeringTeamCommandsUrl: "https://raw.githubusercontent.com/Azure/azure-mcp/main/docs/azmcp-commands.md",
  contentTeamToolsUrl: "https://raw.githubusercontent.com/MicrosoftDocs/azure-dev-docs/main/articles/azure-mcp-server/tools/tools.json",
} as const;

/**
 * File names for source files
 */
export const fileNames = {
  commandsFile: "azmcp-commands.md",
  toolsFile: "tools.json",
  toolsBackupFile: "tools.json.bak",
  newMdFile: "new.md",
  templateFile: "new.template.md",
  createDocsPromptFile: "create-docs.prompt.md",
  editorialReviewFile: "editorial-review.md",
  rawResponseFile: "raw-ai-response.json",
  analysisLogFile: "analysis-log.txt",
  functionAnalysisFile: "function-analysis.txt",
} as const;

/**
 * Generate timestamp for current run
 */
export function generateTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
}

/**
 * Generate paths for a specific run based on timestamp
 */
export function generateRunPaths(timestamp: string) {
  const timestampedDir = path.join(pathConfig.generatedBaseDir, timestamp);
  const sourceOfTruthDir = path.join(timestampedDir, pathConfig.sourceOfTruthDirName);
  const contentDir = path.join(timestampedDir, pathConfig.contentDirName);
  const agentNotesDir = path.join(timestampedDir, pathConfig.agentNotesDirName);
  
  return {
    timestampedDir,
    sourceOfTruthDir,
    contentDir,
    agentNotesDir,
  };
}

/**
 * Generate file paths for source files
 */
export function generateSourceFilePaths() {
  return {
    templateFilePath: path.join(pathConfig.repoRootPath, pathConfig.templateFileName),
    createDocsPromptPath: path.join(pathConfig.repoRootPath, pathConfig.createDocsPromptFileName),
    editorialReviewPath: path.join(pathConfig.repoRootPath, pathConfig.editorialReviewFileName),
    originalToolsBackupPath: path.join(pathConfig.repoRootPath, pathConfig.toolsBackupFileName),
  };
}

/**
 * Generate file paths for run-specific files
 */
export function generateRunFilePaths(sourceOfTruthDir: string, contentDir: string, agentNotesDir: string) {
  return {
    // Source of truth files
    commandsFilePath: path.join(sourceOfTruthDir, fileNames.commandsFile),
    toolsJsonFilePath: path.join(sourceOfTruthDir, fileNames.toolsFile),
    toolsJsonBackupPath: path.join(sourceOfTruthDir, fileNames.toolsBackupFile),
    newMdPersistentPath: path.join(sourceOfTruthDir, fileNames.newMdFile),
    
    // Content files
    rawResponseFilePath: path.join(contentDir, fileNames.rawResponseFile),
    
    // Agent notes files
    analysisLogPath: path.join(agentNotesDir, fileNames.analysisLogFile),
    functionAnalysisPath: path.join(agentNotesDir, fileNames.functionAnalysisFile),
  };
}

/**
 * Validation function to ensure required environment variables are set
 */
export function validateConfig(): void {
  const requiredEnvVars = [
    { name: 'AZURE_AI_PROJECTS_ENDPOINT', value: azureConfig.projectEndpoint },
    { name: 'MODEL_DEPLOYMENT_NAME', value: azureConfig.modelDeploymentName },
    { name: 'AZURE_AI_AGENT', value: azureConfig.agentId },
  ];

  const missingVars = requiredEnvVars.filter(envVar => !envVar.value);
  
  if (missingVars.length > 0) {
    const missingNames = missingVars.map(envVar => envVar.name).join(', ');
    throw new Error(`Missing required environment variables: ${missingNames}`);
  }
}

/**
 * Get complete configuration for a run
 */
export function getRunConfiguration(timestamp?: string) {
  validateConfig();
  
  const runTimestamp = timestamp || generateTimestamp();
  const runPaths = generateRunPaths(runTimestamp);
  const sourceFilePaths = generateSourceFilePaths();
  const runFilePaths = generateRunFilePaths(
    runPaths.sourceOfTruthDir, 
    runPaths.contentDir, 
    runPaths.agentNotesDir
  );
  
  return {
    azure: azureConfig,
    paths: pathConfig,
    urls: urlConfig,
    fileNames,
    timestamp: runTimestamp,
    runPaths,
    sourceFilePaths,
    runFilePaths,
  };
}
