/**
 * Database-based persistence for complex state management
 * This example uses a simple JSON file as a database
 */

import * as fs from "fs";
import * as path from "node:path";

interface AnalysisState {
  lastRunTimestamp: string;
  totalFunctionsInCommands: number;
  totalFunctionsInTools: number;
  newFunctionsFound: string[];
  lastAnalysisResults: any;
  generatedFiles: string[];
}

const dbPath = path.join(__dirname, "../state-db.json");

/**
 * Load the current analysis state
 * @returns {AnalysisState} The current state
 */
function loadAnalysisState(): AnalysisState {
  if (!fs.existsSync(dbPath)) {
    return {
      lastRunTimestamp: "",
      totalFunctionsInCommands: 0,
      totalFunctionsInTools: 0,
      newFunctionsFound: [],
      lastAnalysisResults: null,
      generatedFiles: []
    };
  }
  
  try {
    const content = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn("Error loading state, using default:", error);
    return {
      lastRunTimestamp: "",
      totalFunctionsInCommands: 0,
      totalFunctionsInTools: 0,
      newFunctionsFound: [],
      lastAnalysisResults: null,
      generatedFiles: []
    };
  }
}

/**
 * Save the current analysis state
 * @param {AnalysisState} state - State to save
 */
function saveAnalysisState(state: AnalysisState): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf8');
    console.log(`Saved analysis state to: ${dbPath}`);
  } catch (error) {
    console.error("Error saving state:", error);
  }
}

/**
 * Update the analysis state with new results
 * @param {any} analysisResults - Results from the latest analysis
 * @param {string[]} generatedFiles - Files generated in this run
 */
function updateAnalysisState(analysisResults: any, generatedFiles: string[]): void {
  const currentState = loadAnalysisState();
  
  const newState: AnalysisState = {
    lastRunTimestamp: new Date().toISOString(),
    totalFunctionsInCommands: analysisResults.totalFunctionsInCommands || currentState.totalFunctionsInCommands,
    totalFunctionsInTools: analysisResults.totalFunctionsInTools || currentState.totalFunctionsInTools,
    newFunctionsFound: analysisResults.newFunctionsFound || currentState.newFunctionsFound,
    lastAnalysisResults: analysisResults,
    generatedFiles: [...currentState.generatedFiles, ...generatedFiles]
  };
  
  saveAnalysisState(newState);
}

export {
  AnalysisState,
  loadAnalysisState,
  saveAnalysisState,
  updateAnalysisState
};
