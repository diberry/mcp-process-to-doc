import path from 'path';
import { FileManager } from './file-manager.js';
import { DirectoryManager } from './directory-manager.js';

/**
 * SetupManager manages the overall setup process for documentation generation.
 */
export class SetupManager {
  private fileManager: FileManager;
  private directoryManager: DirectoryManager;

  constructor() {
    this.fileManager = new FileManager();
    this.directoryManager = new DirectoryManager();
  }

  /**
   * Initialize setup using a configuration file and validate it against the schema.
   * @param configPath - Path to the configuration file
   * @param schemaPath - Path to the schema file
   * @throws Error if initialization fails
   */
  async initializeSetup(configPath: string, schemaPath: string): Promise<void> {
    try {
      // Validate the configuration against the schema
      const isValid = this.directoryManager.validateDirectoryStructure(configPath, schemaPath);
      
      if (!isValid) {
        throw new Error('Configuration validation failed');
      }

      // Log the initialization
      const logMessage = `Setup initialized at ${new Date().toISOString()} with config: ${configPath}, schema: ${schemaPath}\n`;
      this.logToSetupLog(logMessage);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const logMessage = `Setup initialization failed at ${new Date().toISOString()}: ${errorMessage}\n`;
      this.logToSetupLog(logMessage);
      throw error;
    }
  }

  /**
   * Create a new directory with a timestamp.
   * @returns The name of the created timestamp directory
   */
  createTimestampDirectory(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Remove milliseconds and replace colons/dots
    const timestampDirName = `docs-${timestamp}`;
    const generatedPath = path.join(process.cwd(), 'Generated');
    const timestampPath = path.join(generatedPath, timestampDirName);
    
    try {
      // Create the Generated directory if it doesn't exist
      this.directoryManager.createDirectory(generatedPath);
      
      // Create the timestamp directory
      this.directoryManager.createDirectory(timestampPath);
      
      // Create subdirectories according to the config structure
      const subdirectories = ['Content', 'Source-of-Truth', 'Logs', 'Prompt', 'Reports'];
      subdirectories.forEach(subdir => {
        const subdirPath = path.join(timestampPath, subdir);
        this.directoryManager.createDirectory(subdirPath);
      });
      
      // Log the directory creation
      const logMessage = `Timestamp directory created: ${timestampDirName} at ${new Date().toISOString()}\n`;
      this.logToSetupLog(logMessage);
      
      return timestampDirName;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const logMessage = `Failed to create timestamp directory at ${new Date().toISOString()}: ${errorMessage}\n`;
      this.logToSetupLog(logMessage);
      throw error;
    }
  }

  /**
   * Update the current.log file with the name of the timestamp directory.
   * @param directoryName - The name of the timestamp directory
   */
  updateCurrentLog(directoryName: string): void {
    try {
      const generatedPath = path.join(process.cwd(), 'Generated');
      const currentLogPath = path.join(generatedPath, 'current.log');
      
      // Create the Generated directory if it doesn't exist
      this.directoryManager.createDirectory(generatedPath);
      
      // Update the current.log file
      const content = `${directoryName}\n`;
      this.fileManager.updateFile(currentLogPath, content);
      
      // Log the update
      const logMessage = `current.log updated with directory: ${directoryName} at ${new Date().toISOString()}\n`;
      this.logToSetupLog(logMessage);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const logMessage = `Failed to update current.log at ${new Date().toISOString()}: ${errorMessage}\n`;
      this.logToSetupLog(logMessage);
      throw error;
    }
  }

  /**
   * Get the current timestamp directory from current.log
   * @returns The current timestamp directory name or null if not found
   */
  getCurrentTimestampDirectory(): string | null {
    try {
      const generatedPath = path.join(process.cwd(), 'Generated');
      const currentLogPath = path.join(generatedPath, 'current.log');
      
      const content = this.fileManager.readFile(currentLogPath);
      return content.trim() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Log messages to the setup.log file
   * @param message - The message to log
   */
  private logToSetupLog(message: string): void {
    try {
      const setupLogPath = path.join(process.cwd(), 'setup.log');
      
      // Read existing content or start with empty string
      let existingContent = '';
      try {
        existingContent = this.fileManager.readFile(setupLogPath);
      } catch (error) {
        // File doesn't exist yet, which is fine
      }
      
      // Append new message
      const updatedContent = existingContent + message;
      this.fileManager.updateFile(setupLogPath, updatedContent);
    } catch (error) {
      // If logging fails, we don't want to crash the main operation
      console.error('Failed to write to setup.log:', error);
    }
  }
}