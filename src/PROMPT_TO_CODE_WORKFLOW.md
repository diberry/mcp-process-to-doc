# Prompt-to-Code Integration Workflow

## Overview

This document explains how to use the new **prompt-to-code integration system** that creates tight coupling between `create-docs.prompt.md` and the source code in the `src/` directory. The system automatically detects changes in the prompt file and synchronizes them with the codebase.

## Quick Start

When you modify `create-docs.prompt.md`, run these commands:

```bash
# 1. Analyze what changed in the prompt
npm run analyze-prompt-changes

# 2. Apply automatic updates to code
npm run apply-prompt-updates

# 3. Validate that everything is synchronized
npm run validate-integration
```

Or use the shortcut:
```bash
# Combined analysis and updates
npm run sync-prompt-to-code

# Full validation
npm run full-validation
```

## What You Do When Changing the Prompt

### Step 1: Modify `create-docs.prompt.md`
Make your changes to the prompt file as needed:
- Update data sources (URLs, APIs)
- Modify content generation rules
- Change validation requirements
- Update output structure

### Step 2: Analyze Changes
```bash
npm run analyze-prompt-changes
```

This will:
- 🔍 **Detect** what sections of the prompt changed
- 📊 **Analyze** impact on different code modules
- ⚠️ **Identify** what requires manual review
- 📋 **Recommend** next steps

Example output:
```
🔧 sources
   Source URLs or data extraction requirements changed
   Impact: data-extractors (medium severity)
   
🔧 content-rules
   Content generation rules changed
   Impact: content-builders (high severity)
   
📊 Impact Analysis:
   Modules affected: 2
   Estimated effort: medium
   Auto-updatable: Partial
```

### Step 3: Apply Updates
```bash
npm run apply-prompt-updates
```

This will:
- ✅ **Automatically update** configuration files
- 🔧 **Modify** code modules where possible
- ⚠️ **Flag** areas requiring manual review
- 📝 **Generate** update summary

### Step 4: Manual Review (if needed)
If the system detects changes that require manual review:

1. **Check the detailed report** in `src/logs/`
2. **Review flagged modules** for complex logic changes
3. **Update any custom business logic** that can't be automated
4. **Test changes** using existing test scripts

### Step 5: Validate Integration
```bash
npm run validate-integration
```

This will:
- 📋 **Verify** prompt and config are synchronized
- 🧩 **Check** all modules are complete
- 🔄 **Validate** workflow integrity
- ✅ **Test** code compliance

Example validation report:
```
📊 Validation Summary:
   Total tests: 34
   ✅ Passed: 32
   ⚠️  Warnings: 2
   ❌ Failed: 0
   Overall status: PASS
```

## Available Commands

### Core Workflow Commands
- `npm run analyze-prompt-changes` - Detect changes in prompt file
- `npm run apply-prompt-updates` - Apply changes to code automatically
- `npm run validate-integration` - Validate prompt-to-code alignment

### Convenience Commands
- `npm run sync-prompt-to-code` - Run analysis + apply updates
- `npm run full-validation` - Complete integration validation

### Legacy Commands (still available)
- `npm run update-toc` - Update table of contents
- `npm run update-index` - Update index files
- `npm run update-supported-services` - Update supported services
- `npm run run-all` - Run full documentation generation
- `npm run full-process` - Complete process (legacy)

## Understanding the System

### Architecture
The prompt-to-code integration system consists of:

```
src/
├── config/
│   ├── workflow-config.json      # Declarative configuration
│   └── prompt-parser.js          # Prompt parsing logic
├── automation/
│   ├── change-detector.js        # Change detection
│   ├── auto-updater.js          # Automatic updates
│   └── cli/                     # Command-line scripts
└── validation/
    └── integration-validator.js  # Validation framework
```

### Configuration Flow
1. **Source of Truth**: `create-docs.prompt.md` contains all requirements
2. **Configuration**: `src/config/workflow-config.json` holds parsed config
3. **Synchronization**: System keeps config aligned with prompt
4. **Code Generation**: Modules use config to generate documentation

### Change Detection
The system tracks changes using:
- **Content hashing** of prompt sections
- **Configuration comparison** between prompt and current state
- **Impact analysis** to determine affected modules
- **Effort estimation** for manual vs automatic updates

## File Structure

### Key Files Created
- `src/docs/PROMPT_INTEGRATION_PLAN.md` - Complete integration plan
- `src/config/workflow-config.json` - Declarative configuration
- `src/config/prompt-parser.js` - Prompt parsing logic
- `src/automation/change-detector.js` - Change detection system
- `src/automation/auto-updater.js` - Automatic update system
- `src/validation/integration-validator.js` - Validation framework
- `src/automation/cli/*.js` - Command-line interface scripts

### Log Files
All operations generate detailed logs in `src/logs/`:
- `change-report-*.json` - Change analysis reports
- `update-report-*.json` - Update operation reports
- `validation-report-*.json` - Validation reports

## Benefits

### For You
- ✅ **Single Source of Truth**: Only edit `create-docs.prompt.md`
- 🔄 **Automatic Synchronization**: Code stays aligned with prompt
- 📊 **Impact Analysis**: Know what changes affect what code
- ⚠️ **Smart Detection**: System knows what needs manual review
- 📝 **Detailed Reporting**: Full visibility into changes and status

### For the System
- 🎯 **Tight Coupling**: Prompt drives code generation
- 🔧 **Modular Updates**: Only affected modules get updated
- ✅ **Validation**: Continuous verification of alignment
- 📋 **Configuration Management**: Declarative, version-controlled config
- 🔄 **Workflow Automation**: Reduced manual synchronization

## Troubleshooting

### Common Issues

#### 1. Validation Failures
```bash
❌ Validation failed - please address the issues above
```
**Solution**: Check the detailed report in `src/logs/validation-report-*.json` and address specific issues.

#### 2. Manual Review Required
```bash
⚠️  Manual review required:
   • Content builder logic changes require manual review
```
**Solution**: Review the affected modules and update complex logic that can't be automated.

#### 3. Configuration Mismatches
```bash
❌ Prompt-Config Sync: Configuration mismatches detected
```
**Solution**: Run `npm run apply-prompt-updates` to synchronize configuration.

### Getting Help
1. Check the detailed logs in `src/logs/`
2. Review the integration plan in `src/docs/PROMPT_INTEGRATION_PLAN.md`
3. Validate individual modules using the existing test scripts

## Next Steps

1. **Test the workflow** by making a small change to `create-docs.prompt.md`
2. **Run the commands** to see how the system responds
3. **Review the reports** to understand what the system detected
4. **Customize the automation** by modifying the configuration files
5. **Extend the system** by adding new validation rules or update strategies

The system is designed to make prompt file changes drive automatic code updates while maintaining full visibility and control over the process.
