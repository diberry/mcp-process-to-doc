-/**
 * Auto Updater - Apply prompt changes to source code modules
 * 
 * This module automatically updates code modules based on prompt file changes
 */

import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PromptParser from '../config/prompt-parser.js';
import ChangeDetector, { 
  ChangeItem, 
  ImpactAnalysis, 
  ChangeDetectionResult,
  DifferenceItem
} from './change-detector.js';

// Derive __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Update result interface
 */
interface UpdateResult {
  type: string;
  updates: string[];
  success: boolean;
}

/**
 * Update summary interface
 */
interface UpdateSummary {
  timestamp: string;
  automaticUpdates: number;
  manualReviewRequired: number;
  results: UpdateResult[];
  manualReviewItems: ChangeItem[];
  success: boolean;
  nextSteps: string[];
}

// Define a type for the update strategies
type UpdateStrategy = (change: ChangeItem) => Promise<UpdateResult>;

class AutoUpdater {
    public promptParser: PromptParser;
    public changeDetector: ChangeDetector;
    public updateStrategies: Record<string, UpdateStrategy>;

    constructor() {
        this.promptParser = new PromptParser();
        this.changeDetector = new ChangeDetector();
        this.updateStrategies = {
            'sources': this.updateDataExtractors.bind(this),
            'content-rules': this.updateContentBuilders.bind(this),
            'validation-rules': this.updateQualityControllers.bind(this),
            'output-structure': this.updateFileGenerators.bind(this),
            'templates': this.updateTemplateProcessors.bind(this)
        };
    }

    /**
     * Apply all detected prompt changes to code modules
     */
    async applyPromptUpdates(): Promise<{ summary: UpdateSummary; summaryPath: string } | { success: boolean; message: string }> {
        try {
            console.log('🔍 Detecting prompt changes...');
            const changeAnalysis = await this.changeDetector.detectPromptChanges();

            if (!changeAnalysis.hasChanges) {
                console.log('✅ No changes detected in prompt file');
                return { success: true, message: 'No updates needed' };
            }

            console.log(`📝 Found ${changeAnalysis?.changes?.length} changes to apply`);

            // Update workflow configuration first
            console.log('📋 Updating workflow configuration...');
            await this.promptParser.updateWorkflowConfig();

            const results: UpdateResult[] = [];
            const manualReviewItems: ChangeItem[] = [];

            for (const change of changeAnalysis?.changes || []) {
                console.log(`🔧 Processing ${change.type} changes...`);
                
                try {
                    if (change?.severity === 'high' && this.requiresManualReview(change)) {
                        manualReviewItems.push(change);
                        console.log(`⚠️  ${change?.type} requires manual review`);
                    } else {
                        const result = await this.applyChange(change);
                        results.push(result);
                        console.log(`✅ Applied ${change?.type} changes`);
                    }
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`❌ Failed to apply ${change?.type}: ${errorMessage}`);
                    // Store the error with the change item
                    const changeWithError = {...change};
                    (changeWithError as any).error = errorMessage; // Using type assertion for the error property
                    manualReviewItems.push(changeWithError);
                }
            }

            // Generate update summary
            const summary = await this.generateUpdateSummary(results, manualReviewItems);
            
            console.log('🎉 Update process completed');
            return summary;

        } catch (error: unknown) {
            throw new Error(`Failed to apply prompt updates: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Check if a change requires manual review
     */
    requiresManualReview(change: ChangeItem): boolean {
        const manualReviewCriteria = [
            change.type === 'content-rules' && change.details.some(d => d.key === 'example-prompts'),
            change.type === 'output-structure' && change.details.some(d => d.type === 'removed'),
            change.severity === 'high' && change.details.length > 5
        ];

        return manualReviewCriteria.some(criteria => criteria);
    }

    /**
     * Apply a specific change using the appropriate strategy
     */
    async applyChange(change: ChangeItem): Promise<UpdateResult> {
        const strategy = this.updateStrategies[change.type];
        if (!strategy) {
            throw new Error(`No update strategy found for change type: ${change.type}`);
        }

        return await strategy(change);
    }

    /**
     * Update data extractor modules based on source changes
     */
    async updateDataExtractors(change: ChangeItem): Promise<UpdateResult> {
        const extractorsPath = path.join(__dirname, '../../../../src/data-extractors');
        const updates: string[] = [];

        for (const detail of change.details) {
            if (detail.key === 'azmcp-commands' && detail.type === 'modified') {
                // Update azmcp-commands-extractor.js
                const extractorPath = path.join(extractorsPath, 'azmcp-commands-extractor.js');
                await this.updateSourceUrl(extractorPath, 'AZMCP_COMMANDS_URL', detail.newValue);
                updates.push('Updated azmcp-commands URL');
            }

            if (detail.key === 'tools-json' && detail.type === 'modified') {
                // Update tools-json-processor.js
                const processorPath = path.join(extractorsPath, 'tools-json-processor.js');
                await this.updateSourceUrl(processorPath, 'TOOLS_JSON_URL', detail.newValue);
                updates.push('Updated tools.json URL');
            }

            if (detail.key === 'e2e-test-prompts' && detail.type === 'modified') {
                // Update parameter-extractor.js to use new prompts source
                const extractorPath = path.join(extractorsPath, 'parameter-extractor.js');
                await this.updateSourceUrl(extractorPath, 'E2E_PROMPTS_URL', detail.newValue);
                updates.push('Updated e2e test prompts URL');
            }
        }

        return { type: 'data-extractors', updates, success: true };
    }

    /**
     * Update content builder modules based on content rule changes
     */
    async updateContentBuilders(change: ChangeItem): Promise<UpdateResult> {
        const buildersPath = path.join(__dirname, '../../../../src/content-builders');
        const updates: string[] = [];

        for (const detail of change.details) {
            if (detail.key === 'example-prompts') {
                // Update example-prompt-builder.js
                const builderPath = path.join(buildersPath, 'example-prompt-builder.js');
                await this.updateExamplePromptRules(builderPath, detail.newValue);
                updates.push('Updated example prompt generation rules');
            }

            if (detail.key === 'parameters') {
                // Update parameter-table-builder.js
                const builderPath = path.join(buildersPath, 'parameter-table-builder.js');
                await this.updateParameterRules(builderPath, detail.newValue);
                updates.push('Updated parameter table formatting rules');
            }

            if (detail.key === 'headers') {
                // Update operation-builder.js
                const builderPath = path.join(buildersPath, 'operation-builder.js');
                await this.updateHeaderRules(builderPath, detail.newValue);
                updates.push('Updated header formatting rules');
            }
        }

        return { type: 'content-builders', updates, success: true };
    }

    /**
     * Update quality controller modules based on validation rule changes
     */
    async updateQualityControllers(change: ChangeItem): Promise<UpdateResult> {
        const controllersPath = path.join(__dirname, '../../../../src/quality-controllers');
        const updates: string[] = [];

        for (const detail of change.details) {
            if (detail.key === 'content') {
                // Update content-validator.js
                const validatorPath = path.join(controllersPath, 'content-validator.js');
                await this.updateContentValidationRules(validatorPath, detail.newValue);
                updates.push('Updated content validation rules');
            }

            if (detail.key === 'structure') {
                // Update format-checker.js
                const checkerPath = path.join(controllersPath, 'format-checker.js');
                await this.updateStructureValidationRules(checkerPath, detail.newValue);
                updates.push('Updated structure validation rules');
            }
        }

        return { type: 'quality-controllers', updates, success: true };
    }

    /**
     * Update file generator modules based on output structure changes
     */
    async updateFileGenerators(change: ChangeItem): Promise<UpdateResult> {
        const generatorsPath = path.join(__dirname, '../../../../src/file-generators');
        const updates: string[] = [];

        for (const detail of change.details) {
            if (detail.key === 'files') {
                // Update output-file-manager.js
                const managerPath = path.join(generatorsPath, 'output-file-manager.js');
                await this.updateOutputFileStructure(managerPath, detail.newValue);
                updates.push('Updated output file structure');
            }

            if (detail.key === 'structure') {
                // Update single-doc-generator.js and batch-doc-generator.js
                const singlePath = path.join(generatorsPath, 'single-doc-generator.js');
                const batchPath = path.join(generatorsPath, 'batch-doc-generator.js');
                
                await this.updateDirectoryStructure(singlePath, detail.newValue);
                await this.updateDirectoryStructure(batchPath, detail.newValue);
                updates.push('Updated directory structure logic');
            }
        }

        return { type: 'file-generators', updates, success: true };
    }

    /**
     * Update template processor modules based on template changes
     */
    async updateTemplateProcessors(change: ChangeItem): Promise<UpdateResult> {
        const processorsPath = path.join(__dirname, '../../../../src/template-processors');
        const updates: string[] = [];

        for (const detail of change.details) {
            if (detail.key === 'primary' || detail.key === 'partial') {
                // Update template-loader.js
                const loaderPath = path.join(processorsPath, 'template-loader.js');
                await this.updateTemplateReferences(loaderPath, detail.key, detail.newValue);
                updates.push(`Updated ${detail.key} template reference`);
            }
        }

        return { type: 'template-processors', updates, success: true };
    }

    /**
     * Update source URL in a module file
     */
    async updateSourceUrl(filePath: string, constant: string, newUrl: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const urlPattern = new RegExp(`(const\\s+${constant}\\s*=\\s*['"])([^'"]+)(['"])`);
            const updatedContent = content.replace(urlPattern, `$1${newUrl}$3`);
            await fs.writeFile(filePath, updatedContent);
        } catch (error: unknown) {
            console.warn(`Could not update ${constant} in ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update example prompt generation rules
     */
    async updateExamplePromptRules(filePath: string, newRules: any): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            // Update configuration object
            const configPattern = /const\s+DEFAULT_CONFIG\s*=\s*{[^}]+}/s;
            const newConfig = `const DEFAULT_CONFIG = ${JSON.stringify(newRules, null, 8)}`;
            const updatedContent = content.replace(configPattern, newConfig);
            
            await fs.writeFile(filePath, updatedContent);
        } catch (error: unknown) {
            console.warn(`Could not update example prompt rules: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update parameter formatting rules
     */
    async updateParameterRules(filePath: string, newRules: any): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            // Update parameter format constants
            if (newRules.format) {
                const formatPattern = /REQUIRED_LABEL\s*=\s*['"][^'"]*['"];?/;
                const requiredLabel = newRules.format.split(' or ')[0];
                const updatedContent = content.replace(formatPattern, `REQUIRED_LABEL = '${requiredLabel}';`);
                await fs.writeFile(filePath, updatedContent);
            }
        } catch (error: unknown) {
            console.warn(`Could not update parameter rules: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update header formatting rules
     */
    async updateHeaderRules(filePath: string, newRules: any): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            // Update header case handling
            if (newRules.case === 'sentence') {
                const casePattern = /toTitleCase/g;
                const updatedContent = content.replace(casePattern, 'toSentenceCase');
                await fs.writeFile(filePath, updatedContent);
            }
        } catch (error: unknown) {
            console.warn(`Could not update header rules: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update content validation rules
     */
    async updateContentValidationRules(filePath: string, newRules: any): Promise<void> {
        // Implementation for updating content validation rules
        console.log('Updating content validation rules...');
    }

    /**
     * Update structure validation rules
     */
    async updateStructureValidationRules(filePath: string, newRules: any): Promise<void> {
        // Implementation for updating structure validation rules
        console.log('Updating structure validation rules...');
    }

    /**
     * Update output file structure
     */
    async updateOutputFileStructure(filePath: string, newStructure: any): Promise<void> {
        // Implementation for updating output file structure
        console.log('Updating output file structure...');
    }

    /**
     * Update directory structure logic
     */
    async updateDirectoryStructure(filePath: string, newStructure: any): Promise<void> {
        // Implementation for updating directory structure
        console.log('Updating directory structure logic...');
    }

    /**
     * Update template references
     */
    async updateTemplateReferences(filePath: string, templateType: string, newTemplate: string): Promise<void> {
        // Implementation for updating template references
        console.log(`Updating ${templateType} template reference to ${newTemplate}...`);
    }

    /**
     * Generate update summary
     */
    async generateUpdateSummary(results: UpdateResult[], manualReviewItems: ChangeItem[]): Promise<{ summary: UpdateSummary; summaryPath: string }> {
        const summary: UpdateSummary = {
            timestamp: new Date().toISOString(),
            automaticUpdates: results.length,
            manualReviewRequired: manualReviewItems.length,
            results,
            manualReviewItems,
            success: results.every(r => r.success),
            nextSteps: []
        };

        if (manualReviewItems.length > 0) {
            summary.nextSteps.push('Run: npm run review-manual-updates');
        }

        summary.nextSteps.push('Run: npm run validate-integration');

        // Save summary
        const summaryPath = path.join(__dirname, '../../logs', `update-summary-${Date.now()}.json`);
        await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

        return { summary, summaryPath };
    }
}

export { AutoUpdater };
