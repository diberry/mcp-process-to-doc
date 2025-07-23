const fs = require('fs');
const path = require('path');

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
const validationLogPath = path.join(logsDir, 'validation.log');

// Initialize logger
const logStream = fs.createWriteStream(validationLogPath, { flags: 'w' });
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
}

log('Starting tools.json validation');

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

// Read azmcp-commands.md content
let azmcpCommands;
try {
    azmcpCommands = fs.readFileSync(azmcpCommandsPath, 'utf8');
    log('Successfully read azmcp-commands.md');
} catch (error) {
    log(`Error reading azmcp-commands.md: ${error.message}`);
    process.exit(1);
}

// Extract existing tools and operations from source tools.json
const sourceToolRoots = new Set();
const sourceToolOperations = new Map();

Object.entries(sourceTools).forEach(([toolKey, toolInfo]) => {
    const toolRoot = toolInfo.root;
    sourceToolRoots.add(toolRoot);
    
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

// Validation counters
let errors = 0;
let warnings = 0;

// Check for new tools and operations in generated tools.json
Object.entries(generatedTools).forEach(([toolKey, toolInfo]) => {
    const toolRoot = toolInfo.root;
    
    // Check if this is a new tool
    if (!sourceToolRoots.has(toolRoot)) {
        // Verify the tool is marked as new
        if (toolInfo.status !== "new") {
            log(`ERROR: New tool ${toolRoot} should have status="new"`);
            errors++;
        }
        
        // Verify the tool exists in azmcp-commands.md
        if (!azmcpCommands.includes(toolRoot)) {
            log(`ERROR: New tool ${toolRoot} not found in azmcp-commands.md`);
            errors++;
        }

        // Check operations for this new tool
        if (toolInfo.tools && Array.isArray(toolInfo.tools)) {
            toolInfo.tools.forEach(operation => {
                // Verify each operation is marked as new
                if (operation.status !== "new") {
                    log(`WARNING: Operation ${operation.name} for new tool ${toolRoot} should have status="new"`);
                    warnings++;
                }
                
                // Verify the operation exists in azmcp-commands.md
                const operationCommand = `${toolRoot} ${operation.name}`;
                if (!azmcpCommands.includes(operationCommand)) {
                    log(`WARNING: Operation command "${operationCommand}" not found in azmcp-commands.md`);
                    warnings++;
                }
            });
        }
    } else {
        // This is an existing tool, check for new operations
        if (toolInfo.tools && Array.isArray(toolInfo.tools)) {
            toolInfo.tools.forEach(operation => {
                const operationName = operation.name;
                const existingOps = sourceToolOperations.get(toolRoot) || new Set();
                
                if (!existingOps.has(operationName)) {
                    // Verify the operation is marked as new
                    if (operation.status !== "new") {
                        log(`ERROR: New operation ${operationName} for tool ${toolRoot} should have status="new"`);
                        errors++;
                    }
                    
                    // Verify the operation exists in azmcp-commands.md
                    const operationCommand = `${toolRoot} ${operationName}`;
                    if (!azmcpCommands.includes(operationCommand)) {
                        log(`WARNING: Operation command "${operationCommand}" not found in azmcp-commands.md`);
                        warnings++;
                    }
                }
            });
        }
    }
});

if (errors === 0 && warnings === 0) {
    log('Validation completed successfully with no issues');
} else {
    log(`Validation completed with ${errors} errors and ${warnings} warnings`);
}

logStream.end();
