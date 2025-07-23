/**
 * Test script for Link Validator
 */

const LinkValidator = require('./quality-controllers/link-validator');

const sampleDocument = `# Azure Storage Tools for the Azure MCP Server

The Azure MCP Server provides comprehensive tools for managing Azure Storage resources.

## Documentation Links

- [Azure Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/)
- [Azure MCP Server Overview](./azure-mcp-tools.md)
- [Storage Account Management](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-overview)
- [Invalid Link](https://nonexistent-domain.example.com/invalid)
- [Broken Internal Link](./non-existent-file.md)

## Internal References

See the [Available Operations](#available-operations) section below.

### Available Operations

This section contains the main operations.

## External Resources

Visit [Microsoft Azure](https://azure.microsoft.com) for more information.
Also check [Azure Portal](https://portal.azure.com).
`;

console.log('🔗 Testing Link Validator...\n');

async function testLinkValidator() {
    const validator = new LinkValidator();
    
    try {
        const result = await validator.validateDocumentLinks(sampleDocument);
        
        console.log('Link Validation Result:', result.isValid ? '✅ PASSED' : '❌ FAILED');
        console.log('Total Links Checked:', result.summary.totalLinks);
        console.log('Valid Links:', result.summary.validLinks);
        console.log('Broken Links:', result.summary.brokenLinks);
        console.log('Warning Links:', result.summary.warningLinks);
        
        if (result.errors.length > 0) {
            console.log('\nBroken Links:');
            result.errors.forEach(error => console.log('  -', error));
        }
        
        if (result.warnings.length > 0) {
            console.log('\nLink Warnings:');
            result.warnings.forEach(warning => console.log('  -', warning));
        }
        
        console.log('\nLink Categories:');
        console.log('  External Links:', result.summary.externalLinks);
        console.log('  Internal Links:', result.summary.internalLinks);
        console.log('  Anchor Links:', result.summary.anchorLinks);
        
        console.log('\n✅ Link Validator test completed!');
        
    } catch (error) {
        console.error('❌ Link validation failed:', error.message);
    }
}

testLinkValidator();
