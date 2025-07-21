const fs = require('fs');
const path = require('path');

// Read the timestamp from current.log
const timestamp = fs.readFileSync('./generated/current.log', 'utf8').trim();
console.log(`Using timestamp: ${timestamp}`);

const sourceTruthDir = path.join('./generated', timestamp, 'source-of-truth');
const contentDir = path.join('./generated', timestamp, 'content');
const logsDir = path.join('./generated', timestamp, 'logs');

// Path to source and output files
const generatedToolsJsonPath = path.join(contentDir, 'tools.json');
const newMdPath = path.join(contentDir, 'new.md');
const logFile = path.join(logsDir, 'new-md-generation.log');

// Initialize logger
const logStream = fs.createWriteStream(logFile, { flags: 'w' });
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
}

log('Starting new.md generation');

// Read the template file
const templatePath = path.join('./new.template.md');
let template;
try {
    template = fs.readFileSync(templatePath, 'utf8');
    log('Successfully read new.md template');
} catch (error) {
    log(`Error reading new.md template: ${error.message}`);
    process.exit(1);
}

// Read the generated tools.json
let generatedTools;
try {
    const generatedToolsJson = fs.readFileSync(generatedToolsJsonPath, 'utf8');
    generatedTools = JSON.parse(generatedToolsJson);
    log('Successfully read generated tools.json');
} catch (error) {
    log(`Error reading generated tools.json: ${error.message}`);
    process.exit(1);
}

// Collect new tools and operations
const newTools = [];
const newOperations = [];

Object.entries(generatedTools).forEach(([toolKey, toolInfo]) => {
    if (toolInfo.status === 'new') {
        newTools.push({
            service: toolKey.replace(/^azure-/, '').replace(/-/g, ' '),
            root: toolInfo.root,
            description: `Azure ${toolKey.replace(/^azure-/, '').replace(/-/g, ' ')} integration`
        });
    } else {
        // Check for new operations in existing tools
        if (toolInfo.tools && Array.isArray(toolInfo.tools)) {
            toolInfo.tools.forEach(operation => {
                if (operation.status === 'new') {
                    newOperations.push({
                        service: toolKey.replace(/^azure-/, '').replace(/-/g, ' '),
                        command: `${toolInfo.root} ${operation.name}`,
                        description: operation.description
                    });
                }
            });
        }
    }
});

// Generate the markdown content
let content = '# New Azure MCP Tools Summary\n\n';

// Add new tools section
content += '## 🆕 New Tool Categories\n\n';
content += '| Service | Command | Description |\n';
content += '|---------|---------|-------------|\n';

if (newTools.length > 0) {
    let currentService = '';
    
    newTools.forEach(tool => {
        if (tool.service !== currentService) {
            content += `| **${tool.service.charAt(0).toUpperCase() + tool.service.slice(1)}** | \`${tool.root}\` | ${tool.description} |\n`;
            currentService = tool.service;
        } else {
            content += `| | \`${tool.root}\` | ${tool.description} |\n`;
        }
    });
} else {
    content += '| No new tools found | | |\n';
}

// Add new operations section
content += '\n## ➕ New Operations for Existing Tools\n\n';
content += '| Service | Command | Description |\n';
content += '|---------|---------|-------------|\n';

if (newOperations.length > 0) {
    let currentService = '';
    
    newOperations.forEach(op => {
        if (op.service !== currentService) {
            content += `| **${op.service.charAt(0).toUpperCase() + op.service.slice(1)}** | \`${op.command}\` | ${op.description} |\n`;
            currentService = op.service;
        } else {
            content += `| | \`${op.command}\` | ${op.description} |\n`;
        }
    });
} else {
    content += '| No new operations found | | |\n';
}

// Write the new.md file
try {
    fs.writeFileSync(newMdPath, content, 'utf8');
    log(`Successfully wrote new.md to ${newMdPath}`);
} catch (error) {
    log(`Error writing new.md: ${error.message}`);
    process.exit(1);
}

log('new.md generation completed successfully');
logStream.end();
