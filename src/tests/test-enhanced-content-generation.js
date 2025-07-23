/**
 * Test script for enhanced content generation modules
 * 
 * This script tests the new modular content builders to ensure they
 * generate high-quality documentation content.
 */

const EnhancedContentGenerator = require('./enhanced-content-generator');
const ExamplePromptBuilder = require('./content-builders/example-prompt-builder');
const ParameterTableBuilder = require('./content-builders/parameter-table-builder');
const OperationBuilder = require('./content-builders/operation-builder');

// Test data
const testToolData = {
    id: 'azure-storage',
    root: 'azmcp storage'
};

const testCommandsInfo = {
    operations: [
        {
            name: 'list-containers',
            operation: 'list',
            tool: 'storage',
            category: 'blob',
            fullCommand: 'azmcp storage blob container list --subscription <subscription> --account-name <account-name>',
            parameters: [
                { name: 'subscription', required: true, description: 'Azure subscription ID' },
                { name: 'account-name', required: true, description: 'Storage account name' },
                { name: 'auth-method', required: false, description: 'Authentication method' }
            ]
        }
    ]
};

function testExamplePromptBuilder() {
    console.log('=== Testing Example Prompt Builder ===');
    const builder = new ExamplePromptBuilder();
    
    const operationData = {
        name: 'list-containers',
        operation: 'list'
    };
    
    const examples = builder.generateExamplePrompts(operationData, 'storage');
    
    console.log('Generated Example Prompts:');
    examples.forEach((example, index) => {
        console.log(`${index + 1}. ${example}`);
    });
    console.log();
}

function testParameterTableBuilder() {
    console.log('=== Testing Parameter Table Builder ===');
    const builder = new ParameterTableBuilder();
    
    const parameters = [
        { name: 'subscription', required: true },
        { name: 'account-name', required: true },
        { name: 'auth-method', required: false }
    ];
    
    const table = builder.generateParameterTable(parameters, 'Storage');
    
    console.log('Generated Parameter Table:');
    console.log(table);
    console.log();
}

function testOperationBuilder() {
    console.log('=== Testing Operation Builder ===');
    const builder = new OperationBuilder();
    
    const operationData = {
        name: 'list-containers',
        operation: 'list',
        tool: 'storage',
        fullCommand: 'azmcp storage blob container list --subscription <subscription> --account-name <account-name>',
        parameters: [
            { name: 'subscription', required: true },
            { name: 'account-name', required: true },
            { name: 'auth-method', required: false }
        ]
    };
    
    const section = builder.buildOperationSection(operationData, 'Storage');
    
    console.log('Generated Operation Section:');
    console.log(section);
    console.log();
}

function testEnhancedContentGenerator() {
    console.log('=== Testing Enhanced Content Generator ===');
    const generator = new EnhancedContentGenerator();
    
    const documentation = generator.generateToolDocumentation(testToolData, testCommandsInfo);
    
    console.log('Generated Documentation Structure:');
    console.log('Metadata:', JSON.stringify(documentation.metadata, null, 2));
    console.log();
    console.log('Introduction:', JSON.stringify(documentation.introduction, null, 2));
    console.log();
    console.log('Operations Count:', documentation.operations.length);
    console.log('First Operation Preview:');
    console.log(documentation.operations[0].substring(0, 500) + '...');
    console.log();
    console.log('Related Content:', JSON.stringify(documentation.relatedContent, null, 2));
    console.log();
}

function runAllTests() {
    console.log('🚀 Starting Enhanced Content Generation Tests\n');
    
    try {
        testExamplePromptBuilder();
        testParameterTableBuilder();
        testOperationBuilder();
        testEnhancedContentGenerator();
        
        console.log('✅ All tests completed successfully!');
        console.log('\n🎯 Next Steps:');
        console.log('1. Review the generated content quality');
        console.log('2. Compare with existing content-generator.js output');
        console.log('3. Update main generation scripts to use EnhancedContentGenerator');
        console.log('4. Test with real tools.json and azmcp-commands.md data');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testExamplePromptBuilder,
    testParameterTableBuilder,
    testOperationBuilder,
    testEnhancedContentGenerator,
    runAllTests
};
