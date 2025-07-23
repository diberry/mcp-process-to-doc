/**
 * Change Detector - Detect changes between prompt file and current configuration
 * 
 * This module analyzes changes in the prompt file and determines what code updates are needed
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const PromptParser = require('../config/prompt-parser');

class ChangeDetector {
    constructor() {
        this.promptParser = new PromptParser();
        this.changeHistoryPath = path.join(__dirname, '..', 'logs', 'change-history.json');
    }

    /**
     * Detect changes in prompt file since last analysis
     */
    async detectPromptChanges() {
        try {
            const currentPromptHash = await this.getPromptFileHash();
            const lastKnownHash = await this.getLastKnownHash();

            if (currentPromptHash === lastKnownHash) {
                return {
                    hasChanges: false,
                    message: 'No changes detected in prompt file'
                };
            }

            const integrity = await this.promptParser.validatePromptIntegrity();
            
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

        } catch (error) {
            throw new Error(`Failed to detect prompt changes: ${error.message}`);
        }
    }

    /**
     * Get hash of current prompt file
     */
    async getPromptFileHash() {
        const promptContent = await fs.readFile(this.promptParser.promptFilePath, 'utf8');
        return crypto.createHash('sha256').update(promptContent).digest('hex');
    }

    /**
     * Get last known hash from change history
     */
    async getLastKnownHash() {
        try {
            const history = JSON.parse(await fs.readFile(this.changeHistoryPath, 'utf8'));
            return history.lastHash || '';
        } catch (error) {
            return ''; // No history file exists yet
        }
    }

    /**
     * Analyze specific changes between current and parsed configuration
     */
    async analyzeSpecificChanges(integrity) {
        const { currentConfig, parsedConfig, discrepancies } = integrity;
        const changes = [];

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
    hasSourceChanges(current, parsed) {
        return JSON.stringify(current) !== JSON.stringify(parsed);
    }

    /**
     * Check if content rules have changed
     */
    hasContentRuleChanges(current, parsed) {
        return JSON.stringify(current) !== JSON.stringify(parsed);
    }

    /**
     * Check if validation rules have changed
     */
    hasValidationChanges(current, parsed) {
        return JSON.stringify(current) !== JSON.stringify(parsed);
    }

    /**
     * Check if output structure has changed
     */
    hasOutputChanges(current, parsed) {
        return JSON.stringify(current) !== JSON.stringify(parsed);
    }

    /**
     * Compare objects and return detailed differences
     */
    compareObjects(obj1, obj2) {
        const differences = [];
        
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
    async generateImpactAnalysis(changes) {
        const impactedModules = new Set();
        const updateActions = [];
        const manualReviewRequired = [];

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
    estimateUpdateEffort(changes) {
        const severityWeights = { low: 1, medium: 3, high: 5 };
        const totalWeight = changes.reduce((sum, change) => sum + severityWeights[change.severity], 0);

        if (totalWeight <= 3) return 'low';
        if (totalWeight <= 10) return 'medium';
        return 'high';
    }

    /**
     * Update change history with new analysis
     */
    async updateChangeHistory(newHash, changes) {
        const timestamp = new Date().toISOString();
        
        let history = [];
        try {
            const existingHistory = await fs.readFile(this.changeHistoryPath, 'utf8');
            history = JSON.parse(existingHistory).changes || [];
        } catch (error) {
            // Create logs directory if it doesn't exist
            await fs.mkdir(path.dirname(this.changeHistoryPath), { recursive: true });
        }

        const newEntry = {
            timestamp,
            hash: newHash,
            changes,
            processed: false
        };

        history.push(newEntry);

        const updatedHistory = {
            lastHash: newHash,
            lastAnalysis: timestamp,
            changes: history.slice(-10) // Keep last 10 entries
        };

        await fs.writeFile(this.changeHistoryPath, JSON.stringify(updatedHistory, null, 2));
    }

    /**
     * Generate detailed change report
     */
    async generateChangeReport(changeAnalysis) {
        const { changes, impactAnalysis } = changeAnalysis;
        
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

        // Save report
        const reportPath = path.join(__dirname, '..', 'logs', `change-report-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return { report, reportPath };
    }

    /**
     * Generate recommendations based on impact analysis
     */
    generateRecommendations(impactAnalysis) {
        const recommendations = [];

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

module.exports = ChangeDetector;
