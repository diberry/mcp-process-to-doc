const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Script to generate documentation files for new tools
 * 
 * This script:
 * 1. Reads the latest tools.json to identify new tools and operations
 * 2. Creates a documentation file for each new tool
 * 3. Creates partial documentation files for new operations in existing tools
 */

// Read the timestamp from current.log
let timestamp;
try {
  timestamp = fs.readFileSync('./generated/current.log', 'utf8').trim();
  console.log(`Using timestamp: ${timestamp}`);
} catch (error) {
  console.error('Error reading current.log. Please run the main process first.');
  process.exit(1);
}

// Define paths
const sourceTruthDir = path.join('./generated', timestamp, 'source-of-truth');
const contentDir = path.join('./generated', timestamp, 'content');
const logsDir = path.join('./generated', timestamp, 'logs');

// Create log file stream
const logFile = path.join(logsDir, 'generate-docs.log');
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Path to files
const generatedToolsJsonPath = path.join(contentDir, 'tools.json');
const azmcpCommandsPath = path.join(sourceTruthDir, 'azmcp-commands.md');

// Templates
const newToolTemplate = `---
title: TOOL_NAME - Azure MCP Server
description: Use the TOOL_NAME tools in Azure MCP Server to manage and interact with your Azure TOOL_NAME resources.
ms.service: azure-mcp-server
ms.topic: reference
ms.date: CURRENT_DATE
---

# Azure TOOL_NAME tools

This article describes the TOOL_NAME tools available in Azure MCP Server, including command syntax, parameters, examples, and other details.

TOOL_DESCRIPTION

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- Access to [Azure MCP Server](../get-started.md).

## Commands

TOOL_COMMANDS

## Related resources

- [Azure TOOL_NAME documentation](https://learn.microsoft.com/azure/TOOL_LEARN_PATH)
- [Azure MCP Server documentation](https://learn.microsoft.com/azure/mcp-server)
`;

const newOperationTemplate = `## OPERATION_NAME

\`\`\`
OPERATION_COMMAND
\`\`\`

OPERATION_DESCRIPTION

### Parameters

OPERATION_PARAMETERS

### Returns

OPERATION_RETURNS

### Example prompts

Example prompts include:

OPERATION_EXAMPLE_PROMPTS
`;

// Main function
async function main() {
  log('Starting documentation generation process');

  // Check if necessary files exist
  if (!fs.existsSync(generatedToolsJsonPath)) {
    log(`Error: tools.json not found at ${generatedToolsJsonPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(azmcpCommandsPath)) {
    log(`Error: azmcp-commands.md not found at ${azmcpCommandsPath}`);
    process.exit(1);
  }

  // Read files
  log('Reading tools.json and azmcp-commands.md...');
  const toolsJson = JSON.parse(fs.readFileSync(generatedToolsJsonPath, 'utf8'));
  const azmcpCommandsContent = fs.readFileSync(azmcpCommandsPath, 'utf8');

  // Extract commands and examples from azmcp-commands.md
  const commandsInfo = extractCommandsInfo(azmcpCommandsContent);
  log(`Extracted ${Object.keys(commandsInfo).length} command infos from azmcp-commands.md`);

  // Process tools.json
  if (toolsJson instanceof Object && !Array.isArray(toolsJson)) {
    // Handle object format
    log('Processing tools.json in object format...');
    
    for (const [toolKey, toolData] of Object.entries(toolsJson)) {
      const toolName = toolKey.replace(/^azure-/, '');
      const rootCommand = toolData.root || '';
      
      // Skip if this is not a new tool and has no new operations
      const hasNewOperations = toolData.tools && toolData.tools.some(op => op.status === 'new');
      
      if (toolData.status === 'new') {
        // Generate full documentation file for new tool
        log(`Generating documentation for new tool: ${toolName}`);
        await generateToolDocumentation(
          toolName, 
          rootCommand,
          toolData.tools || [],
          commandsInfo,
          false
        );
      } else if (hasNewOperations) {
        // Generate partial documentation file for new operations in existing tools
        log(`Generating partial documentation for new operations in: ${toolName}`);
        await generateToolDocumentation(
          toolName, 
          rootCommand,
          toolData.tools.filter(op => op.status === 'new') || [],
          commandsInfo,
          true
        );
      }
    }
  } else if (Array.isArray(toolsJson)) {
    // Handle array format
    log('Processing tools.json in array format...');
    
    for (const tool of toolsJson) {
      if (tool.status !== 'new' && (!tool.operations || !tool.operations.some(op => op.status === 'new'))) {
        continue; // Skip if not a new tool and has no new operations
      }
      
      const toolName = tool.id.replace(/^.*?azmcp[-_]?/, '');
      const rootCommand = `azmcp ${toolName}`;
      
      if (tool.status === 'new') {
        // Generate full documentation file for new tool
        log(`Generating documentation for new tool: ${toolName}`);
        await generateToolDocumentation(
          toolName, 
          rootCommand,
          tool.operations || [],
          commandsInfo,
          false
        );
      } else if (tool.operations && tool.operations.some(op => op.status === 'new')) {
        // Generate partial documentation file for new operations in existing tools
        log(`Generating partial documentation for new operations in: ${toolName}`);
        await generateToolDocumentation(
          toolName, 
          rootCommand,
          tool.operations.filter(op => op.status === 'new'),
          commandsInfo,
          true
        );
      }
    }
  } else {
    log('Error: Unexpected tools.json format');
    process.exit(1);
  }

  log('Documentation generation process completed');
  logStream.end();
}

// Helper function to extract commands and examples from azmcp-commands.md
function extractCommandsInfo(content) {
  const commandsInfo = {};
  
  // Find all command sections (usually H3 or H4 sections)
  const commandSectionRegex = /## (.*?)azmcp ([\w-]+)(?:\s+([\w-]+))?(?:\s+([\w-]+))?([\s\S]*?)(?=##|$)/g;
  
  let match;
  while ((match = commandSectionRegex.exec(content)) !== null) {
    const section = match[0];
    const toolName = match[2];
    
    // Extract all command descriptions within this section
    const commandRegex = /### `azmcp ([\w-]+)(?: ([\w-]+))?(?: ([\w-]+))?(?:\s+([\w-]+))?`\s*(.*?)(?=###|$)/g;
    
    let cmdMatch;
    while ((cmdMatch = commandRegex.exec(section)) !== null) {
      const command = cmdMatch[0].match(/`(.*?)`/)[1];
      const description = cmdMatch[5].trim();
      
      // Extract parameters
      const paramsRegex = /#### Parameters(?:\s*\n\s*)?```(?:\s*\n)([\s\S]*?)(?:\n\s*)?```/;
      const paramsMatch = cmdMatch[0].match(paramsRegex);
      const parameters = paramsMatch ? paramsMatch[1].trim() : '';
      
      // Extract examples
      const examplesRegex = /#### Examples:(?:\s*\n)([\s\S]*?)(?=###|$)/;
      const examplesMatch = cmdMatch[0].match(examplesRegex);
      const examples = examplesMatch ? examplesMatch[1].trim() : '';
      
      // Store command info
      commandsInfo[command] = {
        description,
        parameters,
        examples
      };
    }
  }
  
  return commandsInfo;
}

// Function to generate a documentation file for a tool
async function generateToolDocumentation(
  toolName,
  rootCommand,
  operations,
  commandsInfo,
  isPartial
) {
  // Format tool name for display
  const formattedToolName = toolName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  // Create file name
  const fileName = isPartial ? 
    `azure-${toolName.toLowerCase()}-partial.md` : 
    `azure-${toolName.toLowerCase()}.md`;
  const filePath = path.join(contentDir, fileName);
  
  if (isPartial) {
    // For partial files (new operations in existing tools), just generate the operations sections
    log(`Creating partial file with new operations for ${toolName}`);
    
    let partialContent = `# New operations for Azure ${formattedToolName}\n\n`;
    partialContent += `These operations should be added to the existing ${toolName}.md documentation file.\n\n`;
    
    // Add each operation
    for (const operation of operations) {
      const operationName = operation.name || operation.id;
      const operationCommand = `${rootCommand} ${operationName}`;
      
      // Get operation details from azmcp-commands.md if available
      const cmdInfo = commandsInfo[operationCommand] || {};
      
      partialContent += generateOperationSection(
        operationName,
        operationCommand,
        operation,
        cmdInfo
      );
    }
    
    // Write the partial file
    fs.writeFileSync(filePath, partialContent);
    log(`Wrote partial documentation file: ${filePath}`);
    
  } else {
    // For new tools, generate a complete documentation file
    log(`Creating complete documentation file for ${toolName}`);
    
    // Get current date in ISO format (YYYY-MM-DD)
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Create tool description
    const toolDescription = `Azure ${formattedToolName} allows you to interact with and manage your Azure ${formattedToolName} resources directly from Azure MCP Server.`;
    
    // Start with the template
    let content = newToolTemplate
      .replace(/TOOL_NAME/g, formattedToolName)
      .replace(/TOOL_DESCRIPTION/g, toolDescription)
      .replace(/CURRENT_DATE/g, currentDate)
      .replace(/TOOL_LEARN_PATH/g, toolName.toLowerCase());
    
    // Generate commands sections
    let commandsSection = '';
    
    // Add each operation
    for (const operation of operations) {
      const operationName = operation.name || operation.id;
      const operationCommand = `${rootCommand} ${operationName}`;
      
      // Get operation details from azmcp-commands.md if available
      const cmdInfo = commandsInfo[operationCommand] || {};
      
      commandsSection += generateOperationSection(
        operationName,
        operationCommand,
        operation,
        cmdInfo
      );
    }
    
    // Replace the commands section in the template
    content = content.replace(/TOOL_COMMANDS/g, commandsSection);
    
    // Write the file
    fs.writeFileSync(filePath, content);
    log(`Wrote documentation file: ${filePath}`);
  }
}

// Function to generate an operation section
function generateOperationSection(operationName, operationCommand, operation, cmdInfo) {
  // Format operation name for display
  const formattedOperationName = operationName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Get operation description
  const description = operation.description || 
                     cmdInfo.description || 
                     `Allows you to ${operationName.replace(/-/g, ' ')} resources.`;
  
  // Generate parameters section
  let parametersSection = '';
  if (operation.params && operation.params.length > 0) {
    operation.params.forEach(param => {
      const required = param.required ? ' (Required)' : '';
      parametersSection += `- \`${param.name}\`${required}: ${param.description}\n`;
    });
  } else if (cmdInfo.parameters) {
    // Use parameters from azmcp-commands.md
    parametersSection = cmdInfo.parameters.split('\n')
      .map(line => {
        // Convert parameter lines to markdown format
        const paramMatch = line.match(/--(\w[-\w]*)\s+(.*)/);
        if (paramMatch) {
          return `- \`${paramMatch[1]}\`: ${paramMatch[2]}`;
        }
        return line;
      })
      .join('\n');
  } else {
    parametersSection = '- No parameters required.';
  }
  
  // Generate returns section
  const returnsSection = `Returns information about the ${operationName.replace(/-/g, ' ')}.`;
  
  // Generate example prompts
  let examplePrompts = '';
  if (cmdInfo.examples) {
    // Use examples from azmcp-commands.md
    const examples = cmdInfo.examples.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => {
        // Format examples as bullet points
        return `- **${operationName.replace(/-/g, ' ')}**: "${line.trim()}"`;
      });
    
    examplePrompts = examples.join('\n');
  } else {
    // Generate generic examples
    examplePrompts = `- **List ${operationName.replace(/-/g, ' ')}**: "List all ${operationName.replace(/-/g, ' ')} in my subscription"`;
  }
  
  // Use the operation template
  return newOperationTemplate
    .replace(/OPERATION_NAME/g, formattedOperationName)
    .replace(/OPERATION_COMMAND/g, operationCommand)
    .replace(/OPERATION_DESCRIPTION/g, description)
    .replace(/OPERATION_PARAMETERS/g, parametersSection)
    .replace(/OPERATION_RETURNS/g, returnsSection)
    .replace(/OPERATION_EXAMPLE_PROMPTS/g, examplePrompts);
}

// Run the main function
main().catch(error => {
  log(`Unexpected error: ${error.message}`);
  logStream.end();
  process.exit(1);
});
