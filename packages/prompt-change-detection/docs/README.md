# Prompt Change Detection Package

This package provides automated prompt-to-code synchronization for the Azure MCP Documentation system.

## Overview

The Prompt Change Detection system automatically analyzes changes in the `../../create-docs.prompt.md` file and provides tools to:

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
**Technical Operation**: Computes SHA-256 hash of the current prompt file and compares it against stored hash in change history. Parses the prompt file using regex patterns to extract configuration sections (sources, content rules, validation rules) and performs deep JSON comparison with existing `workflow-config.json`. Generates impact analysis by mapping configuration changes to affected code modules and estimates update effort based on severity weights. Outputs detailed change report with specific file modifications needed and saves analysis to timestamped JSON log.

### Apply Prompt Updates  
```bash
npm run apply-prompt-updates
```
**Technical Operation**: Executes automated code modifications based on detected prompt changes using strategy pattern for different module types. Updates source URLs in data extractors using regex replacement, modifies configuration objects in content builders, and adjusts validation rules in quality controllers. Applies changes only to modules with severity below manual review threshold, using file system operations to modify JavaScript files directly. Generates update summary with success/failure status and identifies items requiring manual intervention.

### Validate Integration
```bash  
npm run validate-integration
```
**Technical Operation**: Performs comprehensive system integrity checks across 4 categories with 34+ individual tests. Validates configuration alignment by comparing parsed prompt against workflow config using JSON deep comparison. Tests module completeness by checking file existence and exports using `fs.access()` and content analysis. Verifies workflow integrity by testing main entry points and module imports. Validates code compliance by parsing source files and checking for implementation of prompt-specified rules using regex pattern matching.

### Debug Configuration
```bash
npm run debug-config
```
**Technical Operation**: Executes direct prompt parsing without change detection or modification operations. Displays raw extracted configuration objects (sources, content rules, validation rules) in formatted JSON output for inspection. Runs integrity validation and reports discrepancies between current configuration and parsed prompt state. Provides immediate feedback on prompt parsing accuracy and configuration synchronization status without generating logs or making changes.

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
