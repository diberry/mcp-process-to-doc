/**
 * Alternative persistence approach using a persistent workspace directory
 */

import * as fs from "fs";
import * as path from "node:path";

// Create a persistent workspace directory that doesn't change between runs
const persistentWorkspaceDir = path.join(__dirname, "../persistent-workspace");

/**
 * Ensure persistent workspace exists and initialize it
 */
function initializePersistentWorkspace(): void {
  if (!fs.existsSync(persistentWorkspaceDir)) {
    fs.mkdirSync(persistentWorkspaceDir, { recursive: true });
    console.log(`Created persistent workspace: ${persistentWorkspaceDir}`);
  }
}

/**
 * Get the path to a persistent file
 * @param {string} fileName - Name of the file
 * @returns {string} Full path to the persistent file
 */
function getPersistentFilePath(fileName: string): string {
  return path.join(persistentWorkspaceDir, fileName);
}

/**
 * Check if a persistent file exists
 * @param {string} fileName - Name of the file to check
 * @returns {boolean} Whether the file exists
 */
function persistentFileExists(fileName: string): boolean {
  return fs.existsSync(getPersistentFilePath(fileName));
}

/**
 * Save content to persistent workspace
 * @param {string} fileName - Name of the file
 * @param {string} content - Content to save
 */
function saveToPersistentWorkspace(fileName: string, content: string): void {
  const filePath = getPersistentFilePath(fileName);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Saved to persistent workspace: ${filePath}`);
}

/**
 * Load content from persistent workspace
 * @param {string} fileName - Name of the file to load
 * @returns {string} File content
 */
function loadFromPersistentWorkspace(fileName: string): string {
  const filePath = getPersistentFilePath(fileName);
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * List all files in persistent workspace
 * @returns {string[]} Array of file names
 */
function listPersistentFiles(): string[] {
  if (!fs.existsSync(persistentWorkspaceDir)) {
    return [];
  }
  return fs.readdirSync(persistentWorkspaceDir);
}

export {
  initializePersistentWorkspace,
  getPersistentFilePath,
  persistentFileExists,
  saveToPersistentWorkspace,
  loadFromPersistentWorkspace,
  listPersistentFiles,
  persistentWorkspaceDir
};
