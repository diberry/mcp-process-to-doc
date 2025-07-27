# Setup Package

This package provides classes for managing the setup process of documentation generation workflows.

## Classes

### SetupManager

The main orchestrator class for the setup process.

**Methods:**

- `initializeSetup(configPath: string, schemaPath: string): Promise<void>` - Initialize setup using a configuration file and validate it against the schema
- `createTimestampDirectory(): string` - Create a new directory with a timestamp
- `updateCurrentLog(directoryName: string): void` - Update the `current.log` file with the name of the timestamp directory
- `getCurrentTimestampDirectory(): string | null` - Get the current timestamp directory from `current.log`

### DirectoryManager

Handles directory creation and validation operations.

**Methods:**

- `createDirectory(path: string): void` - Create a directory at the specified path
- `validateDirectoryStructure(configPath: string, schemaPath: string): boolean` - Validate the directory structure using the configuration and schema
- `createDirectoriesFromConfig(rootPath: string, configPath: string): void` - Create directories based on configuration

### FileManager

Handles file creation, updates, and reading operations.

**Methods:**

- `createFile(path: string, content: string): void` - Create a file with the specified content
- `updateFile(path: string, content: string): void` - Update an existing file
- `readFile(path: string): string` - Read the contents of a file

## Usage

```typescript
import { SetupManager, DirectoryManager, FileManager } from 'setup';

// Initialize setup manager
const setupManager = new SetupManager();

// Initialize the setup process
await setupManager.initializeSetup('./config/setup.config.json', './config/setup-schema.json');

// Create a timestamped directory structure
const timestampDir = setupManager.createTimestampDirectory();

// Update the current.log file
setupManager.updateCurrentLog(timestampDir);

// Get the current directory
const currentDir = setupManager.getCurrentTimestampDirectory();
```

## Directory Structure

The package creates the following directory structure when `createTimestampDirectory()` is called:

```
Generated/
├── current.log                    # Tracks current timestamp directory
└── docs-YYYY-MM-DDTHH-MM-SS/     # Timestamp directory
    ├── Content/                   # Documentation files
    ├── Source-of-Truth/          # Original source files
    ├── Logs/                     # Process logs
    ├── Prompt/                   # JSON prompt files
    └── Reports/                  # Generated reports
```

## Configuration

The setup process uses:

- `config/setup.config.json` - Defines the directory structure
- `config/setup-schema.json` - JSON schema for validation

## Logging

All setup operations are logged to `setup.log` in the current working directory with timestamps for debugging and transparency.

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Watch Mode

```bash
npm run dev
```