/**
 * Document Template Processor
 * 
 * Processes complete document templates by combining multiple sections,
 * applying layout rules, and generating final documentation files.
 */

class DocumentTemplateProcessor {
    constructor() {
        this.documentTemplates = this.initializeDocumentTemplates();
        this.layoutRules = this.initializeLayoutRules();
        this.sectionProcessor = null; // Will be injected
    }

    /**
     * Set section processor dependency
     * @param {Object} sectionProcessor - Section template processor instance
     */
    setSectionProcessor(sectionProcessor) {
        this.sectionProcessor = sectionProcessor;
    }

    /**
     * Process a complete document template
     * @param {string} templateType - Document template type
     * @param {Object} data - Complete document data
     * @param {Object} options - Processing options
     * @returns {string} Complete processed document
     */
    processDocument(templateType, data, options = {}) {
        const template = this.getDocumentTemplate(templateType);
        if (!template) {
            throw new Error(`Unknown document template: ${templateType}`);
        }

        // Process each section
        const processedSections = this.processSections(template.sections, data, options);

        // Combine sections according to layout
        const document = this.combineDocument(template, processedSections, data, options);

        // Apply document-level formatting
        return this.formatDocument(document, templateType, options);
    }

    /**
     * Process multiple documents as a batch
     * @param {Array} documents - Array of {templateType, data, options} objects
     * @param {Object} globalOptions - Global processing options
     * @returns {Object} Map of document names to processed content
     */
    processDocuments(documents, globalOptions = {}) {
        const results = {};

        documents.forEach(doc => {
            const mergedOptions = { ...globalOptions, ...doc.options };
            const documentName = doc.name || doc.data.toolName || 'document';
            results[documentName] = this.processDocument(doc.templateType, doc.data, mergedOptions);
        });

        return results;
    }

    /**
     * Get document template by type
     * @param {string} templateType - Template type
     * @returns {Object} Template definition
     */
    getDocumentTemplate(templateType) {
        return this.documentTemplates[templateType];
    }

    /**
     * Process all sections for a document
     * @param {Array} sectionConfigs - Section configurations
     * @param {Object} data - Document data
     * @param {Object} options - Processing options
     * @returns {Object} Processed sections map
     */
    processSections(sectionConfigs, data, options) {
        const processedSections = {};

        sectionConfigs.forEach(sectionConfig => {
            const sectionData = this.prepareSectionData(sectionConfig, data);
            const sectionOptions = { ...options, ...sectionConfig.options };

            if (this.shouldIncludeSection(sectionConfig, sectionData, options)) {
                processedSections[sectionConfig.name] = this.sectionProcessor.processSection(
                    sectionConfig.type,
                    sectionData,
                    sectionOptions
                );
            }
        });

        return processedSections;
    }

    /**
     * Prepare section-specific data
     * @param {Object} sectionConfig - Section configuration
     * @param {Object} documentData - Complete document data
     * @returns {Object} Section-specific data
     */
    prepareSectionData(sectionConfig, documentData) {
        let sectionData = { ...documentData };

        // Apply data transformations specific to this section
        if (sectionConfig.dataTransform) {
            sectionData = sectionConfig.dataTransform(sectionData);
        }

        // Extract section-specific data
        if (sectionConfig.dataPath) {
            const pathData = this.getNestedValue(documentData, sectionConfig.dataPath);
            sectionData = { ...sectionData, ...pathData };
        }

        return sectionData;
    }

    /**
     * Determine if a section should be included
     * @param {Object} sectionConfig - Section configuration
     * @param {Object} sectionData - Section data
     * @param {Object} options - Processing options
     * @returns {boolean} Should include section
     */
    shouldIncludeSection(sectionConfig, sectionData, options) {
        // Check conditional inclusion
        if (sectionConfig.condition) {
            return this.evaluateCondition(sectionConfig.condition, sectionData, options);
        }

        // Check required data
        if (sectionConfig.requiredData) {
            return sectionConfig.requiredData.every(path => {
                const value = this.getNestedValue(sectionData, path);
                return value !== undefined && value !== null;
            });
        }

        // Check options
        if (sectionConfig.optionFlag) {
            return Boolean(options[sectionConfig.optionFlag]);
        }

        return true;
    }

    /**
     * Combine processed sections into complete document
     * @param {Object} template - Document template
     * @param {Object} processedSections - Processed sections
     * @param {Object} data - Document data
     * @param {Object} options - Processing options
     * @returns {string} Combined document
     */
    combineDocument(template, processedSections, data, options) {
        let document = '';

        // Add document header if specified
        if (template.header) {
            document += this.processDocumentHeader(template.header, data, options);
            document += '\n\n';
        }

        // Add metadata (YAML front matter) if requested
        if (options.includeMetadata && data.metadata) {
            document = data.metadata + '\n\n' + document;
        }

        // Combine sections in specified order
        template.sections.forEach(sectionConfig => {
            const sectionContent = processedSections[sectionConfig.name];
            if (sectionContent) {
                // Add section with appropriate spacing
                document += sectionContent;
                
                // Add spacing between sections
                if (sectionConfig.spacing !== false) {
                    document += '\n\n';
                }
            }
        });

        // Add document footer if specified
        if (template.footer) {
            document += this.processDocumentFooter(template.footer, data, options);
        }

        return document;
    }

    /**
     * Process document header
     * @param {string|Function} header - Header template or function
     * @param {Object} data - Document data
     * @param {Object} options - Processing options
     * @returns {string} Processed header
     */
    processDocumentHeader(header, data, options) {
        if (typeof header === 'function') {
            return header(data, options);
        }

        return this.injectVariables(header, data);
    }

    /**
     * Process document footer
     * @param {string|Function} footer - Footer template or function
     * @param {Object} data - Document data
     * @param {Object} options - Processing options
     * @returns {string} Processed footer
     */
    processDocumentFooter(footer, data, options) {
        if (typeof footer === 'function') {
            return footer(data, options);
        }

        return this.injectVariables(footer, data);
    }

    /**
     * Apply document-level formatting
     * @param {string} document - Document content
     * @param {string} templateType - Template type
     * @param {Object} options - Formatting options
     * @returns {string} Formatted document
     */
    formatDocument(document, templateType, options) {
        const rules = this.layoutRules[templateType] || this.layoutRules.default;

        // Apply layout rules
        rules.forEach(rule => {
            document = document.replace(rule.pattern, rule.replacement);
        });

        // Apply global formatting options
        if (options.maxLineLength) {
            document = this.wrapLines(document, options.maxLineLength);
        }

        if (options.normalizeWhitespace) {
            document = this.normalizeWhitespace(document);
        }

        if (options.addTableOfContents) {
            document = this.addTableOfContents(document);
        }

        return document.trim();
    }

    /**
     * Wrap lines to maximum length
     * @param {string} content - Content to wrap
     * @param {number} maxLength - Maximum line length
     * @returns {string} Wrapped content
     */
    wrapLines(content, maxLength) {
        return content.split('\n').map(line => {
            if (line.length <= maxLength) return line;
            
            // Don't wrap code blocks or headers
            if (line.startsWith('```') || line.startsWith('#')) return line;
            
            // Simple word wrapping
            const words = line.split(' ');
            const wrapped = [];
            let currentLine = '';
            
            words.forEach(word => {
                if ((currentLine + word).length > maxLength && currentLine) {
                    wrapped.push(currentLine.trim());
                    currentLine = word + ' ';
                } else {
                    currentLine += word + ' ';
                }
            });
            
            if (currentLine) {
                wrapped.push(currentLine.trim());
            }
            
            return wrapped.join('\n');
        }).join('\n');
    }

    /**
     * Normalize whitespace in document
     * @param {string} content - Content to normalize
     * @returns {string} Normalized content
     */
    normalizeWhitespace(content) {
        // Normalize line endings
        content = content.replace(/\r\n/g, '\n');
        
        // Remove trailing whitespace
        content = content.replace(/[ \t]+$/gm, '');
        
        // Normalize multiple blank lines
        content = content.replace(/\n{3,}/g, '\n\n');
        
        return content;
    }

    /**
     * Add table of contents to document
     * @param {string} content - Document content
     * @returns {string} Content with TOC
     */
    addTableOfContents(content) {
        const headers = [];
        const lines = content.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/^(#+)\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const title = match[2];
                const anchor = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
                headers.push({ level, title, anchor });
            }
        });
        
        if (headers.length === 0) return content;
        
        let toc = '## Table of Contents\n\n';
        headers.forEach(header => {
            const indent = '  '.repeat(header.level - 2);
            toc += `${indent}- [${header.title}](#${header.anchor})\n`;
        });
        toc += '\n';
        
        // Insert TOC after first header
        const firstHeaderIndex = lines.findIndex(line => line.match(/^#\s+/));
        if (firstHeaderIndex !== -1) {
            lines.splice(firstHeaderIndex + 1, 0, '', toc);
        } else {
            lines.unshift(toc);
        }
        
        return lines.join('\n');
    }

    /**
     * Inject variables into template string
     * @param {string} template - Template string
     * @param {Object} data - Data to inject
     * @returns {string} String with variables injected
     */
    injectVariables(template, data) {
        return template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
            const value = this.getNestedValue(data, variable.trim());
            return value !== undefined ? value : match;
        });
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
     * Evaluate a condition
     * @param {string|Function} condition - Condition to evaluate
     * @param {Object} data - Data context
     * @param {Object} options - Options context
     * @returns {boolean} Condition result
     */
    evaluateCondition(condition, data, options) {
        if (typeof condition === 'function') {
            return condition(data, options);
        }

        // Simple string evaluation
        return Boolean(this.getNestedValue(data, condition));
    }

    /**
     * Register custom document template
     * @param {string} templateType - Template type name
     * @param {Object} template - Template definition
     */
    registerTemplate(templateType, template) {
        this.documentTemplates[templateType] = template;
    }

    /**
     * Initialize document templates
     */
    initializeDocumentTemplates() {
        return {
            'azure-tool': {
                name: 'Azure MCP Tool Documentation',
                sections: [
                    {
                        name: 'overview',
                        type: 'overview',
                        dataPath: 'tool',
                        condition: 'tool.function'
                    },
                    {
                        name: 'parameters',
                        type: 'parameters',
                        dataPath: 'parameters',
                        condition: 'parameters'
                    },
                    {
                        name: 'examples',
                        type: 'examples',
                        dataPath: 'examples',
                        condition: 'examples.length'
                    },
                    {
                        name: 'reference',
                        type: 'reference',
                        dataPath: 'tool',
                        optionFlag: 'includeReference'
                    },
                    {
                        name: 'troubleshooting',
                        type: 'troubleshooting',
                        dataPath: 'troubleshooting',
                        optionFlag: 'includeTroubleshooting'
                    }
                ],
                header: '# {{tool.displayName || tool.function.name}}\n\n{{tool.function.description}}',
                footer: '\n---\n\n*Documentation generated by Azure MCP Server Documentation Generator*'
            },

            'service-overview': {
                name: 'Azure Service Overview',
                sections: [
                    {
                        name: 'overview',
                        type: 'overview',
                        condition: 'service'
                    },
                    {
                        name: 'tools-list',
                        type: 'overview',
                        dataTransform: (data) => ({
                            ...data,
                            description: `Available tools for ${data.service.name}:`,
                            operations: data.tools.map(tool => ({
                                name: tool.function.name,
                                description: tool.function.description
                            }))
                        })
                    }
                ],
                header: '# {{service.name}} Tools for Azure MCP Server',
                footer: ''
            },

            'complete-reference': {
                name: 'Complete API Reference',
                sections: [
                    {
                        name: 'overview',
                        type: 'overview'
                    },
                    {
                        name: 'tools',
                        type: 'reference',
                        condition: 'tools.length'
                    }
                ],
                header: '# Azure MCP Server - Complete Reference',
                footer: ''
            }
        };
    }

    /**
     * Initialize layout rules
     */
    initializeLayoutRules() {
        return {
            default: [
                {
                    name: 'normalize-headers',
                    pattern: /^(#+)\s*(.+?)\s*$/gm,
                    replacement: '$1 $2'
                },
                {
                    name: 'clean-excessive-newlines',
                    pattern: /\n{4,}/g,
                    replacement: '\n\n\n'
                }
            ],
            'azure-tool': [
                {
                    name: 'format-function-names',
                    pattern: /`([a-zA-Z_][a-zA-Z0-9_]*)`/g,
                    replacement: '`$1`'
                },
                {
                    name: 'highlight-azure-terms',
                    pattern: /\b(Azure|MCP|Server)\b/g,
                    replacement: '**$1**'
                }
            ]
        };
    }
}

module.exports = DocumentTemplateProcessor;
