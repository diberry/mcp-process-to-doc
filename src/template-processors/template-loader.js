/**
 * Enhanced Template Engine for Azure MCP Documentation Generation
 * 
 * This module provides advanced template processing using the generated-documentation.template.md
 * as the primary template source. It includes context-aware variable substitution,
 * content validation, and quality formatting.
 */

const fs = require('fs');
const path = require('path');

class EnhancedTemplateEngine {
    constructor(templatePath = './generated-documentation.template.md') {
        this.templatePath = templatePath;
        this.template = null;
        this.loadTemplate();
    }

    loadTemplate() {
        try {
            this.template = fs.readFileSync(this.templatePath, 'utf8');
            console.log('Successfully loaded enhanced template');
        } catch (error) {
            throw new Error(`Failed to load template from ${this.templatePath}: ${error.message}`);
        }
    }

    /**
     * Generate documentation for a tool using the enhanced template
     * @param {Object} toolData - Tool information object
     * @param {Object} commandsInfo - Extracted command information
     * @param {boolean} isPartial - Whether this is partial documentation
     * @returns {string} Generated markdown content
     */
    generateDocumentation(toolData, commandsInfo, isPartial = false) {
        const context = this.buildContext(toolData, commandsInfo, isPartial);
        return this.processTemplate(context);
    }

    /**
     * Build context object for template processing
     */
    buildContext(toolData, commandsInfo, isPartial) {
        const toolName = this.extractToolName(toolData);
        const displayName = this.generateDisplayName(toolName);
        const servicePath = this.generateServicePath(toolName);
        
        return {
            toolDisplayName: displayName,
            toolName: toolName,
            servicePath: servicePath,
            currentDate: new Date().toISOString().split('T')[0],
            mainPurpose: this.generateMainPurpose(toolData, commandsInfo),
            briefDescription: this.generateBriefDescription(toolData, commandsInfo),
            resourceType: this.generateResourceType(toolData),
            resources: this.generateResourcesText(toolData),
            toolSpecificKeywords: this.generateKeywords(toolData),
            operations: this.generateOperations(toolData, commandsInfo),
            isPartial: isPartial
        };
    }

    extractToolName(toolData) {
        if (toolData.id) {
            return toolData.id.replace(/^azure-/, '').replace(/-/g, ' ');
        }
        if (toolData.root) {
            return toolData.root.replace(/^azmcp\s+/, '').replace(/-/g, ' ');
        }
        return 'Unknown Tool';
    }

    generateDisplayName(toolName) {
        return toolName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    generateServicePath(toolName) {
        // Map common tool names to their Azure documentation paths
        const pathMappings = {
            'app configuration': 'azure-app-configuration',
            'key vault': 'key-vault',
            'cosmos db': 'cosmos-db',
            'storage': 'storage',
            'monitor': 'azure-monitor',
            'aks': 'aks',
            'sql': 'azure-sql',
            'postgres': 'postgresql',
            'redis': 'azure-cache-redis',
            'service bus': 'service-bus-messaging',
            'ai search': 'search',
            'load testing': 'load-testing'
        };

        return pathMappings[toolName.toLowerCase()] || toolName.replace(/\s+/g, '-').toLowerCase();
    }

    generateMainPurpose(toolData, commandsInfo) {
        const toolName = this.extractToolName(toolData);
        
        // Purpose mappings based on tool functionality
        const purposeMappings = {
            'app configuration': 'manage application settings and feature flags',
            'key vault': 'securely store and manage secrets, keys, and certificates',
            'cosmos db': 'work with globally distributed, multi-model database resources',
            'storage': 'manage blob containers, files, tables, and queues',
            'monitor': 'collect, analyze, and visualize metrics and logs',
            'aks': 'manage Kubernetes clusters and containerized applications',
            'sql': 'manage SQL databases and servers',
            'postgres': 'manage PostgreSQL database servers and instances',
            'redis': 'manage Redis cache instances and data',
            'service bus': 'manage message queues and topics for reliable messaging',
            'ai search': 'manage search indexes and perform intelligent search operations',
            'load testing': 'create and run performance tests for your applications'
        };

        return purposeMappings[toolName.toLowerCase()] || `manage ${toolName} resources and configurations`;
    }

    generateBriefDescription(toolData, commandsInfo) {
        const toolName = this.extractToolName(toolData);
        const displayName = this.generateDisplayName(toolName);
        
        // Description mappings for Azure services
        const descriptionMappings = {
            'app configuration': 'a service that helps you centrally manage application settings and feature flags',
            'key vault': 'a cloud service for securely storing and accessing secrets, keys, and certificates',
            'cosmos db': 'a globally distributed, multi-model database service for any scale',
            'storage': 'a cloud storage solution for modern data storage scenarios',
            'monitor': 'a comprehensive monitoring service for collecting, analyzing, and acting on telemetry',
            'aks': 'a managed Kubernetes service that simplifies deploying and managing containerized applications',
            'sql': 'a family of managed SQL database services built for the cloud',
            'postgres': 'a managed PostgreSQL database service for app development and deployment',
            'redis': 'a fully managed in-memory data store compatible with open-source Redis',
            'service bus': 'a fully managed enterprise message broker with message queues and publish-subscribe topics',
            'ai search': 'a search-as-a-service solution that provides rich search capabilities for applications',
            'load testing': 'a fully managed load testing service for optimizing application performance'
        };

        return descriptionMappings[toolName.toLowerCase()] || 
               `a service that provides ${toolName} capabilities for cloud applications`;
    }

    generateResourceType(toolData) {
        const toolName = this.extractToolName(toolData);
        
        const resourceMappings = {
            'app configuration': 'configuration stores and settings',
            'key vault': 'vaults, secrets, and certificates',
            'cosmos db': 'databases, containers, and documents',
            'storage': 'storage accounts, containers, and blobs',
            'monitor': 'workspaces, metrics, and alerts',
            'aks': 'clusters, nodes, and pods',
            'sql': 'servers, databases, and pools',
            'postgres': 'servers and databases',
            'redis': 'cache instances and data',
            'service bus': 'namespaces, queues, and topics',
            'ai search': 'search services and indexes',
            'load testing': 'test resources and runs'
        };

        return resourceMappings[toolName.toLowerCase()] || `${toolName} resources`;
    }

    generateResourcesText(toolData) {
        const toolName = this.extractToolName(toolData);
        return this.generateResourceType(toolData);
    }

    generateKeywords(toolData) {
        const toolName = this.extractToolName(toolData);
        const baseKeywords = toolName.replace(/\s+/g, ', ');
        
        const additionalKeywords = {
            'app configuration': 'feature flags, application settings, configuration management',
            'key vault': 'secrets, certificates, keys, security',
            'cosmos db': 'nosql, database, global distribution, multi-model',
            'storage': 'blob storage, file storage, data lake, containers',
            'monitor': 'metrics, logs, alerts, observability, telemetry',
            'aks': 'kubernetes, containers, orchestration, microservices',
            'sql': 'relational database, sql server, elastic pools',
            'postgres': 'postgresql, relational database, open source',
            'redis': 'cache, in-memory, key-value store, performance',
            'service bus': 'messaging, queues, topics, enterprise integration',
            'ai search': 'search, indexing, cognitive search, ai',
            'load testing': 'performance testing, scalability, benchmarking'
        };

        const additional = additionalKeywords[toolName.toLowerCase()] || '';
        return additional ? `${baseKeywords}, ${additional}` : baseKeywords;
    }

    generateOperations(toolData, commandsInfo) {
        if (!toolData.tools && !toolData.operations) {
            return '';
        }

        const operations = toolData.tools || toolData.operations || [];
        const grouped = this.groupOperationsByCategory(operations);
        
        let content = '';
        
        for (const [category, ops] of Object.entries(grouped)) {
            if (category === 'direct') {
                // Direct operations (no categories)
                ops.forEach(op => {
                    content += this.generateOperationSection(op, toolData, commandsInfo);
                });
            } else {
                // Categorized operations
                content += `## ${this.formatCategoryName(category)}\n\n`;
                content += `{Optional brief description of this category of operations if needed for clarity}\n\n`;
                
                ops.forEach(op => {
                    content += `### ${this.formatOperationName(op.name)}\n\n`;
                    content += this.generateOperationContent(op, toolData, commandsInfo);
                });
            }
        }
        
        return content;
    }

    groupOperationsByCategory(operations) {
        const grouped = { direct: [] };
        
        operations.forEach(op => {
            const name = op.name || op.id || '';
            const parts = name.split(' ');
            
            if (parts.length > 1) {
                const category = parts[0];
                if (!grouped[category]) {
                    grouped[category] = [];
                }
                grouped[category].push(op);
            } else {
                grouped.direct.push(op);
            }
        });
        
        return grouped;
    }

    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
    }

    formatOperationName(name) {
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    generateOperationSection(operation, toolData, commandsInfo) {
        const operationName = this.formatOperationName(operation.name || operation.id);
        const command = `${toolData.root || 'azmcp'} ${operation.name || operation.id}`;
        
        let content = `## ${operationName}\n\n`;
        content += `<!-- HTML comment with exact command from azmcp-commands.md -->\n`;
        content += `<!--\n${command}\n-->\n\n`;
        content += this.generateOperationContent(operation, toolData, commandsInfo);
        
        return content;
    }

    generateOperationContent(operation, toolData, commandsInfo) {
        let content = '';
        
        // Description
        content += this.generateOperationDescription(operation, toolData) + '\n\n';
        
        // Example prompts
        content += 'Example prompts include:\n\n';
        content += this.generateExamplePrompts(operation, toolData) + '\n\n';
        
        // Parameters table
        if (operation.params && operation.params.length > 0) {
            content += '| Parameter | Required or optional | Description |\n';
            content += '|-----------|-------------|-------------|\n';
            
            operation.params.forEach(param => {
                const required = param.required ? 'Required' : 'Optional';
                const description = this.enhanceParameterDescription(param, toolData);
                content += `| **${this.formatParameterName(param.name)}** | ${required} | ${description} |\n`;
            });
            
            content += '\n';
        }
        
        return content;
    }

    generateOperationDescription(operation, toolData) {
        const description = operation.description || '';
        const toolName = this.extractToolName(toolData);
        const operationName = operation.name || operation.id || '';
        
        if (description && description.length > 10) {
            return `${description} This enables you to efficiently manage your ${toolName} resources using natural language commands.`;
        }
        
        // Generate contextual description based on operation name
        const actionMappings = {
            'list': 'retrieve and display',
            'show': 'view detailed information about',
            'get': 'fetch specific',
            'create': 'create new',
            'delete': 'remove existing',
            'update': 'modify existing',
            'set': 'configure or update',
            'query': 'search and filter',
            'deploy': 'deploy and configure'
        };
        
        const action = Object.keys(actionMappings).find(key => operationName.toLowerCase().includes(key));
        const actionText = actionMappings[action] || 'manage';
        
        return `This operation allows you to ${actionText} ${toolName} resources. Use this when you need to work with your ${toolName} configurations and data.`;
    }

    generateExamplePrompts(operation, toolData) {
        const operationName = operation.name || operation.id || '';
        const toolName = this.extractToolName(toolData);
        const displayName = this.generateDisplayName(toolName);
        
        // Generate contextual example prompts
        const examples = [];
        
        if (operationName.includes('list')) {
            examples.push(`**List all resources**: "Show me all ${displayName} resources in my subscription"`);
            examples.push(`**View inventory**: "List all my ${toolName} instances"`);
            examples.push(`**Resource discovery**: "What ${displayName} resources do I have?"`);
        } else if (operationName.includes('show') || operationName.includes('get')) {
            examples.push(`**View details**: "Show me details for ${toolName} resource xyz"`);
            examples.push(`**Check configuration**: "Get the configuration of my ${displayName} instance"`);
        } else if (operationName.includes('create')) {
            examples.push(`**Create resource**: "Create a new ${displayName} instance named production"`);
            examples.push(`**Setup new instance**: "Set up a ${toolName} resource for my application"`);
        } else if (operationName.includes('delete')) {
            examples.push(`**Remove resource**: "Delete the ${displayName} instance named test"`);
            examples.push(`**Clean up**: "Remove all unused ${toolName} resources"`);
        } else if (operationName.includes('query')) {
            examples.push(`**Search resources**: "Find ${displayName} resources matching criteria xyz"`);
            examples.push(`**Filter results**: "Query ${toolName} data where status is active"`);
        } else {
            // Generic examples
            examples.push(`**Manage ${toolName}**: "Help me work with my ${displayName} resources"`);
            examples.push(`**${operationName} operation**: "I need to ${operationName.replace(/[-_]/g, ' ')} in ${displayName}"`);
        }
        
        // Ensure we have exactly 5 examples
        while (examples.length < 5) {
            examples.push(`**Work with ${toolName}**: "Manage my ${displayName} configuration"`);
        }
        
        return examples.slice(0, 5).map(example => `- ${example}`).join('\n');
    }

    enhanceParameterDescription(param, toolData) {
        let description = param.description || '';
        const paramName = param.name.toLowerCase();
        
        // Enhance common parameter descriptions
        const enhancements = {
            'subscription': 'The Azure subscription ID or name. This identifies which Azure subscription contains your resources.',
            'resource-group': 'The name of the Azure resource group. This is a logical container for organizing related Azure resources.',
            'account-name': 'The name of the storage account or service instance.',
            'database-name': 'The name of the database to access.',
            'container-name': 'The name of the container within the storage account.',
            'key': 'The identifier or name of the specific item to access.',
            'value': 'The value to set or update for the specified key.',
            'query': 'The search query or filter criteria to apply.',
            'limit': 'The maximum number of results to return (optional for pagination).',
            'filter': 'Additional filtering criteria to narrow down results.'
        };
        
        // Check for exact matches first
        if (enhancements[paramName]) {
            return enhancements[paramName];
        }
        
        // Check for partial matches
        for (const [key, enhancement] of Object.entries(enhancements)) {
            if (paramName.includes(key) || key.includes(paramName)) {
                return enhancement;
            }
        }
        
        // Return original description if it's meaningful, otherwise generate one
        if (description && description.length > 5) {
            return description;
        }
        
        return `The ${param.name.replace(/-/g, ' ')} parameter for this operation.`;
    }

    formatParameterName(name) {
        return name.replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    processTemplate(context) {
        let content = this.template;
        
        // Replace all template variables
        for (const [key, value] of Object.entries(context)) {
            const placeholder = `{${key}}`;
            content = content.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        }
        
        // Handle conditional sections
        content = this.handleConditionalSections(content, context);
        
        // Clean up any remaining placeholders
        content = this.cleanupTemplate(content);
        
        return content;
    }

    handleConditionalSections(content, context) {
        // Remove template comments and choose appropriate template section
        if (context.operations) {
            // Remove the categorized template section if we have direct operations
            if (!context.operations.includes('##') || context.operations.split('##').length <= 2) {
                content = content.replace(/<!-- TEMPLATE FOR TOOL WITH OPERATION CATEGORIES -->[\s\S]*$/m, '');
            } else {
                content = content.replace(/<!-- TEMPLATE FOR TOOL WITH DIRECT OPERATIONS \(NO CATEGORIES\) -->[\s\S]*?<!-- TEMPLATE FOR TOOL WITH OPERATION CATEGORIES -->/s, '');
            }
        }
        
        return content;
    }

    cleanupTemplate(content) {
        // Remove any remaining template placeholders
        content = content.replace(/\{[^}]+\}/g, '');
        
        // Remove template comment sections
        content = content.replace(/<!-- TEMPLATE FOR.*?-->/gs, '');
        
        // Clean up multiple consecutive newlines
        content = content.replace(/\n{3,}/g, '\n\n');
        
        // Add related content section if missing
        if (!content.includes('## Related content')) {
            content += this.generateRelatedContentSection();
        }
        
        return content.trim();
    }

    generateRelatedContentSection() {
        return `\n\n## Related content\n\n- [What are the Azure MCP Server tools?](index.md)\n- [Get started using Azure MCP Server](../get-started.md)\n- [Azure documentation](https://docs.microsoft.com/azure/)\n`;
    }
}

module.exports = EnhancedTemplateEngine;
