# Enhanced Documentation Generation System - Usage Guide

## Overview

The enhanced documentation generation system successfully addresses all the issues identified in the original system:

✅ **Robust Command Extraction**: Fixed "Extracted 0 command infos" issue  
✅ **Quality Content Generation**: Eliminated repetitive and generic content  
✅ **Template Compliance**: Uses proper `generated-documentation.template.md` format  
✅ **Content Validation**: Built-in quality checks prevent poor output  
✅ **Enhanced Examples**: Context-aware, service-specific example prompts  

## Usage Instructions

### 1. Generate All Documentation (Recommended)

```bash
cd /workspaces/mcp-process-to-doc/src
node generate-all-docs-v2.js
```

This will:
- Process all tools in the latest tools.json
- Generate individual documentation files for each service
- Create enhanced index and summary files
- Validate all output for quality
- Generate comprehensive reports

### 2. Generate Single Tool Documentation

```bash
cd /workspaces/mcp-process-to-doc/src
node generate-tool-doc-v2.js <tool-id>

# Example:
node generate-tool-doc-v2.js azure-storage
```

This will:
- Generate documentation for a single tool/service
- Show content preview before writing
- Validate the generated content

### 3. Generate Enhanced Summary File

```bash
cd /workspaces/mcp-process-to-doc/src
node create-new-md-v2.js
```

This will:
- Analyze all tools and categorize by service type
- Generate enhanced new.md with better organization
- Include proper statistics and categorization

## Key Improvements

### Command Extraction
- **Before**: "Extracted 0 command infos from azmcp-commands.md"
- **After**: Robust parsing that successfully extracts all commands

### Content Quality
- **Before**: Repetitive content like "Start operation" repeated 4 times
- **After**: Context-aware descriptions with service-specific details

### Template Usage
- **Before**: Mixed template usage causing format inconsistencies
- **After**: Consistent use of `generated-documentation.template.md`

### Example Prompts
- **Before**: Generic "List items" examples
- **After**: Service-specific examples like "Show storage accounts in my production subscription"

### Validation
- **Before**: No quality control
- **After**: Built-in validation prevents poor quality output

## File Structure

The enhanced system consists of:

### Core Components
- `enhanced-template-engine.js` - Advanced template processing
- `command-parser.js` - Robust command extraction
- `content-generator.js` - Context-aware content generation
- `quality-validator.js` - Content quality validation
- `documentation-orchestrator.js` - Main coordination logic

### Generation Scripts (Enhanced Versions)
- `generate-all-docs-v2.js` - Complete documentation generation
- `generate-tool-doc-v2.js` - Single tool documentation
- `create-new-md-v2.js` - Enhanced summary generation

### Testing
- `test-enhanced-system.js` - Comprehensive system validation

## Migration from Old System

To switch from the old system to the enhanced system:

1. **Replace generation scripts**:
   - Use `generate-all-docs-v2.js` instead of `generate-all-docs.js`
   - Use `generate-tool-doc-v2.js` instead of `generate-tool-doc.js`
   - Use `create-new-md-v2.js` instead of `create-new-md.js`

2. **Keep existing data files**:
   - `tools.json` files remain the same
   - `azmcp-commands.md` files remain the same
   - Templates remain the same

3. **Expected improvements**:
   - Successful command extraction
   - Higher quality content
   - Consistent formatting
   - Service-specific examples
   - Built-in validation

## Troubleshooting

### Command Issues
```bash
# Test the enhanced system
node test-enhanced-system.js

# Check if all components are working
```

### File Path Issues
- All scripts should be run from the `/workspaces/mcp-process-to-doc/src` directory
- Template files are automatically located relative to the src directory

### Quality Issues
- The enhanced system includes built-in validation
- Check logs for specific quality issues
- Use `--debug` flag for detailed output

## Next Steps

1. **Run the enhanced system** on your current data to see the improvements
2. **Compare output quality** between old and new systems
3. **Use the enhanced scripts** as your new standard generation process

The enhanced system is production-ready and will provide significantly better documentation quality than the original system.
