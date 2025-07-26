# Prompt-to-Code Integration Plan

## Current Problem

The `create-docs.prompt.md` contains detailed workflow instructions, but the relationship to `src` modules is loose and manual. Changes to the prompt require manually updating multiple `src` files, leading to:

- **Inconsistency**: Prompt changes don't automatically reflect in code
- **Error-prone updates**: Manual synchronization leads to missed requirements
- **Unclear mappings**: No clear relationship between prompt sections and code modules
- **Verification gaps**: No automated way to verify code implements prompt requirements

## Solution: Declarative Configuration-Driven Architecture

### Core Principle: Single Source of Truth
Transform `create-docs.prompt.md` into a **declarative configuration** that automatically drives code generation and validation.

## Phase 1: Prompt Decomposition and Mapping

### 1.1 Extract Declarative Configuration from Prompt

Create `src/config/workflow-config.json` that extracts all configurable aspects from the prompt:

```json
{
  "workflow": {
    "name": "azure-mcp-documentation-generation",
    "version": "1.0.0",
    "description": "Generate documentation for Azure MCP Server tools"
  },
  "sources": {
    "engineering": {
      "azmcp-commands": "https://github.com/Azure/azure-mcp/blob/main/docs/azmcp-commands.md",
      "e2e-test-prompts": "https://github.com/Azure/azure-mcp/blob/main/e2eTests/e2eTestPrompts.md",
      "command-descriptions": "https://github.com/Azure/azure-mcp/blob/main/src/Areas/{area}/Commands/{command}/{operation}Command.cs"
    },
    "documentation": {
      "tools-json": "https://github.com/MicrosoftDocs/azure-dev-docs-pr/blob/main/articles/azure-mcp-server/tools/tools.json",
      "examples": {
        "app-config": "https://github.com/MicrosoftDocs/azure-dev-docs-pr/blob/main/articles/azure-mcp-server/tools/app-configuration.md",
        "azure-cli": "https://github.com/MicrosoftDocs/azure-dev-docs-pr/blob/main/articles/azure-mcp-server/tools/azure-cli-extension.md",
        "datadog": "https://github.com/MicrosoftDocs/azure-dev-docs-pr/blob/main/articles/azure-mcp-server/tools/azure-native-isv.md"
      },
      "navigation": {
        "toc": "https://github.com/MicrosoftDocs/azure-dev-docs-pr/blob/main/articles/azure-mcp-server/TOC.yml",
        "index": "https://github.com/MicrosoftDocs/azure-dev-docs-pr/blob/main/articles/azure-mcp-server/index.yml",
        "supported-services": "https://github.com/MicrosoftDocs/azure-dev-docs-pr/blob/main/articles/azure-mcp-server/includes/tools/supported-azure-services.md"
      }
    }
  },
  "templates": {
    "primary": "generated-documentation.template.md",
    "partial": "new.template.md"
  },
  "output": {
    "structure": {
      "timestamp-format": "YYYY-MM-DD_HH-mm-ss",
      "directories": ["content", "source-of-truth", "logs"]
    },
    "files": {
      "content": [
        "tools.json",
        "new.md",
        "{tool-name}.md",
        "{tool-name}-partial.md",
        "index.yml",
        "TOC.yml",
        "supported-azure-services.md"
      ],
      "source-of-truth": [
        "azmcp-commands.md",
        "tools.json",
        "app-configuration.md",
        "azure-cli-extension.md",
        "azure-native-isv.md",
        "global-parameters-list.md"
      ],
      "logs": ["azmcp.log"]
    }
  },
  "content-rules": {
    "example-prompts": {
      "count": 5,
      "variety": ["question", "statement", "incomplete", "verbose"],
      "format": "- **{purpose}**: \"{prompt}\""
    },
    "parameters": {
      "format": "Required or Optional",
      "exclude-global": true
    },
    "headers": {
      "case": "sentence",
      "html-comments": true
    },
    "links": {
      "type": "relative",
      "exclude-language-codes": true
    }
  },
  "validation-rules": {
    "markdown": {
      "bullets": "dash",
      "no-prerequisites": true,
      "h2-sections": ["command-operations"],
      "h3-sections": ["avoid-parameters-headers"]
    },
    "content": {
      "min-example-prompts": 5,
      "max-landing-page-tools": 4,
      "required-sections": ["related-content"]
    }
  }
}
```

### 1.2 Create Prompt Parser

Create `src/config/prompt-parser.js` to extract configuration from markdown:

```javascript
/**
 * Parse create-docs.prompt.md and extract structured configuration
 */
class PromptParser {
    async parsePrompt(promptFilePath) {
        // Parse markdown sections
        // Extract URLs, rules, templates
        // Generate workflow-config.json
        // Validate against schema
    }
    
    async validatePromptIntegrity() {
        // Ensure prompt matches current workflow-config.json
        // Flag inconsistencies
    }
}
```

## Phase 2: Configuration-Driven Module Updates

### 2.1 Configuration Manager Enhancement

Update `src/config/configuration-manager.js` to load workflow configuration:

```javascript
class ConfigurationManager {
    async loadWorkflowConfig() {
        const promptConfig = await this.parsePromptFile();
        const workflowConfig = await this.loadWorkflowConfig();
        return this.mergeConfigurations(promptConfig, workflowConfig);
    }
    
    async validateConfigurationIntegrity() {
        // Compare prompt vs workflow-config.json
        // Report mismatches
    }
}
```

### 2.2 Module Auto-Generation

Create `src/automation/module-generator.js`:

```javascript
/**
 * Generate/update modules based on workflow configuration
 */
class ModuleGenerator {
    async updateModulesFromConfig(workflowConfig) {
        // Update data extractors based on sources
        // Update content builders based on content-rules
        // Update validators based on validation-rules
        // Update workflows based on output structure
    }
    
    async generateMissingModules(config) {
        // Identify gaps between config and existing modules
        // Generate missing modules with templates
    }
}
```

## Phase 3: Automated Verification System

### 3.1 Configuration Validator

Create `src/validation/configuration-validator.js`:

```javascript
class ConfigurationValidator {
    async validatePromptToCodeAlignment() {
        return {
            missingModules: [],
            outdatedModules: [],
            configMismatches: [],
            uncoveredRequirements: []
        };
    }
    
    async generateComplianceReport() {
        // Generate report showing how each prompt requirement 
        // is implemented in code
    }
}
```

### 3.2 Integration Test Generator

Create `src/tests/integration/prompt-integration-tests.js`:

```javascript
/**
 * Auto-generate tests from workflow configuration
 */
class PromptIntegrationTests {
    async generateTestsFromConfig(workflowConfig) {
        // Create tests for each workflow step
        // Validate outputs match prompt requirements
        // Test configuration rules compliance
    }
}
```

## Phase 4: Change Management Workflow

### 4.1 Change Detection System

Create `src/automation/change-detector.js`:

```javascript
class ChangeDetector {
    async detectPromptChanges(oldPrompt, newPrompt) {
        return {
            configurationChanges: [],
            ruleChanges: [],
            workflowChanges: [],
            impactedModules: []
        };
    }
    
    async generateUpdatePlan(changes) {
        // Create specific update instructions for each affected module
    }
}
```

### 4.2 Auto-Update Engine

Create `src/automation/auto-updater.js`:

```javascript
class AutoUpdater {
    async updateCodeFromPromptChanges(changeDetection) {
        // Automatically update compatible changes
        // Flag manual review requirements
        // Generate validation tests
    }
}
```

## User Workflow: What You Do When Changing the Prompt

### Step 1: Modify Prompt File
```bash
# Edit create-docs.prompt.md
code create-docs.prompt.md
```

### Step 2: Run Integration Analysis
```bash
npm run analyze-prompt-changes
```
This runs:
- Parse prompt for configuration changes
- Compare against current workflow-config.json
- Identify impacted modules
- Generate update plan

### Step 3: Apply Automated Updates
```bash
npm run apply-prompt-updates
```
This runs:
- Update workflow-config.json
- Auto-update compatible modules
- Generate new modules if needed
- Update tests

### Step 4: Review Manual Changes
```bash
npm run review-manual-updates
```
This shows:
- Modules requiring manual review
- Configuration conflicts
- Validation rule changes

### Step 5: Validate Integration
```bash
npm run validate-integration
```
This runs:
- Integration tests
- Configuration compliance check
- Workflow execution test
- Generate compliance report

## Supporting Files to Create

### 1. Configuration Schema
`src/config/workflow-config.schema.json` - JSON schema for validation

### 2. Module Templates
`src/templates/module-templates/` - Templates for auto-generating modules

### 3. Compliance Dashboard
`src/automation/compliance-dashboard.js` - Visual dashboard showing prompt-to-code alignment

### 4. Change Log Generator
`src/automation/change-log-generator.js` - Generate change logs from prompt modifications

### 5. Documentation Generator
`src/automation/docs-generator.js` - Auto-generate module documentation from configuration

## NPM Scripts to Add

```json
{
  "scripts": {
    "analyze-prompt-changes": "node src/automation/change-detector.js",
    "apply-prompt-updates": "node src/automation/auto-updater.js",
    "review-manual-updates": "node src/automation/manual-review.js",
    "validate-integration": "node src/validation/integration-validator.js",
    "generate-compliance-report": "node src/validation/compliance-reporter.js",
    "sync-prompt-to-code": "npm run analyze-prompt-changes && npm run apply-prompt-updates",
    "full-validation": "npm run validate-integration && npm run generate-compliance-report"
  }
}
```

## Benefits of This Approach

1. **Single Source of Truth**: Prompt file drives everything
2. **Automated Sync**: Changes automatically propagate to code
3. **Validation**: Continuous verification of prompt-to-code alignment
4. **Traceability**: Clear mapping between requirements and implementation
5. **Reduced Errors**: Automation eliminates manual synchronization mistakes
6. **Easy Onboarding**: New team members can understand system from prompt file

## Implementation Priority

1. **Phase 1**: Configuration extraction and parser (High Priority)
2. **Phase 2**: Module auto-updates (Medium Priority)
3. **Phase 3**: Validation system (Medium Priority)
4. **Phase 4**: Change management automation (Low Priority)

This creates a **declarative, configuration-driven system** where the prompt file becomes the authoritative source that automatically drives code generation and validation.
