/**
 * Alternative persistence approach using a persistent workspace directory
 */
declare const persistentWorkspaceDir: string;
/**
 * Ensure persistent workspace exists and initialize it
 */
declare function initializePersistentWorkspace(): void;
/**
 * Get the path to a persistent file
 * @param {string} fileName - Name of the file
 * @returns {string} Full path to the persistent file
 */
declare function getPersistentFilePath(fileName: string): string;
/**
 * Check if a persistent file exists
 * @param {string} fileName - Name of the file to check
 * @returns {boolean} Whether the file exists
 */
declare function persistentFileExists(fileName: string): boolean;
/**
 * Save content to persistent workspace
 * @param {string} fileName - Name of the file
 * @param {string} content - Content to save
 */
declare function saveToPersistentWorkspace(fileName: string, content: string): void;
/**
 * Load content from persistent workspace
 * @param {string} fileName - Name of the file to load
 * @returns {string} File content
 */
declare function loadFromPersistentWorkspace(fileName: string): string;
/**
 * List all files in persistent workspace
 * @returns {string[]} Array of file names
 */
declare function listPersistentFiles(): string[];
export { initializePersistentWorkspace, getPersistentFilePath, persistentFileExists, saveToPersistentWorkspace, loadFromPersistentWorkspace, listPersistentFiles, persistentWorkspaceDir };
