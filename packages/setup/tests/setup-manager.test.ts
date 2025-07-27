import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SetupManager } from '../src/setup-manager.js';
import fs from 'fs';
import path from 'path';

describe('SetupManager', () => {
  const testDir = path.join(process.cwd(), 'test-temp-setup');
  let setupManager: SetupManager;

  beforeEach(() => {
    setupManager = new SetupManager();
    // Ensure test directory doesn't exist before each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    // Clean up any Generated directory and setup.log from previous tests
    const generatedDir = path.join(process.cwd(), 'Generated');
    if (fs.existsSync(generatedDir)) {
      fs.rmSync(generatedDir, { recursive: true, force: true });
    }
    const setupLogPath = path.join(process.cwd(), 'setup.log');
    if (fs.existsSync(setupLogPath)) {
      fs.unlinkSync(setupLogPath);
    }
  });

  afterEach(() => {
    // Clean up test directory after each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    // Clean up Generated directory and setup.log
    const generatedDir = path.join(process.cwd(), 'Generated');
    if (fs.existsSync(generatedDir)) {
      fs.rmSync(generatedDir, { recursive: true, force: true });
    }
    const setupLogPath = path.join(process.cwd(), 'setup.log');
    if (fs.existsSync(setupLogPath)) {
      fs.unlinkSync(setupLogPath);
    }
  });

  describe('initializeSetup', () => {
    it('should initialize setup with valid config and schema', async () => {
      const configPath = path.resolve(__dirname, '../config/setup.config.json');
      const schemaPath = path.resolve(__dirname, '../config/setup-schema.json');
      
      await expect(setupManager.initializeSetup(configPath, schemaPath)).resolves.toBeUndefined();
      
      // Check that setup.log was created
      const setupLogPath = path.join(process.cwd(), 'setup.log');
      expect(fs.existsSync(setupLogPath)).toBe(true);
      
      const logContent = fs.readFileSync(setupLogPath, 'utf-8');
      expect(logContent).toContain('Setup initialized');
    });

    it('should throw error and log for invalid config path', async () => {
      const configPath = path.join(testDir, 'non-existent.json');
      const schemaPath = path.resolve(__dirname, '../config/setup-schema.json');
      
      await expect(setupManager.initializeSetup(configPath, schemaPath)).rejects.toThrow();
      
      // Check that error was logged
      const setupLogPath = path.join(process.cwd(), 'setup.log');
      expect(fs.existsSync(setupLogPath)).toBe(true);
      
      const logContent = fs.readFileSync(setupLogPath, 'utf-8');
      expect(logContent).toContain('Setup initialization failed');
    });
  });

  describe('createTimestampDirectory', () => {
    it('should create timestamp directory with subdirectories', () => {
      const timestampDirName = setupManager.createTimestampDirectory();
      
      expect(timestampDirName).toMatch(/^docs-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
      
      const generatedPath = path.join(process.cwd(), 'Generated');
      const timestampPath = path.join(generatedPath, timestampDirName);
      
      // Check that main directories were created
      expect(fs.existsSync(generatedPath)).toBe(true);
      expect(fs.existsSync(timestampPath)).toBe(true);
      
      // Check that subdirectories were created
      const expectedSubdirs = ['Content', 'Source-of-Truth', 'Logs', 'Prompt', 'Reports'];
      expectedSubdirs.forEach(subdir => {
        const subdirPath = path.join(timestampPath, subdir);
        expect(fs.existsSync(subdirPath)).toBe(true);
      });
      
      // Check that setup.log was updated
      const setupLogPath = path.join(process.cwd(), 'setup.log');
      expect(fs.existsSync(setupLogPath)).toBe(true);
      
      const logContent = fs.readFileSync(setupLogPath, 'utf-8');
      expect(logContent).toContain('Timestamp directory created');
    });
  });

  describe('updateCurrentLog', () => {
    it('should update current.log with directory name', () => {
      const directoryName = 'docs-2025-01-20T12-00-00';
      
      setupManager.updateCurrentLog(directoryName);
      
      const generatedPath = path.join(process.cwd(), 'Generated');
      const currentLogPath = path.join(generatedPath, 'current.log');
      
      expect(fs.existsSync(currentLogPath)).toBe(true);
      
      const content = fs.readFileSync(currentLogPath, 'utf-8');
      expect(content.trim()).toBe(directoryName);
      
      // Check that setup.log was updated
      const setupLogPath = path.join(process.cwd(), 'setup.log');
      expect(fs.existsSync(setupLogPath)).toBe(true);
      
      const logContent = fs.readFileSync(setupLogPath, 'utf-8');
      expect(logContent).toContain('current.log updated');
    });
  });

  describe('getCurrentTimestampDirectory', () => {
    it('should return current timestamp directory from current.log', () => {
      const directoryName = 'docs-2025-01-20T12-00-00';
      
      // First update the current.log
      setupManager.updateCurrentLog(directoryName);
      
      // Then get it back
      const result = setupManager.getCurrentTimestampDirectory();
      
      expect(result).toBe(directoryName);
    });

    it('should return null if current.log does not exist', () => {
      const result = setupManager.getCurrentTimestampDirectory();
      
      expect(result).toBeNull();
    });

    it('should return null if current.log is empty', () => {
      const generatedPath = path.join(process.cwd(), 'Generated');
      const currentLogPath = path.join(generatedPath, 'current.log');
      
      // Create empty current.log
      fs.mkdirSync(generatedPath, { recursive: true });
      fs.writeFileSync(currentLogPath, '');
      
      const result = setupManager.getCurrentTimestampDirectory();
      
      expect(result).toBeNull();
    });
  });

  describe('integration test', () => {
    it('should complete full setup workflow', async () => {
      const configPath = path.resolve(__dirname, '../config/setup.config.json');
      const schemaPath = path.resolve(__dirname, '../config/setup-schema.json');
      
      // Initialize setup
      await setupManager.initializeSetup(configPath, schemaPath);
      
      // Create timestamp directory
      const timestampDirName = setupManager.createTimestampDirectory();
      
      // Update current log
      setupManager.updateCurrentLog(timestampDirName);
      
      // Verify everything is set up correctly
      const generatedPath = path.join(process.cwd(), 'Generated');
      const timestampPath = path.join(generatedPath, timestampDirName);
      const currentLogPath = path.join(generatedPath, 'current.log');
      const setupLogPath = path.join(process.cwd(), 'setup.log');
      
      expect(fs.existsSync(timestampPath)).toBe(true);
      expect(fs.existsSync(currentLogPath)).toBe(true);
      expect(fs.existsSync(setupLogPath)).toBe(true);
      
      const currentDirName = setupManager.getCurrentTimestampDirectory();
      expect(currentDirName).toBe(timestampDirName);
      
      const logContent = fs.readFileSync(setupLogPath, 'utf-8');
      expect(logContent).toContain('Setup initialized');
      expect(logContent).toContain('Timestamp directory created');
      expect(logContent).toContain('current.log updated');
    });
  });
});