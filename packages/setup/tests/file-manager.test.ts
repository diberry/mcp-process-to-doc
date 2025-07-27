import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileManager } from '../src/file-manager.js';
import fs from 'fs';
import path from 'path';

describe('FileManager', () => {
  const testDir = path.join(process.cwd(), 'test-temp');
  let fileManager: FileManager;

  beforeEach(() => {
    fileManager = new FileManager();
    // Ensure test directory doesn't exist before each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test directory after each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('createFile', () => {
    it('should create a file with content', () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'Hello, World!';
      
      fileManager.createFile(filePath, content);
      
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });

    it('should create parent directories if they do not exist', () => {
      const filePath = path.join(testDir, 'nested', 'deep', 'test.txt');
      const content = 'Nested file content';
      
      fileManager.createFile(filePath, content);
      
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });
  });

  describe('updateFile', () => {
    it('should update an existing file', () => {
      const filePath = path.join(testDir, 'update-test.txt');
      const originalContent = 'Original content';
      const updatedContent = 'Updated content';
      
      // Create file first
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(filePath, originalContent);
      
      fileManager.updateFile(filePath, updatedContent);
      
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(updatedContent);
    });

    it('should create file if it does not exist', () => {
      const filePath = path.join(testDir, 'new-file.txt');
      const content = 'New file content';
      
      fileManager.updateFile(filePath, content);
      
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });
  });

  describe('readFile', () => {
    it('should read file content', () => {
      const filePath = path.join(testDir, 'read-test.txt');
      const content = 'Content to read';
      
      // Create test file
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(filePath, content);
      
      const result = fileManager.readFile(filePath);
      
      expect(result).toBe(content);
    });

    it('should throw error if file does not exist', () => {
      const filePath = path.join(testDir, 'non-existent.txt');
      
      expect(() => fileManager.readFile(filePath)).toThrow('File does not exist');
    });
  });
});