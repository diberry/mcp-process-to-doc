const fs = require('fs');
const path = require('path');

// Read the timestamp from current.log
const timestamp = fs.readFileSync('./generated/current.log', 'utf8').trim();
console.log(`Using timestamp: ${timestamp}`);

const contentDir = path.join('./generated', timestamp, 'content');
const logsDir = path.join('./generated', timestamp, 'logs');
const sourceDir = path.join('./generated', timestamp, 'source-of-truth');

// Read the template file
const templateContent = fs.readFileSync('./new.template.md', 'utf8');

// Read the new tools and operations
const newTools = fs.readFileSync(path.join(logsDir, 'new-tools.txt'), 'utf8')
                  .split('\n')
                  .filter(line => line.trim());

const newOperations = fs.readFileSync(path.join(logsDir, 'new-operations.txt'), 'utf8')
                      .split('\n')
                      .filter(line => line.trim());

// Read the tools.json file to get descriptions
const toolsJsonContent = fs.readFileSync(path.join(contentDir, 'tools.json'), 'utf8');
const toolsJson = JSON.parse(toolsJsonContent);

// Helper function to format command from toolRoot
function formatToolName(toolRoot) {
    return toolRoot.replace('azmcp ', '');
}

// Function to get service name from tool root
function getServiceName(toolRoot) {
    const toolName = formatToolName(toolRoot);
    // Convert tool name to service name based on existing pattern in tools.json
    switch (toolName) {
        case 'foundry':
            return 'Azure AI Foundry';
        case 'server':
            return 'Azure MCP Server';
        case 'aks':
            return 'Azure Kubernetes Service (AKS)';
        case 'loadtesting':
            return 'Azure Load Testing';
        case 'grafana':
            return 'Azure Managed Grafana';
        case 'marketplace':
            return 'Azure Marketplace';
        case 'bestpractices':
            return 'Azure MCP Best Practices';
        case 'tool':
            return 'Azure MCP Tools';
        case 'sql':
            return 'Azure SQL Database';
        case 'azureterraformbestpractices':
            return 'Azure Terraform Best Practices';
        case 'bicepschema':
            return 'Azure Bicep';
        default:
            return `Azure ${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`;
    }
}

// Function to get service name from existing tools.json
function getExistingServiceName(toolRoot) {
    for (const [key, value] of Object.entries(toolsJson)) {
        if (value.root === toolRoot) {
            const serviceName = key.replace('azure-', '').split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            return serviceName;
        }
    }
    return toolRoot;
}

// Function to get brief description for a command
function getCommandDescription(command) {
    // Extract the main command parts
    const parts = command.split(' ');
    const toolRoot = `${parts[0]} ${parts[1]}`;
    const operationPath = parts.slice(2).filter(p => !p.startsWith('--')).join(' ');
    
    // First try to find the description in the generated tools.json
    for (const [key, value] of Object.entries(toolsJson)) {
        if (value.root === toolRoot) {
            for (const tool of value.tools) {
                // Check if the operation name matches the beginning of the command
                if (operationPath.startsWith(tool.name)) {
                    return tool.description;
                }
            }
        }
    }
    
    // Fallback to a generic description
    const operation = operationPath.split(' ')[0];
    switch (operation.toLowerCase()) {
        case 'list':
            return 'List resources';
        case 'get':
        case 'show':
            return 'Get resource details';
        case 'create':
            return 'Create a new resource';
        case 'delete':
            return 'Delete a resource';
        case 'update':
            return 'Update a resource';
        default:
            return `Perform ${operation} operation`;
    }
}

// Create new.md content
let newMdContent = `# New Azure MCP Tools Summary\n\n`;

// New Tool Categories
newMdContent += `## 🆕 New Tool Categories\n\n`;
newMdContent += `| Service | Command | Description |\n`;
newMdContent += `|---------|---------|-------------|\n`;

// Group commands by service
const toolCommands = {};
newTools.forEach(toolRoot => {
    const serviceName = getServiceName(toolRoot);
    if (!toolCommands[serviceName]) {
        toolCommands[serviceName] = [];
    }
    
    // Find all commands for this tool root in the new operations list
    const commands = newOperations.filter(op => op.startsWith(toolRoot));
    
    if (commands.length === 0) {
        // Just add the tool itself if no specific operations
        toolCommands[serviceName].push({
            command: toolRoot,
            description: `${serviceName} operations`
        });
    } else {
        // Add each operation
        commands.forEach(cmd => {
            toolCommands[serviceName].push({
                command: cmd,
                description: getCommandDescription(cmd)
            });
        });
    }
});

// Add new tools to the markdown
Object.entries(toolCommands).sort((a, b) => a[0].localeCompare(b[0])).forEach(([service, commands]) => {
    let isFirstRow = true;
    commands.forEach(cmd => {
        if (isFirstRow) {
            newMdContent += `| **${service}** | \`${cmd.command}\` | ${cmd.description} |\n`;
            isFirstRow = false;
        } else {
            newMdContent += `| | \`${cmd.command}\` | ${cmd.description} |\n`;
        }
    });
});

// New Operations for Existing Tools
newMdContent += `\n## ➕ New Operations for Existing Tools\n\n`;
newMdContent += `| Service | Command | Description |\n`;
newMdContent += `|---------|---------|-------------|\n`;

// Find existing tools with new operations
const existingToolsWithNewOps = {};
newOperations.forEach(operation => {
    const parts = operation.split(' ');
    const toolRoot = `${parts[0]} ${parts[1]}`;
    
    // Skip if this is a new tool
    if (newTools.includes(toolRoot)) {
        return;
    }
    
    const serviceName = getExistingServiceName(toolRoot);
    if (!existingToolsWithNewOps[serviceName]) {
        existingToolsWithNewOps[serviceName] = [];
    }
    
    existingToolsWithNewOps[serviceName].push({
        command: operation,
        description: getCommandDescription(operation)
    });
});

// Add existing tools with new operations to the markdown
Object.entries(existingToolsWithNewOps).sort((a, b) => a[0].localeCompare(b[0])).forEach(([service, commands]) => {
    let isFirstRow = true;
    commands.forEach(cmd => {
        if (isFirstRow) {
            newMdContent += `| **${service}** | \`${cmd.command}\` | ${cmd.description} |\n`;
            isFirstRow = false;
        } else {
            newMdContent += `| | \`${cmd.command}\` | ${cmd.description} |\n`;
        }
    });
});

// Write the new.md file
fs.writeFileSync(path.join(contentDir, 'new.md'), newMdContent, 'utf8');
console.log(`Created new.md file at ${path.join(contentDir, 'new.md')}`);
