const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Script to update TOC.yml with new tools
 * 
 * This script:
 * 1. Reads the latest tools.json to identify new tools
 * 2. Reads the existing TOC.yml file from the source of truth
 * 3. Updates the TOC.yml file with entries for the new tools
 * 4. Writes the updated TOC.yml to the content directory
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
const logFile = path.join(logsDir, 'update-toc.log');
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Path to files
const generatedToolsJsonPath = path.join(contentDir, 'tools.json');
const sourceTocPath = path.join(sourceTruthDir, 'TOC.yml');
const updatedTocPath = path.join(contentDir, 'TOC.yml');

// Main function
async function main() {
  log('Starting TOC.yml update process');

  // Check if necessary files exist
  if (!fs.existsSync(generatedToolsJsonPath)) {
    log(`Error: tools.json not found at ${generatedToolsJsonPath}`);
    process.exit(1);
  }

  // Download the TOC.yml file if it doesn't exist
  if (!fs.existsSync(sourceTocPath)) {
    log('Downloading TOC.yml from GitHub...');
    try {
      await execPromise(
        `wget -q -O "${sourceTocPath}" https://raw.githubusercontent.com/MicrosoftDocs/azure-dev-docs/main/articles/azure-mcp-server/TOC.yml`
      );
      log('Successfully downloaded TOC.yml');
    } catch (error) {
      log(`Error downloading TOC.yml: ${error.message}`);
      process.exit(1);
    }
  }

  // Read files
  log('Reading tools.json and TOC.yml...');
  const toolsJson = JSON.parse(fs.readFileSync(generatedToolsJsonPath, 'utf8'));
  let tocContent = fs.readFileSync(sourceTocPath, 'utf8');

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
  
  log(`Found ${newTools.length} new tools to add to TOC.yml`);

  // Get the tools reference section
  const toolsReferenceRegexes = [
    /- name: Tools reference\s+items:([\s\S]*?)(?=\n- name:|$)/,
    /- name: Reference\s+items:([\s\S]*?)(?=\n- name:|$)/
  ];
  
  let toolsReferenceMatch = null;
  let toolsReferenceRegex = null;
  
  for (const regex of toolsReferenceRegexes) {
    toolsReferenceMatch = tocContent.match(regex);
    if (toolsReferenceMatch) {
      toolsReferenceRegex = regex;
      break;
    }
  }

  if (!toolsReferenceMatch) {
    // If we can't find an existing section, let's create one
    log('Warning: Could not find Tools reference section in TOC.yml. Creating a new one.');
    
    // Find the end of the TOC file
    const tocLines = tocContent.split('\n');
    const lastLine = tocLines[tocLines.length - 1];
    
    // Add our new reference section
    tocContent = tocContent + `\n- name: Tools reference\n  items:\n`;
    
    // Set up empty section for tools to be added
    toolsReferenceRegex = /- name: Tools reference\s+items:([\s\S]*?)(?=\n- name:|$)/;
    toolsReferenceMatch = tocContent.match(toolsReferenceRegex);
  }

  let toolsReferenceSection = toolsReferenceMatch[1];

  // Add new tools to the section
  newTools.forEach(tool => {
    const displayName = tool.displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    const fileName = tool.id.replace(/^.*?azmcp[-_]?/, '').toLowerCase();
    
    // Create TOC entry for the new tool
    const toolEntry = `
    - name: ${displayName}
      href: tools/${fileName}.md`;
    
    log(`Adding TOC entry for: ${displayName}`);
    toolsReferenceSection += toolEntry;
  });

  // Replace the tools reference section in the TOC content
  const sectionName = toolsReferenceMatch[0].startsWith('- name: Tools reference') ? 
    'Tools reference' : 'Reference';
    
  const updatedTocContent = tocContent.replace(
    toolsReferenceRegex, 
    `- name: ${sectionName}\n  items:${toolsReferenceSection}`
  );

  // Write updated TOC.yml
  fs.writeFileSync(updatedTocPath, updatedTocContent);
  log(`Updated TOC.yml written to ${updatedTocPath}`);

  log('TOC.yml update process completed');
  logStream.end();
}

// Run the main function
main().catch(error => {
  log(`Unexpected error: ${error.message}`);
  logStream.end();
  process.exit(1);
});
