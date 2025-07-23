/**
 * Main Entry Point - Azure MCP Server Documentation Generator
 * 
 * This is the main entry point that initializes all components and orchestrates
 * the complete documentation generation workflow.
 */

const ConfigurationManager = require('./config/configuration-manager');

// Data Extractors
const ToolsJsonProcessor = require('./data-extractors/tools-json-processor');
const AzmcpCommandsExtractor = require('./data-extractors/azmcp-commands-extractor');
const AzureDocsFetcher = require('./data-extractors/azure-docs-fetcher');
const ParameterExtractor = require('./data-extractors/parameter-extractor');

// Template Processors
const TemplateLoader = require('./template-processors/template-loader');
const SectionTemplateProcessor = require('./template-processors/section-template-processor');
const DocumentTemplateProcessor = require('./template-processors/document-template-processor');

// Content Builders
const ExamplePromptBuilder = require('./content-builders/example-prompt-builder');
const ParameterTableBuilder = require('./content-builders/parameter-table-builder');
const OperationBuilder = require('./content-builders/operation-builder');
const MetadataBuilder = require('./content-builders/metadata-builder');
const UsageExamplesBuilder = require('./content-builders/usage-examples-builder');

// Quality Controllers
const ContentValidator = require('./quality-controllers/content-validator');
const FormatChecker = require('./quality-controllers/format-checker');
const LinkValidator = require('./quality-controllers/link-validator');
const ConsistencyChecker = require('./quality-controllers/consistency-checker');
const ReferenceValidator = require('./quality-controllers/reference-validator');

// File Generators
const SingleDocGenerator = require('./file-generators/single-doc-generator');
const BatchDocGenerator = require('./file-generators/batch-doc-generator');
const OutputFileManager = require('./file-generators/output-file-manager');

// Workflows
const DocumentationOrchestrator = require('./workflows/documentation-orchestrator');

class AzureMcpDocGenerator {
    constructor(configPath = null) {
        this.configManager = new ConfigurationManager(configPath);
        this.components = {};
        this.orchestrator = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the documentation generator
     * @param {Object} configOverrides - Configuration overrides
     * @returns {Promise<void>}
     */
    async initialize(configOverrides = {}) {
        console.log('Initializing Azure MCP Documentation Generator...');

        // Load configuration
        await this.configManager.loadConfiguration(configOverrides);
        console.log('✓ Configuration loaded');

        // Initialize all components
        await this.initializeComponents();
        console.log('✓ Components initialized');

        // Initialize orchestrator
        this.initializeOrchestrator();
        console.log('✓ Orchestrator initialized');

        this.isInitialized = true;
        console.log('✓ Generator ready for use\n');
    }

    /**
     * Generate documentation using default workflow
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generation results
     */
    async generateDocumentation(options = {}) {
        if (!this.isInitialized) {
            throw new Error('Generator not initialized. Call initialize() first.');
        }

        console.log('Starting documentation generation...\n');

        const workflowOptions = {
            ...this.getDefaultWorkflowOptions(),
            ...options
        };

        // Set up progress tracking
        this.setupProgressTracking();

        try {
            const results = await this.orchestrator.executeWorkflow(workflowOptions);
            
            console.log('\n✓ Documentation generation completed successfully!');
            this.printGenerationSummary(results);
            
            return results;
        } catch (error) {
            console.error('\n✗ Documentation generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate documentation for a single tool
     * @param {string} toolName - Name of the tool
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generation results
     */
    async generateSingleTool(toolName, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Generator not initialized. Call initialize() first.');
        }

        console.log(`Generating documentation for tool: ${toolName}`);

        // Load tools data to find the specific tool
        const toolsData = await this.components.toolsExtractor.extractToolsData(
            this.configManager.get('source.toolsJsonPath')
        );

        const tool = toolsData.find(t => t.function?.name === toolName);
        if (!tool) {
            throw new Error(`Tool not found: ${toolName}`);
        }

        // Create single-tool workflow
        const workflowOptions = {
            id: `single-tool-${toolName}-${Date.now()}`,
            extractTools: false, // We already have the tool
            generateBatchDocs: false,
            options: {
                ...options,
                toolsSource: [tool], // Pass single tool
                outputSession: {
                    id: `single-${toolName}`,
                    ...options.outputSession
                }
            }
        };

        return await this.orchestrator.executeWorkflow(workflowOptions);
    }

    /**
     * Generate documentation for specific services
     * @param {Array} serviceNames - Array of service names
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generation results
     */
    async generateForServices(serviceNames, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Generator not initialized. Call initialize() first.');
        }

        console.log(`Generating documentation for services: ${serviceNames.join(', ')}`);

        // Filter tools by service
        const allTools = await this.components.toolsExtractor.extractToolsData(
            this.configManager.get('source.toolsJsonPath')
        );

        const filteredTools = allTools.filter(tool => {
            const toolName = tool.function?.name || '';
            return serviceNames.some(service => toolName.includes(service));
        });

        if (filteredTools.length === 0) {
            throw new Error(`No tools found for services: ${serviceNames.join(', ')}`);
        }

        console.log(`Found ${filteredTools.length} tools for the specified services`);

        const workflowOptions = {
            id: `services-${serviceNames.join('-')}-${Date.now()}`,
            extractTools: false,
            options: {
                ...options,
                toolsSource: filteredTools,
                outputSession: {
                    id: `services-${serviceNames.join('-')}`,
                    ...options.outputSession
                }
            }
        };

        return await this.orchestrator.executeWorkflow(workflowOptions);
    }

    /**
     * Validate existing documentation
     * @param {string} documentPath - Path to document or directory
     * @param {Object} options - Validation options
     * @returns {Promise<Object>} Validation results
     */
    async validateDocumentation(documentPath, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Generator not initialized. Call initialize() first.');
        }

        console.log(`Validating documentation at: ${documentPath}`);

        const fs = require('fs').promises;
        const path = require('path');

        let files = [];
        
        try {
            const stat = await fs.stat(documentPath);
            if (stat.isDirectory()) {
                const entries = await fs.readdir(documentPath);
                files = entries
                    .filter(file => file.endsWith('.md'))
                    .map(file => path.join(documentPath, file));
            } else {
                files = [documentPath];
            }
        } catch (error) {
            throw new Error(`Cannot access path: ${documentPath}`);
        }

        const results = {
            totalFiles: files.length,
            validationResults: [],
            summary: { passed: 0, failed: 0, warnings: 0 }
        };

        for (const filePath of files) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const fileName = path.basename(filePath);

                console.log(`Validating: ${fileName}`);

                const validation = await this.components.contentValidator.validateContent(
                    content, 
                    options.validationOptions
                );

                const format = await this.components.formatChecker.checkFormat(
                    content,
                    options.formatOptions
                );

                const fileResult = {
                    file: fileName,
                    path: filePath,
                    validation,
                    format,
                    overall: validation.isValid && format.isValid ? 'passed' : 'failed'
                };

                results.validationResults.push(fileResult);
                
                if (fileResult.overall === 'passed') {
                    results.summary.passed++;
                } else {
                    results.summary.failed++;
                }

            } catch (error) {
                results.validationResults.push({
                    file: path.basename(filePath),
                    path: filePath,
                    error: error.message,
                    overall: 'error'
                });
                results.summary.failed++;
            }
        }

        console.log(`\nValidation completed: ${results.summary.passed} passed, ${results.summary.failed} failed`);
        return results;
    }

    /**
     * Initialize all components
     */
    async initializeComponents() {
        const config = this.configManager;

        // Data Extractors
        this.components.toolsExtractor = new ToolsJsonProcessor();
        this.components.commandsExtractor = new AzmcpCommandsExtractor();
        this.components.azureDocsFetcher = new AzureDocsFetcher(config.getAzureConfig());
        this.components.parameterExtractor = new ParameterExtractor();

        // Template Processors
        this.components.templateLoader = new TemplateLoader(config.getTemplateConfig());
        this.components.sectionProcessor = new SectionTemplateProcessor();
        this.components.documentProcessor = new DocumentTemplateProcessor();
        
        // Set up processor dependencies
        this.components.documentProcessor.setSectionProcessor(this.components.sectionProcessor);

        // Content Builders
        this.components.exampleBuilder = new ExamplePromptBuilder();
        this.components.parameterTableBuilder = new ParameterTableBuilder();
        this.components.operationBuilder = new OperationBuilder();
        this.components.metadataBuilder = new MetadataBuilder();
        this.components.usageExamplesBuilder = new UsageExamplesBuilder();

        // Quality Controllers
        this.components.contentValidator = new ContentValidator(config.getQualityConfig());
        this.components.formatChecker = new FormatChecker(config.getQualityConfig());
        this.components.linkValidator = new LinkValidator(config.getQualityConfig());
        this.components.consistencyChecker = new ConsistencyChecker(config.getQualityConfig());
        this.components.referenceValidator = new ReferenceValidator(config.getQualityConfig());

        // File Generators
        this.components.outputFileManager = new OutputFileManager(config.getOutputConfig());
        this.components.singleDocGenerator = new SingleDocGenerator(
            this.components.outputFileManager,
            this.components.documentProcessor
        );
        this.components.batchDocGenerator = new BatchDocGenerator(
            this.components.outputFileManager,
            this.components.documentProcessor
        );
    }

    /**
     * Initialize orchestrator
     */
    initializeOrchestrator() {
        this.orchestrator = new DocumentationOrchestrator();
        this.orchestrator.initialize(this.components);
    }

    /**
     * Get default workflow options
     */
    getDefaultWorkflowOptions() {
        return {
            id: `workflow-${Date.now()}`,
            extractTools: true,
            extractCommands: true,
            fetchAzureServices: true,
            extractParameters: true,
            enableQualityControl: this.configManager.get('quality.enableValidation', true),
            generateIndividualDocs: true,
            generateBatchDocs: false,
            generateLogs: true,
            preserveSourceData: true,
            generateIndex: true,
            buildSections: {
                examples: true,
                parameters: true,
                operations: true
            },
            qualityChecks: {
                validation: this.configManager.get('quality.enableValidation', true),
                format: this.configManager.get('quality.enableFormatChecking', true),
                links: this.configManager.get('quality.enableLinkValidation', false),
                consistency: this.configManager.get('quality.enableConsistencyChecking', true),
                reference: this.configManager.get('quality.enableReferenceValidation', true)
            },
            options: {
                toolsSource: this.configManager.get('source.toolsJsonPath'),
                commandsSource: this.configManager.get('source.commandsPath'),
                azureServices: [], // Will be auto-detected from tools
                outputSession: {
                    id: `session-${Date.now()}`
                }
            }
        };
    }

    /**
     * Set up progress tracking
     */
    setupProgressTracking() {
        this.orchestrator.on('workflow:started', () => {
            console.log('🚀 Starting workflow...');
        });

        this.orchestrator.on('phase:started', (data) => {
            console.log(`📋 Starting phase: ${data.phase}`);
        });

        this.orchestrator.on('phase:completed', (data) => {
            console.log(`✅ Completed phase: ${data.phase}`);
        });

        this.orchestrator.on('step:started', (data) => {
            console.log(`  🔄 ${data.step}${data.document ? ` (${data.document})` : ''}`);
        });

        this.orchestrator.on('file:generated', (data) => {
            console.log(`  📄 Generated: ${data.file.filename}`);
        });

        this.orchestrator.on('workflow:error', (data) => {
            console.error(`❌ Workflow error: ${data.error.message}`);
        });
    }

    /**
     * Print generation summary
     */
    printGenerationSummary(results) {
        const session = results.sessionSummary;
        console.log('\n📊 Generation Summary:');
        console.log(`   Session ID: ${session.sessionId}`);
        console.log(`   Output Directory: ${session.directory}`);
        console.log(`   Files Generated: ${session.filesWritten}`);
        console.log(`   Total Size: ${this.formatBytes(session.totalSize)}`);
        
        if (session.files?.length > 0) {
            console.log('\n📁 Generated Files:');
            session.files.forEach(file => {
                console.log(`   - ${file.filename} (${this.formatBytes(file.size)})`);
            });
        }
    }

    /**
     * Format bytes for display
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get configuration manager
     */
    getConfigManager() {
        return this.configManager;
    }

    /**
     * Get component by name
     */
    getComponent(name) {
        return this.components[name];
    }

    /**
     * Get orchestrator instance
     */
    getOrchestrator() {
        return this.orchestrator;
    }
}

// Export both the class and a convenience function
module.exports = AzureMcpDocGenerator;

// Convenience function for quick usage
module.exports.createGenerator = (configPath) => {
    return new AzureMcpDocGenerator(configPath);
};

// CLI usage if run directly
if (require.main === module) {
    async function main() {
        try {
            const generator = new AzureMcpDocGenerator();
            await generator.initialize();
            
            const args = process.argv.slice(2);
            const command = args[0] || 'generate';
            
            switch (command) {
                case 'generate':
                    await generator.generateDocumentation();
                    break;
                case 'tool':
                    if (!args[1]) {
                        throw new Error('Tool name required: node main.js tool <toolname>');
                    }
                    await generator.generateSingleTool(args[1]);
                    break;
                case 'validate':
                    if (!args[1]) {
                        throw new Error('Path required: node main.js validate <path>');
                    }
                    await generator.validateDocumentation(args[1]);
                    break;
                default:
                    console.log('Usage: node main.js [generate|tool <name>|validate <path>]');
            }
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    }
    
    main();
}
