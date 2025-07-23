/**
 * Configuration Manager
 * 
 * Centralized configuration management for the Azure MCP Server documentation generator.
 * Handles environment variables, config files, validation, and runtime configuration.
 */

const fs = require('fs').promises;
const path = require('path');

class ConfigurationManager {
    constructor(configPath = null) {
        this.configPath = configPath || this.findConfigFile();
        this.config = {};
        this.defaults = this.initializeDefaults();
        this.environmentOverrides = this.loadEnvironmentOverrides();
        this.isLoaded = false;
    }

    /**
     * Load configuration from all sources
     * @param {Object} overrides - Runtime overrides
     * @returns {Promise<Object>} Complete configuration
     */
    async loadConfiguration(overrides = {}) {
        // Start with defaults
        this.config = { ...this.defaults };

        // Load from config file if it exists
        if (this.configPath && await this.fileExists(this.configPath)) {
            const fileConfig = await this.loadConfigFile();
            this.config = this.mergeConfigs(this.config, fileConfig);
        }

        // Apply environment overrides
        this.config = this.mergeConfigs(this.config, this.environmentOverrides);

        // Apply runtime overrides
        this.config = this.mergeConfigs(this.config, overrides);

        // Validate configuration
        this.validateConfiguration();

        // Process computed values
        this.processComputedValues();

        this.isLoaded = true;
        return this.config;
    }

    /**
     * Get configuration value
     * @param {string} path - Dot-notation path to config value
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = undefined) {
        if (!this.isLoaded) {
            throw new Error('Configuration not loaded. Call loadConfiguration() first.');
        }

        return this.getNestedValue(this.config, path) ?? defaultValue;
    }

    /**
     * Set configuration value
     * @param {string} path - Dot-notation path
     * @param {*} value - Value to set
     */
    set(path, value) {
        this.setNestedValue(this.config, path, value);
    }

    /**
     * Get Azure-specific configuration
     * @returns {Object} Azure configuration
     */
    getAzureConfig() {
        return this.get('azure', {});
    }

    /**
     * Get output configuration
     * @returns {Object} Output configuration
     */
    getOutputConfig() {
        return this.get('output', {});
    }

    /**
     * Get template configuration
     * @returns {Object} Template configuration
     */
    getTemplateConfig() {
        return this.get('templates', {});
    }

    /**
     * Get processing configuration
     * @returns {Object} Processing configuration
     */
    getProcessingConfig() {
        return this.get('processing', {});
    }

    /**
     * Get quality control configuration
     * @returns {Object} Quality control configuration
     */
    getQualityConfig() {
        return this.get('quality', {});
    }

    /**
     * Save current configuration to file
     * @param {string} filePath - File path to save to (optional)
     * @returns {Promise<void>}
     */
    async saveConfiguration(filePath = null) {
        const targetPath = filePath || this.configPath || './config.json';
        const configToSave = this.cleanConfigForSave(this.config);
        
        await fs.writeFile(
            targetPath, 
            JSON.stringify(configToSave, null, 2), 
            'utf8'
        );
    }

    /**
     * Create a new configuration file with defaults
     * @param {string} filePath - Path for new config file
     * @param {Object} customDefaults - Custom default values
     * @returns {Promise<void>}
     */
    async createDefaultConfig(filePath, customDefaults = {}) {
        const defaultConfig = this.mergeConfigs(this.defaults, customDefaults);
        await fs.writeFile(
            filePath, 
            JSON.stringify(defaultConfig, null, 2), 
            'utf8'
        );
    }

    /**
     * Validate current configuration
     * @throws {Error} If configuration is invalid
     */
    validateConfiguration() {
        const errors = [];

        // Validate required paths
        const requiredPaths = [
            'output.baseDirectory',
            'templates.baseDirectory',
            'processing.maxConcurrency'
        ];

        requiredPaths.forEach(path => {
            if (this.getNestedValue(this.config, path) === undefined) {
                errors.push(`Required configuration missing: ${path}`);
            }
        });

        // Validate Azure configuration if present
        if (this.config.azure?.enabled) {
            this.validateAzureConfig(errors);
        }

        // Validate output configuration
        this.validateOutputConfig(errors);

        // Validate processing configuration
        this.validateProcessingConfig(errors);

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
    }

    /**
     * Get configuration schema for validation
     * @returns {Object} Configuration schema
     */
    getConfigSchema() {
        return {
            azure: {
                type: 'object',
                properties: {
                    enabled: { type: 'boolean' },
                    subscriptionId: { type: 'string' },
                    tenantId: { type: 'string' },
                    timeout: { type: 'number', minimum: 1000 },
                    retryAttempts: { type: 'number', minimum: 0 }
                }
            },
            output: {
                type: 'object',
                required: ['baseDirectory'],
                properties: {
                    baseDirectory: { type: 'string' },
                    createTimestampedDirs: { type: 'boolean' },
                    backupExisting: { type: 'boolean' },
                    fileExtension: { type: 'string' }
                }
            },
            templates: {
                type: 'object',
                required: ['baseDirectory'],
                properties: {
                    baseDirectory: { type: 'string' },
                    defaultTemplate: { type: 'string' },
                    customTemplates: { type: 'object' }
                }
            },
            processing: {
                type: 'object',
                required: ['maxConcurrency'],
                properties: {
                    maxConcurrency: { type: 'number', minimum: 1 },
                    batchSize: { type: 'number', minimum: 1 },
                    enableParallelProcessing: { type: 'boolean' }
                }
            }
        };
    }

    /**
     * Load configuration from file
     * @returns {Promise<Object>} File configuration
     */
    async loadConfigFile() {
        try {
            const content = await fs.readFile(this.configPath, 'utf8');
            
            if (this.configPath.endsWith('.json')) {
                return JSON.parse(content);
            } else if (this.configPath.endsWith('.js')) {
                // Dynamic import for JS config files
                delete require.cache[require.resolve(path.resolve(this.configPath))];
                return require(path.resolve(this.configPath));
            }
            
            throw new Error(`Unsupported config file format: ${this.configPath}`);
        } catch (error) {
            throw new Error(`Failed to load config file ${this.configPath}: ${error.message}`);
        }
    }

    /**
     * Find configuration file
     * @returns {string|null} Configuration file path
     */
    findConfigFile() {
        const possiblePaths = [
            './config.json',
            './config.js',
            './src/config.json',
            './src/config.js',
            process.env.MCP_DOC_CONFIG
        ].filter(Boolean);

        for (const configPath of possiblePaths) {
            try {
                require.resolve(path.resolve(configPath));
                return configPath;
            } catch {
                // File doesn't exist, continue
            }
        }

        return null;
    }

    /**
     * Load environment variable overrides
     * @returns {Object} Environment configuration
     */
    loadEnvironmentOverrides() {
        const env = process.env;
        const overrides = {};

        // Map environment variables to config paths
        const envMapping = {
            'MCP_DOC_OUTPUT_DIR': 'output.baseDirectory',
            'MCP_DOC_TEMPLATES_DIR': 'templates.baseDirectory',
            'MCP_DOC_MAX_CONCURRENCY': 'processing.maxConcurrency',
            'MCP_DOC_BATCH_SIZE': 'processing.batchSize',
            'AZURE_SUBSCRIPTION_ID': 'azure.subscriptionId',
            'AZURE_TENANT_ID': 'azure.tenantId',
            'MCP_DOC_CREATE_TIMESTAMPS': 'output.createTimestampedDirs',
            'MCP_DOC_BACKUP_EXISTING': 'output.backupExisting',
            'MCP_DOC_ENABLE_PARALLEL': 'processing.enableParallelProcessing'
        };

        Object.entries(envMapping).forEach(([envVar, configPath]) => {
            if (env[envVar]) {
                let value = env[envVar];
                
                // Convert string values to appropriate types
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (/^\d+$/.test(value)) value = parseInt(value);
                else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
                
                this.setNestedValue(overrides, configPath, value);
            }
        });

        return overrides;
    }

    /**
     * Merge configuration objects
     * @param {Object} target - Target configuration
     * @param {Object} source - Source configuration
     * @returns {Object} Merged configuration
     */
    mergeConfigs(target, source) {
        const result = { ...target };
        
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeConfigs(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        });
        
        return result;
    }

    /**
     * Process computed configuration values
     */
    processComputedValues() {
        // Resolve relative paths
        this.resolveRelativePaths();
        
        // Set computed defaults
        this.setComputedDefaults();
    }

    /**
     * Resolve relative paths in configuration
     */
    resolveRelativePaths() {
        const pathFields = [
            'output.baseDirectory',
            'templates.baseDirectory',
            'source.toolsJsonPath',
            'source.commandsPath'
        ];

        pathFields.forEach(pathField => {
            const value = this.getNestedValue(this.config, pathField);
            if (value && typeof value === 'string' && !path.isAbsolute(value)) {
                this.setNestedValue(this.config, pathField, path.resolve(value));
            }
        });
    }

    /**
     * Set computed default values
     */
    setComputedDefaults() {
        // Set default template based on available templates
        if (!this.config.templates.defaultTemplate) {
            this.config.templates.defaultTemplate = 'azure-tool';
        }

        // Set session ID if not provided
        if (!this.config.session?.id) {
            this.set('session.id', this.generateSessionId());
        }
    }

    /**
     * Validate Azure configuration
     * @param {Array} errors - Errors array to populate
     */
    validateAzureConfig(errors) {
        const azureConfig = this.config.azure;
        
        if (azureConfig.timeout && azureConfig.timeout < 1000) {
            errors.push('Azure timeout must be at least 1000ms');
        }
        
        if (azureConfig.retryAttempts && azureConfig.retryAttempts < 0) {
            errors.push('Azure retry attempts must be non-negative');
        }
    }

    /**
     * Validate output configuration
     * @param {Array} errors - Errors array to populate
     */
    validateOutputConfig(errors) {
        const outputConfig = this.config.output;
        
        if (!outputConfig.baseDirectory) {
            errors.push('Output base directory is required');
        }
        
        if (outputConfig.fileExtension && !outputConfig.fileExtension.startsWith('.')) {
            errors.push('File extension must start with a dot');
        }
    }

    /**
     * Validate processing configuration
     * @param {Array} errors - Errors array to populate
     */
    validateProcessingConfig(errors) {
        const processingConfig = this.config.processing;
        
        if (processingConfig.maxConcurrency < 1) {
            errors.push('Max concurrency must be at least 1');
        }
        
        if (processingConfig.batchSize && processingConfig.batchSize < 1) {
            errors.push('Batch size must be at least 1');
        }
    }

    /**
     * Clean configuration for saving (remove computed values)
     * @param {Object} config - Configuration to clean
     * @returns {Object} Cleaned configuration
     */
    cleanConfigForSave(config) {
        const cleaned = { ...config };
        
        // Remove computed values that shouldn't be saved
        delete cleaned.session;
        
        return cleaned;
    }

    /**
     * Get nested value from object
     * @param {Object} obj - Object to search
     * @param {string} path - Dot-notation path
     * @returns {*} Found value or undefined
     */
    getNestedValue(obj, path) {
        if (!obj || !path) return undefined;
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Set nested value in object
     * @param {Object} obj - Object to modify
     * @param {string} path - Dot-notation path
     * @param {*} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    /**
     * Check if file exists
     * @param {string} filePath - File path
     * @returns {Promise<boolean>} File exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initialize default configuration
     * @returns {Object} Default configuration
     */
    initializeDefaults() {
        return {
            azure: {
                enabled: true,
                timeout: 30000,
                retryAttempts: 3,
                subscriptionId: null,
                tenantId: null
            },
            output: {
                baseDirectory: './generated',
                createTimestampedDirs: true,
                backupExisting: true,
                validateOutput: true,
                fileExtension: '.md',
                encoding: 'utf8'
            },
            templates: {
                baseDirectory: './templates',
                defaultTemplate: 'azure-tool',
                customTemplates: {}
            },
            processing: {
                maxConcurrency: 5,
                batchSize: 10,
                enableParallelProcessing: true,
                continueOnError: false
            },
            quality: {
                enableValidation: true,
                enableFormatChecking: true,
                enableLinkValidation: false,
                enableConsistencyChecking: true,
                enableReferenceValidation: true
            },
            source: {
                toolsJsonPath: './tools.json',
                commandsPath: './azmcp-commands.md'
            },
            logging: {
                level: 'info',
                enableFileLogging: true,
                enableConsoleLogging: true
            }
        };
    }
}

module.exports = ConfigurationManager;
