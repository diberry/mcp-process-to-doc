/**
 * Documentation Orchestrator for Azure MCP Documentation Generation
 * 
 * This is the main coordination logic that brings together all the enhanced components
 * for quality-controlled documentation generation with comprehensive error handling and logging.
 */

const fs = require('fs');
const path = require('path');
const EnhancedTemplateEngine = require('./enhanced-template-engine');
const CommandParser = require('./command-parser');
const ContentGenerator = require('./content-generator');
const QualityValidator = require('./quality-validator');

class DocumentationOrchestrator {
    constructor(options = {}) {
        this.options = {
            templatePath: './generated-documentation.template.md',
            validateOutput: true,
            generateReport: true,
            logLevel: 'info',
            ...options
        };
        
        this.templateEngine = new EnhancedTemplateEngine(this.options.templatePath);
        this.commandParser = new CommandParser();
        this.contentGenerator = new ContentGenerator();
        this.qualityValidator = new QualityValidator();
        
        this.stats = {
            totalTools: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            validationPassed: 0,
            validationFailed: 0,
            startTime: null,
            endTime: null
        };
        
        this.logStream = null;
    }

    /**
     * Initialize the orchestrator with workspace paths
     * @param {string} timestamp - Timestamp for the current generation run
     */
    async initialize(timestamp) {
        this.timestamp = timestamp;
        this.setupPaths(timestamp);
        this.setupLogging();
        
        this.log('info', 'Initializing Documentation Orchestrator');
        this.log('info', `Using timestamp: ${timestamp}`);
        this.log('info', `Template path: ${this.options.templatePath}`);
        
        this.stats.startTime = new Date();
    }

    /**
     * Setup workspace paths
     */
    setupPaths(timestamp) {
        this.paths = {
            base: path.join('./generated', timestamp),
            content: path.join('./generated', timestamp, 'content'),
            sourceTruth: path.join('./generated', timestamp, 'source-of-truth'),
            logs: path.join('./generated', timestamp, 'logs'),
            toolsJson: path.join('./generated', timestamp, 'content', 'tools.json'),
            azmcpCommands: path.join('./generated', timestamp, 'source-of-truth', 'azmcp-commands.md')
        };
    }

    /**
     * Setup logging
     */
    setupLogging() {
        const logPath = path.join(this.paths.logs, 'documentation-orchestrator.log');
        this.logStream = fs.createWriteStream(logPath, { flags: 'w' });
        
        this.log('info', 'Logging initialized');
    }

    /**
     * Log messages with different levels
     */
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (this.options.logLevel === 'debug' || level !== 'debug') {
            console.log(logMessage);
        }
        
        if (this.logStream) {
            this.logStream.write(logMessage + '\n');
            if (data) {
                this.logStream.write(`[${timestamp}] [DATA] ${JSON.stringify(data, null, 2)}\n`);
            }
        }
    }

    /**
     * Main orchestration method to generate all documentation
     */
    async generateAllDocumentation() {
        try {
            this.log('info', 'Starting comprehensive documentation generation');
            
            // Step 1: Validate prerequisites
            await this.validatePrerequisites();
            
            // Step 2: Load and parse source data
            const { toolsData, commandsInfo } = await this.loadSourceData();
            
            // Step 3: Generate documentation for all tools
            const generationResults = await this.generateToolDocumentation(toolsData, commandsInfo);
            
            // Step 4: Validate generated documentation
            if (this.options.validateOutput) {
                await this.validateGeneratedDocumentation(generationResults);
            }
            
            // Step 5: Generate comprehensive report
            if (this.options.generateReport) {
                await this.generateComprehensiveReport(generationResults);
            }
            
            this.stats.endTime = new Date();
            this.log('info', 'Documentation generation completed successfully', this.stats);
            
            return this.createFinalReport();
            
        } catch (error) {
            this.log('error', `Documentation generation failed: ${error.message}`, { stack: error.stack });
            throw error;
        } finally {
            if (this.logStream) {
                this.logStream.end();
            }
        }
    }

    /**
     * Validate prerequisites before starting
     */
    async validatePrerequisites() {
        this.log('info', 'Validating prerequisites');
        
        const requiredFiles = [
            this.paths.toolsJson,
            this.paths.azmcpCommands,
            this.options.templatePath
        ];
        
        const missingFiles = [];
        
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                missingFiles.push(file);
            }
        }
        
        if (missingFiles.length > 0) {
            throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
        }
        
        // Ensure output directories exist
        [this.paths.content, this.paths.logs].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        this.log('info', 'Prerequisites validated successfully');
    }

    /**
     * Load and parse source data
     */
    async loadSourceData() {
        this.log('info', 'Loading source data files');
        
        // Load tools.json
        const toolsData = JSON.parse(fs.readFileSync(this.paths.toolsJson, 'utf8'));
        this.log('info', `Loaded tools.json with ${Object.keys(toolsData).length} tools`);
        
        // Parse commands file
        const commandsInfo = this.commandParser.parseCommandsFile(this.paths.azmcpCommands);
        this.log('info', `Parsed ${commandsInfo.size} commands from azmcp-commands.md`);
        
        // Export parsed commands for debugging if needed
        if (this.options.logLevel === 'debug') {
            const debugPath = path.join(this.paths.logs, 'parsed-commands.json');
            this.commandParser.exportParsedData(debugPath);
        }
        
        return { toolsData, commandsInfo };
    }

    /**
     * Generate documentation for all tools
     */
    async generateToolDocumentation(toolsData, commandsInfo) {
        this.log('info', 'Starting tool documentation generation');
        
        const results = [];
        const convertedCommandsInfo = this.convertCommandsInfoToObject(commandsInfo);
        
        for (const [toolKey, toolData] of Object.entries(toolsData)) {
            this.stats.totalTools++;
            
            try {
                const result = await this.generateSingleToolDocumentation(
                    toolKey, 
                    toolData, 
                    convertedCommandsInfo
                );
                results.push(result);
                
                if (result.success) {
                    this.stats.successfulGenerations++;
                    this.log('info', `Successfully generated documentation for ${toolKey}`);
                } else {
                    this.stats.failedGenerations++;
                    this.log('error', `Failed to generate documentation for ${toolKey}`, result.error);
                }
                
            } catch (error) {
                this.stats.failedGenerations++;
                const errorResult = {
                    toolKey,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                results.push(errorResult);
                this.log('error', `Exception during generation for ${toolKey}: ${error.message}`);
            }
        }
        
        this.log('info', `Tool documentation generation completed. Success: ${this.stats.successfulGenerations}, Failed: ${this.stats.failedGenerations}`);
        
        return results;
    }

    /**
     * Convert Map to Object for easier processing
     */
    convertCommandsInfoToObject(commandsInfo) {
        const obj = {};
        for (const [key, value] of commandsInfo) {
            obj[key] = value;
        }
        return obj;
    }

    /**
     * Generate documentation for a single tool
     */
    async generateSingleToolDocumentation(toolKey, toolData, commandsInfo) {
        const toolName = toolKey.replace(/^azure-/, '');
        const isNewTool = toolData.status === 'new';
        const hasNewOperations = toolData.tools && toolData.tools.some(op => op.status === 'new');
        
        // Skip if no new content
        if (!isNewTool && !hasNewOperations) {
            return {
                toolKey,
                success: true,
                skipped: true,
                reason: 'No new content to generate',
                timestamp: new Date().toISOString()
            };
        }
        
        try {
            // Prepare tool data for generation
            const processedToolData = this.prepareToolData(toolKey, toolData, isNewTool);
            
            // Generate content using enhanced template engine
            const content = this.templateEngine.generateDocumentation(
                processedToolData,
                commandsInfo,
                !isNewTool // isPartial
            );
            
            // Determine output filename
            const suffix = isNewTool ? '.md' : '-partial.md';
            const outputPath = path.join(this.paths.content, `azure-${toolName}${suffix}`);
            
            // Write the generated content
            fs.writeFileSync(outputPath, content, 'utf8');
            
            return {
                toolKey,
                success: true,
                outputPath,
                isPartial: !isNewTool,
                contentLength: content.length,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                toolKey,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Prepare tool data for documentation generation
     */
    prepareToolData(toolKey, toolData, isNewTool) {
        const processedData = {
            id: toolKey,
            root: toolData.root || `azmcp ${toolKey.replace(/^azure-/, '')}`,
            status: toolData.status,
            ...toolData
        };
        
        // Filter operations for new content only if this is a partial generation
        if (!isNewTool && toolData.tools) {
            processedData.tools = toolData.tools.filter(op => op.status === 'new');
        }
        
        return processedData;
    }

    /**
     * Validate generated documentation
     */
    async validateGeneratedDocumentation(generationResults) {
        this.log('info', 'Starting documentation validation');
        
        const filesToValidate = generationResults
            .filter(result => result.success && result.outputPath)
            .map(result => result.outputPath);
        
        if (filesToValidate.length === 0) {
            this.log('warning', 'No files to validate');
            return;
        }
        
        const validationResults = this.qualityValidator.validateFiles(filesToValidate);
        
        this.stats.validationPassed = validationResults.summary.passedValidation;
        this.stats.validationFailed = validationResults.summary.totalFiles - validationResults.summary.passedValidation;
        
        // Generate validation report
        const reportPath = path.join(this.paths.logs, 'validation-report.md');
        this.qualityValidator.generateReport(validationResults, reportPath);
        
        this.log('info', `Validation completed. Passed: ${this.stats.validationPassed}, Failed: ${this.stats.validationFailed}`);
        
        // Log critical issues
        const criticalIssues = validationResults.summary.issues.filter(issue => 
            issue.type === 'structure' || issue.type === 'content'
        );
        
        if (criticalIssues.length > 0) {
            this.log('warning', `Found ${criticalIssues.length} critical validation issues`);
            criticalIssues.forEach(issue => {
                this.log('warning', `${issue.file}: ${issue.message}`);
            });
        }
    }

    /**
     * Generate comprehensive report
     */
    async generateComprehensiveReport(generationResults) {
        this.log('info', 'Generating comprehensive report');
        
        const report = this.createProgressReport(generationResults);
        const reportPath = path.join(this.paths.content, 'progress-report.md');
        
        fs.writeFileSync(reportPath, report, 'utf8');
        
        this.log('info', `Comprehensive report saved to: ${reportPath}`);
    }

    /**
     * Create progress report
     */
    createProgressReport(generationResults) {
        const duration = this.stats.endTime ? 
            (this.stats.endTime - this.stats.startTime) / 1000 : 0;
        
        let report = '# Documentation Generation Progress Report\n\n';
        report += `**Generated**: ${new Date().toISOString()}\n`;
        report += `**Duration**: ${duration.toFixed(2)} seconds\n\n`;
        
        // Summary
        report += '## Summary\n\n';
        report += `- **Total Tools Processed**: ${this.stats.totalTools}\n`;
        report += `- **Successful Generations**: ${this.stats.successfulGenerations}\n`;
        report += `- **Failed Generations**: ${this.stats.failedGenerations}\n`;
        report += `- **Success Rate**: ${Math.round((this.stats.successfulGenerations / this.stats.totalTools) * 100)}%\n\n`;
        
        if (this.options.validateOutput) {
            report += `- **Validation Passed**: ${this.stats.validationPassed}\n`;
            report += `- **Validation Failed**: ${this.stats.validationFailed}\n`;
            report += `- **Validation Rate**: ${Math.round((this.stats.validationPassed / (this.stats.validationPassed + this.stats.validationFailed)) * 100)}%\n\n`;
        }
        
        // Generated Files
        report += '## Generated Files\n\n';
        const successfulResults = generationResults.filter(r => r.success && r.outputPath);
        
        if (successfulResults.length > 0) {
            report += '| File | Type | Size |\n';
            report += '|------|------|------|\n';
            
            successfulResults.forEach(result => {
                const filename = path.basename(result.outputPath);
                const type = result.isPartial ? 'Partial' : 'Complete';
                const size = result.contentLength ? `${Math.round(result.contentLength / 1024)} KB` : 'Unknown';
                report += `| ${filename} | ${type} | ${size} |\n`;
            });
        } else {
            report += '*No files were successfully generated.*\n';
        }
        
        report += '\n';
        
        // Failed Generations
        const failedResults = generationResults.filter(r => !r.success && !r.skipped);
        if (failedResults.length > 0) {
            report += '## Failed Generations\n\n';
            failedResults.forEach(result => {
                report += `- **${result.toolKey}**: ${result.error}\n`;
            });
            report += '\n';
        }
        
        // Skipped Tools
        const skippedResults = generationResults.filter(r => r.skipped);
        if (skippedResults.length > 0) {
            report += '## Skipped Tools\n\n';
            skippedResults.forEach(result => {
                report += `- **${result.toolKey}**: ${result.reason}\n`;
            });
            report += '\n';
        }
        
        // Next Steps
        report += '## Next Steps\n\n';
        report += '1. Review generated documentation files\n';
        report += '2. Address any validation issues found\n';
        report += '3. Update TOC and index files with new content\n';
        report += '4. Perform final quality review before publishing\n\n';
        
        // Links
        report += '## Related Files\n\n';
        report += '- [Validation Report](../logs/validation-report.md)\n';
        report += '- [Generation Logs](../logs/documentation-orchestrator.log)\n';
        
        return report;
    }

    /**
     * Create final report summary
     */
    createFinalReport() {
        return {
            timestamp: this.timestamp,
            stats: this.stats,
            duration: this.stats.endTime ? 
                (this.stats.endTime - this.stats.startTime) / 1000 : 0,
            successRate: Math.round((this.stats.successfulGenerations / this.stats.totalTools) * 100),
            validationRate: this.options.validateOutput ? 
                Math.round((this.stats.validationPassed / (this.stats.validationPassed + this.stats.validationFailed)) * 100) : null,
            paths: this.paths
        };
    }

    /**
     * Generate documentation for a single tool (public interface)
     * @param {string} toolId - Tool identifier
     * @param {Object} options - Generation options
     */
    async generateSingleTool(toolId, options = {}) {
        await this.initialize(options.timestamp || new Date().toISOString().replace(/[:.]/g, '-'));
        
        const { toolsData, commandsInfo } = await this.loadSourceData();
        const toolKey = toolId.startsWith('azure-') ? toolId : `azure-${toolId}`;
        
        if (!toolsData[toolKey]) {
            throw new Error(`Tool ${toolKey} not found in tools.json`);
        }
        
        const convertedCommandsInfo = this.convertCommandsInfoToObject(commandsInfo);
        const result = await this.generateSingleToolDocumentation(
            toolKey,
            toolsData[toolKey],
            convertedCommandsInfo
        );
        
        if (this.options.validateOutput && result.success && result.outputPath) {
            const validationResult = this.qualityValidator.validateFile(result.outputPath);
            result.validation = validationResult;
        }
        
        return result;
    }
}

module.exports = DocumentationOrchestrator;
