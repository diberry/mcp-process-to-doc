/**
 * Change Detector - Detect changes between prompt file and current configuration
 * 
 * This module analyzes changes in the prompt file and determines what code updates are needed
 */

import { promises as fs } from 'node:fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import PromptParser from './prompt-parser.js';
import { SystemFile } from '../index.js';

// Derive __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Integrity check result interface
 */
export interface IntegrityResult {
    isValid: boolean;
    discrepancies: string[];
    currentConfig: any;
    parsedConfig: any;
}

/**
 * Change item interface
 */
export interface ChangeItem {
    type: string;
    description: string;
    impact: 'data-extractors' | 'content-builders' | 'quality-controllers' | 'file-generators';
    severity: 'low' | 'medium' | 'high';
    details: DifferenceItem[];
}

/**
 * Difference item interface
 */
export interface DifferenceItem {
    type: 'added' | 'removed' | 'modified';
    key: string;
    value?: any;
    oldValue?: any;
    newValue?: any;
}

/**
 * Impact analysis interface
 */
export interface ImpactAnalysis {
    impactedModules: string[];
    updateActions: string[];
    manualReviewRequired: string[];
    estimatedEffort: 'low' | 'medium' | 'high';
    autoUpdateable: boolean;
}

/**
 * Change detection result interface
 */
export interface ChangeDetectionResult {
    hasChanges: boolean;
    message?: string;
    changes?: ChangeItem[];
    impactAnalysis?: ImpactAnalysis;
}

/**
 * Change history entry interface
 */
export interface ChangeHistoryEntry {
    timestamp: string;
    hash: string;
    changes: ChangeItem[];
    processed: boolean;
}

/**
 * Change history interface
 */
export interface ChangeHistory {
    lastHash: string;
    lastAnalysis: string;
    changes: ChangeHistoryEntry[];
}

/**
 * Change report interface
 */
export interface ChangeReport {
    summary: {
        timestamp: string;
        totalChanges: number;
        estimatedEffort: string;
        autoUpdateable: boolean;
    };
    changes: Array<{
        type: string;
        description: string;
        severity: string;
        impact: string;
        detailCount: number;
    }>;
    impact: {
        modulesAffected: number;
        updateActions: number;
        manualReviewItems: number;
    };
    recommendations: string[];
}

export default class ChangeDetector {

    public promptParser: PromptParser;
    public changeHistoryPath: string;
    public systemFiles: Record<string, SystemFile>;


    constructor(systemFiles: Record<string, SystemFile>) {
        this.promptParser = new PromptParser(systemFiles['prompt'].path, systemFiles['workflow-config.json'].path);
        this.changeHistoryPath = systemFiles['change-history.json'].path;
        this.systemFiles = systemFiles;
    }

    /**
     * Detect changes in prompt file since last analysis
     */
    async detectPromptChanges(): Promise<ChangeDetectionResult> {
        try {
            const currentPromptHash = await this.getPromptFileHash();
            const lastKnownHash = await this.getLastKnownHash();

            // Check if this is the first time through (no last known hash)
            if (!lastKnownHash) {
                return {
                    hasChanges: true,
                    message: 'First-time execution: No previous hash found, assuming changes',
                    changes: [],
                    impactAnalysis: {
                        impactedModules: [],
                        updateActions: ['Initialize workflow configuration'],
                        manualReviewRequired: [],
                        estimatedEffort: 'low',
                        autoUpdateable: true
                    }
                };
            }

            if (currentPromptHash === lastKnownHash) {
                return {
                    hasChanges: false,
                    message: 'No changes detected in prompt file'
                };
            } 

            const integrity = await this.promptParser.validatePromptIntegrity() as IntegrityResult;
            
            if (integrity.isValid) {
                return {
                    hasChanges: false,
                    message: 'Prompt file changed but configuration is still in sync'
                };
            }

            const changes = await this.analyzeSpecificChanges(integrity);
            await this.updateChangeHistory(currentPromptHash, changes);

            return {
                hasChanges: true,
                changes,
                impactAnalysis: await this.generateImpactAnalysis(changes)
            };

        } catch (error: unknown) {
            throw new Error(`Failed to detect prompt changes: ${error}`);
        }
    }

    /**
     * Get hash of current prompt file
     */
    async getPromptFileHash(): Promise<string> {
        const promptContent = await fs.readFile(this?.promptParser?.promptFilePath, 'utf8');
        return crypto.createHash('sha256').update(promptContent).digest('hex');
    }

    /**
     * Get last known hash from change history
     */
    async getLastKnownHash(): Promise<string> {
        try {
            const history = JSON.parse(await fs.readFile(this.changeHistoryPath, 'utf8')) as ChangeHistory;
            return history.lastHash || '';
        } catch (error) {
            return ''; // No history file exists yet
        }
    }

    /**
     * Analyze specific changes between current and parsed configuration
     */
    async analyzeSpecificChanges(integrity: IntegrityResult): Promise<ChangeItem[]> {
        const { currentConfig, parsedConfig, discrepancies } = integrity;
        const changes: ChangeItem[] = [];

        // Analyze source changes
        if (this.hasSourceChanges(currentConfig.sources, parsedConfig.sources)) {
            changes.push({
                type: 'sources',
                description: 'Source URLs or data extraction requirements changed',
                impact: 'data-extractors',
                severity: 'medium',
                details: this.compareObjects(currentConfig.sources, parsedConfig.sources)
            });
        }

        // Analyze content rule changes
        if (this.hasContentRuleChanges(currentConfig['content-rules'], parsedConfig.contentRules)) {
            changes.push({
                type: 'content-rules',
                description: 'Content generation rules changed',
                impact: 'content-builders',
                severity: 'high',
                details: this.compareObjects(currentConfig['content-rules'], parsedConfig.contentRules)
            });
        }

        // Analyze validation rule changes
        if (this.hasValidationChanges(currentConfig['validation-rules'], parsedConfig.validationRules)) {
            changes.push({
                type: 'validation-rules',
                description: 'Quality validation rules changed',
                impact: 'quality-controllers',
                severity: 'medium',
                details: this.compareObjects(currentConfig['validation-rules'], parsedConfig.validationRules)
            });
        }

        // Analyze output structure changes
        if (this.hasOutputChanges(currentConfig.output, parsedConfig.output)) {
            changes.push({
                type: 'output-structure',
                description: 'Output file structure or naming changed',
                impact: 'file-generators',
                severity: 'high',
                details: this.compareObjects(currentConfig.output, parsedConfig.output)
            });
        }

        return changes;
    }

    /**
     * Check if source configuration has changed
     */
    hasSourceChanges(current: any, parsed: any): boolean {
        return JSON.stringify(current) !== JSON.stringify(parsed);
    }

    /**
     * Check if content rules have changed
     */
    hasContentRuleChanges(current: any, parsed: any): boolean {
        return JSON.stringify(current) !== JSON.stringify(parsed);
    }

    /**
     * Check if validation rules have changed
     */
    hasValidationChanges(current: any, parsed: any): boolean {
        return JSON.stringify(current) !== JSON.stringify(parsed);
    }

    /**
     * Check if output structure have changed
     */
    hasOutputChanges(current: any, parsed: any): boolean {
        return JSON.stringify(current) !== JSON.stringify(parsed);
    }

    /**
     * Compare objects and return detailed differences
     */
    compareObjects(obj1: any, obj2: any): DifferenceItem[] {
        const differences: DifferenceItem[] = [];
        
        const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
        
        for (const key of allKeys) {
            if (!(key in obj1)) {
                differences.push({ type: 'added', key, value: obj2[key] });
            } else if (!(key in obj2)) {
                differences.push({ type: 'removed', key, value: obj1[key] });
            } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
                differences.push({ 
                    type: 'modified', 
                    key, 
                    oldValue: obj1[key], 
                    newValue: obj2[key] 
                });
            }
        }

        return differences;
    }

    /**
     * Generate impact analysis for detected changes
     */
    async generateImpactAnalysis(changes: ChangeItem[]): Promise<ImpactAnalysis> {
        const impactedModules = new Set<string>();
        const updateActions: string[] = [];
        const manualReviewRequired: string[] = [];

        for (const change of changes) {
            switch (change.impact) {
                case 'data-extractors':
                    impactedModules.add('data-extractors/*');
                    updateActions.push('Update source URLs and data extraction logic');
                    break;
                    
                case 'content-builders':
                    impactedModules.add('content-builders/*');
                    updateActions.push('Update content generation rules and templates');
                    if (change.severity === 'high') {
                        manualReviewRequired.push('Content builder logic changes require manual review');
                    }
                    break;
                    
                case 'quality-controllers':
                    impactedModules.add('quality-controllers/*');
                    updateActions.push('Update validation rules and quality checks');
                    break;
                    
                case 'file-generators':
                    impactedModules.add('file-generators/*');
                    updateActions.push('Update output file structure and naming');
                    if (change.severity === 'high') {
                        manualReviewRequired.push('File structure changes require manual review');
                    }
                    break;
            }
        }

        return {
            impactedModules: Array.from(impactedModules),
            updateActions,
            manualReviewRequired,
            estimatedEffort: this.estimateUpdateEffort(changes),
            autoUpdateable: manualReviewRequired.length === 0
        };
    }

    /**
     * Estimate update effort based on changes
     */
    estimateUpdateEffort(changes: ChangeItem[]): 'low' | 'medium' | 'high' {
        const severityWeights = { low: 1, medium: 3, high: 5 };
        const totalWeight = changes.reduce((sum, change) => sum + severityWeights[change.severity], 0);

        if (totalWeight <= 3) return 'low';
        if (totalWeight <= 10) return 'medium';
        return 'high';
    }

    /**
     * Update change history with new analysis
     */
    async updateChangeHistory(newHash: string, changes: ChangeItem[]): Promise<void> {
        const timestamp = new Date().toISOString();
        
        let history: ChangeHistoryEntry[] = [];
        try {
            const existingHistory = await fs.readFile(this.changeHistoryPath, 'utf8');
            history = (JSON.parse(existingHistory) as ChangeHistory).changes || [];
        } catch (error) {
            // Create logs directory if it doesn't exist
            await fs.mkdir(path.dirname(this.changeHistoryPath), { recursive: true });
        }

        const newEntry: ChangeHistoryEntry = {
            timestamp,
            hash: newHash,
            changes,
            processed: false
        };

        history.push(newEntry);

        const updatedHistory: ChangeHistory = {
            lastHash: newHash,
            lastAnalysis: timestamp,
            changes: history.slice(-10) // Keep last 10 entries
        };

        await fs.writeFile(this.changeHistoryPath, JSON.stringify(updatedHistory, null, 2));
    }

    /**
     * Generate detailed change report
     */
    async generateChangeReport(changeAnalysis: ChangeDetectionResult): Promise<{report: ChangeReport, reportPath: string}> {
        const { changes = [], impactAnalysis } = changeAnalysis;

        if (!impactAnalysis) {
            throw new Error('Impact analysis is required for generating a change report');
        }

        const report = {
            summary: {
                timestamp: new Date().toISOString(),
                totalChanges: changes.length,
                estimatedEffort: impactAnalysis.estimatedEffort,
                autoUpdateable: impactAnalysis.autoUpdateable
            },
            changes: changes.map(change => ({
                type: change.type,
                description: change.description,
                severity: change.severity,
                impact: change.impact,
                detailCount: change.details.length
            })),
            impact: {
                modulesAffected: impactAnalysis.impactedModules.length,
                updateActions: impactAnalysis.updateActions.length,
                manualReviewItems: impactAnalysis.manualReviewRequired.length
            },
            recommendations: this.generateRecommendations(impactAnalysis)
        };

        try {
            // Save report
            await fs.writeFile(this.systemFiles['change-report'].path, JSON.stringify(report, null, 2));
        } catch (error) {
            throw new Error(`Failed to create change report file: ${error}`);
        }

        return { report, reportPath: this.systemFiles['change-report'].path };
    }

    /**
     * Generate recommendations based on impact analysis
     */
    generateRecommendations(impactAnalysis: ImpactAnalysis): string[] {
        const recommendations: string[] = [];

        if (impactAnalysis.autoUpdateable) {
            recommendations.push('All changes can be automatically applied');
            recommendations.push('Run: npm run apply-prompt-updates');
        } else {
            recommendations.push('Manual review required for some changes');
            recommendations.push('Run: npm run review-manual-updates');
        }

        if (impactAnalysis.estimatedEffort === 'high') {
            recommendations.push('Consider implementing changes incrementally');
            recommendations.push('Test each module update separately');
        }

        recommendations.push('Run: npm run validate-integration after updates');

        return recommendations;
    }
}

// Class is already exported as default
