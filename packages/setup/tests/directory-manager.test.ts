import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DirectoryManager } from '../src/directory-manager.js';
import fs from 'fs';
import path from 'path';

describe('DirectoryManager', () => {
  const testDir = path.join(process.cwd(), 'test-temp-dir');
  let directoryManager: DirectoryManager;

  beforeEach(() => {
    directoryManager = new DirectoryManager();
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

  describe('createDirectory', () => {
    it('should create a directory', () => {
      const dirPath = path.join(testDir, 'new-dir');
      
      directoryManager.createDirectory(dirPath);
      
      expect(fs.existsSync(dirPath)).toBe(true);
      expect(fs.statSync(dirPath).isDirectory()).toBe(true);
    });

    it('should create nested directories', () => {
      const dirPath = path.join(testDir, 'nested', 'deep', 'structure');
      
      directoryManager.createDirectory(dirPath);
      
      expect(fs.existsSync(dirPath)).toBe(true);
      expect(fs.statSync(dirPath).isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', () => {
      const dirPath = path.join(testDir, 'existing-dir');
      
      // Create directory first
      fs.mkdirSync(dirPath, { recursive: true });
      
      // Should not throw error
      expect(() => directoryManager.createDirectory(dirPath)).not.toThrow();
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  describe('validateDirectoryStructure', () => {
    it('should validate valid configuration against schema', () => {
      // Use the existing config and schema files
      const configPath = path.resolve(__dirname, '../config/setup.config.json');
      const schemaPath = path.resolve(__dirname, '../config/setup-schema.json');
      
      const result = directoryManager.validateDirectoryStructure(configPath, schemaPath);
      
      expect(result).toBe(true);
    });

    it('should throw error for non-existent config file', () => {
      const configPath = path.join(testDir, 'non-existent.json');
      const schemaPath = path.resolve(__dirname, '../config/setup-schema.json');
      
      expect(() => directoryManager.validateDirectoryStructure(configPath, schemaPath))
        .toThrow('Directory structure validation failed');
    });

    it('should throw error for non-existent schema file', () => {
      const configPath = path.resolve(__dirname, '../config/setup.config.json');
      const schemaPath = path.join(testDir, 'non-existent-schema.json');
      
      expect(() => directoryManager.validateDirectoryStructure(configPath, schemaPath))
        .toThrow('Directory structure validation failed');
    });
  });

  describe('createDirectoriesFromConfig', () => {
    it('should create directories based on configuration', () => {
      // Create a simple test config
      const testConfig = {
        children: {
          'TestRoot': {
            description: 'Test root directory',
            children: {
              'SubDir1': {
                description: 'First subdirectory'
              },
              'SubDir2': {
                description: 'Second subdirectory',
                children: {
                  'NestedDir': {
                    description: 'Nested directory'
                  }
                }
              }
            }
          }
        }
      };
      
      const configPath = path.join(testDir, 'test-config.json');
      
      // Create the config file
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
      
      // Create directories from config
      directoryManager.createDirectoriesFromConfig(testDir, configPath);
      
      // Verify directories were created
      expect(fs.existsSync(path.join(testDir, 'TestRoot'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'TestRoot', 'SubDir1'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'TestRoot', 'SubDir2'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'TestRoot', 'SubDir2', 'NestedDir'))).toBe(true);
    });
  });
});