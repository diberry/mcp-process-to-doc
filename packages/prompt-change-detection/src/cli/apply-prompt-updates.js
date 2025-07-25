#!/usr/bin/env node

/**
 * CLI script to apply prompt updates
 */

const AutoUpdater = require('../automation/auto-updater');

async function main() {
    try {
        console.log('🔧 Azure MCP Documentation - Apply Prompt Updates');
        console.log('==============================================');
        
        const updater = new AutoUpdater();
        const result = await updater.applyPromptUpdates();
        
        if (!result.summary) {
            console.log('✅ No updates needed');
            console.log('   All configurations are up to date');
            process.exit(0);
        }
        
        const { summary } = result;
        
        console.log('📊 Update Summary:');
        console.log(`   Automatic updates applied: ${summary.automaticUpdates}`);
        console.log(`   Manual review required: ${summary.manualReviewRequired}`);
        console.log(`   Overall success: ${summary.success ? 'Yes' : 'No'}`);
        console.log('');
        
        if (summary.results.length > 0) {
            console.log('✅ Applied Updates:');
            for (const result of summary.results) {
                console.log(`   📁 ${result.type}`);
                for (const update of result.updates) {
                    console.log(`      • ${update}`);
                }
            }
            console.log('');
        }
        
        if (summary.manualReviewItems.length > 0) {
            console.log('⚠️  Manual Review Required:');
            for (const item of summary.manualReviewItems) {
                console.log(`   📁 ${item.type}`);
                console.log(`      ${item.description}`);
                if (item.error) {
                    console.log(`      Error: ${item.error}`);
                }
            }
            console.log('');
        }
        
        console.log('📋 Next Steps:');
        for (const step of summary.nextSteps) {
            console.log(`   ${step}`);
        }
        
        console.log('');
        console.log(`📄 Update summary saved: ${result.summaryPath}`);
        
        if (!summary.success) {
            console.log('');
            console.log('❌ Some updates failed - please review the logs');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Error applying prompt updates:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
