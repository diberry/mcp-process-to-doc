const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Script to update index.yml with new tools
 * 
 * This script:
 * 1. Reads the latest tools.json to identify new tools
 * 2. Reads the existing index.yml file from the source of truth
 * 3. Updates the index.yml file with entries for the new tools (up to 5 entries total)
 * 4. Writes the updated index.yml to the content directory
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
const logFile = path.join(logsDir, 'update-index.log');
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Path to files
const generatedToolsJsonPath = path.join(contentDir, 'tools.json');
const sourceIndexPath = path.join(sourceTruthDir, 'index.yml');
const updatedIndexPath = path.join(contentDir, 'index.yml');

// Main function
async function main() {
  log('Starting index.yml update process');

  // Check if necessary files exist
  if (!fs.existsSync(generatedToolsJsonPath)) {
    log(`Error: tools.json not found at ${generatedToolsJsonPath}`);
    process.exit(1);
  }

  // Download the index.yml file if it doesn't exist
  if (!fs.existsSync(sourceIndexPath)) {
    log('Downloading index.yml from GitHub...');
    try {
      await execPromise(
        `wget -q -O "${sourceIndexPath}" https://raw.githubusercontent.com/MicrosoftDocs/azure-dev-docs/main/articles/azure-mcp-server/index.yml`
      );
      log('Successfully downloaded index.yml');
    } catch (error) {
      log(`Error downloading index.yml: ${error.message}`);
      process.exit(1);
    }
  }

  // Read files
  log('Reading tools.json and index.yml...');
  const toolsJson = JSON.parse(fs.readFileSync(generatedToolsJsonPath, 'utf8'));
  let indexContent = fs.readFileSync(sourceIndexPath, 'utf8');

  // Extract all tools (both existing and new)
  log('Extracting tools from tools.json...');
  const allTools = [];
  
  // Process the tools.json format (it could be an array or object)
  if (Array.isArray(toolsJson)) {
    // Handle array format
    toolsJson.forEach(tool => {
      const displayName = tool.id.replace(/^.*?azmcp[-_]?/, '').replace(/-/g, ' ');
      const fileName = tool.id.replace(/^.*?azmcp[-_]?/, '').toLowerCase();
      
      allTools.push({
        id: tool.id,
        displayName: displayName,
        fileName: fileName,
        isNew: tool.status === 'new'
      });
    });
  } else {
    // Handle object format where each key is a tool ID
    for (const [key, value] of Object.entries(toolsJson)) {
      const displayName = key.replace(/^azure-/, '').replace(/-/g, ' ');
      const fileName = key.replace(/^azure-/, '').toLowerCase();
      
      allTools.push({
        id: key,
        displayName: displayName,
        fileName: fileName,
        isNew: value.status === 'new'
      });
    }
  }
  
  // Sort tools alphabetically by display name
  allTools.sort((a, b) => a.displayName.localeCompare(b.displayName));
  
  // Find the "Tools reference" section in the index.yml
  const toolsReferenceRegexes = [
    /### Tools reference([\s\S]*?)(?=###|$)/,
    /## Tools([\s\S]*?)(?=##|$)/,
    /## Reference([\s\S]*?)(?=##|$)/
  ];
  
  let toolsReferenceMatch = null;
  let toolsReferenceRegex = null;
  
  for (const regex of toolsReferenceRegexes) {
    toolsReferenceMatch = indexContent.match(regex);
    if (toolsReferenceMatch) {
      toolsReferenceRegex = regex;
      break;
    }
  }

  if (!toolsReferenceMatch) {
    // If we can't find an existing section, let's create one
    log('Warning: Could not find Tools reference section in index.yml. Creating a new one.');
    
    // Find the end of the file
    const lastIndex = indexContent.lastIndexOf('##');
    if (lastIndex !== -1) {
      // Insert after the last section
      indexContent = indexContent.substring(0, lastIndex) + 
                     "\n\n### Tools reference\n\n" +
                     indexContent.substring(lastIndex);
    } else {
      // Or just append to the end
      indexContent += "\n\n### Tools reference\n\n";
    }
    
    // Set up new section regex
    toolsReferenceRegex = /### Tools reference([\s\S]*?)(?=###|$)/;
    toolsReferenceMatch = indexContent.match(toolsReferenceRegex);
  }
  
  // Generate the tools reference section with up to 5 tools
  const maxToolsToShow = 4; // The maximum number of individual tools to show (plus "View all")
  
  // Get the first few tools to display individually
  const toolsToShow = allTools.slice(0, maxToolsToShow);
  
  // Build the updated tools reference section
  // Determine the section header format from the match
  let sectionHeader = '### Tools reference';
  
  if (toolsReferenceMatch[0].startsWith('## Tools')) {
    sectionHeader = '## Tools';
  } else if (toolsReferenceMatch[0].startsWith('## Reference')) {
    sectionHeader = '## Reference';
  }
  
  let updatedToolsSection = `${sectionHeader}\n\n`;
  
  // Add each tool
  toolsToShow.forEach(tool => {
    const displayName = tool.displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    updatedToolsSection += `- [${displayName}](./tools/${tool.fileName}.md)\n`;
  });
  
  // Add the "View all" link
  updatedToolsSection += `- [View all](./tools/index.yml)\n\n`;
  
  // Update the index content
  const updatedIndexContent = indexContent.replace(
    toolsReferenceRegex,
    updatedToolsSection
  );
  
  // Write the updated index.yml
  fs.writeFileSync(updatedIndexPath, updatedIndexContent);
  log(`Updated index.yml written to ${updatedIndexPath}`);
  
  log('index.yml update process completed');
  logStream.end();
}

// Run the main function
main().catch(error => {
  log(`Unexpected error: ${error.message}`);
  logStream.end();
  process.exit(1);
});
