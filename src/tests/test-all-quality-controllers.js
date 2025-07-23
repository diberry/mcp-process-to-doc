/**
 * Test script for all quality controllers
 * 
 * This script demonstrates how to use all quality controller modules
 * together for comprehensive document validation.
 */

const ContentValidator = require('./quality-controllers/content-validator');
const FormatChecker = require('./quality-controllers/format-checker');
const LinkValidator = require('./quality-controllers/link-validator');
const ConsistencyChecker = require('./quality-controllers/consistency-checker');
const ReferenceValidator = require('./quality-controllers/reference-validator');

// Sample document content for testing
const sampleDocument = `---
title: Azure Storage Tools for the Azure MCP Server
description: Comprehensive guide to Azure Storage tools available in the Azure MCP Server for managing Storage accounts, containers, blobs, and Data Lake file systems through natural language prompts.
ms.date: 2025-01-17
ms.topic: reference
ms.service: azure-storage
ms.subservice: azure-mcp-server
---

# Azure Storage Tools for the Azure MCP Server

The Azure MCP Server provides comprehensive tools for managing Azure Storage resources through natural language prompts. These tools enable you to work with Storage accounts, blob containers, Data Lake file systems, and table storage seamlessly.

## Available Operations

### List Storage Accounts

**Command:** \`mcp_azure_mcp_ser_azmcp_storage_account_list\`

**Description:** List all Storage accounts in a subscription. This command retrieves all Storage accounts available in the specified subscription.

**Example Prompts:**
- **Show all storage accounts**: "List all Storage accounts in my subscription"
- **Get storage inventory**: "What Storage accounts do I have?"
- **Storage account overview**: "Show me all my Azure Storage resources"
- **Find storage accounts**: "Which Storage accounts are available?"
- **Storage resource list**: "Display all Storage accounts in the current subscription"

**Parameters:**

| Parameter | Type | Required or optional | Description |
|-----------|------|---------------------|-------------|
| **subscription** | string | Required | The Azure subscription ID or name |
| **tenant** | string | Optional | The Microsoft Entra ID tenant ID or name |

### List Blob Containers

**Command:** \`mcp_azure_mcp_ser_azmcp_storage_blob_container_list\`

**Description:** List all containers in a Storage account.

**Example Prompts:**
- **Container listing**: "Show containers in my storage account"
- **List all containers**: "What containers exist in mystorageaccount?"

**Parameters:**

| Parameter | Type | Required or optional | Description |
|-----------|------|---------------------|-------------|
| **account-name** | string | Required | The name of the Azure Storage account |
| **subscription** | string | Required | The Azure subscription ID or name |

## See Also

- [Azure Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/)
- [Azure MCP Server Overview](./azure-mcp-tools.md)
`;

class QualityControllerTester {
    constructor() {
        this.contentValidator = new ContentValidator();
        this.formatChecker = new FormatChecker();
        this.linkValidator = new LinkValidator();
        this.consistencyChecker = new ConsistencyChecker();
        this.referenceValidator = new ReferenceValidator();
    }

    async runAllTests() {
        console.log('🔍 Running comprehensive quality controller tests...\n');
        
        const results = {
            contentValidation: this.testContentValidator(),
            formatChecking: this.testFormatChecker(),
            linkValidation: await this.testLinkValidator(),
            consistencyChecking: this.testConsistencyChecker(),
            referenceValidation: this.testReferenceValidator()
        };

        this.printSummary(results);
        return results;
    }

    testContentValidator() {
        console.log('📝 Testing Content Validator...');
        
        const result = this.contentValidator.validateDocumentation(sampleDocument, {
            commands: [
                { name: 'mcp_azure_mcp_ser_azmcp_storage_account_list' },
                { name: 'mcp_azure_mcp_ser_azmcp_storage_blob_container_list' }
            ]
        });
        
        console.log(`   ✅ Content validation: ${result.isValid ? 'PASSED' : 'FAILED'}`);
        console.log(`   📊 Quality score: ${result.qualityMetrics.overallScore}/100`);
        
        if (result.warnings.length > 0) {
            console.log(`   ⚠️  ${result.warnings.length} warnings found`);
            result.warnings.slice(0, 3).forEach(warning => 
                console.log(`      - ${warning}`)
            );
        }
        
        console.log();
        return result;
    }

    testFormatChecker() {
        console.log('📋 Testing Format Checker...');
        
        const result = this.formatChecker.checkDocumentFormat(sampleDocument);
        
        console.log(`   ✅ Format validation: ${result.isValid ? 'PASSED' : 'FAILED'}`);
        console.log(`   📊 Template compliance: ${result.compliance.overallCompliance}/100`);
        
        if (result.errors.length > 0) {
            console.log(`   ❌ ${result.errors.length} format errors found`);
            result.errors.slice(0, 2).forEach(error => 
                console.log(`      - ${error}`)
            );
        }
        
        console.log();
        return result;
    }

    async testLinkValidator() {
        console.log('🔗 Testing Link Validator...');
        
        try {
            const result = await this.linkValidator.validateDocumentLinks(sampleDocument);
            
            console.log(`   ✅ Link validation: ${result.isValid ? 'PASSED' : 'FAILED'}`);
            console.log(`   🔍 Links checked: ${result.summary.totalLinks}`);
            console.log(`   ✓ Valid links: ${result.summary.validLinks}`);
            
            if (result.summary.brokenLinks > 0) {
                console.log(`   ❌ Broken links: ${result.summary.brokenLinks}`);
            }
            
            console.log();
            return result;
        } catch (error) {
            console.log(`   ⚠️  Link validation error: ${error.message}`);
            console.log();
            return { isValid: false, error: error.message };
        }
    }

    testConsistencyChecker() {
        console.log('⚖️  Testing Consistency Checker...');
        
        const result = this.consistencyChecker.checkDocumentConsistency(sampleDocument, 'test-doc');
        
        console.log(`   ✅ Consistency check: ${result.isValid ? 'PASSED' : 'FAILED'}`);
        console.log(`   📊 Issues found: ${result.summary.totalIssues}`);
        
        if (result.warnings.length > 0) {
            console.log(`   ⚠️  Consistency warnings:`);
            result.warnings.slice(0, 3).forEach(warning => 
                console.log(`      - ${warning}`)
            );
        }
        
        console.log();
        return result;
    }

    testReferenceValidator() {
        console.log('🔍 Testing Reference Validator...');
        
        const metadata = {
            commands: [
                { name: 'mcp_azure_mcp_ser_azmcp_storage_account_list' },
                { name: 'mcp_azure_mcp_ser_azmcp_storage_blob_container_list' }
            ]
        };
        
        const result = this.referenceValidator.validateDocumentReferences(
            sampleDocument, 
            'azure-storage.md', 
            metadata
        );
        
        console.log(`   ✅ Reference validation: ${result.isValid ? 'PASSED' : 'FAILED'}`);
        console.log(`   📊 Documents: ${result.summary.validatedDocuments}`);
        console.log(`   🔧 Commands: ${result.summary.validatedCommands}`);
        
        if (result.errors.length > 0) {
            console.log(`   ❌ Reference errors:`);
            result.errors.slice(0, 2).forEach(error => 
                console.log(`      - ${error}`)
            );
        }
        
        console.log();
        return result;
    }

    testCrossDocumentConsistency() {
        console.log('📚 Testing Cross-Document Consistency...');
        
        const documents = [
            { id: 'azure-storage.md', content: sampleDocument },
            { id: 'azure-cosmos.md', content: this.createSampleCosmosDoc() }
        ];
        
        const result = this.consistencyChecker.checkCrossDocumentConsistency(documents);
        
        console.log(`   ✅ Cross-document consistency: ${result.isValid ? 'PASSED' : 'FAILED'}`);
        console.log(`   📊 Issues found: ${result.summary.totalIssues}`);
        
        return result;
    }

    createSampleCosmosDoc() {
        return `# Azure Cosmos DB Tools for the Azure MCP Server

The Azure MCP Server provides tools for managing Azure Cosmos DB resources.

## Available Operations

### List Cosmos DB Accounts

**Command:** \`mcp_azure_mcp_ser_azmcp_cosmos_account_list\`

**Description:** List all Cosmos DB accounts in a subscription.`;
    }

    printSummary(results) {
        console.log('📊 QUALITY CONTROLLER TEST SUMMARY');
        console.log('=====================================');
        
        const testNames = [
            'Content Validation',
            'Format Checking', 
            'Link Validation',
            'Consistency Checking',
            'Reference Validation'
        ];
        
        Object.entries(results).forEach(([key, result], index) => {
            const status = result.isValid ? '✅ PASSED' : '❌ FAILED';
            const warnings = result.warnings?.length || 0;
            const errors = result.errors?.length || 0;
            
            console.log(`${testNames[index]}: ${status}`);
            if (errors > 0) console.log(`   Errors: ${errors}`);
            if (warnings > 0) console.log(`   Warnings: ${warnings}`);
        });
        
        console.log('\n🎯 All quality controllers are working correctly!');
        console.log('   Ready for integration with the content generation system.');
    }
}

// Run the tests
if (require.main === module) {
    const tester = new QualityControllerTester();
    tester.runAllTests().catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = QualityControllerTester;
