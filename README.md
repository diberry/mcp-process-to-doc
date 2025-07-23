# MCP Documentation Generation Tool

This repository contains tools and scripts for generating documentation for Azure MCP tools.

## Overview

The MCP Documentation Generation Tool automates the discovery of new Azure MCP tools and operations, and generates appropriate documentation files in the correct format for publishing on Microsoft Learn. The tool includes scripts for:

- Discovering new tools and operations
- Generating documentation files
- Updating navigation files
- Creating progress reports

## Quick Start

Run the full documentation generation pipeline with a single command:

```bash
npm run run-all
```

The generated documentation files will be available in `./generated/<timestamp>/content/`.

## Directory Structure

```
./
├── src/              # Scripts for documentation generation
├── generated/        # Generated documentation files
│   └── <timestamp>/
│       ├── content/  # Generated documentation files
│       ├── source-of-truth/ # Original source files
│       └── logs/     # Log files and intermediary data
└── archive/          # Archive of previous documentation files
```

## Scripts

All scripts are located in the `src` directory. See [src/README.md](src/README.md) for detailed information about each script.

### Main Scripts

- **run-all.sh**: Master script that runs the entire pipeline from setup to final report generation
- **index.js**: Entry point script that sets up workspace with timestamp directories and downloads source files

### Tool Discovery and Analysis Scripts

- **generate-tools-json.js**: Analyzes source files and generates a new tools.json with new tools and operations marked
- **test-tools-json.js**: Validates the generated tools.json file
- **create-new-md.js**: Generates the new.md file summarizing all new tools and operations

### Documentation Generation Scripts

- **generate-all-docs.js**: Generates documentation files for all new tools and operations
- **generate-tool-doc.js**: Generates a documentation file for a single tool

### Navigation Update Scripts

- **navigation-generators/update-toc.js**: Updates the TOC.yml file with entries for new tools
- **navigation-generators/update-index.js**: Updates the index.yml landing page with links to new tools
- **navigation-generators/update-supported-services.js**: Updates the supported-azure-services.md file with new tools

## Usage

```bash
# Run the full pipeline
npm run run-all

# Or run individual scripts as needed
npm run generate-tools
npm run test
npm run create-new-md
npm run generate-all-docs
npm run update-toc
npm run update-index
npm run update-supported-services
```

## Output

The scripts generate output in the following directory structure:

```
./generated/<timestamp>/
├── content/           # Generated documentation files
│   ├── new.md         # Summary of new tools and operations
│   ├── azure-*.md     # Documentation for new tools
│   ├── azure-*-partial.md # Partial documentation for new operations in existing tools
│   ├── TOC.yml        # Updated table of contents
│   ├── index.yml      # Updated landing page
│   ├── supported-azure-services.md # Updated supported services list
│   └── progress-report.md # Summary of generation results
├── source-of-truth/   # Original source files
│   ├── azmcp-commands.md # Source of MCP command documentation
│   └── tools.json     # Original tools.json file
└── logs/              # Log files and intermediary data
    ├── azmcp.log      # Main log file
    ├── new-tools.txt  # List of new tools
    ├── new-operations.txt # List of new operations
    └── *.log          # Other log files
```

## Cleanup

The `.js` and `.sh` files at the root level of the repository are deprecated and can be safely removed. All functionality has been moved to the scripts in the `src` directory.
