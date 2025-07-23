/**
 * Documentation Generation Orchestrator
 * 
 * Central orchestrator that coordinates the entire documentation generation workflow.
 * Manages the flow between data extraction, content building, quality control, and file output.
 */

class DocumentationOrchestrator {
    constructor() {
        this.components = {};
        this.currentWorkflow = null;
        this.workflowState = {};
        this.eventListeners = {};
    }

    /**
     * Initialize orchestrator with all required components
     * @param {Object} components - Component instances
     */
    initialize(components) {
        this.components = {
            configManager: components.configManager,
            toolsExtractor: components.toolsExtractor,
            commandsExtractor: components.commandsExtractor,
            azureDocsFetcher: components.azureDocsFetcher,
            parameterExtractor: components.parameterExtractor,
            
            templateLoader: components.templateLoader,
            sectionProcessor: components.sectionProcessor,
            documentProcessor: components.documentProcessor,
            
            exampleBuilder: components.exampleBuilder,
            parameterTableBuilder: components.parameterTableBuilder,
            operationBuilder: components.operationBuilder,
            metadataBuilder: components.metadataBuilder,
            usageExamplesBuilder: components.usageExamplesBuilder,
            
            contentValidator: components.contentValidator,
            formatChecker: components.formatChecker,
            linkValidator: components.linkValidator,
            consistencyChecker: components.consistencyChecker,
            referenceValidator: components.referenceValidator,
            
            singleDocGenerator: components.singleDocGenerator,
            batchDocGenerator: components.batchDocGenerator,
            outputFileManager: components.outputFileManager
        };

        this.validateComponents();
    }

    /**
     * Execute complete documentation generation workflow
     * @param {Object} workflowOptions - Workflow configuration
     * @returns {Promise<Object>} Workflow results
     */
    async executeWorkflow(workflowOptions = {}) {
        const workflow = this.createWorkflow(workflowOptions);
        this.currentWorkflow = workflow;

        try {
            this.emit('workflow:started', workflow);
            
            // Phase 1: Data Extraction
            const extractedData = await this.executeDataExtraction(workflow);
            this.updateWorkflowState('dataExtraction', extractedData);
            this.emit('phase:completed', { phase: 'dataExtraction', data: extractedData });

            // Phase 2: Content Processing
            const processedContent = await this.executeContentProcessing(extractedData, workflow);
            this.updateWorkflowState('contentProcessing', processedContent);
            this.emit('phase:completed', { phase: 'contentProcessing', data: processedContent });

            // Phase 3: Quality Control
            const qualityResults = await this.executeQualityControl(processedContent, workflow);
            this.updateWorkflowState('qualityControl', qualityResults);
            this.emit('phase:completed', { phase: 'qualityControl', data: qualityResults });

            // Phase 4: File Generation
            const outputResults = await this.executeFileGeneration(processedContent, qualityResults, workflow);
            this.updateWorkflowState('fileGeneration', outputResults);
            this.emit('phase:completed', { phase: 'fileGeneration', data: outputResults });

            // Finalize workflow
            const finalResults = await this.finalizeWorkflow(workflow);
            this.emit('workflow:completed', finalResults);

            return finalResults;

        } catch (error) {
            this.emit('workflow:error', { error, workflow });
            throw error;
        } finally {
            this.currentWorkflow = null;
        }
    }

    /**
     * Execute data extraction phase
     * @param {Object} workflow - Workflow configuration
     * @returns {Promise<Object>} Extracted data
     */
    async executeDataExtraction(workflow) {
        this.emit('phase:started', { phase: 'dataExtraction' });

        const results = {
            tools: null,
            commands: null,
            azureServices: null,
            parameters: null,
            timestamp: new Date().toISOString()
        };

        // Extract tools data
        if (workflow.extractTools) {
            this.emit('step:started', { step: 'extractTools' });
            results.tools = await this.components.toolsExtractor.extractToolsData(
                workflow.options.toolsSource
            );
            this.emit('step:completed', { step: 'extractTools', data: results.tools });
        }

        // Extract commands data
        if (workflow.extractCommands) {
            this.emit('step:started', { step: 'extractCommands' });
            results.commands = await this.components.commandsExtractor.extractCommands(
                workflow.options.commandsSource
            );
            this.emit('step:completed', { step: 'extractCommands', data: results.commands });
        }

        // Fetch Azure service information
        if (workflow.fetchAzureServices) {
            this.emit('step:started', { step: 'fetchAzureServices' });
            results.azureServices = await this.components.azureDocsFetcher.fetchServiceDocumentation(
                workflow.options.azureServices
            );
            this.emit('step:completed', { step: 'fetchAzureServices', data: results.azureServices });
        }

        // Extract and normalize parameters
        if (workflow.extractParameters && results.tools) {
            this.emit('step:started', { step: 'extractParameters' });
            results.parameters = await this.components.parameterExtractor.extractParameters(
                results.tools,
                workflow.options.parameterOptions
            );
            this.emit('step:completed', { step: 'extractParameters', data: results.parameters });
        }

        return results;
    }

    /**
     * Execute content processing phase
     * @param {Object} extractedData - Data from extraction phase
     * @param {Object} workflow - Workflow configuration
     * @returns {Promise<Object>} Processed content
     */
    async executeContentProcessing(extractedData, workflow) {
        this.emit('phase:started', { phase: 'contentProcessing' });

        const results = {
            documents: [],
            sections: {},
            metadata: {},
            timestamp: new Date().toISOString()
        };

        // Load templates
        this.emit('step:started', { step: 'loadTemplates' });
        const templates = await this.components.templateLoader.loadTemplates(
            workflow.options.templateOptions
        );
        this.emit('step:completed', { step: 'loadTemplates', data: templates });

        // Process each tool/service
        if (extractedData.tools) {
            for (const tool of extractedData.tools) {
                const serviceName = this.extractServiceName(tool);
                const serviceInfo = extractedData.azureServices?.[serviceName] || {};

                // Build content sections
                const sections = await this.buildContentSections(
                    tool, 
                    serviceInfo, 
                    extractedData, 
                    workflow
                );

                // Generate metadata
                const metadata = this.components.metadataBuilder.buildMetadata(
                    tool, 
                    serviceInfo, 
                    workflow.options.metadataOptions
                );

                // Process document
                const document = await this.components.documentProcessor.processDocument(
                    workflow.options.documentTemplate || 'azure-tool',
                    {
                        tool,
                        serviceInfo,
                        sections,
                        metadata,
                        ...extractedData
                    },
                    workflow.options.documentOptions
                );

                results.documents.push({
                    name: tool.function?.name || 'unknown',
                    serviceName,
                    content: document,
                    metadata,
                    sections
                });
            }
        }

        return results;
    }

    /**
     * Execute quality control phase
     * @param {Object} processedContent - Content from processing phase
     * @param {Object} workflow - Workflow configuration
     * @returns {Promise<Object>} Quality control results
     */
    async executeQualityControl(processedContent, workflow) {
        this.emit('phase:started', { phase: 'qualityControl' });

        const results = {
            validationResults: [],
            formatResults: [],
            linkResults: [],
            consistencyResults: [],
            referenceResults: [],
            summary: {},
            timestamp: new Date().toISOString()
        };

        if (!workflow.enableQualityControl) {
            return results;
        }

        for (const document of processedContent.documents) {
            const documentResults = {
                documentName: document.name,
                validation: null,
                format: null,
                links: null,
                consistency: null,
                reference: null
            };

            // Content validation
            if (workflow.qualityChecks.validation) {
                this.emit('step:started', { step: 'validateContent', document: document.name });
                documentResults.validation = await this.components.contentValidator.validateContent(
                    document.content,
                    workflow.options.validationOptions
                );
                this.emit('step:completed', { step: 'validateContent', document: document.name });
            }

            // Format checking
            if (workflow.qualityChecks.format) {
                this.emit('step:started', { step: 'checkFormat', document: document.name });
                documentResults.format = await this.components.formatChecker.checkFormat(
                    document.content,
                    workflow.options.formatOptions
                );
                this.emit('step:completed', { step: 'checkFormat', document: document.name });
            }

            // Link validation
            if (workflow.qualityChecks.links) {
                this.emit('step:started', { step: 'validateLinks', document: document.name });
                documentResults.links = await this.components.linkValidator.validateLinks(
                    document.content,
                    workflow.options.linkOptions
                );
                this.emit('step:completed', { step: 'validateLinks', document: document.name });
            }

            // Consistency checking
            if (workflow.qualityChecks.consistency) {
                this.emit('step:started', { step: 'checkConsistency', document: document.name });
                documentResults.consistency = await this.components.consistencyChecker.checkConsistency(
                    document.content,
                    processedContent.documents.map(d => d.content),
                    workflow.options.consistencyOptions
                );
                this.emit('step:completed', { step: 'checkConsistency', document: document.name });
            }

            // Reference validation
            if (workflow.qualityChecks.reference) {
                this.emit('step:started', { step: 'validateReferences', document: document.name });
                documentResults.reference = await this.components.referenceValidator.validateReferences(
                    document.content,
                    workflow.options.referenceOptions
                );
                this.emit('step:completed', { step: 'validateReferences', document: document.name });
            }

            results.validationResults.push(documentResults);
        }

        // Generate quality summary
        results.summary = this.generateQualitySummary(results);

        return results;
    }

    /**
     * Execute file generation phase
     * @param {Object} processedContent - Processed content
     * @param {Object} qualityResults - Quality control results
     * @param {Object} workflow - Workflow configuration
     * @returns {Promise<Object>} File generation results
     */
    async executeFileGeneration(processedContent, qualityResults, workflow) {
        this.emit('phase:started', { phase: 'fileGeneration' });

        // Initialize output session
        await this.components.outputFileManager.initializeSession(workflow.options.outputSession);

        const results = {
            generatedFiles: [],
            logFiles: [],
            sourceFiles: [],
            errors: [],
            timestamp: new Date().toISOString()
        };

        // Generate individual documents
        if (workflow.generateIndividualDocs) {
            for (const document of processedContent.documents) {
                try {
                    const fileInfo = await this.components.singleDocGenerator.generateDocument(
                        document,
                        workflow.options.singleDocOptions
                    );
                    results.generatedFiles.push(fileInfo);
                    this.emit('file:generated', { file: fileInfo, document: document.name });
                } catch (error) {
                    results.errors.push({
                        document: document.name,
                        error: error.message
                    });
                    this.emit('file:error', { document: document.name, error });
                }
            }
        }

        // Generate batch documentation
        if (workflow.generateBatchDocs) {
            try {
                const batchResult = await this.components.batchDocGenerator.generateBatch(
                    processedContent.documents,
                    workflow.options.batchDocOptions
                );
                results.generatedFiles.push(...batchResult.files);
                this.emit('batch:generated', { result: batchResult });
            } catch (error) {
                results.errors.push({
                    operation: 'batch generation',
                    error: error.message
                });
                this.emit('batch:error', { error });
            }
        }

        // Write log files
        if (workflow.generateLogs) {
            const logResult = await this.generateLogFiles(qualityResults, workflow);
            results.logFiles.push(...logResult);
        }

        // Write source files
        if (workflow.preserveSourceData) {
            const sourceResult = await this.generateSourceFiles(processedContent, workflow);
            results.sourceFiles.push(...sourceResult);
        }

        // Generate index
        if (workflow.generateIndex) {
            const indexResult = await this.components.outputFileManager.generateIndex(
                workflow.options.indexOptions
            );
            results.generatedFiles.push(indexResult);
        }

        return results;
    }

    /**
     * Build content sections for a tool
     * @param {Object} tool - Tool definition
     * @param {Object} serviceInfo - Service information
     * @param {Object} extractedData - All extracted data
     * @param {Object} workflow - Workflow configuration
     * @returns {Promise<Object>} Built sections
     */
    async buildContentSections(tool, serviceInfo, extractedData, workflow) {
        const sections = {};

        // Build examples
        if (workflow.buildSections.examples) {
            sections.examples = await this.components.usageExamplesBuilder.buildUsageExamples(
                tool,
                extractedData.tools || [],
                workflow.options.examplesOptions
            );
        }

        // Build parameter table
        if (workflow.buildSections.parameters) {
            sections.parameters = await this.components.parameterTableBuilder.buildParameterTable(
                tool,
                extractedData.parameters?.[tool.function?.name],
                workflow.options.parameterOptions
            );
        }

        // Build operations overview
        if (workflow.buildSections.operations) {
            sections.operations = await this.components.operationBuilder.buildOperationDescription(
                tool,
                serviceInfo,
                workflow.options.operationOptions
            );
        }

        return sections;
    }

    /**
     * Generate log files
     * @param {Object} qualityResults - Quality control results
     * @param {Object} workflow - Workflow configuration
     * @returns {Promise<Array>} Generated log files
     */
    async generateLogFiles(qualityResults, workflow) {
        const logFiles = [];

        // Quality control log
        if (qualityResults.summary) {
            const qualityLog = JSON.stringify(qualityResults, null, 2);
            const logFile = await this.components.outputFileManager.writeLogFile(
                'quality-control',
                qualityLog
            );
            logFiles.push(logFile);
        }

        // Workflow state log
        const workflowLog = JSON.stringify(this.workflowState, null, 2);
        const stateLogFile = await this.components.outputFileManager.writeLogFile(
            'workflow-state',
            workflowLog
        );
        logFiles.push(stateLogFile);

        return logFiles;
    }

    /**
     * Generate source data files
     * @param {Object} processedContent - Processed content
     * @param {Object} workflow - Workflow configuration
     * @returns {Promise<Array>} Generated source files
     */
    async generateSourceFiles(processedContent, workflow) {
        const sourceFiles = [];

        // Save tools data
        if (this.workflowState.dataExtraction?.tools) {
            const toolsFile = await this.components.outputFileManager.writeSourceFile(
                'tools.json',
                JSON.stringify(this.workflowState.dataExtraction.tools, null, 2)
            );
            sourceFiles.push(toolsFile);
        }

        // Save commands data
        if (this.workflowState.dataExtraction?.commands) {
            const commandsFile = await this.components.outputFileManager.writeSourceFile(
                'commands.json',
                JSON.stringify(this.workflowState.dataExtraction.commands, null, 2)
            );
            sourceFiles.push(commandsFile);
        }

        return sourceFiles;
    }

    /**
     * Create workflow configuration
     * @param {Object} options - Workflow options
     * @returns {Object} Workflow configuration
     */
    createWorkflow(options) {
        const defaults = {
            id: `workflow_${Date.now()}`,
            extractTools: true,
            extractCommands: true,
            fetchAzureServices: true,
            extractParameters: true,
            enableQualityControl: true,
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
                validation: true,
                format: true,
                links: false,
                consistency: true,
                reference: true
            },
            options: {}
        };

        return { ...defaults, ...options };
    }

    /**
     * Extract service name from tool
     * @param {Object} tool - Tool definition
     * @returns {string} Service name
     */
    extractServiceName(tool) {
        const toolName = tool.function?.name || '';
        const match = toolName.match(/mcp_azure_mcp_ser_azmcp_([^_]+)_/);
        return match ? match[1] : 'azure';
    }

    /**
     * Generate quality summary
     * @param {Object} qualityResults - Quality results
     * @returns {Object} Summary
     */
    generateQualitySummary(qualityResults) {
        const summary = {
            totalDocuments: qualityResults.validationResults.length,
            passedValidation: 0,
            passedFormat: 0,
            totalIssues: 0
        };

        qualityResults.validationResults.forEach(result => {
            if (result.validation?.isValid) summary.passedValidation++;
            if (result.format?.isValid) summary.passedFormat++;
            
            Object.values(result).forEach(check => {
                if (check?.issues) summary.totalIssues += check.issues.length;
            });
        });

        return summary;
    }

    /**
     * Finalize workflow
     * @param {Object} workflow - Workflow configuration
     * @returns {Promise<Object>} Final results
     */
    async finalizeWorkflow(workflow) {
        const sessionSummary = this.components.outputFileManager.getSessionSummary();
        
        return {
            workflowId: workflow.id,
            sessionSummary,
            workflowState: this.workflowState,
            completedAt: new Date().toISOString()
        };
    }

    /**
     * Update workflow state
     * @param {string} phase - Phase name
     * @param {*} data - Phase data
     */
    updateWorkflowState(phase, data) {
        this.workflowState[phase] = {
            data,
            completedAt: new Date().toISOString()
        };
    }

    /**
     * Validate required components
     */
    validateComponents() {
        const required = [
            'configManager', 'toolsExtractor', 'outputFileManager',
            'templateLoader', 'documentProcessor', 'singleDocGenerator'
        ];

        const missing = required.filter(name => !this.components[name]);
        if (missing.length > 0) {
            throw new Error(`Missing required components: ${missing.join(', ')}`);
        }
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event listener
     */
    on(event, listener) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(listener);
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get current workflow status
     * @returns {Object} Workflow status
     */
    getWorkflowStatus() {
        return {
            currentWorkflow: this.currentWorkflow?.id || null,
            workflowState: this.workflowState,
            isRunning: Boolean(this.currentWorkflow)
        };
    }
}

module.exports = DocumentationOrchestrator;
