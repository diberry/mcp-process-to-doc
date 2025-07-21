# MCP Documentation Generation Scripts

This directory contains scripts for generating documentation for Azure MCP tools.

## Scripts

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

- **update-toc.js**: Updates the TOC.yml file with entries for new tools
- **update-index.js**: Updates the index.yml landing page with links to new tools (up to 4 + "View all")
- **update-supported-services.js**: Updates the supported-azure-services.md file with new tools

### Utility Scripts

- **setup-workspace.sh**: Sets up the workspace with timestamp directories and downloads source files
- **extract-tools.sh**: Extracts tools and operations from the azmcp-commands.md file

## Usage

Run the full pipeline with a single command:

```bash
npm run run-all
```

Or run the full process with npm:

```bash
npm run full-process
```

You can also run individual scripts as needed:

```bash
# Generate updated tools.json
npm run generate-tools

# Test the generated tools.json
npm run test

# Create the new.md summary
npm run create-new-md

# Generate documentation for all new tools
npm run generate-all-docs

# Update navigation files
npm run update-toc
npm run update-index
npm run update-supported-services
```

## Directory Structure

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

## Workflow

The documentation generation process follows these steps:

1. **Setup**: Create timestamped directory structure and download source files
2. **Analysis**: Compare source files to identify new tools and operations
3. **Validation**: Ensure the generated tools.json is valid
4. **Summary**: Generate a new.md file summarizing all new tools and operations
5. **Documentation**: Generate documentation files for all new tools and operations
6. **Navigation**: Update TOC.yml, index.yml, and supported-azure-services.md
7. **Reporting**: Generate a final progress report

## Error Handling

The scripts include error handling and will exit with non-zero status codes if critical errors occur. The run-all.sh script will warn about non-critical errors (like navigation file updates) but continue the process.
