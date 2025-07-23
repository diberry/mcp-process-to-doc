/**
 * Example Prompt Builder - Generates varied, realistic example prompts
 * 
 * This module creates natural language examples that users would actually type,
 * following the template format: "**{Bold Summary}**: "{Natural language example}""
 */

class ExamplePromptBuilder {
    constructor() {
        this.promptPatterns = this.initializePromptPatterns();
        this.serviceContexts = this.initializeServiceContexts();
    }

    /**
     * Generate 5 varied example prompts for an operation
     * @param {Object} operationData - Operation information including name, parameters, purpose
     * @param {string} serviceName - Service name for context
     * @returns {Array} Array of formatted example prompt objects
     */
    generateExamplePrompts(operationData, serviceName) {
        const context = this.getServiceContext(serviceName);
        const examples = [];

        // Generate 5 different types of prompts
        examples.push(this.generateQuestionPrompt(operationData, context));
        examples.push(this.generateStatementPrompt(operationData, context));
        examples.push(this.generateIncompletePrompt(operationData, context));
        examples.push(this.generateTaskPrompt(operationData, context));
        examples.push(this.generateExploratoryPrompt(operationData, context));

        return examples.map(example => this.formatPromptForTemplate(example));
    }

    /**
     * Generate a question-style prompt
     */
    generateQuestionPrompt(operationData, context) {
        const operation = this.normalizeOperationName(operationData.name);
        const questionStarters = [
            'How can I',
            'What are the',
            'Can you show me',
            'How do I',
            'What is the way to'
        ];

        const starter = this.selectRandom(questionStarters);
        let prompt;

        if (operation.includes('list')) {
            prompt = `${starter} see all ${context.resourceTypes[0]} in my subscription?`;
        } else if (operation.includes('create') || operation.includes('deploy')) {
            prompt = `${starter} create a new ${context.resourceTypes[0]}?`;
        } else if (operation.includes('get') || operation.includes('show')) {
            prompt = `${starter} ${context.resourceTypes[0]} details for a specific resource?`;
        } else if (operation.includes('delete')) {
            prompt = `${starter} remove a ${context.resourceTypes[0]}?`;
        } else {
            prompt = `${starter} ${operation.replace(/-/g, ' ')} with ${context.displayName}?`;
        }

        return {
            summary: this.generateSummaryFromPrompt(prompt),
            text: prompt
        };
    }

    /**
     * Generate a statement-style prompt
     */
    generateStatementPrompt(operationData, context) {
        const operation = this.normalizeOperationName(operationData.name);
        const statements = [
            'I need to',
            'I want to',
            'Show me how to',
            'Help me',
            'I\'d like to'
        ];

        const starter = this.selectRandom(statements);
        let prompt;

        if (operation.includes('list')) {
            prompt = `${starter} view all my ${context.resourceTypes[0]}`;
        } else if (operation.includes('query')) {
            prompt = `${starter} search through ${context.resourceTypes[0]} data`;
        } else if (operation.includes('monitor') || operation.includes('metrics')) {
            prompt = `${starter} check the performance of my ${context.resourceTypes[0]}`;
        } else {
            prompt = `${starter} ${operation.replace(/-/g, ' ')} for my ${context.displayName} resources`;
        }

        return {
            summary: this.generateSummaryFromPrompt(prompt),
            text: prompt
        };
    }

    /**
     * Generate an incomplete phrase prompt
     */
    generateIncompletePrompt(operationData, context) {
        const operation = this.normalizeOperationName(operationData.name);
        const incompletePhrases = [
            `Get ${context.resourceTypes[0]}`,
            `List all`,
            `Show me`,
            `Find my`,
            `Check the`
        ];

        const phrase = this.selectRandom(incompletePhrases);
        let prompt;

        if (phrase === 'List all') {
            prompt = `List all ${context.resourceTypes[0]} in my subscription`;
        } else if (phrase === 'Show me') {
            prompt = `Show me ${context.resourceTypes[0]} information`;
        } else if (phrase === 'Find my') {
            prompt = `Find my ${context.resourceTypes[0]} resources`;
        } else if (phrase === 'Check the') {
            prompt = `Check the status of ${context.resourceTypes[0]}`;
        } else {
            prompt = phrase;
        }

        return {
            summary: this.generateSummaryFromPrompt(prompt),
            text: prompt
        };
    }

    /**
     * Generate a task-oriented prompt
     */
    generateTaskPrompt(operationData, context) {
        const operation = this.normalizeOperationName(operationData.name);
        const tasks = this.getTasksForOperation(operation, context);
        const task = this.selectRandom(tasks);

        return {
            summary: this.generateSummaryFromPrompt(task),
            text: task
        };
    }

    /**
     * Generate an exploratory prompt
     */
    generateExploratoryPrompt(operationData, context) {
        const exploratoryPhrases = [
            `What ${context.resourceTypes[0]} do I have available?`,
            `Tell me about my ${context.displayName} setup`,
            `What can I do with ${context.displayName}?`,
            `Show me ${context.displayName} options`,
            `Help me explore ${context.resourceTypes[0]}`
        ];

        const prompt = this.selectRandom(exploratoryPhrases);

        return {
            summary: this.generateSummaryFromPrompt(prompt),
            text: prompt
        };
    }

    /**
     * Get tasks specific to operation type and service
     */
    getTasksForOperation(operation, context) {
        const baseTasks = [
            `Manage my ${context.resourceTypes[0]} efficiently`,
            `Set up ${context.displayName} for my project`,
            `Configure ${context.resourceTypes[0]} properly`,
            `Monitor ${context.resourceTypes[0]} performance`,
            `Optimize my ${context.displayName} usage`
        ];

        if (operation.includes('deploy')) {
            baseTasks.push(`Deploy a new ${context.resourceTypes[0]} instance`);
        }
        if (operation.includes('scale')) {
            baseTasks.push(`Scale my ${context.resourceTypes[0]} resources`);
        }
        if (operation.includes('backup')) {
            baseTasks.push(`Backup my ${context.resourceTypes[0]} data`);
        }

        return baseTasks;
    }

    /**
     * Generate a concise summary from a prompt
     */
    generateSummaryFromPrompt(prompt) {
        // Extract key action words and create a 2-4 word summary
        const cleanPrompt = prompt.toLowerCase()
            .replace(/^(how can i|what are the|can you show me|how do i|what is the way to|i need to|i want to|show me how to|help me|i'd like to)\s*/i, '')
            .replace(/\?$/, '');

        const words = cleanPrompt.split(' ');
        
        // Find the main action verb and object
        const actionWords = ['list', 'show', 'get', 'create', 'delete', 'view', 'find', 'check', 'manage', 'deploy'];
        const actionWord = words.find(word => actionWords.some(action => word.includes(action))) || words[0];
        
        // Find the main object, limit to 2-3 words
        const objectWords = words.slice(1, 3).join(' ');
        
        const summary = `${this.capitalize(actionWord)} ${objectWords}`.trim();
        
        // Ensure summary is reasonable length
        return summary.length > 40 ? summary.substring(0, 37) + '...' : summary;
    }

    /**
     * Format prompt for template insertion
     */
    formatPromptForTemplate(exampleObj) {
        return `- **${exampleObj.summary}**: "${exampleObj.text}"`;
    }

    /**
     * Initialize service contexts for generating relevant examples
     */
    initializeServiceContexts() {
        return {
            'app-configuration': {
                displayName: 'App Configuration',
                resourceTypes: ['configuration stores', 'keys', 'values']
            },
            'key-vault': {
                displayName: 'Key Vault',
                resourceTypes: ['vaults', 'secrets', 'keys', 'certificates']
            },
            'cosmos-db': {
                displayName: 'Cosmos DB',
                resourceTypes: ['databases', 'containers', 'documents']
            },
            'storage': {
                displayName: 'Storage',
                resourceTypes: ['storage accounts', 'containers', 'blobs']
            },
            'monitor': {
                displayName: 'Monitor',
                resourceTypes: ['workspaces', 'metrics', 'logs']
            },
            'aks': {
                displayName: 'AKS',
                resourceTypes: ['clusters', 'nodes', 'pods']
            },
            'foundry': {
                displayName: 'AI Foundry',
                resourceTypes: ['models', 'deployments', 'endpoints']
            },
            'bicep': {
                displayName: 'Bicep Schema',
                resourceTypes: ['schemas', 'resources', 'templates']
            },
            'loadtesting': {
                displayName: 'Load Testing',
                resourceTypes: ['tests', 'test runs', 'resources']
            }
        };
    }

    /**
     * Initialize prompt patterns for different operation types
     */
    initializePromptPatterns() {
        return {
            list: ['show all', 'get list of', 'display', 'find all'],
            create: ['make new', 'set up', 'deploy', 'build'],
            delete: ['remove', 'clean up', 'destroy', 'eliminate'],
            update: ['modify', 'change', 'edit', 'adjust'],
            get: ['show details', 'display info', 'fetch', 'retrieve']
        };
    }

    /**
     * Helper methods
     */
    getServiceContext(serviceName) {
        const normalizedName = serviceName.toLowerCase().replace(/[^a-z]/g, '');
        return this.serviceContexts[normalizedName] || {
            displayName: serviceName,
            resourceTypes: ['resources']
        };
    }

    normalizeOperationName(name) {
        return name.toLowerCase().replace(/[^a-z-]/g, '');
    }

    selectRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

module.exports = ExamplePromptBuilder;
