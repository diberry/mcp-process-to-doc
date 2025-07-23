/**
 * Section Template Processor
 * 
 * Processes and compiles individual documentation section templates
 * with content injection, conditional rendering, and formatting.
 */

class SectionTemplateProcessor {
    constructor() {
        this.sectionTemplates = this.initializeSectionTemplates();
        this.conditionalPatterns = this.initializeConditionalPatterns();
        this.formattingRules = this.initializeFormattingRules();
    }

    /**
     * Process a complete section template with data
     * @param {string} sectionType - Type of section (overview, parameters, examples, etc.)
     * @param {Object} data - Data to inject into template
     * @param {Object} options - Processing options
     * @returns {string} Processed section content
     */
    processSection(sectionType, data, options = {}) {
        const template = this.getSectionTemplate(sectionType);
        if (!template) {
            throw new Error(`Unknown section type: ${sectionType}`);
        }

        let content = template.content;

        // Process conditionals first
        content = this.processConditionals(content, data, options);

        // Inject data variables
        content = this.injectVariables(content, data);

        // Apply formatting rules
        content = this.applyFormatting(content, sectionType, options);

        // Post-process cleanup
        content = this.cleanupContent(content);

        return content;
    }

    /**
     * Process multiple sections as a batch
     * @param {Array} sections - Array of {type, data, options} objects
     * @param {Object} globalOptions - Global processing options
     * @returns {Object} Map of section type to processed content
     */
    processSections(sections, globalOptions = {}) {
        const results = {};

        sections.forEach(section => {
            const mergedOptions = { ...globalOptions, ...section.options };
            results[section.type] = this.processSection(section.type, section.data, mergedOptions);
        });

        return results;
    }

    /**
     * Get section template by type
     * @param {string} sectionType - Section type
     * @returns {Object} Template object
     */
    getSectionTemplate(sectionType) {
        return this.sectionTemplates[sectionType];
    }

    /**
     * Process conditional blocks in template
     * @param {string} content - Template content
     * @param {Object} data - Data for conditionals
     * @param {Object} options - Processing options
     * @returns {string} Content with conditionals processed
     */
    processConditionals(content, data, options) {
        // Process {{#if condition}} blocks
        content = content.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, block) => {
            if (this.evaluateCondition(condition, data, options)) {
                return block;
            }
            return '';
        });

        // Process {{#unless condition}} blocks
        content = content.replace(/\{\{#unless\s+([^}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, condition, block) => {
            if (!this.evaluateCondition(condition, data, options)) {
                return block;
            }
            return '';
        });

        // Process {{#each array}} blocks
        content = content.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, block) => {
            const array = this.getNestedValue(data, arrayPath);
            if (Array.isArray(array)) {
                return array.map((item, index) => {
                    return this.injectVariables(block, { ...data, this: item, index: index });
                }).join('');
            }
            return '';
        });

        return content;
    }

    /**
     * Evaluate a conditional expression
     * @param {string} condition - Condition to evaluate
     * @param {Object} data - Data context
     * @param {Object} options - Options context
     * @returns {boolean} Condition result
     */
    evaluateCondition(condition, data, options) {
        // Handle simple existence checks
        if (condition.includes('.')) {
            const value = this.getNestedValue(data, condition);
            return Boolean(value);
        }

        // Handle option flags
        if (condition.startsWith('options.')) {
            const optionPath = condition.substring(8);
            return Boolean(options[optionPath]);
        }

        // Handle comparisons
        if (condition.includes('==')) {
            const [left, right] = condition.split('==').map(s => s.trim());
            const leftValue = this.getNestedValue(data, left);
            const rightValue = right.startsWith('"') ? right.slice(1, -1) : this.getNestedValue(data, right);
            return leftValue == rightValue;
        }

        if (condition.includes('!=')) {
            const [left, right] = condition.split('!=').map(s => s.trim());
            const leftValue = this.getNestedValue(data, left);
            const rightValue = right.startsWith('"') ? right.slice(1, -1) : this.getNestedValue(data, right);
            return leftValue != rightValue;
        }

        // Handle array length checks
        if (condition.includes('.length')) {
            const arrayPath = condition.replace('.length', '');
            const array = this.getNestedValue(data, arrayPath);
            return Array.isArray(array) && array.length > 0;
        }

        // Simple variable existence
        return Boolean(data[condition]);
    }

    /**
     * Inject variables into template content
     * @param {string} content - Template content
     * @param {Object} data - Data to inject
     * @returns {string} Content with variables injected
     */
    injectVariables(content, data) {
        // Replace {{variable}} patterns
        content = content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
            const trimmed = variable.trim();
            
            // Handle helper functions
            if (trimmed.includes('|')) {
                return this.processHelper(trimmed, data);
            }

            // Handle nested properties
            const value = this.getNestedValue(data, trimmed);
            return value !== undefined ? value : match;
        });

        return content;
    }

    /**
     * Process helper functions
     * @param {string} expression - Helper expression
     * @param {Object} data - Data context
     * @returns {string} Processed value
     */
    processHelper(expression, data) {
        const [variable, ...helpers] = expression.split('|').map(s => s.trim());
        let value = this.getNestedValue(data, variable);

        helpers.forEach(helper => {
            value = this.applyHelper(helper, value, data);
        });

        return value;
    }

    /**
     * Apply a helper function to a value
     * @param {string} helper - Helper name and arguments
     * @param {*} value - Value to process
     * @param {Object} data - Data context
     * @returns {*} Processed value
     */
    applyHelper(helper, value, data) {
        const [helperName, ...args] = helper.split(' ');

        switch (helperName) {
            case 'uppercase':
                return String(value).toUpperCase();
            case 'lowercase':
                return String(value).toLowerCase();
            case 'capitalize':
                return String(value).charAt(0).toUpperCase() + String(value).slice(1);
            case 'default':
                return value || args[0];
            case 'json':
                return JSON.stringify(value, null, 2);
            case 'join':
                return Array.isArray(value) ? value.join(args[0] || ', ') : value;
            case 'truncate':
                const maxLength = parseInt(args[0]) || 100;
                return String(value).length > maxLength 
                    ? String(value).substring(0, maxLength) + '...' 
                    : value;
            case 'replace':
                return String(value).replace(new RegExp(args[0], 'g'), args[1] || '');
            case 'markdown-escape':
                return String(value).replace(/[*_`[\]()]/g, '\\$&');
            case 'code-block':
                return `\`\`\`${args[0] || 'text'}\n${value}\n\`\`\``;
            case 'inline-code':
                return `\`${value}\``;
            default:
                return value;
        }
    }

    /**
     * Get nested value from object
     * @param {Object} obj - Object to search
     * @param {string} path - Dot-notation path
     * @returns {*} Found value or undefined
     */
    getNestedValue(obj, path) {
        if (!obj || !path) return undefined;
        
        // Handle 'this' reference
        if (path === 'this') return obj;
        
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Apply formatting rules to content
     * @param {string} content - Content to format
     * @param {string} sectionType - Section type
     * @param {Object} options - Formatting options
     * @returns {string} Formatted content
     */
    applyFormatting(content, sectionType, options) {
        const rules = this.formattingRules[sectionType] || this.formattingRules.default;

        rules.forEach(rule => {
            content = content.replace(rule.pattern, rule.replacement);
        });

        // Apply global formatting options
        if (options.addLineNumbers) {
            content = this.addLineNumbers(content);
        }

        if (options.indentLevel) {
            content = this.indentContent(content, options.indentLevel);
        }

        return content;
    }

    /**
     * Clean up processed content
     * @param {string} content - Content to clean
     * @returns {string} Cleaned content
     */
    cleanupContent(content) {
        // Remove extra whitespace
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        // Trim leading/trailing whitespace
        content = content.trim();
        
        // Fix markdown formatting issues
        content = content.replace(/^#+\s*$/gm, ''); // Remove empty headers
        content = content.replace(/\n\n#+/g, '\n\n##'); // Ensure headers have proper spacing
        
        return content;
    }

    /**
     * Add line numbers to content
     * @param {string} content - Content to number
     * @returns {string} Content with line numbers
     */
    addLineNumbers(content) {
        return content.split('\n').map((line, index) => {
            return `${(index + 1).toString().padStart(3, ' ')}: ${line}`;
        }).join('\n');
    }

    /**
     * Indent content by specified level
     * @param {string} content - Content to indent
     * @param {number} level - Indentation level
     * @returns {string} Indented content
     */
    indentContent(content, level) {
        const indent = '  '.repeat(level);
        return content.split('\n').map(line => {
            return line.trim() ? indent + line : line;
        }).join('\n');
    }

    /**
     * Register custom section template
     * @param {string} sectionType - Section type name
     * @param {Object} template - Template definition
     */
    registerTemplate(sectionType, template) {
        this.sectionTemplates[sectionType] = template;
    }

    /**
     * Register custom helper function
     * @param {string} helperName - Helper function name
     * @param {Function} helperFn - Helper function
     */
    registerHelper(helperName, helperFn) {
        // Store custom helpers for later use
        if (!this.customHelpers) {
            this.customHelpers = {};
        }
        this.customHelpers[helperName] = helperFn;
    }

    /**
     * Initialize section templates
     */
    initializeSectionTemplates() {
        return {
            overview: {
                name: 'Overview',
                content: `## Overview

{{description}}

{{#if serviceInfo.documentation}}
For more information about {{serviceName}}, see the [official documentation]({{serviceInfo.documentation}}).
{{/if}}

### Available Operations

{{#each operations}}
- **{{this.name}}**: {{this.description}}
{{/each}}`
            },

            parameters: {
                name: 'Parameters',
                content: `## Parameters

{{#if hasRequiredParams}}
### Required Parameters

{{#each requiredParams}}
- **{{name}}** ({{type}}): {{description}}
{{/each}}
{{/if}}

{{#if hasOptionalParams}}
### Optional Parameters

{{#each optionalParams}}
- **{{name}}** ({{type}}): {{description}}{{#if default}} (Default: {{default}}){{/if}}
{{/each}}
{{/if}}`
            },

            examples: {
                name: 'Usage Examples',
                content: `## Usage Examples

{{#each examples}}
### {{title}}

{{description}}

**User Prompt:**
> {{userPrompt}}

**Expected Response:**
{{expectedResponse}}

{{#if notes}}
**Notes:**
{{notes}}
{{/if}}

{{/each}}`
            },

            reference: {
                name: 'API Reference',
                content: `## API Reference

### Function Signature

\`\`\`typescript
{{functionSignature}}
\`\`\`

### Parameters Schema

\`\`\`json
{{parametersSchema | json}}
\`\`\`

{{#if responseSchema}}
### Response Schema

\`\`\`json
{{responseSchema | json}}
\`\`\`
{{/if}}`
            },

            troubleshooting: {
                name: 'Troubleshooting',
                content: `## Troubleshooting

{{#if commonErrors.length}}
### Common Errors

{{#each commonErrors}}
**{{error}}**
- **Cause**: {{cause}}
- **Solution**: {{solution}}

{{/each}}
{{/if}}

{{#if tips.length}}
### Tips

{{#each tips}}
- {{this}}
{{/each}}
{{/if}}`
            }
        };
    }

    /**
     * Initialize conditional patterns
     */
    initializeConditionalPatterns() {
        return {
            existence: /\{\{#if\s+([^}]+)\}\}/,
            negation: /\{\{#unless\s+([^}]+)\}\}/,
            iteration: /\{\{#each\s+([^}]+)\}\}/,
            comparison: /\{\{#if\s+([^}]+)\s*(==|!=)\s*([^}]+)\}\}/
        };
    }

    /**
     * Initialize formatting rules
     */
    initializeFormattingRules() {
        return {
            default: [
                {
                    name: 'clean-empty-lines',
                    pattern: /\n\s*\n\s*\n/g,
                    replacement: '\n\n'
                },
                {
                    name: 'fix-header-spacing',
                    pattern: /^(#+)\s*(.+?)\s*$/gm,
                    replacement: '$1 $2'
                }
            ],
            parameters: [
                {
                    name: 'format-parameter-lists',
                    pattern: /^-\s+\*\*([^*]+)\*\*\s*\(([^)]+)\):\s*(.+)$/gm,
                    replacement: '- **$1** (`$2`): $3'
                }
            ],
            examples: [
                {
                    name: 'format-user-prompts',
                    pattern: /^>\s*(.+)$/gm,
                    replacement: '> $1'
                }
            ]
        };
    }
}

module.exports = SectionTemplateProcessor;
