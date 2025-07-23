/**
 * Content Validator - Validates content quality and completeness
 * 
 * This module ensures generated content meets quality standards for
 * Azure MCP Server documentation including completeness, clarity, and usefulness.
 */

class ContentValidator {
    constructor() {
        this.qualityRules = this.initializeQualityRules();
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Validate complete documentation content
     * @param {Object} content - Generated content object
     * @returns {Object} Validation result with errors and warnings
     */
    validateDocumentation(content) {
        this.clearValidationState();
        
        this.validateMetadata(content.metadata);
        this.validateIntroduction(content.introduction);
        this.validateOperations(content.operations);
        this.validateRelatedContent(content.relatedContent);
        
        return this.getValidationResult();
    }

    /**
     * Validate individual operation section
     * @param {string} operationMarkdown - Operation section markdown
     * @returns {Object} Validation result
     */
    validateOperationSection(operationMarkdown) {
        this.clearValidationState();
        
        this.validateOperationStructure(operationMarkdown);
        this.validateExamplePrompts(operationMarkdown);
        this.validateParameterTable(operationMarkdown);
        this.validateCommandComment(operationMarkdown);
        
        return this.getValidationResult();
    }

    /**
     * Validate metadata section
     */
    validateMetadata(metadata) {
        if (!metadata) {
            this.addError('Metadata section is missing');
            return;
        }

        // Required fields
        const requiredFields = ['title', 'description', 'keywords', 'service', 'topic', 'date'];
        for (const field of requiredFields) {
            if (!metadata[field]) {
                this.addError(`Metadata missing required field: ${field}`);
            }
        }

        // Title validation
        if (metadata.title && !metadata.title.includes('Azure MCP Server')) {
            this.addWarning('Title should include "Azure MCP Server"');
        }

        // Description validation
        if (metadata.description && metadata.description.length < 50) {
            this.addWarning('Description should be at least 50 characters for better SEO');
        }

        // Keywords validation
        if (metadata.keywords && !metadata.keywords.includes('azure mcp server')) {
            this.addWarning('Keywords should include "azure mcp server"');
        }

        // Date validation
        if (metadata.date && !this.isValidDate(metadata.date)) {
            this.addError('Date should be in YYYY-MM-DD format');
        }
    }

    /**
     * Validate introduction section
     */
    validateIntroduction(introduction) {
        if (!introduction) {
            this.addError('Introduction section is missing');
            return;
        }

        // Title validation
        if (!introduction.title || !introduction.title.includes('tools for the Azure MCP Server')) {
            this.addError('Introduction title should follow format: "{Service} tools for the Azure MCP Server"');
        }

        // Overview validation
        if (!introduction.overview || introduction.overview.length < 100) {
            this.addWarning('Overview should be at least 100 characters to provide adequate context');
        }

        if (introduction.overview && !introduction.overview.includes('natural language prompts')) {
            this.addWarning('Overview should mention "natural language prompts"');
        }

        // Service description validation
        if (!introduction.serviceDescription || !introduction.serviceDescription.includes('/azure/')) {
            this.addError('Service description must include proper Azure documentation link');
        }
    }

    /**
     * Validate operations sections
     */
    validateOperations(operations) {
        if (!operations || operations.length === 0) {
            this.addError('At least one operation section is required');
            return;
        }

        operations.forEach((operation, index) => {
            if (typeof operation === 'string') {
                this.validateOperationStructure(operation, index);
            }
        });
    }

    /**
     * Validate operation structure
     */
    validateOperationStructure(operationMarkdown, index = 0) {
        const sectionName = `Operation ${index + 1}`;

        // Check for H2 heading
        if (!operationMarkdown.includes('\n## ')) {
            this.addError(`${sectionName}: Missing H2 heading`);
        }

        // Check for HTML comment with command
        if (!operationMarkdown.includes('<!--') || !operationMarkdown.includes('-->')) {
            this.addError(`${sectionName}: Missing HTML command comment`);
        }

        // Check for description paragraph
        const lines = operationMarkdown.split('\n').filter(line => line.trim());
        const hasDescription = lines.some(line => 
            !line.startsWith('#') && 
            !line.startsWith('<!--') && 
            !line.startsWith('-->') &&
            !line.startsWith('|') &&
            !line.startsWith('-') &&
            line.length > 50
        );
        
        if (!hasDescription) {
            this.addError(`${sectionName}: Missing descriptive paragraph`);
        }

        // Check for example prompts section
        if (!operationMarkdown.includes('Example prompts include:')) {
            this.addError(`${sectionName}: Missing "Example prompts include:" section`);
        }

        // Check for parameter table
        if (!operationMarkdown.includes('| Parameter | Required or optional | Description |')) {
            this.addError(`${sectionName}: Missing parameter table with correct headers`);
        }
    }

    /**
     * Validate example prompts quality
     */
    validateExamplePrompts(operationMarkdown) {
        const promptRegex = /- \*\*(.*?)\*\*: "(.*?)"/g;
        const prompts = [...operationMarkdown.matchAll(promptRegex)];

        if (prompts.length < 3) {
            this.addError('Should have at least 3 example prompts');
        }

        if (prompts.length > 7) {
            this.addWarning('Consider limiting to 5-7 example prompts for readability');
        }

        prompts.forEach((prompt, index) => {
            const [, summary, text] = prompt;
            
            // Summary validation
            if (!summary || summary.length < 3) {
                this.addError(`Example prompt ${index + 1}: Summary too short`);
            }

            if (summary && summary.length > 40) {
                this.addWarning(`Example prompt ${index + 1}: Summary too long (${summary.length} chars)`);
            }

            // Text validation
            if (!text || text.length < 10) {
                this.addError(`Example prompt ${index + 1}: Prompt text too short`);
            }

            if (text && text.length > 200) {
                this.addWarning(`Example prompt ${index + 1}: Prompt text too long (${text.length} chars)`);
            }

            // Quality checks
            if (text && this.isGenericPrompt(text)) {
                this.addWarning(`Example prompt ${index + 1}: Prompt appears generic: "${text}"`);
            }
        });

        // Check for variety
        const promptTexts = prompts.map(p => p[2].toLowerCase());
        const uniqueStarters = new Set(promptTexts.map(text => text.split(' ')[0]));
        
        if (uniqueStarters.size < Math.min(3, prompts.length)) {
            this.addWarning('Example prompts should have more variety in sentence starters');
        }
    }

    /**
     * Validate parameter table
     */
    validateParameterTable(operationMarkdown) {
        const tableRegex = /\| \*\*(.*?)\*\* \| (Required|Optional) \| (.*?) \|/g;
        const parameters = [...operationMarkdown.matchAll(tableRegex)];

        if (parameters.length === 0) {
            this.addError('Parameter table has no parameters or incorrect format');
            return;
        }

        parameters.forEach((param, index) => {
            const [, name, required, description] = param;
            
            // Name validation
            if (!name || name.length < 2) {
                this.addError(`Parameter ${index + 1}: Name too short or missing`);
            }

            // Required/Optional validation
            if (!['Required', 'Optional'].includes(required)) {
                this.addError(`Parameter ${index + 1}: Must be "Required" or "Optional", got "${required}"`);
            }

            // Description validation
            if (!description || description.length < 20) {
                this.addWarning(`Parameter ${index + 1}: Description should be more detailed (${description?.length || 0} chars)`);
            }

            if (description && !description.endsWith('.')) {
                this.addWarning(`Parameter ${index + 1}: Description should end with a period`);
            }
        });
    }

    /**
     * Validate command comment format
     */
    validateCommandComment(operationMarkdown) {
        const commentMatch = operationMarkdown.match(/<!--\s*(.*?)\s*-->/s);
        
        if (!commentMatch) {
            this.addError('Missing HTML command comment');
            return;
        }

        const command = commentMatch[1].trim();
        
        if (!command.startsWith('azmcp')) {
            this.addError('Command comment should start with "azmcp"');
        }

        if (!command.includes('--')) {
            this.addWarning('Command should include parameter examples (--parameter)');
        }
    }

    /**
     * Validate related content section
     */
    validateRelatedContent(relatedContent) {
        if (!relatedContent || !relatedContent.links) {
            this.addError('Related content section is missing');
            return;
        }

        const links = relatedContent.links;
        
        if (links.length < 3) {
            this.addWarning('Should have at least 3 related content links');
        }

        // Check for required links
        const hasIndexLink = links.some(link => link.includes('index.md'));
        const hasGetStartedLink = links.some(link => link.includes('get-started.md'));
        
        if (!hasIndexLink) {
            this.addError('Missing link to index.md');
        }

        if (!hasGetStartedLink) {
            this.addError('Missing link to get-started.md');
        }

        // Validate link formats
        links.forEach((link, index) => {
            if (!link.startsWith('- [') || !link.includes('](')) {
                this.addError(`Related link ${index + 1}: Incorrect markdown link format`);
            }
        });
    }

    /**
     * Check if prompt text is generic/low quality
     */
    isGenericPrompt(text) {
        const genericPatterns = [
            /^(list|show|get|create|delete) (the|a|my)? ?\w+s?$/i,
            /^(help|what|how)$/i,
            /^manage resources?$/i,
            /^view (items?|resources?)$/i
        ];

        return genericPatterns.some(pattern => pattern.test(text.trim()));
    }

    /**
     * Validate date format
     */
    isValidDate(dateString) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(dateString);
    }

    /**
     * Helper methods for validation state management
     */
    clearValidationState() {
        this.errors = [];
        this.warnings = [];
    }

    addError(message) {
        this.errors.push(message);
    }

    addWarning(message) {
        this.warnings.push(message);
    }

    getValidationResult() {
        return {
            isValid: this.errors.length === 0,
            hasWarnings: this.warnings.length > 0,
            errors: [...this.errors],
            warnings: [...this.warnings],
            summary: {
                totalIssues: this.errors.length + this.warnings.length,
                errorCount: this.errors.length,
                warningCount: this.warnings.length
            }
        };
    }

    /**
     * Initialize quality rules configuration
     */
    initializeQualityRules() {
        return {
            minDescriptionLength: 50,
            minOverviewLength: 100,
            minExamplePrompts: 3,
            maxExamplePrompts: 7,
            maxPromptLength: 200,
            maxSummaryLength: 40,
            minParameterDescriptionLength: 20,
            requiredMetadataFields: ['title', 'description', 'keywords', 'service', 'topic', 'date'],
            requiredLinks: ['index.md', 'get-started.md']
        };
    }
}

module.exports = ContentValidator;
