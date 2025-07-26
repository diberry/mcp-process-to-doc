#!/usr/bin/env node

/**
 * CLI script to analyze prompt changes
 */

import { fileURLToPath } from 'url';
import * as path from 'path';
import ChangeDetector from './lib/change-detector.js';
import { promises as fs } from 'node:fs';

// Derive __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface SystemFile {
    path: string;
    access: 'read' | 'write';
}

export const systemFiles: Record<string, SystemFile> = {
    'prompt': {
        path: path.join(__dirname, '../../../create-docs.prompt.md'),
        access: 'read'
    },
    'workflow-config.json': {
        path: path.join(__dirname, '../../../generated/workflow/workflow-config.json'),
        access: 'write'
    },
    'change-history.json': {
        path: path.join(__dirname, '../../../generated/logs/change-history.json'),
        access: 'write'
    },
    'change-report': {
        path: path.join(__dirname, `../../../generated/reports/change-report-${Date.now()}.md`),
        access: 'write'
    }
};

async function ensurePathsExist(): Promise<void> {
    for (const key in systemFiles) {
        const filePath = systemFiles[key].path;
        const dirPath = path.dirname(filePath);

        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error(`Failed to create directory for ${key}:`, error);
        }
    }
}

console.log(`System files configured: ${JSON.stringify(systemFiles, null, 2)}`);

async function main(): Promise<void> {
    try {
        console.log('🔍 Azure MCP Documentation - Prompt Change Analysis');
        console.log('================================================');

        await ensurePathsExist();
        const detector = new ChangeDetector(systemFiles);
        const changeAnalysis = await detector.detectPromptChanges();

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

        const impactAnalysis = changeAnalysis.impactAnalysis;
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

    } catch (error:unknown) {
        console.error('❌ Error analyzing prompt changes:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
    main();
}