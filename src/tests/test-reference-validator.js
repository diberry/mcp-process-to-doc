/**
 * Test script for Reference Validator
 */

const ReferenceValidator = require('./quality-controllers/reference-validator');

const sampleDocument = `# Azure Storage Tools for the Azure MCP Server

The Azure MCP Server provides comprehensive tools for managing Azure Storage resources.

## Available Operations

### List Storage Accounts

**Command:** \`mcp_azure_mcp_ser_azmcp_storage_account_list\`

**Description:** List all Storage accounts in a subscription.

**Example Prompts:**
- **Show all storage accounts**: "List all Storage accounts using \`mcp_azure_mcp_ser_azmcp_storage_account_list\`"
- **Reference unknown command**: "Use \`unknown_command\` to list accounts"

**Parameters:**

| Parameter | Type | Required or optional | Description |
|-----------|------|---------------------|-------------|
| **subscription** | string | Required | The Azure subscription ID |
| **unknown-param** | string | Optional | This parameter doesn't exist |

### Container Operations

Reference to [Available Operations](#available-operations) section.
Also see [Non-existent Section](#non-existent-section).

## Cross-References

- See [Other Document](./other-document.md)
- Link to [Azure Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/)
- Reference to \`mcp_azure_mcp_ser_azmcp_unknown_tool\`

## Code Examples

\`\`\`bash
# Using the storage account list command
mcp_azure_mcp_ser_azmcp_storage_account_list --subscription "my-sub"
mcp_azure_mcp_ser_azmcp_invalid_command --param value
\`\`\`

Inline code reference: \`account-name\` and \`invalid-parameter\`.
`;

console.log('🔍 Testing Reference Validator...\n');

const validator = new ReferenceValidator();

// Register some valid commands and parameters for testing
const metadata = {
    commands: [
        { name: 'mcp_azure_mcp_ser_azmcp_storage_account_list' },
        { name: 'mcp_azure_mcp_ser_azmcp_storage_blob_list' }
    ],
    parameters: [
        { command: 'mcp_azure_mcp_ser_azmcp_storage_account_list', name: 'subscription', type: 'string' },
        { command: 'mcp_azure_mcp_ser_azmcp_storage_account_list', name: 'tenant', type: 'string' },
        { command: 'mcp_azure_mcp_ser_azmcp_storage_blob_list', name: 'account-name', type: 'string' }
    ]
};

// Test single document reference validation
console.log('Testing single document reference validation...');
const result = validator.validateDocumentReferences(
    sampleDocument, 
    'azure-storage.md', 
    metadata
);

console.log('Reference Validation Result:', result.isValid ? '✅ PASSED' : '❌ FAILED');
console.log('Total Issues:', result.summary.totalIssues);
console.log('Errors:', result.summary.errorCount);
console.log('Warnings:', result.summary.warningCount);

if (result.errors.length > 0) {
    console.log('\nReference Errors:');
    result.errors.forEach(error => console.log('  -', error));
}

if (result.warnings.length > 0) {
    console.log('\nReference Warnings:');
    result.warnings.forEach(warning => console.log('  -', warning));
}

console.log('\nValidation Summary:');
console.log('  Validated Documents:', result.summary.validatedDocuments);
console.log('  Validated Commands:', result.summary.validatedCommands);
console.log('  Validated Parameters:', result.summary.validatedParameters);

// Test cross-document reference validation
console.log('\n📚 Testing cross-document reference validation...');

const documents = [
    { 
        id: 'azure-storage.md', 
        content: sampleDocument,
        metadata: metadata
    },
    { 
        id: 'azure-cosmos.md', 
        content: `# Azure Cosmos DB Tools
        
Reference to [Storage Tools](./azure-storage.md#list-storage-accounts).
Uses command \`mcp_azure_mcp_ser_azmcp_cosmos_account_list\`.
        `,
        metadata: {
            commands: [{ name: 'mcp_azure_mcp_ser_azmcp_cosmos_account_list' }]
        }
    }
];

const crossResult = validator.validateCrossDocumentReferences(documents);

console.log('Cross-Document References:', crossResult.isValid ? '✅ PASSED' : '❌ FAILED');
console.log('Cross-Document Issues:', crossResult.summary.totalIssues);

if (crossResult.errors.length > 0) {
    console.log('\nCross-Document Errors:');
    crossResult.errors.slice(0, 3).forEach(error => console.log('  -', error));
}

console.log('\n✅ Reference Validator test completed!');
