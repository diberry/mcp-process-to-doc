/**
 * Usage Examples Builder
 * 
 * Generates comprehensive usage examples for Azure MCP Server tools
 * including context-aware scenarios, best practices, and common patterns.
 */

class UsageExamplesBuilder {
    constructor() {
        this.exampleTemplates = this.initializeExampleTemplates();
        this.scenarioPatterns = this.initializeScenarioPatterns();
        this.commonParameters = this.initializeCommonParameters();
    }

    /**
     * Build complete usage examples section for a tool
     * @param {Object} tool - Tool definition
     * @param {Array} relatedTools - Related tools for context
     * @param {Object} options - Generation options
     * @returns {string} Formatted usage examples section
     */
    buildUsageExamples(tool, relatedTools = [], options = {}) {
        const examples = this.generateExamples(tool, relatedTools, options);
        return this.formatExamplesSection(examples, options);
    }

    /**
     * Generate examples for a tool
     * @param {Object} tool - Tool definition
     * @param {Array} relatedTools - Related tools
     * @param {Object} options - Generation options
     * @returns {Array} Generated examples
     */
    generateExamples(tool, relatedTools, options) {
        const examples = [];
        const toolName = tool.function?.name;
        const operation = this.extractOperation(toolName);
        const service = this.extractService(toolName);

        // Basic usage example
        examples.push(this.generateBasicExample(tool, service, operation));

        // Scenario-based examples
        const scenarios = this.getRelevantScenarios(service, operation);
        scenarios.forEach(scenario => {
            examples.push(this.generateScenarioExample(tool, scenario, relatedTools));
        });

        // Advanced examples if requested
        if (options.includeAdvanced) {
            examples.push(this.generateAdvancedExample(tool, relatedTools));
        }

        // Error handling examples
        if (options.includeErrorHandling) {
            examples.push(this.generateErrorHandlingExample(tool));
        }

        return examples.filter(example => example !== null);
    }

    /**
     * Generate basic usage example
     * @param {Object} tool - Tool definition
     * @param {string} service - Service name
     * @param {string} operation - Operation type
     * @returns {Object} Basic example
     */
    generateBasicExample(tool, service, operation) {
        const toolName = tool.function?.name;
        const parameters = tool.function?.parameters?.properties || {};
        
        const example = {
            title: "Basic Usage",
            description: this.buildBasicDescription(service, operation),
            userPrompt: this.buildBasicPrompt(service, operation, parameters),
            explanation: this.buildBasicExplanation(tool, service, operation),
            expectedBehavior: this.buildExpectedBehavior(tool, operation)
        };

        return example;
    }

    /**
     * Generate scenario-based example
     * @param {Object} tool - Tool definition
     * @param {Object} scenario - Scenario template
     * @param {Array} relatedTools - Related tools
     * @returns {Object} Scenario example
     */
    generateScenarioExample(tool, scenario, relatedTools) {
        const toolName = tool.function?.name;
        const parameters = tool.function?.parameters?.properties || {};

        return {
            title: scenario.title,
            description: scenario.description,
            userPrompt: this.buildScenarioPrompt(scenario, parameters),
            explanation: this.buildScenarioExplanation(tool, scenario, relatedTools),
            expectedBehavior: scenario.expectedBehavior,
            followUp: scenario.followUp
        };
    }

    /**
     * Generate advanced example with multiple tools
     * @param {Object} tool - Tool definition
     * @param {Array} relatedTools - Related tools
     * @returns {Object} Advanced example
     */
    generateAdvancedExample(tool, relatedTools) {
        const service = this.extractService(tool.function?.name);
        const operation = this.extractOperation(tool.function?.name);

        return {
            title: "Advanced Workflow",
            description: `Complex workflow demonstrating ${service} operations in sequence`,
            userPrompt: this.buildAdvancedPrompt(tool, relatedTools),
            explanation: this.buildAdvancedExplanation(tool, relatedTools),
            expectedBehavior: "Executes a complete workflow with multiple related operations",
            bestPractices: this.getAdvancedBestPractices(service)
        };
    }

    /**
     * Generate error handling example
     * @param {Object} tool - Tool definition
     * @returns {Object} Error handling example
     */
    generateErrorHandlingExample(tool) {
        const service = this.extractService(tool.function?.name);
        
        return {
            title: "Error Handling",
            description: "Example of how the tool responds to invalid parameters or conditions",
            userPrompt: this.buildErrorPrompt(tool),
            explanation: "This example shows how to handle common error scenarios",
            expectedBehavior: "Tool provides clear error messages and suggests corrections",
            commonErrors: this.getCommonErrors(tool)
        };
    }

    /**
     * Build basic description
     * @param {string} service - Service name
     * @param {string} operation - Operation type
     * @returns {string} Description
     */
    buildBasicDescription(service, operation) {
        const operationMap = {
            'list': 'retrieve a list of',
            'get': 'get details about',
            'create': 'create a new',
            'delete': 'delete an existing',
            'update': 'update an existing',
            'query': 'query data from'
        };

        const actionText = operationMap[operation] || 'work with';
        return `Simple example to ${actionText} ${service} resources.`;
    }

    /**
     * Build basic user prompt
     * @param {string} service - Service name
     * @param {string} operation - Operation type
     * @param {Object} parameters - Tool parameters
     * @returns {string} User prompt
     */
    buildBasicPrompt(service, operation, parameters) {
        const hasSubscription = parameters.subscription;
        const hasResourceGroup = parameters['resource-group'];
        
        let prompt = "";
        
        switch (operation) {
            case 'list':
                if (hasSubscription) {
                    prompt = `List all ${service} resources in my subscription.`;
                } else {
                    prompt = `Show me the ${service} resources.`;
                }
                break;
            case 'get':
            case 'show':
                prompt = `Get details about my ${service} resource.`;
                break;
            case 'create':
                prompt = `Create a new ${service} resource.`;
                break;
            case 'delete':
                prompt = `Delete the ${service} resource.`;
                break;
            case 'query':
                prompt = `Query data from my ${service} service.`;
                break;
            default:
                prompt = `Help me work with ${service}.`;
        }

        return prompt;
    }

    /**
     * Build basic explanation
     * @param {Object} tool - Tool definition
     * @param {string} service - Service name
     * @param {string} operation - Operation type
     * @returns {string} Explanation
     */
    buildBasicExplanation(tool, service, operation) {
        const toolName = tool.function?.name;
        return `This prompt will invoke the \`${toolName}\` tool to ${operation} ${service} resources. The tool will use your current Azure authentication context to perform the operation.`;
    }

    /**
     * Build expected behavior description
     * @param {Object} tool - Tool definition
     * @param {string} operation - Operation type
     * @returns {string} Expected behavior
     */
    buildExpectedBehavior(tool, operation) {
        const behaviorMap = {
            'list': 'Returns a formatted list of resources with key properties',
            'get': 'Returns detailed information about the specified resource',
            'create': 'Creates the resource and returns confirmation with details',
            'delete': 'Deletes the resource and returns confirmation',
            'update': 'Updates the resource and returns the updated configuration',
            'query': 'Returns the query results in a readable format'
        };

        return behaviorMap[operation] || 'Performs the requested operation and returns relevant information';
    }

    /**
     * Build scenario prompt
     * @param {Object} scenario - Scenario template
     * @param {Object} parameters - Tool parameters
     * @returns {string} Scenario prompt
     */
    buildScenarioPrompt(scenario, parameters) {
        return scenario.promptTemplate.replace(/\{(\w+)\}/g, (match, param) => {
            return this.commonParameters[param] || `[${param}]`;
        });
    }

    /**
     * Build scenario explanation
     * @param {Object} tool - Tool definition
     * @param {Object} scenario - Scenario template
     * @param {Array} relatedTools - Related tools
     * @returns {string} Explanation
     */
    buildScenarioExplanation(tool, scenario, relatedTools) {
        let explanation = scenario.explanation;
        
        if (relatedTools.length > 0) {
            const relatedNames = relatedTools.map(t => t.function?.name).join(', ');
            explanation += ` This might be used in conjunction with: ${relatedNames}.`;
        }

        return explanation;
    }

    /**
     * Build advanced prompt with multiple operations
     * @param {Object} tool - Tool definition
     * @param {Array} relatedTools - Related tools
     * @returns {string} Advanced prompt
     */
    buildAdvancedPrompt(tool, relatedTools) {
        const service = this.extractService(tool.function?.name);
        const operation = this.extractOperation(tool.function?.name);

        if (operation === 'list') {
            return `List all ${service} resources, then show me details about the first one.`;
        } else if (operation === 'create') {
            return `Create a ${service} resource and then verify it was created successfully.`;
        } else {
            return `Help me perform a complete ${service} workflow including multiple operations.`;
        }
    }

    /**
     * Build advanced explanation
     * @param {Object} tool - Tool definition
     * @param {Array} relatedTools - Related tools
     * @returns {string} Explanation
     */
    buildAdvancedExplanation(tool, relatedTools) {
        const toolName = tool.function?.name;
        return `This workflow demonstrates chaining multiple operations together. The initial tool \`${toolName}\` will be followed by additional tools to complete the full scenario.`;
    }

    /**
     * Build error handling prompt
     * @param {Object} tool - Tool definition
     * @returns {string} Error prompt
     */
    buildErrorPrompt(tool) {
        const service = this.extractService(tool.function?.name);
        return `Show me ${service} resources that don't exist.`;
    }

    /**
     * Extract service name from tool name
     * @param {string} toolName - Tool name
     * @returns {string} Service name
     */
    extractService(toolName) {
        if (!toolName) return 'Azure';
        
        const match = toolName.match(/mcp_azure_mcp_ser_azmcp_([^_]+)_/);
        if (match) {
            const serviceMap = {
                'storage': 'Storage',
                'cosmos': 'Cosmos DB',
                'monitor': 'Monitor',
                'keyvault': 'Key Vault',
                'aks': 'AKS',
                'sql': 'SQL',
                'foundry': 'AI Foundry',
                'loadtesting': 'Load Testing'
            };
            return serviceMap[match[1]] || match[1];
        }
        
        return 'Azure';
    }

    /**
     * Extract operation from tool name
     * @param {string} toolName - Tool name
     * @returns {string} Operation type
     */
    extractOperation(toolName) {
        if (!toolName) return 'unknown';
        
        if (toolName.includes('_list')) return 'list';
        if (toolName.includes('_get')) return 'get';
        if (toolName.includes('_show')) return 'show';
        if (toolName.includes('_create')) return 'create';
        if (toolName.includes('_delete')) return 'delete';
        if (toolName.includes('_update')) return 'update';
        if (toolName.includes('_query')) return 'query';
        
        return 'manage';
    }

    /**
     * Get relevant scenarios for service and operation
     * @param {string} service - Service name
     * @param {string} operation - Operation type
     * @returns {Array} Relevant scenarios
     */
    getRelevantScenarios(service, operation) {
        const serviceKey = service.toLowerCase().replace(/\s+/g, '');
        const scenarios = this.scenarioPatterns[serviceKey] || this.scenarioPatterns.default;
        
        return scenarios.filter(scenario => 
            !scenario.operations || scenario.operations.includes(operation)
        );
    }

    /**
     * Format examples section
     * @param {Array} examples - Generated examples
     * @param {Object} options - Formatting options
     * @returns {string} Formatted section
     */
    formatExamplesSection(examples, options = {}) {
        let content = "## Usage Examples\n\n";
        
        examples.forEach((example, index) => {
            content += `### ${example.title}\n\n`;
            content += `${example.description}\n\n`;
            content += `**User Prompt:**\n`;
            content += `> ${example.userPrompt}\n\n`;
            content += `**Explanation:**\n`;
            content += `${example.explanation}\n\n`;
            content += `**Expected Behavior:**\n`;
            content += `${example.expectedBehavior}\n\n`;
            
            if (example.followUp) {
                content += `**Follow-up Actions:**\n`;
                content += `${example.followUp}\n\n`;
            }
            
            if (example.bestPractices) {
                content += `**Best Practices:**\n`;
                example.bestPractices.forEach(practice => {
                    content += `- ${practice}\n`;
                });
                content += '\n';
            }
            
            if (example.commonErrors) {
                content += `**Common Errors:**\n`;
                example.commonErrors.forEach(error => {
                    content += `- ${error}\n`;
                });
                content += '\n';
            }
            
            if (index < examples.length - 1) {
                content += '---\n\n';
            }
        });
        
        return content;
    }

    /**
     * Get advanced best practices for service
     * @param {string} service - Service name
     * @returns {Array} Best practices
     */
    getAdvancedBestPractices(service) {
        const practicesMap = {
            'Storage': [
                'Always verify resource existence before operations',
                'Use resource groups to organize related resources',
                'Consider access patterns when choosing storage options'
            ],
            'Cosmos DB': [
                'Monitor request units (RUs) for cost optimization',
                'Use appropriate consistency levels for your use case',
                'Structure queries to minimize cross-partition operations'
            ],
            'Monitor': [
                'Set appropriate time ranges for queries',
                'Use filters to reduce data volume',
                'Consider metric aggregation for better performance'
            ]
        };
        
        return practicesMap[service] || [
            'Follow Azure best practices for security and cost optimization',
            'Use resource tagging for better organization',
            'Monitor resource usage and costs regularly'
        ];
    }

    /**
     * Get common errors for tool
     * @param {Object} tool - Tool definition
     * @returns {Array} Common errors
     */
    getCommonErrors(tool) {
        const errors = [
            'Authentication errors - ensure you are logged into Azure CLI',
            'Permission errors - verify you have appropriate role assignments',
            'Resource not found - check resource names and subscription'
        ];
        
        const parameters = tool.function?.parameters?.properties || {};
        
        if (parameters.subscription) {
            errors.push('Invalid subscription ID - verify the subscription exists and is accessible');
        }
        
        if (parameters['resource-group']) {
            errors.push('Resource group not found - ensure the resource group exists in the subscription');
        }
        
        return errors;
    }

    /**
     * Initialize example templates
     */
    initializeExampleTemplates() {
        return {
            basic: {
                title: "Basic Usage",
                template: "Simple example to {action} {service} resources."
            },
            scenario: {
                title: "Real-world Scenario",
                template: "Practical example showing {service} usage in a {context} scenario."
            },
            advanced: {
                title: "Advanced Workflow",
                template: "Complex workflow demonstrating multiple {service} operations."
            }
        };
    }

    /**
     * Initialize scenario patterns
     */
    initializeScenarioPatterns() {
        return {
            storage: [
                {
                    title: "Development Environment Setup",
                    description: "Setting up storage for a development project",
                    promptTemplate: "I need to set up storage for my new web application project.",
                    explanation: "This scenario shows how to create and configure storage for application development.",
                    expectedBehavior: "Creates storage account with appropriate settings for development",
                    followUp: "You might then want to create containers and set up access policies."
                }
            ],
            cosmosdb: [
                {
                    title: "Data Migration Planning",
                    description: "Assessing Cosmos DB resources before migration",
                    promptTemplate: "Show me all my Cosmos DB accounts and their database information.",
                    explanation: "Common scenario when planning data migration or architecture review.",
                    expectedBehavior: "Provides comprehensive overview of Cosmos DB resources",
                    followUp: "You can then examine specific databases and containers for migration planning."
                }
            ],
            default: [
                {
                    title: "Resource Discovery",
                    description: "Finding resources in your subscription",
                    promptTemplate: "What {service} resources do I have in my subscription?",
                    explanation: "Common starting point for working with any Azure service.",
                    expectedBehavior: "Lists all relevant resources with key information"
                }
            ]
        };
    }

    /**
     * Initialize common parameters
     */
    initializeCommonParameters() {
        return {
            subscriptionId: "your-subscription-id",
            resourceGroup: "my-resource-group",
            location: "eastus",
            accountName: "myaccount",
            containerName: "mycontainer",
            databaseName: "mydatabase"
        };
    }
}

module.exports = UsageExamplesBuilder;
