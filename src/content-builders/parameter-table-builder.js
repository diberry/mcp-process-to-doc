/**
 * Parameter Table Builder - Generates comprehensive parameter documentation tables
 * 
 * This module creates parameter tables that follow the template format:
 * | Parameter | Required or optional | Description |
 */

class ParameterTableBuilder {
    constructor() {
        this.parameterDescriptions = this.initializeParameterDescriptions();
        this.commonParameters = this.initializeCommonParameters();
    }

    /**
     * Generate parameter table markdown for an operation
     * @param {Array} parameters - Array of parameter objects from command info
     * @param {string} serviceName - Service name for context
     * @returns {string} Formatted markdown table
     */
    generateParameterTable(parameters, serviceName) {
        if (!parameters || parameters.length === 0) {
            return this.generateEmptyTable();
        }

        const tableHeader = '| Parameter | Required or optional | Description |\n|-----------|-------------|-------------|';
        const rows = parameters.map(param => this.formatParameterRow(param, serviceName));
        
        return [tableHeader, ...rows].join('\n');
    }

    /**
     * Format a single parameter row
     */
    formatParameterRow(parameter, serviceName) {
        const name = this.formatParameterName(parameter.name);
        const required = this.determineRequiredStatus(parameter);
        const description = this.generateParameterDescription(parameter, serviceName);

        return `| **${name}** | ${required} | ${description} |`;
    }

    /**
     * Format parameter name for display
     */
    formatParameterName(paramName) {
        if (!paramName) return 'Parameter';

        // Remove dashes and convert to natural language
        return paramName
            .replace(/^--/, '') // Remove leading dashes
            .replace(/-/g, ' ') // Replace dashes with spaces
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Determine if parameter is required or optional
     */
    determineRequiredStatus(parameter) {
        // Check various indicators of required status
        if (parameter.required === true || parameter.required === 'true') {
            return 'Required';
        }
        if (parameter.required === false || parameter.required === 'false') {
            return 'Optional';
        }
        if (parameter.optional === true || parameter.optional === 'true') {
            return 'Optional';
        }
        if (parameter.optional === false || parameter.optional === 'false') {
            return 'Required';
        }

        // Check parameter name patterns for common required parameters
        const paramName = parameter.name?.toLowerCase() || '';
        const requiredPatterns = [
            'subscription', 'resource-group', 'name', 'account-name',
            'server', 'database', 'vault', 'key', 'secret'
        ];

        if (requiredPatterns.some(pattern => paramName.includes(pattern))) {
            return 'Required';
        }

        // Default to Optional if not clearly required
        return 'Optional';
    }

    /**
     * Generate comprehensive parameter description
     */
    generateParameterDescription(parameter, serviceName) {
        const paramName = parameter.name?.toLowerCase() || '';
        
        // Check for existing description
        if (parameter.description && parameter.description.length > 10) {
            return this.enhanceDescription(parameter.description, paramName);
        }

        // Generate description based on parameter name and service context
        const baseDescription = this.getBaseDescription(paramName, serviceName);
        const exampleText = this.getParameterExample(paramName);
        
        return exampleText ? `${baseDescription} ${exampleText}` : baseDescription;
    }

    /**
     * Get base description for common parameters
     */
    getBaseDescription(paramName, serviceName) {
        // Check predefined descriptions first
        const predefined = this.parameterDescriptions[paramName];
        if (predefined) {
            return predefined;
        }

        // Generate contextual description
        if (paramName.includes('subscription')) {
            return 'The Azure subscription ID or name containing the resources.';
        }
        if (paramName.includes('resource-group')) {
            return 'The name of the Azure resource group containing the resources.';
        }
        if (paramName.includes('account-name') || paramName.includes('account')) {
            return `The name of the ${serviceName} account to access.`;
        }
        if (paramName.includes('name') && !paramName.includes('account')) {
            return `The name of the ${serviceName} resource.`;
        }
        if (paramName.includes('location') || paramName.includes('region')) {
            return 'The Azure region where the resource is located.';
        }
        if (paramName.includes('query')) {
            return 'The query string to execute or search for.';
        }
        if (paramName.includes('limit') || paramName.includes('max')) {
            return 'The maximum number of results to return.';
        }
        if (paramName.includes('timeout')) {
            return 'The timeout duration for the operation.';
        }
        if (paramName.includes('format') || paramName.includes('output')) {
            return 'The output format for the results.';
        }

        // Generic fallback
        return `Specifies the ${paramName.replace(/-/g, ' ')} for the operation.`;
    }

    /**
     * Get example text for parameter
     */
    getParameterExample(paramName) {
        const examples = {
            'subscription': 'Example: my-subscription-name or 12345678-1234-1234-1234-123456789012.',
            'resource-group': 'Example: my-resource-group.',
            'account-name': 'Example: mystorageaccount.',
            'server': 'Example: myserver.database.windows.net.',
            'database': 'Example: mydatabase.',
            'vault': 'Example: myvault.',
            'location': 'Example: eastus, westus2.',
            'query': 'Example: "SELECT * FROM table WHERE condition".',
            'limit': 'Example: 50, 100.',
            'timeout': 'Example: 30s, 5m.',
            'format': 'Example: json, table, yaml.'
        };

        for (const [key, example] of Object.entries(examples)) {
            if (paramName.includes(key)) {
                return example;
            }
        }

        return null;
    }

    /**
     * Enhance existing description
     */
    enhanceDescription(existingDescription, paramName) {
        let enhanced = existingDescription;

        // Ensure proper punctuation
        if (!enhanced.endsWith('.')) {
            enhanced += '.';
        }

        // Add examples if helpful
        const example = this.getParameterExample(paramName);
        if (example && !enhanced.includes('Example:')) {
            enhanced += ` ${example}`;
        }

        return enhanced;
    }

    /**
     * Generate empty table for operations with no parameters
     */
    generateEmptyTable() {
        return '| Parameter | Required or optional | Description |\n|-----------|-------------|-------------|\n| None | - | This operation does not require additional parameters. |';
    }

    /**
     * Initialize comprehensive parameter descriptions
     */
    initializeParameterDescriptions() {
        return {
            'subscription': 'The Azure subscription ID or name. This can be either the GUID identifier or the display name of the Azure subscription to use.',
            'resource-group': 'The name of the Azure resource group. This is a logical container for Azure resources.',
            'tenant': 'The Microsoft Entra ID tenant ID or name. This can be either the GUID identifier or the display name of your Entra ID tenant.',
            'account-name': 'The name of the Azure Storage account. This is the unique name you chose for your storage account.',
            'container-name': 'The name of the container to access within the storage account.',
            'database-name': 'The name of the database to query.',
            'table-name': 'The name of the table to access within the database.',
            'server': 'The name of the server to connect to.',
            'workspace': 'The Log Analytics workspace ID or name. This can be either the unique identifier (GUID) or the display name of your workspace.',
            'vault': 'The name of the Key Vault.',
            'key': 'The name of the key to access within the Key Vault.',
            'secret': 'The name of the secret to access within the Key Vault.',
            'query': 'The query to execute. Uses service-specific query syntax.',
            'limit': 'The maximum number of results to return.',
            'hours': 'The number of hours to query back from the current time.',
            'auth-method': 'Authentication method to use. Options: credential (Azure CLI/managed identity), key (access key), or connectionString.',
            'retry-delay': 'Initial delay in seconds between retry attempts. For exponential backoff, this value is used as the base.',
            'retry-max-delay': 'Maximum delay in seconds between retries, regardless of the retry strategy.',
            'retry-max-retries': 'Maximum number of retry attempts for failed operations before giving up.',
            'retry-mode': 'Retry strategy to use. fixed uses consistent delays, exponential increases delay between attempts.',
            'retry-network-timeout': 'Network operation timeout in seconds. Operations taking longer than this will be cancelled.'
        };
    }

    /**
     * Initialize common parameters across services
     */
    initializeCommonParameters() {
        return [
            'subscription',
            'resource-group',
            'tenant',
            'auth-method',
            'retry-delay',
            'retry-max-delay',
            'retry-max-retries',
            'retry-mode',
            'retry-network-timeout'
        ];
    }
}

module.exports = ParameterTableBuilder;
