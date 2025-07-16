#!/bin/bash

echo "Testing configuration refactoring..."

# Test that configuration can be imported and used
node -e "
const { getRunConfiguration } = require('./dist/config.js');

console.log('Testing configuration loading...');

try {
  // Mock environment variables for testing
  process.env.AZURE_AI_PROJECTS_ENDPOINT = 'https://test.azure.com';
  process.env.MODEL_DEPLOYMENT_NAME = 'test-model';
  process.env.AZURE_AI_AGENT = 'test-agent-id';
  
  const config = getRunConfiguration();
  
  console.log('✓ Configuration loaded successfully');
  console.log('✓ Azure config:', config.azure.projectEndpoint);
  console.log('✓ Model deployment:', config.azure.modelDeploymentName);
  console.log('✓ Agent ID:', config.azure.agentId);
  console.log('✓ Repo root path:', config.paths.repoRootPath);
  console.log('✓ Generated base dir:', config.paths.generatedBaseDir);
  console.log('✓ Timestamp:', config.timestamp);
  console.log('✓ Source of truth dir:', config.runPaths.sourceOfTruthDir);
  console.log('✓ Content dir:', config.runPaths.contentDir);
  console.log('✓ Agent notes dir:', config.runPaths.agentNotesDir);
  console.log('✓ Commands file path:', config.runFilePaths.commandsFilePath);
  console.log('✓ Tools JSON file path:', config.runFilePaths.toolsJsonFilePath);
  
  console.log('\\n✅ Configuration refactoring successful!');
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}
"
