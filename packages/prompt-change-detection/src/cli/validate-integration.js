#!/usr/bin/env node

/**
 * CLI script to validate integration
 */

const IntegrationValidator = require('../validation/integration-validator');

async function main() {
    try {
        console.log('✅ Azure MCP Documentation - Integration Validation');
        console.log('===============================================');
        
        const validator = new IntegrationValidator();
        const { report, reportPath } = await validator.validateIntegration();
        
        console.log('📊 Validation Summary:');
        console.log(`   Total tests: ${report.summary.total}`);
        console.log(`   ✅ Passed: ${report.summary.passed}`);
        console.log(`   ⚠️  Warnings: ${report.summary.warnings}`);
        console.log(`   ❌ Failed: ${report.summary.failed}`);
        console.log(`   Overall status: ${report.overallStatus}`);
        console.log('');
        
        // Show detailed results by category
        const categories = [
            { name: 'Configuration Alignment', key: 'configurationAlignment' },
            { name: 'Module Completeness', key: 'moduleCompleteness' },
            { name: 'Workflow Integrity', key: 'workflowIntegrity' },
            { name: 'Code Compliance', key: 'codeCompliance' }
        ];
        
        for (const category of categories) {
            const results = report.results[category.key];
            if (results.length === 0) continue;
            
            console.log(`📋 ${category.name}:`);
            for (const result of results) {
                const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
                console.log(`   ${icon} ${result.test}: ${result.message}`);
                if (result.details && result.status !== 'PASS') {
                    console.log(`      Details: ${JSON.stringify(result.details, null, 6)}`);
                }
            }
            console.log('');
        }
        
        console.log('🎯 Recommendations:');
        for (const rec of report.recommendations) {
            console.log(`   ${rec}`);
        }
        
        console.log('');
        console.log(`📄 Detailed report saved: ${reportPath}`);
        
        if (report.overallStatus === 'FAIL') {
            console.log('');
            console.log('❌ Validation failed - please address the issues above');
            process.exit(1);
        } else if (report.overallStatus === 'PASS_WITH_WARNINGS') {
            console.log('');
            console.log('⚠️  Validation passed with warnings - consider addressing them');
        } else {
            console.log('');
            console.log('🎉 All validations passed successfully!');
        }
        
    } catch (error) {
        console.error('❌ Error during validation:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
