# MCP Documentation Generation Scripts

This directory contains scripts for generating documentation for Azure MCP tools. The system includes both the original scripts and an enhanced version that provides improved quality, validation, and error handling.

## Enhanced System (Recommended)

### Core Enhanced Components
- **enhanced-template-engine.js**: Advanced template processing using `generated-documentation.template.md`
- **command-parser.js**: Robust extraction from `azmcp-commands.md` (fixes "Extracted 0 command infos" issue)
- **content-generator.js**: Context-aware content generation with service-specific examples
- **quality-validator.js**: Built-in validation to prevent poor quality output
- **documentation-orchestrator.js**: Main coordination logic with comprehensive error handling

### Enhanced Generation Scripts
- **generate-all-docs-v2.js**: Complete documentation generation with validation
- **generate-tool-doc-v2.js**: Single tool generation with preview and debugging
- **create-new-md-v2.js**: Enhanced summary generation with better categorization

### Testing
- **test-enhanced-system.js**: Comprehensive test suite for all enhanced components

### Quick Start with Enhanced System
```bash
# Generate all documentation (recommended)
node generate-all-docs-v2.js

# Generate single tool documentation
node generate-tool-doc-v2.js <tool-id>

# Generate enhanced summary
node create-new-md-v2.js

# Test the enhanced system
node test-enhanced-system.js
```

## Original Scripts

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
- **navigation-generators/update-index.js**: Updates the index.yml landing page with links to new tools (up to 4 + "View all")
- **navigation-generators/update-supported-services.js**: Updates the supported-azure-services.md file with new tools

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
│   ├── tools.json     # Original tools.json file
│   ├── index.yml      # Copy of source index.yml file
│   ├── TOC.yml        # Copy of source TOC.yml file
│   └── supported-azure-services.md # Copy of source supported services file
└── logs/              # Log files and intermediary data
    ├── azmcp.log      # Main log file
    ├── new-tools.txt  # List of new tools
    ├── new-operations.txt # List of new operations
    └── *.log          # Other log files
```

## Source Files and Templates

### Input Source Files
- **azmcp-commands.md**: Complete MCP command documentation with parameters and descriptions
- **tools.json**: Tool definitions with operations, parameters, and metadata
- **generated-documentation.template.md**: Primary template for documentation generation (located in project root)
- **new.template.md**: Alternative template (legacy, not recommended)
- **index.yml**: Landing page configuration
- **TOC.yml**: Table of contents structure
- **supported-azure-services.md**: List of supported Azure services

### Critical Source File Details
- **azmcp-commands.md**: Contains the source of truth for all MCP command documentation including:
  - Command syntax and structure
  - Parameter definitions and requirements
  - Return value descriptions
  - Usage examples and patterns
  - Function signatures and implementation details
- **tools.json**: Defines the tool structure including:
  - Tool identifiers and root commands
  - Operation hierarchies and categorization
  - Parameter mappings and validation rules
  - Status tracking (new vs existing)
  - Tool metadata and descriptions

### Template Files
- **generated-documentation.template.md**: The primary, high-quality template that:
  - Follows Microsoft documentation standards
  - Includes proper frontmatter and metadata
  - Provides consistent formatting for operations and parameters
  - Contains placeholders for all required content sections
  - Supports both categorized and direct operations
- **new.template.md**: Legacy template with simpler structure (not recommended for new generation)

### Key Improvements in Enhanced System
- ✅ **Robust Command Extraction**: Fixed "Extracted 0 command infos" issue
- ✅ **Quality Content Generation**: Eliminated repetitive and generic content
- ✅ **Template Compliance**: Uses proper `generated-documentation.template.md` format
- ✅ **Content Validation**: Built-in quality checks prevent poor output
- ✅ **Enhanced Examples**: Context-aware, service-specific example prompts

## Workflow

The documentation generation process follows these steps:

1. **Setup**: Create timestamped directory structure and download source files
2. **Analysis**: Compare source files to identify new tools and operations
3. **Validation**: Ensure the generated tools.json is valid
4. **Summary**: Generate a new.md file summarizing all new tools and operations
5. **Documentation**: Generate documentation files for all new tools and operations
6. **Navigation**: Update TOC.yml, index.yml, and supported-azure-services.md
7. **Reporting**: Generate a final progress report

### Enhanced System Workflow
The enhanced system provides the same workflow but with:
- **Better Command Extraction**: Successfully extracts all commands from azmcp-commands.md
- **Quality Validation**: Built-in checks ensure high-quality output
- **Template Consistency**: All output follows the primary template format
- **Rich Content**: Context-aware descriptions and service-specific examples
- **Error Handling**: Comprehensive logging and error reporting

## Migration to Enhanced System

To use the enhanced system instead of the original:

1. **Replace generation commands**:
   - Use `node generate-all-docs-v2.js` instead of `node generate-all-docs.js`
   - Use `node generate-tool-doc-v2.js <tool-id>` instead of `node generate-tool-doc.js <tool-id>`
   - Use `node create-new-md-v2.js` instead of `node create-new-md.js`

2. **Same input files**: The enhanced system uses the same source files
3. **Better output**: Expect higher quality, validated documentation

## Error Handling

The scripts include error handling and will exit with non-zero status codes if critical errors occur. The run-all.sh script will warn about non-critical errors (like navigation file updates) but continue the process.
