const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Read the timestamp from current.log
const timestamp = fs.readFileSync('./generated/current.log', 'utf8').trim();
console.log(`Using timestamp: ${timestamp}`);

const sourceTruthDir = path.join('./generated', timestamp, 'source-of-truth');
const contentDir = path.join('./generated', timestamp, 'content');
const logsDir = path.join('./generated', timestamp, 'logs');

// Create directories if they don't exist
if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Path to source files
const azmcpCommandsPath = path.join(sourceTruthDir, 'azmcp-commands.md');
const sourceToolsJsonPath = path.join(sourceTruthDir, 'tools.json');
const logFile = path.join(logsDir, 'tools-analysis.log');

// Output paths
const outputToolsJsonPath = path.join(contentDir, 'tools.json');
const newToolsListPath = path.join(logsDir, 'new-tools.txt');
const newOperationsListPath = path.join(logsDir, 'new-operations.txt');

// Initialize logger
const logStream = fs.createWriteStream(logFile, { flags: 'w' });
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
}

log('Starting tools.json generation process');
log(`Reading from source files in: ${sourceTruthDir}`);
log(`Output will be saved to: ${contentDir}`);

// Read the existing tools.json
let existingTools;
try {
    const existingToolsJson = fs.readFileSync(sourceToolsJsonPath, 'utf8');
    existingTools = JSON.parse(existingToolsJson);
    log('Successfully read existing tools.json');
} catch (error) {
    log(`Error reading existing tools.json: ${error.message}`);
    process.exit(1);
}

// Extract existing tools and operations
const existingToolRoots = new Set(); // Set of tool roots like "azmcp appconfig"
const existingToolOperations = new Map(); // Map of tool root to Set of operations

Object.entries(existingTools).forEach(([toolKey, toolInfo]) => {
    const toolRoot = toolInfo.root;
    existingToolRoots.add(toolRoot);
    
    if (!existingToolOperations.has(toolRoot)) {
        existingToolOperations.set(toolRoot, new Set());
    }

    if (toolInfo.tools && Array.isArray(toolInfo.tools)) {
        toolInfo.tools.forEach(operation => {
            if (operation.name) {
                existingToolOperations.get(toolRoot).add(operation.name);
            }
        });
    }
});

log(`Extracted ${existingToolRoots.size} existing tool roots`);
existingToolRoots.forEach(root => {
    const operations = existingToolOperations.get(root) || new Set();
    log(`  ${root}: ${operations.size} operations`);
});

// Parse azmcp-commands.md to extract commands
async function extractCommandsFromFile(filePath) {
    const commands = new Map(); // Map of tool root to array of operations
    
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    // Regular expression to match azmcp commands
    const cmdRegex = /^\s*azmcp\s+([a-z0-9-]+)(\s+[a-z0-9-]+(?:\s+[a-z0-9-]+)*)/i;

    for await (const line of rl) {
        const match = line.match(cmdRegex);
        if (match) {
            const toolName = match[1];
            const toolRoot = `azmcp ${toolName}`;
            const operation = match[2].trim();
            
            if (!commands.has(toolRoot)) {
                commands.set(toolRoot, []);
            }
            commands.get(toolRoot).push(operation);
        }
    }
    
    return commands;
}

// Extract parameters from command line examples
function extractParameters(commandText) {
    const params = [];
    // Match --param <value> or --param-name <value>
    const paramRegex = /--([a-z0-9-]+)(?:\s+<([^>]+)>)?/g;
    let match;
    
    while ((match = paramRegex.exec(commandText)) !== null) {
        const paramName = match[1];
        const isRequired = commandText.includes(`--${paramName}`) && !commandText.includes(`[--${paramName}`);
        
        params.push({
            name: paramName,
            description: `The ${paramName.replace(/-/g, ' ')}`,
            required: isRequired
        });
    }
    
    return params;
}

// Function to format a description based on operation name
function formatDescription(operation) {
    // Convert operation like "account list" to "List accounts"
    const parts = operation.split(' ');
    if (parts.length >= 2) {
        // If last word is a verb (like list, get, create, etc.), move it to the front
        const lastWord = parts[parts.length - 1].toLowerCase();
        if (['list', 'get', 'show', 'create', 'update', 'delete', 'set', 'lock', 'unlock', 'peek', 'query', 'gethealth', 'describe'].includes(lastWord)) {
            const verb = lastWord.charAt(0).toUpperCase() + lastWord.slice(1);
            const subject = parts.slice(0, -1).join(' ');
            return `${verb} ${subject}.`;
        }
    }
    // Default format if we can't determine a better description
    return `Execute the ${operation} operation.`;
}

// Main function to generate new tools.json
async function generateToolsJson() {
    // Extract commands from azmcp-commands.md
    log('Extracting commands from azmcp-commands.md...');
    const extractedCommands = await extractCommandsFromFile(azmcpCommandsPath);
    log(`Extracted ${extractedCommands.size} tool roots from azmcp-commands.md`);
    
    // Create a deep copy of existing tools.json
    const newToolsJson = JSON.parse(JSON.stringify(existingTools));
    
    // Track new tools and operations
    const newTools = [];
    const newOperations = [];
    
    // Compare and merge
    for (const [toolRoot, operations] of extractedCommands.entries()) {
        // Check if this is a new tool
        const isNewTool = !existingToolRoots.has(toolRoot);
        
        if (isNewTool) {
            log(`Found new tool: ${toolRoot}`);
            newTools.push(toolRoot);
            
            // Determine toolKey from toolRoot (e.g., "azmcp appconfig" -> "azure-app-configuration")
            const toolName = toolRoot.replace('azmcp ', '');
            const toolKey = `azure-${toolName.replace(/ /g, '-')}`;
            
            // Create new tool entry
            newToolsJson[toolKey] = {
                root: toolRoot,
                tools: [],
                status: "new" // Mark the whole tool as new
            };
            
            // Process all operations for this new tool
            operations.forEach(operation => {
                log(`  Adding operation: ${operation} to new tool ${toolKey}`);
                newToolsJson[toolKey].tools.push({
                    name: operation,
                    description: formatDescription(operation),
                    params: extractParameters(`azmcp ${toolName} ${operation}`),
                    status: "new" // Mark each operation as new
                });
            });
        } else {
            // This is an existing tool, check for new operations
            const existingToolKey = Object.keys(existingTools).find(key => 
                existingTools[key].root === toolRoot
            );
            
            if (existingToolKey) {
                const existingOps = existingToolOperations.get(toolRoot);
                
                operations.forEach(operation => {
                    if (!existingOps.has(operation)) {
                        log(`Found new operation: ${operation} for tool ${toolRoot}`);
                        newOperations.push(`${toolRoot} ${operation}`);
                        
                        // Add new operation to existing tool
                        newToolsJson[existingToolKey].tools.push({
                            name: operation,
                            description: formatDescription(operation),
                            params: extractParameters(`${toolRoot} ${operation}`),
                            status: "new" // Mark as new
                        });
                    }
                });
            }
        }
    }
    
    // Write out the new tools.json
    fs.writeFileSync(outputToolsJsonPath, JSON.stringify(newToolsJson, null, 4), 'utf8');
    log(`Saved updated tools.json to ${outputToolsJsonPath}`);
    
    // Write lists of new tools and operations
    fs.writeFileSync(newToolsListPath, newTools.join('\n'), 'utf8');
    log(`Saved list of ${newTools.length} new tools to ${newToolsListPath}`);
    
    fs.writeFileSync(newOperationsListPath, newOperations.join('\n'), 'utf8');
    log(`Saved list of ${newOperations.length} new operations to ${newOperationsListPath}`);
    
    log('Process completed successfully');
    logStream.end();
    
    return {
        newTools,
        newOperations,
        updatedToolsJson: newToolsJson
    };
}

generateToolsJson().catch(error => {
    log(`Error generating tools.json: ${error.message}`);
    log(error.stack);
    logStream.end();
    process.exit(1);
});
