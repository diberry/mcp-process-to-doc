import fs from 'fs';
import path from 'path';

/**
 * FileManager handles file creation, updates, and reading operations.
 */
export class FileManager {
  /**
   * Create a file with the specified content.
   * Creates parent directories if they don't exist.
   * @param filePath - The path where the file should be created
   * @param content - The content to write to the file
   */
  createFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    
    // Create parent directories if they don't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Update an existing file with new content.
   * Creates the file if it doesn't exist.
   * @param filePath - The path of the file to update
   * @param content - The new content to write to the file
   */
  updateFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    
    // Create parent directories if they don't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Read the contents of a file.
   * @param filePath - The path of the file to read
   * @returns The content of the file as a string
   * @throws Error if the file doesn't exist or cannot be read
   */
  readFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    return fs.readFileSync(filePath, 'utf-8');
  }
}