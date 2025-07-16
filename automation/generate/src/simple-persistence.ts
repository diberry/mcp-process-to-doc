/**
 * Simplified persistence system
 * - Only stores essential data needed between runs
 * - Agent writes all notes/logs to agent-notes directory
 * - Clear separation of concerns
 */

import * as fs from "fs";
import * as path from "node:path";

interface SimpleState {
  currentTimestamp: string;
  agentNotesDir: string;
  lastSuccessfulRun?: string;
}

/**
 * Initialize directories and return state for current run
 */
function initializeRun(baseDir: string, timestamp: string): SimpleState {
  const agentNotesDir = path.join(baseDir, "generated", timestamp, "agent-notes");
  
  // Create agent-notes directory
  fs.mkdirSync(agentNotesDir, { recursive: true });
  
  const state: SimpleState = {
    currentTimestamp: timestamp,
    agentNotesDir,
  };
  
  // Save state file in agent-notes for the agent to access
  const stateFile = path.join(agentNotesDir, "run-state.json");
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  
  console.log(`Initialized run ${timestamp}`);
  console.log(`Agent notes directory: ${agentNotesDir}`);
  
  return state;
}

/**
 * Load previous successful run data if it exists
 */
function loadPreviousResults(baseDir: string): string | null {
  const generatedDir = path.join(baseDir, "generated");
  if (!fs.existsSync(generatedDir)) {
    return null;
  }
  
  // Find most recent directory with successful results
  const runDirs = fs.readdirSync(generatedDir)
    .filter(dir => dir.match(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}Z$/))
    .sort()
    .reverse();
  
  for (const runDir of runDirs) {
    const newMdPath = path.join(generatedDir, runDir, "content", "new.md");
    if (fs.existsSync(newMdPath)) {
      console.log(`Found previous successful run: ${runDir}`);
      return newMdPath;
    }
  }
  
  return null;
}

/**
 * Create agent instructions that include persistence information
 */
function createAgentInstructions(agentNotesDir: string, previousResultsPath?: string): string {
  const baseInstructions = `
You are an expert Azure documentation specialist with deep knowledge of Azure services and documentation standards.

IMPORTANT PERSISTENCE INSTRUCTIONS:
- Your working directory is: ${agentNotesDir}
- ALL logs, notes, debug output, and intermediate files MUST be written to this directory
- Use Python code to create files like: analysis-log.txt, debug-output.txt, function-list.txt
- The files you create will be preserved for future runs and debugging

CRITICAL: You MUST use the code interpreter tool to execute Python code. Do not just describe what the code would do.

Your task is to analyze Azure MCP (Model Context Protocol) functions to identify new tools and operations.
`;

  if (previousResultsPath) {
    return baseInstructions + `

PREVIOUS RESULTS AVAILABLE:
- You have access to results from a previous successful run
- Use this to build upon existing work and identify any changes
- Previous results are in your uploaded files
`;
  }

  return baseInstructions + `

FRESH ANALYSIS:
- This is a new analysis starting from scratch
- Compare azmcp-commands.md with tools.json to find new functions
`;
}

export {
  SimpleState,
  initializeRun,
  loadPreviousResults,
  createAgentInstructions
};
