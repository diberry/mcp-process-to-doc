# JSON Schema Enhancement for Prompt Change Detection

## Overview

This enhancement adds structured JSON conversion and validation capabilities to the prompt change detection system. The new functionality provides:

1. **JSON Schema Definition**: Strongly typed schema for prompt structure validation
2. **Markdown-to-JSON Converter**: Automated conversion from markdown prompts to structured JSON
3. **Schema Validation**: Validation of converted JSON against defined schema
4. **Change Detection**: Enhanced comparison capabilities using structured data
5. **CLI Integration**: Command-line tools for conversion and validation

## Features

### 1. JSON Schema (`prompt-schema.json`)

**Location**: `packages/prompt-change-detection/src/config/prompt-schema.json`

The schema defines a comprehensive structure for prompt files including:

- **Metadata**: Title, description, version, timestamps, SHA-256 hash
- **Goal**: Primary objectives, repository references, workflow steps
- **Tools**: Recommended tools and usage priorities
- **Sources**: Engineering and documentation source references
- **Templates**: Template files and usage guidelines
- **File Generation**: Output structure, workflow, and file organization
- **Content Rules**: Documentation formatting and generation rules
- **Navigation Rules**: File organization and navigation structure
- **Editorial Review**: Review process and criteria
- **Validation Rules**: Content validation and compliance requirements

### 2. Markdown-to-JSON Converter

**Location**: `packages/prompt-change-detection/src/automation/markdown-to-json-converter.ts`
**CLI Tool**: `packages/prompt-change-detection/src/cli/unified-convert-prompt.js`

The converter provides:

```typescript
interface PromptStructure {
  metadata: PromptMetadata;
  goal: GoalSection;
  tools?: ToolsSection;
  sources: SourcesSection;
  templates: TemplatesSection;
  fileGeneration: FileGenerationSection;
  contentRules: ContentRulesSection;
  navigationRules: NavigationRulesSection;
  editorialReview?: EditorialReviewSection;
  validationRules: ValidationRulesSection;
}
```

**Key Features**:
- Automated parsing of markdown sections
- SHA-256 hash generation for content integrity
- Type-safe interfaces for all data structures
- Schema validation support
- Change comparison capabilities

### 3. CLI Tool

**Location**: `packages/prompt-change-detection/src/cli/convert-prompt.js`

**Usage**:
```bash
# Basic conversion
npm run convert-prompt create-docs.prompt.md

# With validation
npm run convert-prompt create-docs.prompt.md --validate

# With comparison to previous version
npm run convert-prompt create-docs.prompt.md --compare previous.json --verbose

# Custom output file
npm run convert-prompt input.md output.json --validate
```

**Options**:
- `-o, --output`: Specify output file path
- `-s, --schema`: Specify JSON schema file path  
- `-c, --compare`: Compare with previous JSON file
- `-v, --validate`: Validate output against schema
- `--verbose`: Show detailed output
- `-h, --help`: Show help message

## Benefits for Prompt Change Detection

### 1. Structural Validation

**Before**: Text-based diff comparison
```bash
# Limited insight into structural changes
diff create-docs.prompt.md create-docs.prompt.md.backup
```

**After**: Schema-validated structural comparison
```bash
# Detailed structural analysis
npm run convert-prompt create-docs.prompt.md --compare previous.json --verbose
```

**Benefits**:
- Detect schema violations before processing
- Identify specific section changes (goal, content rules, etc.)
- Validate data types and required fields
- Ensure consistent structure across versions

### 2. Enhanced Change Detection

**JSON-based comparison provides**:
- **Granular Change Detection**: Identify which specific sections changed
- **Semantic Comparison**: Compare structured data rather than text
- **Change Significance**: Classify changes as major, minor, or patch level
- **Property-level Tracking**: Track changes to specific configuration properties

**Example Output**:
```
📊 Changes detected (major):
  - Goal section modified
  - Content rules modified: formatting.parameters.requiredFormat changed
  - File generation workflow updated: 2 new steps added
```

### 3. Automated Validation

**Schema Enforcement**:
- Required fields validation
- Type checking (strings, arrays, objects)
- Format validation (URLs, SHA-256 hashes, semantic versions)
- Custom validation rules (max values, pattern matching)

**Content Integrity**:
- SHA-256 hash verification for content changes
- Timestamp tracking for modification history
- Version comparison for breaking changes

### 4. Better Integration with Code Generation

**Structured Data Access**:
```javascript
// Instead of parsing markdown
const promptData = JSON.parse(fs.readFileSync('prompt.json'));

// Direct access to structured configuration
const maxTools = promptData.navigationRules.landingPage.maxTools;
const outputDir = promptData.fileGeneration.structure.baseDirectory;
const contentRules = promptData.contentRules.formatting;
```

**Benefits**:
- Type-safe access to configuration data
- No need for markdown parsing in code generators
- Consistent data structure across all tools
- Easy validation of configuration values

### 5. Enhanced Monitoring and Reporting

**Detailed Change Tracking**:
- Track specific rule changes affecting generation
- Monitor schema compliance over time
- Generate change reports for review processes
- Identify patterns in prompt evolution

**Automated Quality Checks**:
- Pre-commit validation of prompt structure
- Continuous integration schema validation
- Automated detection of breaking changes
- Compliance reporting for editorial review

## Implementation Workflow

### 1. Convert Existing Prompt
```bash
# Convert current prompt to JSON with validation
npm run convert-prompt create-docs.prompt.md --validate --verbose
```

### 2. Integrate with Change Detection
```bash
# Enhanced change detection workflow
npm run convert-prompt create-docs.prompt.md --compare previous-prompt.json
npm run analyze-prompt-changes  # Now uses JSON comparison
npm run apply-prompt-updates    # Uses structured data
```

### 3. Continuous Validation
```bash
# Add to CI/CD pipeline
npm run convert-prompt create-docs.prompt.md --validate
if [ $? -ne 0 ]; then
  echo "Prompt validation failed"
  exit 1
fi
```

### 4. Version Tracking
```bash
# Create versioned snapshots
npm run convert-prompt create-docs.prompt.md prompt-v1.2.0.json
git add prompt-v1.2.0.json
git commit -m "feat: prompt schema v1.2.0 with enhanced content rules"
```

## Future Enhancements

### 1. Advanced Validation
- Custom validation rules for specific content requirements
- Cross-reference validation between sections
- Automated compliance checking for documentation standards

### 2. Schema Evolution
- Schema versioning and migration tools
- Backward compatibility validation
- Breaking change detection and reporting

### 3. Integration Improvements
- Real-time validation in prompt editors
- IDE extensions for schema-aware editing
- Automated prompt optimization suggestions

### 4. Reporting and Analytics
- Prompt evolution analytics
- Change impact analysis
- Configuration drift detection
- Performance impact tracking

## Configuration

The JSON schema and converter can be customized by:

1. **Modifying the Schema**: Edit `prompt-schema.json` to add or modify validation rules
2. **Extending the Converter**: Add new parsing logic for additional sections
3. **Custom Validation**: Implement domain-specific validation rules
4. **Integration Points**: Connect with existing workflow automation tools

This enhancement provides a solid foundation for reliable, scalable prompt change detection while maintaining backward compatibility with existing markdown-based workflows.
