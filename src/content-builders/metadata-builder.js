/**
 * Metadata Builder
 * 
 * Generates YAML front matter and metadata for Azure MCP Server documentation
 * following Microsoft documentation standards and Azure service conventions.
 */

class MetadataBuilder {
    constructor() {
        this.serviceMetadata = this.initializeServiceMetadata();
        this.defaultMetadata = this.initializeDefaultMetadata();
    }

    /**
     * Generate complete YAML front matter for a tool document
     * @param {Object} tool - Tool definition
     * @param {Object} serviceInfo - Service information from azure-docs-fetcher
     * @param {Object} options - Additional options
     * @returns {string} YAML front matter
     */
    buildMetadata(tool, serviceInfo = {}, options = {}) {
        const serviceName = this.extractServiceName(tool);
        const metadata = this.buildMetadataObject(tool, serviceInfo, serviceName, options);
        return this.formatAsYaml(metadata);
    }

    /**
     * Build metadata object
     * @param {Object} tool - Tool definition
     * @param {Object} serviceInfo - Service information
     * @param {string} serviceName - Service name
     * @param {Object} options - Additional options
     * @returns {Object} Metadata object
     */
    buildMetadataObject(tool, serviceInfo, serviceName, options) {
        const baseService = this.serviceMetadata[serviceName] || {};
        
        return {
            title: this.buildTitle(tool, serviceInfo, serviceName),
            description: this.buildDescription(tool, serviceInfo, serviceName),
            'ms.date': this.getCurrentDate(),
            'ms.topic': 'reference',
            'ms.service': baseService.msService || 'azure-mcp-server',
            'ms.subservice': baseService.msSubservice || 'azure-mcp-server',
            ...(options.includeAuthor && { author: 'Microsoft' }),
            ...(options.includeKeywords && { 
                keywords: this.buildKeywords(tool, serviceInfo, serviceName) 
            }),
            ...(options.customFields && options.customFields)
        };
    }

    /**
     * Build document title
     * @param {Object} tool - Tool definition
     * @param {Object} serviceInfo - Service information
     * @param {string} serviceName - Service name
     * @returns {string} Document title
     */
    buildTitle(tool, serviceInfo, serviceName) {
        const formattedServiceName = serviceInfo.serviceName || this.formatServiceName(serviceName);
        return `${formattedServiceName} tools for the Azure MCP Server`;
    }

    /**
     * Build document description
     * @param {Object} tool - Tool definition
     * @param {Object} serviceInfo - Service information
     * @param {string} serviceName - Service name
     * @returns {string} Document description
     */
    buildDescription(tool, serviceInfo, serviceName) {
        const formattedServiceName = serviceInfo.serviceName || this.formatServiceName(serviceName);
        const serviceDescription = serviceInfo.description || `Azure ${formattedServiceName} service`;
        
        return `Comprehensive guide to ${formattedServiceName} tools available in the Azure MCP Server for managing ${serviceDescription.toLowerCase()} through natural language prompts.`;
    }

    /**
     * Build keywords array
     * @param {Object} tool - Tool definition
     * @param {Object} serviceInfo - Service information
     * @param {string} serviceName - Service name
     * @returns {Array} Keywords array
     */
    buildKeywords(tool, serviceInfo, serviceName) {
        const baseKeywords = ['azure', 'mcp', 'server', 'tools', 'documentation'];
        const serviceKeywords = serviceInfo.keywords || [serviceName];
        const toolKeywords = this.extractToolKeywords(tool);
        
        // Combine and deduplicate
        const allKeywords = [...baseKeywords, ...serviceKeywords, ...toolKeywords];
        return [...new Set(allKeywords)];
    }

    /**
     * Extract service name from tool
     * @param {Object} tool - Tool definition
     * @returns {string} Service name
     */
    extractServiceName(tool) {
        if (!tool.function?.name) return 'azure';
        
        const toolName = tool.function.name;
        
        // Extract service from tool name pattern: mcp_azure_mcp_ser_azmcp_{service}_{operation}
        const match = toolName.match(/mcp_azure_mcp_ser_azmcp_([^_]+)_/);
        if (match) {
            return match[1];
        }
        
        // Fallback patterns
        if (toolName.includes('storage')) return 'storage';
        if (toolName.includes('cosmos')) return 'cosmos';
        if (toolName.includes('monitor')) return 'monitor';
        if (toolName.includes('keyvault')) return 'keyvault';
        if (toolName.includes('aks')) return 'aks';
        
        return 'azure';
    }

    /**
     * Extract keywords from tool definition
     * @param {Object} tool - Tool definition
     * @returns {Array} Tool-specific keywords
     */
    extractToolKeywords(tool) {
        const keywords = [];
        
        if (tool.function?.name) {
            const toolName = tool.function.name;
            
            // Extract keywords from tool name
            if (toolName.includes('list')) keywords.push('list', 'query');
            if (toolName.includes('get')) keywords.push('retrieve', 'show');
            if (toolName.includes('create')) keywords.push('create', 'add');
            if (toolName.includes('delete')) keywords.push('delete', 'remove');
            if (toolName.includes('update')) keywords.push('update', 'modify');
        }
        
        if (tool.function?.description) {
            const description = tool.function.description.toLowerCase();
            
            // Extract keywords from description
            if (description.includes('database')) keywords.push('database');
            if (description.includes('container')) keywords.push('container');
            if (description.includes('blob')) keywords.push('blob');
            if (description.includes('table')) keywords.push('table');
            if (description.includes('queue')) keywords.push('queue');
            if (description.includes('file')) keywords.push('file');
        }
        
        return keywords;
    }

    /**
     * Format service name for display
     * @param {string} serviceName - Raw service name
     * @returns {string} Formatted service name
     */
    formatServiceName(serviceName) {
        const serviceMap = {
            'storage': 'Azure Storage',
            'cosmos': 'Azure Cosmos DB',
            'monitor': 'Azure Monitor',
            'keyvault': 'Azure Key Vault',
            'aks': 'Azure Kubernetes Service',
            'sql': 'Azure SQL Database',
            'foundry': 'Azure AI Foundry',
            'loadtesting': 'Azure Load Testing'
        };
        
        return serviceMap[serviceName] || `Azure ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}`;
    }

    /**
     * Get current date in YYYY-MM-DD format
     * @returns {string} Current date
     */
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Format metadata object as YAML front matter
     * @param {Object} metadata - Metadata object
     * @returns {string} YAML front matter
     */
    formatAsYaml(metadata) {
        const lines = ['---'];
        
        Object.entries(metadata).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                lines.push(`${key}:`);
                value.forEach(item => {
                    lines.push(`  - ${item}`);
                });
            } else {
                // Escape quotes in values
                const escapedValue = typeof value === 'string' && value.includes(':') 
                    ? `"${value.replace(/"/g, '\\"')}"` 
                    : value;
                lines.push(`${key}: ${escapedValue}`);
            }
        });
        
        lines.push('---');
        return lines.join('\n');
    }

    /**
     * Build metadata for multiple tools
     * @param {Array} tools - Array of tool definitions
     * @param {Object} serviceInfos - Service information map
     * @param {Object} options - Additional options
     * @returns {Object} Metadata map by tool name
     */
    buildBatchMetadata(tools, serviceInfos = {}, options = {}) {
        const results = {};
        
        tools.forEach(tool => {
            const serviceName = this.extractServiceName(tool);
            const serviceInfo = serviceInfos[serviceName] || {};
            const toolName = tool.function?.name || 'unknown';
            
            results[toolName] = this.buildMetadataObject(tool, serviceInfo, serviceName, options);
        });
        
        return results;
    }

    /**
     * Build minimal metadata for quick generation
     * @param {string} serviceName - Service name
     * @param {string} title - Document title (optional)
     * @param {string} description - Document description (optional)
     * @returns {string} YAML front matter
     */
    buildMinimalMetadata(serviceName, title = null, description = null) {
        const serviceConfig = this.serviceMetadata[serviceName] || {};
        const formattedServiceName = this.formatServiceName(serviceName);
        
        const metadata = {
            title: title || `${formattedServiceName} tools for the Azure MCP Server`,
            description: description || `Guide to ${formattedServiceName} tools available in the Azure MCP Server`,
            'ms.date': this.getCurrentDate(),
            'ms.topic': 'reference',
            'ms.service': serviceConfig.msService || 'azure-mcp-server',
            'ms.subservice': serviceConfig.msSubservice || 'azure-mcp-server'
        };
        
        return this.formatAsYaml(metadata);
    }

    /**
     * Initialize service metadata mappings
     */
    initializeServiceMetadata() {
        return {
            'storage': {
                msService: 'azure-storage',
                msSubservice: 'azure-mcp-server',
                category: 'Storage'
            },
            'cosmos': {
                msService: 'cosmos-db',
                msSubservice: 'azure-mcp-server',
                category: 'Database'
            },
            'monitor': {
                msService: 'azure-monitor',
                msSubservice: 'azure-mcp-server',
                category: 'Management and Governance'
            },
            'keyvault': {
                msService: 'key-vault',
                msSubservice: 'azure-mcp-server',
                category: 'Security'
            },
            'aks': {
                msService: 'aks',
                msSubservice: 'azure-mcp-server',
                category: 'Compute'
            },
            'sql': {
                msService: 'sql-database',
                msSubservice: 'azure-mcp-server',
                category: 'Database'
            },
            'foundry': {
                msService: 'ai-services',
                msSubservice: 'azure-mcp-server',
                category: 'AI + Machine Learning'
            },
            'loadtesting': {
                msService: 'load-testing',
                msSubservice: 'azure-mcp-server',
                category: 'Developer Tools'
            }
        };
    }

    /**
     * Initialize default metadata
     */
    initializeDefaultMetadata() {
        return {
            'ms.topic': 'reference',
            'ms.service': 'azure-mcp-server',
            'ms.subservice': 'azure-mcp-server',
            author: 'Microsoft'
        };
    }

    /**
     * Validate metadata object
     * @param {Object} metadata - Metadata to validate
     * @returns {Object} Validation result
     */
    validateMetadata(metadata) {
        const required = ['title', 'description', 'ms.date', 'ms.topic', 'ms.service'];
        const missing = required.filter(field => !metadata[field]);
        
        return {
            isValid: missing.length === 0,
            missing: missing,
            warnings: this.getMetadataWarnings(metadata)
        };
    }

    /**
     * Get metadata warnings
     * @param {Object} metadata - Metadata to check
     * @returns {Array} Warnings
     */
    getMetadataWarnings(metadata) {
        const warnings = [];
        
        if (metadata.description && metadata.description.length > 200) {
            warnings.push('Description is longer than recommended 200 characters');
        }
        
        if (metadata.title && metadata.title.length > 100) {
            warnings.push('Title is longer than recommended 100 characters');
        }
        
        if (!metadata.keywords) {
            warnings.push('Keywords not specified - consider adding for better discoverability');
        }
        
        return warnings;
    }
}

module.exports = MetadataBuilder;
