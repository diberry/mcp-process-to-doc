# Prompt Change Detection Package

This package provides automated prompt-to-code synchronization for the Azure MCP Documentation system.

## Overview

The Prompt Change Detection system automatically analyzes changes in the `create-docs.prompt.md` file and provides tools to:

- **Detect Changes**: Identify when the prompt file has been modified
- **Analyze Impact**: Determine which code modules need updates  
- **Apply Updates**: Automatically update code based on prompt changes
- **Validate Integration**: Ensure the system remains synchronized

## Architecture

```
src/
├── config/
│   ├── workflow-config.json     # Declarative configuration
│   └── prompt-parser.js         # Parse prompt and extract config
├── automation/
│   ├── change-detector.js       # Detect prompt changes
│   └── auto-updater.js         # Apply updates to code
├── validation/
│   └── integration-validator.js # Validate system integrity
└── cli/
    ├── analyze-prompt-changes.js
    ├── apply-prompt-updates.js
    ├── validate-integration.js
    └── debug-config.js
```

## Commands

This package provides several CLI commands via npm scripts:

### Analyze Prompt Changes
```bash
npm run analyze-prompt-changes
```
Detects and analyzes changes in the prompt file without making modifications.

### Apply Prompt Updates  
```bash
npm run apply-prompt-updates
```
Automatically applies detected prompt changes to the codebase.

### Validate Integration
```bash  
npm run validate-integration
```
Validates that the code correctly implements prompt requirements.

### Debug Configuration
```bash
npm run debug-config
```
Debug tool to inspect prompt parsing and configuration alignment.

## Workflow

1. **Make changes to `create-docs.prompt.md`**
2. **Run analysis**: `npm run analyze-prompt-changes`
3. **Apply updates**: `npm run apply-prompt-updates` 
4. **Validate**: `npm run validate-integration`

## Configuration

The system uses `src/config/workflow-config.json` as the declarative configuration extracted from the prompt file. This configuration drives all automation and validation.

## Logs

All operations generate detailed logs in the `logs/` directory:
- `change-history.json` - History of detected changes
- `change-report-*.json` - Detailed change analysis reports
- `update-summary-*.json` - Update operation results
- `validation-report-*.json` - Integration validation reports
