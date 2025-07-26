#!/usr/bin/env node

/**
 * CLI script to analyze prompt changes
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ChangeDetector from '../automation/change-detector.js';
import { ChangeDetectionResult, ChangeItem, ImpactAnalysis } from '../automation/change-detector.js';

// Derive __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
    try {
        console.log('🔍 Azure MCP Documentation - Prompt Change Analysis');
        console.log('================================================');
        
        const detector = new ChangeDetector();
        const changeAnalysis: ChangeDetectionResult = await detector.detectPromptChanges();
        
        if (!changeAnalysis.hasChanges) {
            console.log('✅ No changes detected in prompt file');
            console.log('   Configuration is up to date');
            process.exit(0);
        }
        
        console.log(`📝 Detected ${changeAnalysis.changes?.length || 0} changes:`);
        console.log('');
        
        for (const change of changeAnalysis.changes || []) {
            console.log(`🔧 ${change.type}`);
            console.log(`   ${change.description}`);
            console.log(`   Impact: ${change.impact} (${change.severity} severity)`);
            console.log(`   Details: ${change.details.length} specific changes`);
            console.log('');
        }
        
        const impactAnalysis: ImpactAnalysis | undefined = changeAnalysis.impactAnalysis;
        if (impactAnalysis) {
            console.log('📊 Impact Analysis:');
            console.log(`   Modules affected: ${impactAnalysis.impactedModules.length}`);
            console.log(`   Estimated effort: ${impactAnalysis.estimatedEffort}`);
            console.log(`   Auto-updatable: ${impactAnalysis.autoUpdateable ? 'Yes' : 'No'}`);
            console.log('');
            
            console.log('🎯 Recommendations:');
            for (const rec of impactAnalysis.updateActions) {
                console.log(`   • ${rec}`);
            }
            
            if (impactAnalysis.manualReviewRequired.length > 0) {
                console.log('');
                console.log('⚠️  Manual review required:');
                for (const item of impactAnalysis.manualReviewRequired) {
                    console.log(`   • ${item}`);
                }
            }
        }
        
        console.log('');
        console.log('📋 Next steps:');
        if (impactAnalysis?.autoUpdateable) {
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
        console.error('❌ Error analyzing prompt changes:', (error as Error).message);
        process.exit(1);
    }
}

// Replace `require.main === module` with ES module equivalent
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
    main();
}