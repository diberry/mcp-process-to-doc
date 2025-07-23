/**
 * Test script for Consistency Checker
 */

const ConsistencyChecker = require('./quality-controllers/consistency-checker');

const sampleDocument = `# Azure Storage Tools for the Azure MCP Server

The Azure MCP Server provides comprehensive tools for managing Azure storage resources.

## Available Operations

### List Storage Accounts

**Command:** \`mcp_azure_mcp_ser_azmcp_storage_account_list\`

**Description:** List all Storage accounts in a subscription. This command retrieves all storage accounts available in the specified subscription.

**Example Prompts:**
- **Show all storage accounts**: "List all Storage accounts in my subscription"
- **Get storage inventory**: "What Storage accounts do I have?"
- **storage account overview**: "Show me all my Azure Storage resources"  // inconsistent capitalization
- **Find storage accounts**: "Which Storage accounts are available?"
- **Storage resource list**: "Display all storage accounts in the current subscription"  // inconsistent capitalization

**Parameters:**

| Parameter | Type | Required or optional | Description |
|-----------|------|---------------------|-------------|
| **subscription** | string | Required | The Azure subscription ID or name |
| **Subscription** | string | Required | Alternative subscription parameter |  // inconsistent naming

## Features

- Works with Azure Storage
- Supports Azure storage operations  // inconsistent capitalization
- Integrates with Microsoft Azure portal  // incorrect branding
`;

console.log('⚖️  Testing Consistency Checker...\n');

const checker = new ConsistencyChecker();

// Test single document consistency
console.log('Testing single document consistency...');
const result = checker.checkDocumentConsistency(sampleDocument, 'azure-storage.md');

console.log('Consistency Check Result:', result.isValid ? '✅ PASSED' : '❌ FAILED');
console.log('Total Issues:', result.summary.totalIssues);
console.log('Errors:', result.summary.errorCount);
console.log('Warnings:', result.summary.warningCount);

if (result.errors.length > 0) {
    console.log('\nConsistency Errors:');
    result.errors.forEach(error => console.log('  -', error));
}

if (result.warnings.length > 0) {
    console.log('\nConsistency Warnings:');
    result.warnings.forEach(warning => console.log('  -', warning));
}

// Test cross-document consistency
console.log('\n📚 Testing cross-document consistency...');

const documents = [
    { 
        id: 'azure-storage.md', 
        content: sampleDocument 
    },
    { 
        id: 'azure-cosmos.md', 
        content: `# Azure Cosmos DB Tools for the Azure MCP Server
        
The Azure MCP Server provides tools for managing Azure Cosmos DB resources.

**Example Prompts:**
- **Show all databases**: "List all Cosmos DB databases"
- **get database info**: "What databases do I have?"  // inconsistent capitalization
        `
    }
];

const crossResult = checker.checkCrossDocumentConsistency(documents);

console.log('Cross-Document Consistency:', crossResult.isValid ? '✅ PASSED' : '❌ FAILED');
console.log('Cross-Document Issues:', crossResult.summary.totalIssues);

if (crossResult.warnings.length > 0) {
    console.log('\nCross-Document Warnings:');
    crossResult.warnings.slice(0, 5).forEach(warning => console.log('  -', warning));
}

console.log('\n✅ Consistency Checker test completed!');
