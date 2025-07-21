const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Read the timestamp from current.log
const timestamp = fs.readFileSync('./generated/current.log', 'utf8').trim();
console.log(`Using timestamp: ${timestamp}`);

const sourceTruthDir = path.join('./generated', timestamp, 'source-of-truth');
const contentDir = path.join('./generated', timestamp, 'content');
const logsDir = path.join('./generated', timestamp, 'logs');

// Path to source files
const azmcpCommandsPath = path.join(sourceTruthDir, 'azmcp-commands.md');
const sourceToolsJsonPath = path.join(sourceTruthDir, 'tools.json');
const generatedToolsJsonPath = path.join(contentDir, 'tools.json');
const testLogFile = path.join(logsDir, 'tools-validation.log');

// Initialize logger
const logStream = fs.createWriteStream(testLogFile, { flags: 'w' });
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
}

log('Starting tools.json validation process');

// Read the source tools.json
let sourceTools;
try {
    const sourceToolsJson = fs.readFileSync(sourceToolsJsonPath, 'utf8');
    sourceTools = JSON.parse(sourceToolsJson);
    log('Successfully read source tools.json');
} catch (error) {
    log(`Error reading source tools.json: ${error.message}`);
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

// Extract source tools and operations
const sourceToolRoots = new Set(); // Set of tool roots like "azmcp appconfig"
const sourceToolOperations = new Map(); // Map of tool root to Set of operations
const sourceToolKeys = new Set(); // Set of tool keys like "azure-app-configuration"

Object.entries(sourceTools).forEach(([toolKey, toolInfo]) => {
    const toolRoot = toolInfo.root;
    sourceToolRoots.add(toolRoot);
    sourceToolKeys.add(toolKey);
    
    if (!sourceToolOperations.has(toolRoot)) {
        sourceToolOperations.set(toolRoot, new Set());
    }

    if (toolInfo.tools && Array.isArray(toolInfo.tools)) {
        toolInfo.tools.forEach(operation => {
            if (operation.name) {
                sourceToolOperations.get(toolRoot).add(operation.name);
            }
        });
    }
});

// Extract commands from azmcp-commands.md
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

// Function to find new tool keys in generated tools.json
function findNewToolKeys() {
    const newToolKeys = [];
    
    Object.keys(generatedTools).forEach(toolKey => {
        if (!sourceToolKeys.has(toolKey)) {
            newToolKeys.push(toolKey);
        }
    });
    
    return newToolKeys;
}

// Function to find new operations in existing tools
function findNewOperations() {
    const newOperations = [];
    
    Object.entries(generatedTools).forEach(([toolKey, toolInfo]) => {
        // Skip if this is a new tool (already validated separately)
        if (!sourceToolKeys.has(toolKey)) {
            return;
        }
        
        const toolRoot = toolInfo.root;
        const sourceOperations = sourceToolOperations.get(toolRoot) || new Set();
        
        if (toolInfo.tools && Array.isArray(toolInfo.tools)) {
            toolInfo.tools.forEach(operation => {
                if (operation.name && !sourceOperations.has(operation.name)) {
                    newOperations.push({
                        toolKey,
                        toolRoot,
                        operation: operation.name,
                        hasStatusNew: operation.status === 'new'
                    });
                }
            });
        }
    });
    
    return newOperations;
}

async function validateToolsJson() {
    let errors = 0;
    let warnings = 0;
    
    // Extract commands from azmcp-commands.md
    log('Extracting commands from azmcp-commands.md for validation...');
    const extractedCommands = await extractCommandsFromFile(azmcpCommandsPath);
    log(`Extracted ${extractedCommands.size} tool roots from azmcp-commands.md`);
    
    // Find new tools
    const newToolKeys = findNewToolKeys();
    log(`Found ${newToolKeys.length} new tools in generated tools.json`);
    
    // Validate new tools
    for (const toolKey of newToolKeys) {
        const toolInfo = generatedTools[toolKey];
        const toolRoot = toolInfo.root;
        
        // Check if tool root exists in azmcp-commands.md
        if (!extractedCommands.has(toolRoot)) {
            log(`ERROR: New tool root "${toolRoot}" not found in azmcp-commands.md`);
            errors++;
            continue;
        }
        
        log(`Validating new tool: ${toolKey} (${toolRoot})`);
        
        // Check operations
        if (toolInfo.tools && Array.isArray(toolInfo.tools)) {
            for (const operation of toolInfo.tools) {
                const operationName = operation.name;
                const extractedOps = extractedCommands.get(toolRoot) || [];
                
                if (!extractedOps.includes(operationName)) {
                    log(`ERROR: Operation "${operationName}" of new tool "${toolRoot}" not found in azmcp-commands.md`);
                    errors++;
                }
                
                // Check if new tool operations have status="new"
                if (!operation.status || operation.status !== 'new') {
                    log(`WARNING: New tool operation "${toolRoot} ${operationName}" should have status="new"`);
                    warnings++;
                }
            }
        } else {
            log(`WARNING: New tool "${toolKey}" has no operations defined`);
            warnings++;
        }
    }
    
    // Find and validate new operations in existing tools
    const newOperations = findNewOperations();
    log(`Found ${newOperations.length} new operations in existing tools`);
    
    for (const newOp of newOperations) {
        // Check if operation exists in azmcp-commands.md
        const extractedOps = extractedCommands.get(newOp.toolRoot) || [];
        
        if (!extractedOps.includes(newOp.operation)) {
            log(`ERROR: New operation "${newOp.toolRoot} ${newOp.operation}" not found in azmcp-commands.md`);
            errors++;
        }
        
        // Check if operation is marked with status="new"
        if (!newOp.hasStatusNew) {
            log(`WARNING: New operation "${newOp.toolRoot} ${newOp.operation}" should have status="new"`);
            warnings++;
        }
    }
    
    // Validate existing operations are not marked as new
    Object.entries(generatedTools).forEach(([toolKey, toolInfo]) => {
        if (sourceToolKeys.has(toolKey)) {
            const toolRoot = toolInfo.root;
            const sourceOperations = sourceToolOperations.get(toolRoot) || new Set();
            
            if (toolInfo.tools && Array.isArray(toolInfo.tools)) {
                toolInfo.tools.forEach(operation => {
                    if (operation.name && sourceOperations.has(operation.name) && operation.status === 'new') {
                        log(`ERROR: Existing operation "${toolRoot} ${operation.name}" is incorrectly marked as new`);
                        errors++;
                    }
                });
            }
        }
    });
    
    // Final validation result
    if (errors === 0 && warnings === 0) {
        log('VALIDATION PASSED: All checks completed successfully');
    } else {
        log(`VALIDATION COMPLETED: Found ${errors} errors and ${warnings} warnings`);
    }
    
    logStream.end();
    return { errors, warnings };
}

validateToolsJson().then(({ errors, warnings }) => {
    console.log(`Validation completed with ${errors} errors and ${warnings} warnings`);
    if (errors > 0) {
        process.exit(1);
    }
}).catch(error => {
    log(`Error during validation: ${error.message}`);
    log(error.stack);
    logStream.end();
    process.exit(1);
});
