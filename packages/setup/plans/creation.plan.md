# Plan to Turn `setup.1.prompt.md` into a Programmatic Package

## Overview
The goal is to create a programmatic package at `./packages/setup` that automates the setup process described in `setup.1.prompt.md`. This package will manage files and folders for setup, extrapolate file and directory names into a JSON configuration file, and ensure compatibility with other packages.

## Structure
### Classes
1. **SetupManager**
   - Purpose: Manage the overall setup process.
   - Methods:
     - `initializeSetup(configPath: string): Promise<void>`: Initialize setup using a configuration file.
     - `createTimestampDirectory(): string`: Create a new directory with a timestamp.
     - `updateCurrentLog(directoryName: string): void`: Update the `current.log` file with the name of the timestamp directory.

2. **DirectoryManager**
   - Purpose: Handle directory creation and validation.
   - Methods:
     - `createDirectory(path: string): void`: Create a directory at the specified path.
     - `validateDirectoryStructure(): boolean`: Ensure required directories exist.

3. **FileManager**
   - Purpose: Handle file creation and updates.
   - Methods:
     - `createFile(path: string, content: string): void`: Create a file with the specified content.
     - `updateFile(path: string, content: string): void`: Update an existing file.
     - `readFile(path: string): string`: Read the contents of a file.

### Types
1. **SetupConfig**
   - Purpose: Define the structure of the JSON configuration file.
   - Fields:
     - `directories: string[]`: List of required directories.
     - `files: { [key: string]: string }`: Mapping of file names to their purposes.

2. **LogEntry**
   - Purpose: Define the structure of log entries.
   - Fields:
     - `timestamp: string`: Timestamp of the log entry.
     - `message: string`: Description of the action performed.

## Steps
### Step 1: Create JSON Configuration File
- File: `./packages/setup/config/setup.config.json`
- Content:
```json
{
  "directories": [
    "content",
    "source-of-truth",
    "logs"
  ],
  "files": {
    "tools.json": "Track new tools and operations",
    "new.md": "Communicate new or updated documentation",
    "current.log": "Track the current timestamp directory"
  }
}
```

### Step 2: Implement Classes and Methods
- Create `SetupManager`, `DirectoryManager`, and `FileManager` classes in `./packages/setup/src`.
- Use TypeScript for type safety and compatibility.

### Step 3: Logging
- File: `./packages/setup/logs/setup.log`
- Log all actions performed by the package, including directory creation, file updates, and errors.

### Step 4: Testing
- Create unit tests in `./packages/setup/tests`.
- Ensure all methods work as expected and handle edge cases.

### Step 5: Documentation
- Update `README.md` in `./packages/setup` with usage instructions.

## Questions
1. Should the package handle errors gracefully and retry operations, or fail fast? FAIL FAST
2. Are there additional directories or files that need to be included in the JSON configuration? The file and directory structure will grow over time so the structure should be separate from the source code but detailed with enough information that the source code knows how to manage the structure. The property names of the structure should be self-evident to any english reader. 
3. Should the package support custom directory and file names, or enforce strict adherence to the configuration? Strict adherence. 

## Next Steps
1. Confirm the structure and content of the JSON configuration file.
2. Begin implementation of the `SetupManager` class.
3. Log all actions in `setup.log` for transparency and debugging.
