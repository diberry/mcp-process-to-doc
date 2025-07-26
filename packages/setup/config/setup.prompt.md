# Setup generated directory Instructions

## Goal

Create a reusable and importable package to manage folders and files for the system including finding, reading, and writing files. This package will be used to manage the `./Generated` directory structure and its contents.

## Definitions

- directory: a directory is defined by its name, its purpose, if it is required (true by default), its direct parent, if one exists and its child directories and files. 
- file: a file is defined by its purpose, and is found inside the direct object of its parents. 

## Directories

- `Generated` Directory:
    - Purpose: Store all files created or modified during the documentation process.
    - Contains subdirectories for different purposes.

- `./Generated/<timestamp>/Content` Directory:
   - Purpose: Store files created during the documentation process.
   - Files:
     - `tools.json`: Updated tools and operations.
     - `new.md`: List of new tools or tools with changed operations (new, updated, or removed)
     - `<tool-name>.md`: Documentation for new tools.
     - `<tool-name>-partial.md`: Documentation for new operations.

- `./Generated/<timestamp>/Source-of-Truth` Directory:
   - Purpose: Store original files downloaded from sources. These files should not be edited.
   - Files:
     - `tools.json`: Original tools file from the content team.
     - `azmcp-commands.md`: Original tools file from the engineering team.

- `./Generated/<timestamp>/Logs` Directory:
   - Purpose: Store logs or intermediary files created during the process.
   - Files:
     - `azmcp.log`: Log file for issues and intermediary steps.
     - `current.log`: Tracks the current timestamp directory being worked on.

- `./Generated/<timestamp>/Prompt` Directory:
   - Purpose: Store JSON version of prompt file.
   - Files:
     - `setup.1.prompt.json`: Configuration file for the workflow.

- `./Generated/<timestamp>/Reports` Directory:
    - Purpose: Store reports generated during the documentation process.
    - Files:
      - `setup.1.prompt.report.json`: Summary of changes made during the prompt.json generation process.

## Files

- `./Generated/current.log`:
   - Location: `./Generated/current.log`
   - Purpose: Track the current timestamp directory being worked on.

## Setup Steps
1. Create a new directory inside `./Generated` with a timestamp in the name (e.g., `2025-07-26_18-57-50`).
2. Place all files you download, create, or edit in this new directory.
3. Update `current.log` with the name of the new timestamp directory.
