const fs = require('fs');
const path = require('path');

// Check for command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: node generate-tool-doc.js <tool-id>');
    process.exit(1);
}

const toolId = args[0];

// Read the timestamp from current.log
const timestamp = fs.readFileSync('./generated/current.log', 'utf8').trim();
console.log(`Using timestamp: ${timestamp}`);

const contentDir = path.join('./generated', timestamp, 'content');
const sourceTruthDir = path.join('./generated', timestamp, 'source-of-truth');
const logsDir = path.join('./generated', timestamp, 'logs');

// Path to files
const generatedToolsJsonPath = path.join(contentDir, 'tools.json');
const templatePath = path.join('.', 'new.template.md');
const docOutputPath = path.join(contentDir, `azure-${toolId}.md`);
const logFile = path.join(logsDir, `generate-${toolId}-doc.log`);

// Create log stream
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
}

// Check if files exist
if (!fs.existsSync(generatedToolsJsonPath)) {
    log(`Error: tools.json not found at ${generatedToolsJsonPath}`);
    process.exit(1);
}

if (!fs.existsSync(templatePath)) {
    log(`Error: template not found at ${templatePath}`);
    process.exit(1);
}

// Read files
const toolsData = JSON.parse(fs.readFileSync(generatedToolsJsonPath, 'utf8'));
const templateContent = fs.readFileSync(templatePath, 'utf8');

// Find the specified tool
// In the new format, each key in the object is a tool ID
const toolKey = `azure-${toolId}`;
const tool = toolsData[toolKey];

// If not found directly, try to find by matching the root command
let foundTool = null;
if (!tool) {
    for (const [key, value] of Object.entries(toolsData)) {
        if (value.root && value.root.includes(toolId)) {
            foundTool = {
                id: key,
                root: value.root,
                operations: value.tools || []
            };
            break;
        }
    }
}

const actualTool = tool || foundTool;

if (!actualTool) {
    log(`Error: Tool with ID '${toolId}' not found in tools.json`);
    process.exit(1);
}

log(`Found tool: ${actualTool.id || toolKey}`);
log(`Root command: ${actualTool.root}`);

// Generate doc content from template
let docContent = templateContent;

// Replace placeholders with actual content
const toolDisplayName = toolId.charAt(0).toUpperCase() + toolId.slice(1);
docContent = docContent.replace(/\{\{TOOL_NAME\}\}/g, toolDisplayName);
docContent = docContent.replace(/\{\{TOOL_ID\}\}/g, actualTool.root || `azmcp ${toolId}`);

// Generate operations content
let operationsContent = '';
if (actualTool.operations && actualTool.operations.length > 0) {
    actualTool.operations.forEach(operation => {
        // Use name for new format, id for old format
        const opName = operation.name || operation.id;
        const opDescription = operation.description || `This operation allows you to ${opName.replace(/-/g, ' ')} in Azure ${toolDisplayName}.`;
        
        operationsContent += `\n## ${opName}\n\n`;
        operationsContent += `\`${actualTool.root} ${opName}\`\n\n`;
        operationsContent += `${opDescription}\n\n`;
        operationsContent += `### Parameters\n\n`;
        
        if (operation.params && operation.params.length > 0) {
            operation.params.forEach(param => {
                const required = param.required ? ' (Required)' : '';
                operationsContent += `- \`${param.name}\`: ${param.description}${required}\n`;
            });
        } else {
            operationsContent += `- \`parameter_name\`: Description of parameter.\n`;
        }
        
        operationsContent += `\n### Returns\n\n`;
        operationsContent += `Returns information about the ${opName.replace(/-/g, ' ')}.\n\n`;
        operationsContent += `### Example\n\n`;
        operationsContent += "```json\n{\n  \"example\": \"value\"\n}\n```\n\n";
    });
}

docContent = docContent.replace(/\{\{OPERATIONS\}\}/g, operationsContent);

// Write to file
fs.writeFileSync(docOutputPath, docContent);
log(`Generated documentation for tool '${toolId}' at ${docOutputPath}`);

logStream.end();
