const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
let useExistingTimestamp = false;
let specifiedTimestamp = '';

// Process arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--use-existing' && args[i+1]) {
        useExistingTimestamp = true;
        specifiedTimestamp = args[i+1];
        i++; // Skip the next arg since we've used it
    }
}

// Create or use existing timestamp
let timestamp;
if (useExistingTimestamp) {
    timestamp = specifiedTimestamp;
    console.log(`Using existing timestamp: ${timestamp}`);
} else {
    timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19) + 'Z';
    console.log(`Using new timestamp: ${timestamp}`);
}

// Define directories
const baseDir = path.resolve('.');
const generatedDir = path.join(baseDir, 'generated');
const timestampDir = path.join(generatedDir, timestamp);
const contentDir = path.join(timestampDir, 'content');
const sourceTruthDir = path.join(timestampDir, 'source-of-truth');
const logsDir = path.join(timestampDir, 'logs');
const logFile = path.join(logsDir, 'azmcp.log');

// Initialize logger
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
}

// Create the directory structure
async function createDirectories() {
    log('Creating directory structure...');
    
    try {
        if (!fs.existsSync(generatedDir)) {
            fs.mkdirSync(generatedDir);
        }
        
        if (!fs.existsSync(timestampDir)) {
            fs.mkdirSync(timestampDir);
        }
        
        if (!fs.existsSync(contentDir)) {
            fs.mkdirSync(contentDir);
        }
        
        if (!fs.existsSync(sourceTruthDir)) {
            fs.mkdirSync(sourceTruthDir);
        }
        
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
        }
        
        // Update current.log with the timestamp
        fs.writeFileSync(path.join(generatedDir, 'current.log'), timestamp, 'utf8');
        log('Directory structure created successfully');
    } catch (error) {
        log(`Error creating directory structure: ${error.message}`);
        throw error;
    }
}

// Download source files
async function downloadSourceFiles() {
    log('Downloading source files...');
    
    try {
        // Download azmcp-commands.md
        const cmdResult = await execPromise(
            `wget -q -O "${sourceTruthDir}/azmcp-commands.md" https://raw.githubusercontent.com/Azure/azure-mcp/main/docs/azmcp-commands.md`
        );
        log('Successfully downloaded azmcp-commands.md');
        
        // Download tools.json
        const toolsResult = await execPromise(
            `wget -q -O "${sourceTruthDir}/tools.json" https://raw.githubusercontent.com/MicrosoftDocs/azure-dev-docs/main/articles/azure-mcp-server/tools/tools.json`
        );
        log('Successfully downloaded tools.json');
    } catch (error) {
        log(`Error downloading source files: ${error.message}`);
        throw error;
    }
}

// Generate tools.json
async function generateToolsJson() {
    log('Generating tools.json...');
    
    try {
        const result = await execPromise(`node "${baseDir}/src/generate-tools-json.js"`);
        log('Successfully generated tools.json');
        return result;
    } catch (error) {
        log(`Error generating tools.json: ${error.message}`);
        throw error;
    }
}

// Test generated tools.json
async function testToolsJson() {
    log('Testing generated tools.json...');
    
    try {
        const result = await execPromise(`node "${baseDir}/src/test-tools-json.js"`);
        log('Successfully tested tools.json');
        return result;
    } catch (error) {
        log(`Error testing tools.json: ${error.message}`);
        throw error;
    }
}

// Generate new.md
async function generateNewMd() {
    log('Generating new.md...');
    
    try {
        const result = await execPromise(`node "${baseDir}/src/create-new-md.js"`);
        log('Successfully generated new.md');
        return result;
    } catch (error) {
        log(`Error generating new.md: ${error.message}`);
        throw error;
    }
}

// Main process
async function main() {
    try {
        log('Starting MCP documentation generation process');
        
        // Step 1: Create directories and update current.log
        await createDirectories();
        
        // Step 2: Download source files
        await downloadSourceFiles();
        
        // Step 3: Generate tools.json
        const toolsGenOutput = await generateToolsJson();
        log(toolsGenOutput.stdout);
        
        // Step 4: Test tools.json
        const testOutput = await testToolsJson();
        log(testOutput.stdout);
        
        // Step 5: Generate new.md
        const newMdOutput = await generateNewMd();
        log(newMdOutput.stdout);
        
        log('Documentation generation process completed successfully');
        log(`Output files are available in: ${contentDir}`);
        log(`Log files are available in: ${logsDir}`);
        
    } catch (error) {
        log(`Error in documentation generation process: ${error.message}`);
        log('Process failed');
        process.exit(1);
    } finally {
        logStream.end();
    }
}

// Run the main process
main();
