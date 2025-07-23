/**
 * Test script for Content Validator
 */

const ContentValidator = require('./quality-controllers/content-validator');

const sampleDocument = `---
title: Azure Storage Tools for the Azure MCP Server
description: Comprehensive guide to Azure Storage tools
ms.date: 2025-01-17
ms.topic: reference
ms.service: azure-storage
---

# Azure Storage Tools for the Azure MCP Server

The Azure MCP Server provides comprehensive tools for managing Azure Storage resources.

## Available Operations

### List Storage Accounts

**Command:** \`mcp_azure_mcp_ser_azmcp_storage_account_list\`

**Description:** List all Storage accounts in a subscription.

**Example Prompts:**
- **Show all storage accounts**: "List all Storage accounts in my subscription"
- **Get storage inventory**: "What Storage accounts do I have?"
- **Storage account overview**: "Show me all my Azure Storage resources"

**Parameters:**

| Parameter | Type | Required or optional | Description |
|-----------|------|---------------------|-------------|
| **subscription** | string | Required | The Azure subscription ID or name |
`;

console.log('🔍 Testing Content Validator...\n');

const validator = new ContentValidator();
const result = validator.validateDocumentation(sampleDocument, {
    commands: [{ name: 'mcp_azure_mcp_ser_azmcp_storage_account_list' }]
});

console.log('Validation Result:', result.isValid ? '✅ PASSED' : '❌ FAILED');
console.log('Quality Score:', (result.qualityMetrics?.overallScore || 0) + '/100');
console.log('Errors:', result.errors.length);
console.log('Warnings:', result.warnings.length);

if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(error => console.log('  -', error));
}

if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach(warning => console.log('  -', warning));
}

if (result.qualityMetrics) {
    console.log('\nQuality Metrics:');
    console.log('  Structure Score:', result.qualityMetrics.structureScore || 0);
    console.log('  Content Score:', result.qualityMetrics.contentScore || 0);
    console.log('  Examples Score:', result.qualityMetrics.examplesScore || 0);
    console.log('  Metadata Score:', result.qualityMetrics.metadataScore || 0);
}

console.log('\n✅ Content Validator test completed!');
