/**
 * Parameter Extractor
 * 
 * Extracts and normalizes parameter information from Azure MCP tools
 * to create comprehensive parameter documentation with proper types,
 * descriptions, and usage examples.
 */

class ParameterExtractor {
    constructor() {
        this.parameterTypes = this.initializeParameterTypes();
        this.commonParameters = this.initializeCommonParameters();
        this.parameterDescriptions = this.initializeParameterDescriptions();
    }

    /**
     * Extract parameters from tool definition
     * @param {Object} tool - Tool definition object
     * @returns {Array} Normalized parameter information
     */
    extractParameters(tool) {
        if (!tool || !tool.function || !tool.function.parameters) {
            return [];
        }

        const parameters = tool.function.parameters;
        const requiredParams = parameters.required || [];
        const properties = parameters.properties || {};

        return Object.entries(properties).map(([name, definition]) => {
            return this.normalizeParameter(name, definition, requiredParams.includes(name));
        });
    }

    /**
     * Normalize parameter information
     * @param {string} name - Parameter name
     * @param {Object} definition - Parameter definition
     * @param {boolean} isRequired - Whether parameter is required
     * @returns {Object} Normalized parameter
     */
    normalizeParameter(name, definition, isRequired) {
        return {
            name: name,
            type: this.normalizeType(definition.type),
            required: isRequired ? 'Required' : 'Optional',
            description: this.generateDescription(name, definition),
            example: this.generateExample(name, definition),
            validation: this.extractValidation(definition),
            category: this.categorizeParameter(name),
            commonValues: this.getCommonValues(name, definition)
        };
    }

    /**
     * Generate comprehensive parameter description
     * @param {string} name - Parameter name
     * @param {Object} definition - Parameter definition
     * @returns {string} Enhanced description
     */
    generateDescription(name, definition) {
        // Use existing description if available
        if (definition.description && definition.description.length > 20) {
            return this.enhanceDescription(definition.description, name);
        }

        // Generate description based on parameter name and type
        const baseDescription = this.parameterDescriptions[name] || 
                               this.generateDescriptionFromName(name);
        
        return this.enhanceDescription(baseDescription, name, definition);
    }

    /**
     * Enhance parameter description with context
     * @param {string} baseDescription - Base description
     * @param {string} name - Parameter name
     * @param {Object} definition - Parameter definition (optional)
     * @returns {string} Enhanced description
     */
    enhanceDescription(baseDescription, name, definition = {}) {
        let enhanced = baseDescription;

        // Add type-specific information
        if (definition.type === 'string' && this.isIdParameter(name)) {
            enhanced += ' This can be either the GUID identifier or the display name.';
        }

        // Add validation information
        if (definition.minLength) {
            enhanced += ` Minimum length: ${definition.minLength} characters.`;
        }

        if (definition.maxLength) {
            enhanced += ` Maximum length: ${definition.maxLength} characters.`;
        }

        // Add examples for common parameters
        if (this.hasCommonExamples(name)) {
            const examples = this.getCommonExamples(name);
            enhanced += ` Example: ${examples[0]}.`;
        }

        return enhanced.trim();
    }

    /**
     * Generate description from parameter name
     * @param {string} name - Parameter name
     * @returns {string} Generated description
     */
    generateDescriptionFromName(name) {
        const namePatterns = {
            'subscription': 'The Azure subscription ID or name',
            'tenant': 'The Microsoft Entra ID tenant ID or name',
            'resource-group': 'The name of the Azure resource group',
            'account-name': 'The name of the Azure account',
            'database-name': 'The name of the database',
            'container-name': 'The name of the container',
            'table-name': 'The name of the table',
            'file-name': 'The name of the file',
            'query': 'The query to execute',
            'limit': 'The maximum number of results to return',
            'filter': 'Filter criteria for the results'
        };

        // Check for exact matches
        if (namePatterns[name]) {
            return namePatterns[name];
        }

        // Generate based on patterns
        if (name.endsWith('-name')) {
            const prefix = name.replace('-name', '').replace(/-/g, ' ');
            return `The name of the ${prefix}`;
        }

        if (name.endsWith('-id')) {
            const prefix = name.replace('-id', '').replace(/-/g, ' ');
            return `The unique identifier of the ${prefix}`;
        }

        if (name.includes('max') || name.includes('limit')) {
            return 'The maximum number of items to process or return';
        }

        if (name.includes('timeout')) {
            return 'The timeout duration for the operation';
        }

        // Default description
        return `The ${name.replace(/-/g, ' ')} parameter`;
    }

    /**
     * Generate example value for parameter
     * @param {string} name - Parameter name
     * @param {Object} definition - Parameter definition
     * @returns {string} Example value
     */
    generateExample(name, definition) {
        // Use predefined examples
        if (this.parameterDescriptions[name]?.example) {
            return this.parameterDescriptions[name].example;
        }

        // Generate based on type and name
        if (definition.type === 'string') {
            return this.generateStringExample(name);
        }

        if (definition.type === 'number' || definition.type === 'integer') {
            return this.generateNumberExample(name);
        }

        if (definition.type === 'boolean') {
            return this.generateBooleanExample(name);
        }

        if (definition.type === 'array') {
            return this.generateArrayExample(name);
        }

        return 'value';
    }

    /**
     * Generate string example based on parameter name
     * @param {string} name - Parameter name
     * @returns {string} Example string
     */
    generateStringExample(name) {
        const examples = {
            'subscription': 'my-subscription-id',
            'tenant': 'my-tenant-id',
            'resource-group': 'my-resource-group',
            'account-name': 'mystorageaccount',
            'database-name': 'my-database',
            'container-name': 'my-container',
            'table-name': 'my-table',
            'file-name': 'my-file.txt',
            'query': 'SELECT * FROM table',
            'filter': 'status=active'
        };

        if (examples[name]) {
            return examples[name];
        }

        if (name.endsWith('-name')) {
            const prefix = name.replace('-name', '');
            return `my-${prefix}`;
        }

        if (name.endsWith('-id')) {
            const prefix = name.replace('-id', '');
            return `${prefix}-12345`;
        }

        return 'example-value';
    }

    /**
     * Generate number example based on parameter name
     * @param {string} name - Parameter name
     * @returns {number} Example number
     */
    generateNumberExample(name) {
        const examples = {
            'limit': 100,
            'timeout': 30,
            'port': 443,
            'count': 10,
            'size': 1024
        };

        if (examples[name]) {
            return examples[name];
        }

        if (name.includes('limit') || name.includes('max')) {
            return 100;
        }

        if (name.includes('timeout')) {
            return 30;
        }

        if (name.includes('port')) {
            return 443;
        }

        return 1;
    }

    /**
     * Generate boolean example
     * @param {string} name - Parameter name
     * @returns {boolean} Example boolean
     */
    generateBooleanExample(name) {
        const trueExamples = ['enable', 'include', 'force', 'recursive'];
        const falseExamples = ['disable', 'exclude', 'optional'];

        if (trueExamples.some(example => name.includes(example))) {
            return true;
        }

        if (falseExamples.some(example => name.includes(example))) {
            return false;
        }

        return true;
    }

    /**
     * Generate array example
     * @param {string} name - Parameter name
     * @returns {Array} Example array
     */
    generateArrayExample(name) {
        if (name.includes('tag')) {
            return ['tag1', 'tag2'];
        }

        if (name.includes('id')) {
            return ['id1', 'id2'];
        }

        return ['item1', 'item2'];
    }

    /**
     * Extract validation rules from parameter definition
     * @param {Object} definition - Parameter definition
     * @returns {Object} Validation rules
     */
    extractValidation(definition) {
        const validation = {};

        if (definition.minLength) validation.minLength = definition.minLength;
        if (definition.maxLength) validation.maxLength = definition.maxLength;
        if (definition.minimum) validation.minimum = definition.minimum;
        if (definition.maximum) validation.maximum = definition.maximum;
        if (definition.pattern) validation.pattern = definition.pattern;
        if (definition.enum) validation.allowedValues = definition.enum;

        return validation;
    }

    /**
     * Categorize parameter by purpose
     * @param {string} name - Parameter name
     * @returns {string} Parameter category
     */
    categorizeParameter(name) {
        const categories = {
            authentication: ['subscription', 'tenant', 'auth-method'],
            identification: ['account-name', 'resource-group', 'database-name', 'container-name'],
            query: ['query', 'filter', 'search'],
            configuration: ['limit', 'timeout', 'retry'],
            output: ['format', 'output']
        };

        for (const [category, params] of Object.entries(categories)) {
            if (params.some(param => name.includes(param))) {
                return category;
            }
        }

        return 'general';
    }

    /**
     * Get common values for parameter
     * @param {string} name - Parameter name
     * @param {Object} definition - Parameter definition
     * @returns {Array} Common values
     */
    getCommonValues(name, definition) {
        if (definition.enum) {
            return definition.enum;
        }

        const commonValues = {
            'auth-method': ['credential', 'key', 'connectionString'],
            'retry-mode': ['fixed', 'exponential'],
            'format': ['json', 'table', 'csv'],
            'level': ['low', 'medium', 'high']
        };

        return commonValues[name] || [];
    }

    /**
     * Normalize parameter type
     * @param {string} type - Original type
     * @returns {string} Normalized type
     */
    normalizeType(type) {
        const typeMap = {
            'str': 'string',
            'int': 'integer',
            'bool': 'boolean',
            'list': 'array',
            'dict': 'object'
        };

        return typeMap[type] || type || 'string';
    }

    /**
     * Check if parameter is an ID parameter
     * @param {string} name - Parameter name
     * @returns {boolean} True if ID parameter
     */
    isIdParameter(name) {
        return name.includes('id') || name.includes('subscription') || name.includes('tenant');
    }

    /**
     * Check if parameter has common examples
     * @param {string} name - Parameter name
     * @returns {boolean} True if has common examples
     */
    hasCommonExamples(name) {
        return this.parameterDescriptions[name]?.examples?.length > 0;
    }

    /**
     * Get common examples for parameter
     * @param {string} name - Parameter name
     * @returns {Array} Common examples
     */
    getCommonExamples(name) {
        return this.parameterDescriptions[name]?.examples || [];
    }

    /**
     * Initialize parameter types
     */
    initializeParameterTypes() {
        return {
            'string': { default: '', validation: ['minLength', 'maxLength', 'pattern'] },
            'number': { default: 0, validation: ['minimum', 'maximum'] },
            'integer': { default: 0, validation: ['minimum', 'maximum'] },
            'boolean': { default: false, validation: [] },
            'array': { default: [], validation: ['minItems', 'maxItems'] },
            'object': { default: {}, validation: ['properties', 'required'] }
        };
    }

    /**
     * Initialize common parameters
     */
    initializeCommonParameters() {
        return [
            'subscription',
            'tenant',
            'resource-group',
            'auth-method',
            'retry-delay',
            'retry-max-retries',
            'retry-mode',
            'retry-network-timeout'
        ];
    }

    /**
     * Initialize parameter descriptions
     */
    initializeParameterDescriptions() {
        return {
            'subscription': {
                description: 'The Azure subscription ID or name. This can be either the GUID identifier or the display name of the Azure subscription to use.',
                example: 'my-subscription-id',
                examples: ['my-subscription', '12345678-1234-1234-1234-123456789012']
            },
            'tenant': {
                description: 'The Microsoft Entra ID tenant ID or name. This can be either the GUID identifier or the display name of your Entra ID tenant.',
                example: 'my-tenant-id',
                examples: ['contoso.onmicrosoft.com', '87654321-4321-4321-4321-210987654321']
            },
            'resource-group': {
                description: 'The name of the Azure resource group. This is a logical container for Azure resources.',
                example: 'my-resource-group',
                examples: ['production-rg', 'dev-resources', 'test-environment']
            },
            'account-name': {
                description: 'The name of the Azure account. This is the unique name you chose for your account.',
                example: 'myaccount',
                examples: ['mystorageaccount', 'mydatabase', 'myservice']
            },
            'auth-method': {
                description: 'Authentication method to use. Options: \'credential\' (Azure CLI/managed identity), \'key\' (access key), or \'connectionString\'.',
                example: 'credential',
                examples: ['credential', 'key', 'connectionString']
            }
        };
    }

    /**
     * Batch extract parameters from multiple tools
     * @param {Array} tools - Array of tool definitions
     * @returns {Object} Parameters grouped by tool
     */
    extractBatchParameters(tools) {
        const results = {};

        tools.forEach(tool => {
            const toolName = tool.function?.name || 'unknown';
            results[toolName] = this.extractParameters(tool);
        });

        return results;
    }
}

module.exports = ParameterExtractor;
