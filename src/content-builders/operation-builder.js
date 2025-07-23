/**
 * Operation Builder - Assembles complete operation sections
 * 
 * This module creates full operation sections following the template format:
 * - Operation title
 * - HTML comment with command
 * - Description
 * - Example prompts
 * - Parameter table
 */

const ExamplePromptBuilder = require('./example-prompt-builder');
const ParameterTableBuilder = require('./parameter-table-builder');

class OperationBuilder {
    constructor() {
        this.exampleBuilder = new ExamplePromptBuilder();
        this.parameterBuilder = new ParameterTableBuilder();
        this.operationDescriptions = this.initializeOperationDescriptions();
    }

    /**
     * Build a complete operation section
     * @param {Object} operationData - Operation information
     * @param {string} serviceName - Service name for context
     * @returns {string} Complete markdown section
     */
    buildOperationSection(operationData, serviceName) {
        const title = this.generateOperationTitle(operationData);
        const command = this.formatCommandComment(operationData);
        const description = this.generateOperationDescription(operationData, serviceName);
        const examples = this.generateExamplePrompts(operationData, serviceName);
        const parameters = this.generateParameterTable(operationData, serviceName);

        return this.assembleSection(title, command, description, examples, parameters);
    }

    /**
     * Generate natural language operation title
     */
    generateOperationTitle(operationData) {
        const name = operationData.name || operationData.operation || 'Operation';
        
        // Convert technical names to natural language
        const titleMappings = {
            'list': 'List resources',
            'get': 'Get resource details',
            'show': 'Show resource information',
            'create': 'Create a new resource',
            'delete': 'Delete a resource',
            'update': 'Update resource settings',
            'deploy': 'Deploy a resource',
            'scale': 'Scale resources',
            'query': 'Query data',
            'monitor': 'Monitor performance',
            'backup': 'Backup data',
            'restore': 'Restore from backup'
        };

        // Try exact match first
        const exactMatch = titleMappings[name.toLowerCase()];
        if (exactMatch) {
            return exactMatch;
        }

        // Try partial matches
        for (const [key, value] of Object.entries(titleMappings)) {
            if (name.toLowerCase().includes(key)) {
                const resourceType = this.inferResourceType(operationData);
                return value.replace('resource', resourceType.replace(/s$/, '')); // Remove trailing 's' to avoid duplication
            }
        }

        // Default: convert kebab-case to title case
        return name
            .split(/[-_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Format HTML command comment
     */
    formatCommandComment(operationData) {
        let command = 'azmcp';
        
        if (operationData.fullCommand) {
            command = operationData.fullCommand;
        } else {
            // Build command from parts
            if (operationData.tool) command += ` ${operationData.tool}`;
            if (operationData.category) command += ` ${operationData.category}`;
            if (operationData.operation) command += ` ${operationData.operation}`;
            
            // Add common parameters
            if (operationData.parameters && operationData.parameters.length > 0) {
                const paramNames = operationData.parameters
                    .slice(0, 3) // Show first 3 parameters
                    .map(p => `--${p.name}`)
                    .join(' ');
                command += ` ${paramNames}`;
            }
        }

        return `<!--\n${command}\n-->`;
    }

    /**
     * Generate operation description
     */
    generateOperationDescription(operationData, serviceName) {
        const operationName = operationData.name || operationData.operation || '';
        
        // Check for predefined descriptions
        const predefined = this.operationDescriptions[operationName.toLowerCase()];
        if (predefined) {
            return predefined.replace('{service}', serviceName);
        }

        // Generate contextual description
        return this.generateContextualDescription(operationData, serviceName);
    }

    /**
     * Generate contextual description based on operation type
     */
    generateContextualDescription(operationData, serviceName) {
        const operation = operationData.name?.toLowerCase() || '';
        const resourceType = this.inferResourceType(operationData);

        if (operation.includes('list')) {
            return `This operation retrieves and displays all ${resourceType} available in your ${serviceName} service. Use this when you need an overview of your resources or want to find specific items by browsing the complete list.`;
        }

        if (operation.includes('get') || operation.includes('show')) {
            return `This operation fetches detailed information about a specific ${resourceType}. Use this when you need comprehensive details about a particular resource, including its configuration, status, and properties.`;
        }

        if (operation.includes('create') || operation.includes('deploy')) {
            return `This operation creates a new ${resourceType} in your ${serviceName} service. Use this when you need to provision new resources for your applications or expand your current infrastructure.`;
        }

        if (operation.includes('delete') || operation.includes('remove')) {
            return `This operation removes a ${resourceType} from your ${serviceName} service. Use this when you no longer need a resource and want to clean up your infrastructure to reduce costs.`;
        }

        if (operation.includes('update') || operation.includes('modify')) {
            return `This operation modifies the configuration or properties of an existing ${resourceType}. Use this when you need to adjust settings, change configurations, or update resource properties.`;
        }

        if (operation.includes('query')) {
            return `This operation executes queries against your ${serviceName} data. Use this when you need to search, filter, or analyze data using query syntax to find specific information.`;
        }

        if (operation.includes('monitor') || operation.includes('metrics')) {
            return `This operation retrieves monitoring data and performance metrics for your ${serviceName} resources. Use this when you need to analyze performance, troubleshoot issues, or track resource utilization.`;
        }

        // Generic fallback
        return `This operation performs ${operation.replace(/-/g, ' ')} actions on your ${serviceName} resources. Use this operation to manage and interact with your ${resourceType} as needed.`;
    }

    /**
     * Generate example prompts for the operation
     */
    generateExamplePrompts(operationData, serviceName) {
        const examples = this.exampleBuilder.generateExamplePrompts(operationData, serviceName);
        
        const header = 'Example prompts include:\n';
        const exampleLines = examples.join('\n');
        
        return header + exampleLines;
    }

    /**
     * Generate parameter table for the operation
     */
    generateParameterTable(operationData, serviceName) {
        const parameters = operationData.parameters || [];
        return this.parameterBuilder.generateParameterTable(parameters, serviceName);
    }

    /**
     * Assemble the complete section
     */
    assembleSection(title, command, description, examples, parameters) {
        return [
            `## ${title}`,
            '',
            command,
            '',
            description,
            '',
            examples,
            '',
            parameters,
            ''
        ].join('\n');
    }

    /**
     * Infer resource type from operation data
     */
    inferResourceType(operationData) {
        const operation = operationData.name?.toLowerCase() || '';
        const tool = operationData.tool?.toLowerCase() || '';

        // Service-specific resource types
        const resourceMappings = {
            'storage': 'storage resources',
            'keyvault': 'vault resources',
            'key-vault': 'vault resources',
            'cosmos': 'database resources',
            'sql': 'database resources',
            'monitor': 'monitoring resources',
            'aks': 'cluster resources',
            'loadtesting': 'test resources',
            'foundry': 'AI model resources',
            'bicep': 'template resources'
        };

        // Check tool name first
        for (const [key, value] of Object.entries(resourceMappings)) {
            if (tool.includes(key)) {
                return value;
            }
        }

        // Operation-specific inference
        if (operation.includes('database') || operation.includes('db')) {
            return 'database resources';
        }
        if (operation.includes('container')) {
            return 'container resources';
        }
        if (operation.includes('key') || operation.includes('secret')) {
            return 'key vault resources';
        }
        if (operation.includes('metric') || operation.includes('log')) {
            return 'monitoring resources';
        }

        return 'resources';
    }

    /**
     * Initialize operation-specific descriptions
     */
    initializeOperationDescriptions() {
        return {
            'list': 'This operation retrieves and displays all {service} resources available in your subscription. Use this when you need an overview of your resources or want to find specific items.',
            'get': 'This operation fetches detailed information about a specific {service} resource. Use this when you need comprehensive details about a particular resource.',
            'show': 'This operation displays detailed information about a specific {service} resource. Use this when you need to view configuration, status, and properties.',
            'create': 'This operation creates a new {service} resource. Use this when you need to provision new resources for your applications.',
            'delete': 'This operation removes a {service} resource. Use this when you no longer need a resource and want to clean up your infrastructure.',
            'update': 'This operation modifies an existing {service} resource. Use this when you need to adjust settings or change configurations.',
            'deploy': 'This operation deploys a new {service} resource. Use this when you need to provision and configure resources for deployment.',
            'query': 'This operation executes queries against your {service} data. Use this when you need to search, filter, or analyze data.',
            'monitor': 'This operation retrieves monitoring data for your {service} resources. Use this when you need to analyze performance or troubleshoot issues.'
        };
    }
}

module.exports = OperationBuilder;
