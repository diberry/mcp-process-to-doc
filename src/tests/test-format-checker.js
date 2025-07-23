/**
 * Test script for Format Checker
 */

const FormatChecker = require('./quality-controllers/format-checker');

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

**Parameters:**

| Parameter | Type | Required or optional | Description |
|-----------|------|---------------------|-------------|
| **subscription** | string | Required | The Azure subscription ID or name |

## See Also

- [Azure Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/)
`;

console.log('📋 Testing Format Checker...\n');

const checker = new FormatChecker();
const result = checker.checkDocumentFormat(sampleDocument);

console.log('Format Check Result:', result.isValid ? '✅ PASSED' : '❌ FAILED');
console.log('Template Compliance:', (result.compliance?.overallCompliance || 0) + '/100');
console.log('Errors:', result.errors.length);
console.log('Warnings:', result.warnings.length);

if (result.errors.length > 0) {
    console.log('\nFormat Errors:');
    result.errors.forEach(error => console.log('  -', error));
}

if (result.warnings.length > 0) {
    console.log('\nFormat Warnings:');
    result.warnings.forEach(warning => console.log('  -', warning));
}

if (result.compliance) {
    console.log('\nCompliance Breakdown:');
    console.log('  Front Matter:', result.compliance.frontMatter || 0);
    console.log('  Heading Structure:', result.compliance.headingStructure || 0);
    console.log('  Template Format:', result.compliance.templateFormat || 0);
    console.log('  Microsoft Standards:', result.compliance.microsoftStandards || 0);
}

console.log('\n✅ Format Checker test completed!');
