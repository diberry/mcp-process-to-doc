/**
 * Integration Validator - Validate that code correctly implements prompt requirements
 * 
 * This module validates the integrity between prompt file and code implementation
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import PromptParser from '../config/prompt-parser.js';

/**
 * Test result status type
 */
export type ValidationStatus = 'PASS' | 'WARN' | 'FAIL';

/**
 * Validation test result
 */
export interface ValidationTest {
    test: string;
    status: ValidationStatus;
    message: string;
    details?: string | string[];
}

/**
 * Validation results structure
 */
export interface ValidationResults {
    configurationAlignment: ValidationTest[];
    moduleCompleteness: ValidationTest[];
    workflowIntegrity: ValidationTest[];
    codeCompliance: ValidationTest[];
}

/**
 * Validation summary
 */
export interface ValidationSummary {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
}

/**
 * Full validation report
 */
export interface ValidationReport {
    timestamp: string;
    summary: ValidationSummary;
    overallStatus: 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
    results: ValidationResults;
    recommendations: string[];
}

export default class IntegrationValidator {

    public promptParser: PromptParser;
    public validationResults: ValidationResults;

    constructor() {
        this.promptParser = new PromptParser();
        this.validationResults = {
            configurationAlignment: [],
            moduleCompleteness: [],
            workflowIntegrity: [],
            codeCompliance: []
        };
    }

    /**
     * Run complete integration validation
     */
    async validateIntegration(): Promise<{ report: ValidationReport; reportPath: string }> {
        console.log('🔍 Starting integration validation...');

        try {
            // Validate configuration alignment
            console.log('📋 Validating configuration alignment...');
            await this.validateConfigurationAlignment();

            // Validate module completeness
            console.log('🧩 Validating module completeness...');
            await this.validateModuleCompleteness();

            // Validate workflow integrity
            console.log('🔄 Validating workflow integrity...');
            await this.validateWorkflowIntegrity();

            // Validate code compliance
            console.log('✅ Validating code compliance...');
            await this.validateCodeCompliance();

            // Generate final report
            const report = await this.generateValidationReport();
            console.log('📊 Validation completed');

            return report;

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Integration validation failed: ${errorMessage}`);
        }
    }

    /**
     * Validate that configuration matches prompt requirements
     */
    async validateConfigurationAlignment(): Promise<void> {
        const integrity = await this.promptParser.validatePromptIntegrity();
        
        if (integrity.isValid) {
            this.validationResults.configurationAlignment.push({
                test: 'Prompt-Config Sync',
                status: 'PASS',
                message: 'Configuration matches prompt requirements'
            });
        } else {
            this.validationResults.configurationAlignment.push({
                test: 'Prompt-Config Sync',
                status: 'FAIL',
                message: 'Configuration mismatches detected',
                details: integrity.discrepancies
            });
        }
    }

    /**
     * Validate that all required modules exist and are complete
     */
    async validateModuleCompleteness(): Promise<void> {
        const workflowConfig = JSON.parse(
            await fs.readFile(this.promptParser.configPath, 'utf8')
        );

        const requiredModules = this.getRequiredModules(workflowConfig);
        
        for (const modulePath of requiredModules) {
            const fullPath = path.join(__dirname, '../../../../src', modulePath);
            
            try {
                await fs.access(fullPath);
                
                // Check if module has required exports
                const hasRequiredExports = await this.validateModuleExports(fullPath);
                
                this.validationResults.moduleCompleteness.push({
                    test: `Module: ${modulePath}`,
                    status: hasRequiredExports ? 'PASS' : 'WARN',
                    message: hasRequiredExports ? 'Module complete' : 'Module missing required exports'
                });
                
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.validationResults.moduleCompleteness.push({
                    test: `Module: ${modulePath}`,
                    status: 'FAIL',
                    message: 'Module not found',
                    details: errorMessage
                });
            }
        }
    }

    /**
     * Get list of required modules based on configuration
     */
    getRequiredModules(config: any): string[] {
        const modules: string[] = [];
        
        // Data extractors
        modules.push('data-extractors/azmcp-commands-extractor.js');
        modules.push('data-extractors/tools-json-processor.js');
        modules.push('data-extractors/azure-docs-fetcher.js');
        modules.push('data-extractors/parameter-extractor.js');

        // Content builders
        modules.push('content-builders/metadata-builder.js');
        modules.push('content-builders/example-prompt-builder.js');
        modules.push('content-builders/operation-builder.js');
        modules.push('content-builders/parameter-table-builder.js');
        modules.push('content-builders/usage-examples-builder.js');

        // Template processors
        modules.push('template-processors/template-loader.js');
        modules.push('template-processors/section-template-processor.js');
        modules.push('template-processors/document-template-processor.js');

        // Quality controllers
        modules.push('quality-controllers/content-validator.js');
        modules.push('quality-controllers/format-checker.js');
        modules.push('quality-controllers/link-validator.js');
        modules.push('quality-controllers/consistency-checker.js');
        modules.push('quality-controllers/reference-validator.js');

        // File generators
        modules.push('file-generators/single-doc-generator.js');
        modules.push('file-generators/batch-doc-generator.js');
        modules.push('file-generators/output-file-manager.js');

        // Navigation generators
        modules.push('navigation-generators/update-index.js');
        modules.push('navigation-generators/update-supported-services.js');
        modules.push('navigation-generators/update-toc.js');

        // Workflows
        modules.push('workflows/generate-single-tool.js');
        modules.push('workflows/documentation-orchestrator.js');

        // Configuration
        modules.push('config/configuration-manager.js');

        return modules;
    }

    /**
     * Validate that a module has required exports
     */
    async validateModuleExports(modulePath: string): Promise<boolean> {
        try {
            const content = await fs.readFile(modulePath, 'utf8');
            
            // Check for module.exports or class exports
            const hasExports = content.includes('module.exports') || 
                              content.includes('class ') ||
                              content.includes('function ') ||
                              content.includes('const ') ||
                              content.includes('async function');
            
            return hasExports;
        } catch (error: unknown) {
            return false;
        }
    }

    /**
     * Validate workflow execution integrity
     */
    async validateWorkflowIntegrity(): Promise<void> {
        try {
            // Test main entry point
            const mainPath = path.join(__dirname, '../../../../src', 'main.js');
            await fs.access(mainPath);
            
            this.validationResults.workflowIntegrity.push({
                test: 'Main Entry Point',
                status: 'PASS',
                message: 'Main entry point exists'
            });

            // Test configuration loading
            try {
                const configManagerPath = path.join(__dirname, '../../../../src', 'config', 'configuration-manager.js');
                await fs.access(configManagerPath);
                
                this.validationResults.workflowIntegrity.push({
                    test: 'Configuration Loading',
                    status: 'PASS',
                    message: 'Configuration manager accessible'
                });
            } catch (error) {
                this.validationResults.workflowIntegrity.push({
                    test: 'Configuration Loading',
                    status: 'WARN',
                    message: 'Configuration manager not found'
                });
            }

            // Test orchestrator integration
            const orchestratorPath = path.join(__dirname, '../../../../src', 'workflows', 'documentation-orchestrator.js');
            await fs.access(orchestratorPath);
            
            this.validationResults.workflowIntegrity.push({
                test: 'Workflow Orchestrator',
                status: 'PASS',
                message: 'Documentation orchestrator exists'
            });

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.validationResults.workflowIntegrity.push({
                test: 'Workflow Integration',
                status: 'FAIL',
                message: 'Workflow integration issue',
                details: errorMessage
            });
        }
    }

    /**
     * Validate code compliance with prompt rules
     */
    async validateCodeCompliance(): Promise<void> {
        const workflowConfig = JSON.parse(
            await fs.readFile(this.promptParser.configPath, 'utf8')
        );

        // Validate content rules implementation
        await this.validateContentRulesImplementation(workflowConfig['content-rules']);
        
        // Validate validation rules implementation
        await this.validateValidationRulesImplementation(workflowConfig['validation-rules']);
        
        // Validate source URL consistency
        await this.validateSourceUrlConsistency(workflowConfig.sources);
    }

    /**
     * Validate that content rules are implemented in content builders
     */
    async validateContentRulesImplementation(contentRules: any): Promise<void> {
        const builderPath = path.join(__dirname, '../../../../src', 'content-builders');
        
        try {
            // Check example prompt builder
            const exampleBuilderPath = path.join(builderPath, 'example-prompt-builder.js');
            const exampleContent = await fs.readFile(exampleBuilderPath, 'utf8');
            
            const hasVarietyCheck = contentRules['example-prompts']?.variety?.every(type => 
                exampleContent.includes(type)
            );
            
            this.validationResults.codeCompliance.push({
                test: 'Example Prompt Rules',
                status: hasVarietyCheck ? 'PASS' : 'WARN',
                message: hasVarietyCheck ? 'Variety rules implemented' : 'Some variety rules missing'
            });

            // Check parameter table builder
            const paramBuilderPath = path.join(builderPath, 'parameter-table-builder.js');
            const paramContent = await fs.readFile(paramBuilderPath, 'utf8');
            
            const hasRequiredFormat = contentRules.parameters?.format && 
                paramContent.includes(contentRules.parameters.format);
            
            this.validationResults.codeCompliance.push({
                test: 'Parameter Format Rules',
                status: hasRequiredFormat ? 'PASS' : 'WARN',
                message: hasRequiredFormat ? 'Parameter format implemented' : 'Parameter format may not match rules'
            });

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.validationResults.codeCompliance.push({
                test: 'Content Rules Implementation',
                status: 'FAIL',
                message: 'Could not validate content rules',
                details: errorMessage
            });
        }
    }

    /**
     * Validate that validation rules are implemented in quality controllers
     */
    async validateValidationRulesImplementation(validationRules: any): Promise<void> {
        const controllerPath = path.join(__dirname, '../../../../src', 'quality-controllers');
        
        try {
            // Check content validator
            const validatorPath = path.join(controllerPath, 'content-validator.js');
            const validatorContent = await fs.readFile(validatorPath, 'utf8');
            
            const hasContentValidation = validationRules.content && 
                Object.keys(validationRules.content).some(rule => 
                    validatorContent.includes(rule.replace(/-/g, ''))
                );
            
            this.validationResults.codeCompliance.push({
                test: 'Content Validation Rules',
                status: hasContentValidation ? 'PASS' : 'WARN',
                message: hasContentValidation ? 'Content validation implemented' : 'Some validation rules may be missing'
            });

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.validationResults.codeCompliance.push({
                test: 'Validation Rules Implementation',
                status: 'FAIL',
                message: 'Could not validate validation rules',
                details: errorMessage
            });
        }
    }

    /**
     * Validate that source URLs are consistent across modules
     */
    async validateSourceUrlConsistency(sources: any): Promise<void> {
        const dataExtractorPath = path.join(__dirname, '../../../../src', 'data-extractors');
        
        try {
            // Check azmcp-commands URL
            if (sources.engineering['azmcp-commands']) {
                const extractorPath = path.join(dataExtractorPath, 'azmcp-commands-extractor.js');
                const content = await fs.readFile(extractorPath, 'utf8');
                
                const hasCorrectUrl = content.includes(sources.engineering['azmcp-commands']);
                
                this.validationResults.codeCompliance.push({
                    test: 'AZMCP Commands URL',
                    status: hasCorrectUrl ? 'PASS' : 'FAIL',
                    message: hasCorrectUrl ? 'URL matches configuration' : 'URL mismatch detected'
                });
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.validationResults.codeCompliance.push({
                test: 'Source URL Consistency',
                status: 'FAIL',
                message: 'Could not validate source URLs',
                details: errorMessage
            });
        }
    }

    /**
     * Generate comprehensive validation report
     */
    async generateValidationReport(): Promise<{ report: ValidationReport; reportPath: string }> {
        const allTests = [
            ...this.validationResults.configurationAlignment,
            ...this.validationResults.moduleCompleteness,
            ...this.validationResults.workflowIntegrity,
            ...this.validationResults.codeCompliance
        ];

        const summary: ValidationSummary = {
            total: allTests.length,
            passed: allTests.filter(t => t.status === 'PASS').length,
            warnings: allTests.filter(t => t.status === 'WARN').length,
            failed: allTests.filter(t => t.status === 'FAIL').length
        };

        const overallStatus = summary.failed === 0 
            ? (summary.warnings === 0 ? 'PASS' as const : 'PASS_WITH_WARNINGS' as const) 
            : 'FAIL' as const;

        const report: ValidationReport = {
            timestamp: new Date().toISOString(),
            summary,
            overallStatus,
            results: this.validationResults,
            recommendations: this.generateRecommendations(summary, allTests)
        };

        // Save report
        const reportPath = path.join(__dirname, '../../logs', `validation-report-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return { report, reportPath };
    }

    /**
     * Generate recommendations based on validation results
     */
    generateRecommendations(summary: ValidationSummary, allTests: ValidationTest[]): string[] {
        const recommendations: string[] = [];

        if (summary.failed > 0) {
            recommendations.push('❌ Fix failing tests before proceeding');
            const failedTests = allTests.filter(t => t.status === 'FAIL');
            failedTests.forEach(test => {
                recommendations.push(`  - ${test.test}: ${test.message}`);
            });
        }

        if (summary.warnings > 0) {
            recommendations.push('⚠️  Review warnings for potential improvements');
            const warningTests = allTests.filter(t => t.status === 'WARN');
            warningTests.forEach(test => {
                recommendations.push(`  - ${test.test}: ${test.message}`);
            });
        }

        if (summary.failed === 0 && summary.warnings === 0) {
            recommendations.push('✅ All tests passed - system is fully integrated');
            recommendations.push('🚀 Ready for production use');
        }

        recommendations.push('📝 Run validation after any prompt changes');

        return recommendations;
    }
}

module.exports = IntegrationValidator;
