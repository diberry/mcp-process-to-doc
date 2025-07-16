/**
 * Thread-based persistence - reuse the same thread across runs
 */

import * as fs from "fs";
import * as path from "node:path";

const threadStatePath = path.join(__dirname, "../thread-state.json");

interface ThreadState {
  threadId: string;
  agentId: string;
  lastActivity: string;
  messageCount: number;
}

/**
 * Load existing thread state
 * @returns {ThreadState | null} Existing thread state or null
 */
function loadThreadState(): ThreadState | null {
  if (!fs.existsSync(threadStatePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(threadStatePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn("Error loading thread state:", error);
    return null;
  }
}

/**
 * Save thread state
 * @param {ThreadState} state - Thread state to save
 */
function saveThreadState(state: ThreadState): void {
  try {
    fs.writeFileSync(threadStatePath, JSON.stringify(state, null, 2), 'utf8');
    console.log(`Saved thread state: ${state.threadId}`);
  } catch (error) {
    console.error("Error saving thread state:", error);
  }
}

/**
 * Clear thread state (start fresh)
 */
function clearThreadState(): void {
  if (fs.existsSync(threadStatePath)) {
    fs.unlinkSync(threadStatePath);
    console.log("Cleared thread state");
  }
}

export {
  ThreadState,
  loadThreadState,
  saveThreadState,
  clearThreadState
};
