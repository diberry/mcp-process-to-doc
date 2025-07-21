const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Script to update supported-azure-services.md with new tools
 * 
 * This script:
 * 1. Reads the latest tools.json to identify new tools
 * 2. Reads the existing supported-azure-services.md file from the source of truth
 * 3. Updates the file with entries for the new tools
 * 4. Writes the updated file to the content directory
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
const logFile = path.join(logsDir, 'update-supported-services.log');
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Path to files
const generatedToolsJsonPath = path.join(contentDir, 'tools.json');
const sourceSupportedServicesPath = path.join(sourceTruthDir, 'supported-azure-services.md');
const updatedSupportedServicesPath = path.join(contentDir, 'supported-azure-services.md');

// Main function
async function main() {
  log('Starting supported-azure-services.md update process');

  // Check if necessary files exist
  if (!fs.existsSync(generatedToolsJsonPath)) {
    log(`Error: tools.json not found at ${generatedToolsJsonPath}`);
    process.exit(1);
  }

  // Download the supported-azure-services.md file if it doesn't exist
  if (!fs.existsSync(sourceSupportedServicesPath)) {
    log('Downloading supported-azure-services.md from GitHub...');
    try {
      await execPromise(
        `wget -q -O "${sourceSupportedServicesPath}" https://raw.githubusercontent.com/MicrosoftDocs/azure-dev-docs/main/articles/azure-mcp-server/includes/tools/supported-azure-services.md`
      );
      log('Successfully downloaded supported-azure-services.md');
    } catch (error) {
      log(`Error downloading supported-azure-services.md: ${error.message}`);
      process.exit(1);
    }
  }

  // Read files
  log('Reading tools.json and supported-azure-services.md...');
  const toolsJson = JSON.parse(fs.readFileSync(generatedToolsJsonPath, 'utf8'));
  let supportedServicesContent = fs.readFileSync(sourceSupportedServicesPath, 'utf8');

  // Find new tools with status "new"
  log('Identifying new tools...');
  const newTools = [];
  
  // Process the tools.json format (it could be an array or object)
  if (Array.isArray(toolsJson)) {
    // Handle array format
    toolsJson.forEach(tool => {
      if (tool.status === 'new') {
        newTools.push({
          id: tool.id,
          displayName: tool.id.replace(/^.*?azmcp[-_]?/, '').replace(/-/g, ' ')
        });
      }
    });
  } else {
    // Handle object format where each key is a tool ID
    for (const [key, value] of Object.entries(toolsJson)) {
      if (value.status === 'new') {
        newTools.push({
          id: key,
          displayName: key.replace(/^azure-/, '').replace(/-/g, ' ')
        });
      }
    }
  }
  
  log(`Found ${newTools.length} new tools to add to supported-azure-services.md`);

  if (newTools.length === 0) {
    log('No new tools to add. Exiting.');
    logStream.end();
    return;
  }

  // Find the list of supported services in the file
  const listRegexes = [
    /## Supported Azure services\s+([\s\S]*?)(?=##|$)/,
    /## Azure services supported\s+([\s\S]*?)(?=##|$)/,
    /# Supported Azure services\s+([\s\S]*?)(?=#|$)/
  ];
  
  let listMatch = null;
  let listRegex = null;
  
  for (const regex of listRegexes) {
    listMatch = supportedServicesContent.match(regex);
    if (listMatch) {
      listRegex = regex;
      break;
    }
  }

  if (!listMatch) {
    // If we can't find an existing section, let's create one
    log('Warning: Could not find supported services list in the file. Creating a new one.');
    supportedServicesContent = '# Supported Azure services\n\n' + supportedServicesContent;
    
    // Match the new section
    listRegex = /# Supported Azure services\s+([\s\S]*?)(?=#|$)/;
    listMatch = supportedServicesContent.match(listRegex);
  }

  let servicesList = listMatch[1] || '\n';

  // Add each new tool to the list in alphabetical order
  newTools.forEach(tool => {
    const displayName = tool.displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    // Create a brief description based on the tool name
    const description = `Query and manage ${displayName} resources.`;
    
    // Create entry for the new tool
    const newEntry = `- **${displayName}**: ${description}\n`;
    
    log(`Adding entry for: ${displayName}`);
    servicesList += newEntry;
  });

  // Extract all entries, sort them alphabetically, and rebuild the list
  const entries = servicesList.split('\n')
    .filter(line => line.trim().startsWith('-'))
    .sort((a, b) => {
      // Extract service name between ** **
      const getServiceName = (line) => {
        const match = line.match(/\*\*(.*?)\*\*/);
        return match ? match[1].toLowerCase() : '';
      };
      return getServiceName(a).localeCompare(getServiceName(b));
    });

  // Determine the header format from the match
  let headerFormat = '## Supported Azure services';
  
  if (listMatch[0].startsWith('# Supported')) {
    headerFormat = '# Supported Azure services';
  } else if (listMatch[0].startsWith('## Azure services')) {
    headerFormat = '## Azure services supported';
  }
  
  // Rebuild the sorted list with proper spacing
  const sortedServicesList = `${headerFormat}\n\n` + entries.join('\n') + '\n\n';

  // Replace the services list in the content
  const updatedContent = supportedServicesContent.replace(
    listRegex, 
    sortedServicesList
  );

  // Write updated supported-azure-services.md
  fs.writeFileSync(updatedSupportedServicesPath, updatedContent);
  log(`Updated supported-azure-services.md written to ${updatedSupportedServicesPath}`);

  log('supported-azure-services.md update process completed');
  logStream.end();
}

// Run the main function
main().catch(error => {
  log(`Unexpected error: ${error.message}`);
  logStream.end();
  process.exit(1);
});
