#!/usr/bin/env node

/**
 * CLI script to analyze prompt changes
 */

const ChangeDetector = require('../automation/change-detector');

async function main() {
    try {
        console.log('🔍 Azure MCP Documentation - Prompt Change Analysis');
        console.log('================================================');
        
        const detector = new ChangeDetector();
        const changeAnalysis = await detector.detectPromptChanges();
        
        if (!changeAnalysis.hasChanges) {
            console.log('✅ No changes detected in prompt file');
            console.log('   Configuration is up to date');
            process.exit(0);
        }
        
        console.log(`📝 Detected ${changeAnalysis.changes.length} changes:`);
        console.log('');
        
        for (const change of changeAnalysis.changes) {
            console.log(`🔧 ${change.type}`);
            console.log(`   ${change.description}`);
            console.log(`   Impact: ${change.impact} (${change.severity} severity)`);
            console.log(`   Details: ${change.details.length} specific changes`);
            console.log('');
        }
        
        console.log('📊 Impact Analysis:');
        console.log(`   Modules affected: ${changeAnalysis.impactAnalysis.impactedModules.length}`);
        console.log(`   Estimated effort: ${changeAnalysis.impactAnalysis.estimatedEffort}`);
        console.log(`   Auto-updatable: ${changeAnalysis.impactAnalysis.autoUpdateable ? 'Yes' : 'No'}`);
        console.log('');
        
        console.log('🎯 Recommendations:');
        for (const rec of changeAnalysis.impactAnalysis.updateActions) {
            console.log(`   • ${rec}`);
        }
        
        if (changeAnalysis.impactAnalysis.manualReviewRequired.length > 0) {
            console.log('');
            console.log('⚠️  Manual review required:');
            for (const item of changeAnalysis.impactAnalysis.manualReviewRequired) {
                console.log(`   • ${item}`);
            }
        }
        
        console.log('');
        console.log('📋 Next steps:');
        if (changeAnalysis.impactAnalysis.autoUpdateable) {
            console.log('   npm run apply-prompt-updates');
        } else {
            console.log('   npm run review-manual-updates');
        }
        console.log('   npm run validate-integration');
        
        // Generate detailed report
        const { reportPath } = await detector.generateChangeReport(changeAnalysis);
        console.log('');
        console.log(`📄 Detailed report saved: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Error analyzing prompt changes:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
