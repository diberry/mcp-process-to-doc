# Fixed: Prompt-Driven Data Extraction

## ✅ **Issue Resolved**

**Problem**: The JSON converter was using hardcoded values instead of extracting real data from the prompt file, which violated the principle that "the prompt is the source of truth for the system."

**Solution**: Implemented comprehensive markdown parsing to extract actual content from the prompt file.

## 🔄 **What Was Changed**

### 1. **Added Professional Markdown Parsing**
- **NPM Packages**: Using `markdown-it` and `gray-matter` for robust parsing
- **New Method**: `parseMarkdownSections()` - Intelligently parses markdown into logical sections
- **Section Detection**: Automatically identifies sections like `goal`, `sources_of_truth`, `templates`, etc.
- **Header Recognition**: Processes both `#` (H1) and `##` (H2) headers to organize content
- **Frontmatter Support**: Extracts metadata from YAML frontmatter

### 2. **Enhanced Data Extraction Methods**

#### **Before**: Hardcoded values
```javascript
extractSources(content) {
  return {
    engineering: {
      commands: {
        url: "https://github.com/Azure/azure-mcp-server/blob/main/src/commands.ts", // HARDCODED
        format: "TypeScript source code",
        purpose: "Command definitions and implementations"
      }
    }
  };
}
```

#### **After**: Real prompt parsing
```javascript
extractSources(sections) {
  // Extract URLs and descriptions from the actual sources section
  const lines = sourcesContent.split('\n');
  for (const line of lines) {
    const urlMatch = line.match(/(https?:\/\/[^\s\)]+)/);
    if (urlMatch) {
      const url = urlMatch[1];
      const description = line.replace(urlMatch[0], '').trim();
      // Use actual extracted data
    }
  }
}
```

### 3. **Real Data Now Extracted**

#### **Metadata**
- ✅ **Title**: Extracted from H1 headers in prompt
- ✅ **Description**: First meaningful paragraph from goal section
- ✅ **Version**: Searches for version patterns in content

#### **Goal Section**
- ✅ **Primary Goal**: Actual first paragraph from goal section
- ✅ **Repository URLs**: Real URLs extracted from prompt content
- ✅ **Workflow Steps**: Numbered and bulleted lists from prompt

#### **Sources**
- ✅ **Engineering URLs**: Actual GitHub URLs from prompt
- ✅ **Documentation References**: Real file and URL references
- ✅ **Article Lists**: Extracted from documentation sections

#### **Templates**
- ✅ **Template Files**: Real `.template.md` and `.md` file references
- ✅ **Usage Instructions**: Actual usage text from prompt

#### **File Generation**
- ✅ **Directory Structure**: Real directory paths from prompt
- ✅ **Workflow Steps**: Actual numbered steps from prompt
- ✅ **Output Files**: Real file names with actual purposes

#### **Content Rules**
- ✅ **Formatting Rules**: Real parameter formats, header styles
- ✅ **Path Formats**: Actual path patterns from prompt
- ✅ **Custom Fields**: Real `ms.service` field references

#### **Navigation Rules**
- ✅ **File References**: Real TOC.yml, index.yml mentions
- ✅ **Max Tools**: Actual numeric limits from prompt
- ✅ **Ordering Rules**: Real ordering instructions

## 📊 **Real Data Examples Extracted**

### **Before** (Hardcoded):
```json
{
  "description": "Automated documentation generation for Azure MCP tools and services",
  "repositories": {
    "engineering": {
      "url": "https://github.com/Azure/azure-mcp-server"
    }
  }
}
```

### **After** (Extracted from Prompt):
```json
{
  "description": "Discover new tools and operations in the engineering repository then go through the process of creating documentation for those tools in the MCP server documentation. The final result is a set of new documentation files that are ready for editorial review and publishing.",
  "repositories": {
    "engineering": {
      "url": "https://github.com/Azure/azure-mcp"
    },
    "documentation": {
      "repository": {
        "url": "https://github.com/MicrosoftDocs/azure-dev-docs"
      }
    }
  }
}
```

### **Real Files Discovered**:
- `new.template.md`
- `generated-documentation.template.md` 
- `partial.md`
- `supported-azure-services.md`
- `azmcp-commands.md`
- `app-configuration.md`
- `azure-cli-extension.md`
- `azure-native-isv.md`
- `global-parameters-list.md`

## 🎯 **Key Improvements**

### 1. **Prompt as Source of Truth**
- ✅ All data now extracted from actual prompt content
- ✅ Minimal fallback to defaults only when content is missing
- ✅ Real URLs, file names, and descriptions used

### 2. **Intelligent Parsing**
- ✅ Section-aware content extraction
- ✅ URL pattern recognition
- ✅ File reference detection
- ✅ Workflow step extraction

### 3. **Dynamic Content Discovery**
- ✅ Finds actual template files mentioned in prompt
- ✅ Discovers real output file names and purposes
- ✅ Extracts genuine formatting rules and requirements

### 4. **Validation Maintained**
- ✅ Still passes schema validation
- ✅ Preserves required field structure
- ✅ Falls back to sensible defaults only when needed

## ✨ **Result**

The JSON converter now truly reflects the prompt content as the authoritative source, extracting real data instead of using placeholder values. This ensures:

1. **Accuracy**: Generated JSON matches actual prompt requirements
2. **Reliability**: Changes to prompt automatically reflect in JSON output
3. **Maintainability**: No need to update hardcoded values when prompt changes
4. **Authenticity**: Real file names, URLs, and instructions from the source

The system now properly honors the principle that **"the prompt is the source of truth for the system"**.
