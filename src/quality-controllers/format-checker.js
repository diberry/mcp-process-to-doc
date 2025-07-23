/**
 * Format Checker - Check compliance with documentation standards
 * 
 * This module validates that generated documentation follows the exact
 * template format and Microsoft documentation standards.
 */

class FormatChecker {
    constructor() {
        this.formatRules = this.initializeFormatRules();
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Check complete document format compliance
     * @param {string} documentMarkdown - Complete document markdown
     * @returns {Object} Format compliance result
     */
    checkDocumentFormat(documentMarkdown) {
        this.clearValidationState();
        
        this.checkYamlFrontMatter(documentMarkdown);
        this.checkHeadingStructure(documentMarkdown);
        this.checkTemplateCompliance(documentMarkdown);
        this.checkMarkdownSyntax(documentMarkdown);
        this.checkMicrosoftStandards(documentMarkdown);
        
        return this.getValidationResult();
    }

    /**
     * Check operation section format
     * @param {string} operationMarkdown - Operation section markdown
     * @returns {Object} Format compliance result
     */
    checkOperationFormat(operationMarkdown) {
        this.clearValidationState();
        
        this.checkOperationHeading(operationMarkdown);
        this.checkHtmlComment(operationMarkdown);
        this.checkExamplePromptsFormat(operationMarkdown);
        this.checkParameterTableFormat(operationMarkdown);
        this.checkSectionOrder(operationMarkdown);
        
        return this.getValidationResult();
    }

    /**
     * Check YAML front matter format
     */
    checkYamlFrontMatter(documentMarkdown) {
        const yamlMatch = documentMarkdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
        
        if (!yamlMatch) {
            this.addError('Missing YAML front matter');
            return;
        }

        const yamlContent = yamlMatch[1];
        const lines = yamlContent.split('\n');
        
        // Check required YAML fields
        const requiredFields = ['title', 'description', 'keywords', 'ms.service', 'ms.topic', 'ms.date'];
        const foundFields = new Set();
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const colonIndex = trimmed.indexOf(':');
                if (colonIndex > 0) {
                    const fieldName = trimmed.substring(0, colonIndex).trim();
                    foundFields.add(fieldName);
                    
                    // Check field format
                    this.checkYamlFieldFormat(fieldName, trimmed, index + 1);
                }
            }
        });

        // Check for missing required fields
        requiredFields.forEach(field => {
            if (!foundFields.has(field)) {
                this.addError(`Missing required YAML field: ${field}`);
            }
        });
    }

    /**
     * Check YAML field format
     */
    checkYamlFieldFormat(fieldName, line, lineNumber) {
        const value = line.substring(line.indexOf(':') + 1).trim();
        
        switch (fieldName) {
            case 'title':
                if (!value.includes('Azure MCP Server')) {
                    this.addWarning(`Line ${lineNumber}: Title should include "Azure MCP Server"`);
                }
                break;
            case 'ms.service':
                if (value !== 'azure-mcp-server') {
                    this.addError(`Line ${lineNumber}: ms.service should be "azure-mcp-server"`);
                }
                break;
            case 'ms.topic':
                if (value !== 'reference') {
                    this.addWarning(`Line ${lineNumber}: ms.topic should typically be "reference"`);
                }
                break;
            case 'ms.date':
                if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    this.addError(`Line ${lineNumber}: ms.date should be in YYYY-MM-DD format`);
                }
                break;
        }
    }

    /**
     * Check heading structure
     */
    checkHeadingStructure(documentMarkdown) {
        const lines = documentMarkdown.split('\n');
        const headings = [];
        
        lines.forEach((line, index) => {
            if (line.match(/^#{1,6}\s/)) {
                const level = line.match(/^#+/)[0].length;
                const text = line.replace(/^#+\s*/, '').trim();
                headings.push({ level, text, line: index + 1 });
            }
        });

        if (headings.length === 0) {
            this.addError('Document has no headings');
            return;
        }

        // Check H1 heading
        const h1Headings = headings.filter(h => h.level === 1);
        if (h1Headings.length === 0) {
            this.addError('Document missing H1 heading');
        } else if (h1Headings.length > 1) {
            this.addError('Document should have only one H1 heading');
        } else {
            const h1 = h1Headings[0];
            if (!h1.text.includes('tools for the Azure MCP Server')) {
                this.addError('H1 heading should follow format: "{Service} tools for the Azure MCP Server"');
            }
        }

        // Check heading hierarchy
        this.checkHeadingHierarchy(headings);
    }

    /**
     * Check heading hierarchy
     */
    checkHeadingHierarchy(headings) {
        for (let i = 1; i < headings.length; i++) {
            const current = headings[i];
            const previous = headings[i - 1];
            
            // Don't skip more than one level
            if (current.level > previous.level + 1) {
                this.addWarning(`Line ${current.line}: Heading level jumps from H${previous.level} to H${current.level}`);
            }
        }
    }

    /**
     * Check template compliance
     */
    checkTemplateCompliance(documentMarkdown) {
        // Check for required template sections
        const requiredSections = [
            'tools for the Azure MCP Server',
            '[!INCLUDE [tip-about-params]',
            '## Related content'
        ];

        requiredSections.forEach(section => {
            if (!documentMarkdown.includes(section)) {
                this.addError(`Missing required template section: ${section}`);
            }
        });

        // Check for template variables that weren't replaced
        const unreplacedVariables = documentMarkdown.match(/\{[^}]+\}/g);
        if (unreplacedVariables) {
            unreplacedVariables.forEach(variable => {
                this.addError(`Unreplaced template variable: ${variable}`);
            });
        }
    }

    /**
     * Check operation heading format
     */
    checkOperationHeading(operationMarkdown) {
        const h2Match = operationMarkdown.match(/^## (.+)$/m);
        
        if (!h2Match) {
            this.addError('Operation section missing H2 heading');
            return;
        }

        const headingText = h2Match[1].trim();
        
        // Should be natural language, not technical
        if (headingText.includes('-') || headingText.includes('_')) {
            this.addWarning('Operation heading should use natural language, not technical names');
        }

        // Should not be all caps
        if (headingText === headingText.toUpperCase()) {
            this.addError('Operation heading should not be all uppercase');
        }
    }

    /**
     * Check HTML comment format
     */
    checkHtmlComment(operationMarkdown) {
        const commentMatch = operationMarkdown.match(/<!--\s*([\s\S]*?)\s*-->/);
        
        if (!commentMatch) {
            this.addError('Missing HTML command comment');
            return;
        }

        const comment = commentMatch[1].trim();
        
        // Should start with azmcp
        if (!comment.startsWith('azmcp')) {
            this.addError('HTML comment should contain azmcp command');
        }

        // Check for proper placement (should be after heading)
        const lines = operationMarkdown.split('\n');
        let headingIndex = -1;
        let commentIndex = -1;
        
        lines.forEach((line, index) => {
            if (line.match(/^## /)) {
                headingIndex = index;
            }
            if (line.includes('<!--')) {
                commentIndex = index;
            }
        });

        if (headingIndex >= 0 && commentIndex >= 0 && commentIndex <= headingIndex) {
            this.addError('HTML comment should come after the operation heading');
        }
    }

    /**
     * Check example prompts format
     */
    checkExamplePromptsFormat(operationMarkdown) {
        // Check for section header
        if (!operationMarkdown.includes('Example prompts include:')) {
            this.addError('Missing "Example prompts include:" section header');
            return;
        }

        // Check prompt format
        const promptRegex = /^- \*\*(.*?)\*\*: "(.*?)"$/gm;
        const prompts = [...operationMarkdown.matchAll(promptRegex)];
        
        if (prompts.length === 0) {
            this.addError('No properly formatted example prompts found');
            return;
        }

        // Check each prompt format
        prompts.forEach((prompt, index) => {
            const [fullMatch, summary, text] = prompt;
            
            // Summary should be bold
            if (!summary) {
                this.addError(`Example prompt ${index + 1}: Missing bold summary`);
            }

            // Text should be in quotes
            if (!text) {
                this.addError(`Example prompt ${index + 1}: Missing quoted text`);
            }
        });

        // Check for proper indentation
        const lines = operationMarkdown.split('\n');
        const promptLines = lines.filter(line => line.match(/^- \*\*/));
        
        promptLines.forEach((line, index) => {
            if (!line.startsWith('- ')) {
                this.addError(`Example prompt line ${index + 1}: Should start with "- "`);
            }
        });
    }

    /**
     * Check parameter table format
     */
    checkParameterTableFormat(operationMarkdown) {
        const expectedHeader = '| Parameter | Required or optional | Description |';
        const expectedSeparator = '|-----------|-------------|-------------|';
        
        if (!operationMarkdown.includes(expectedHeader)) {
            this.addError('Parameter table missing correct header row');
        }

        if (!operationMarkdown.includes(expectedSeparator)) {
            this.addError('Parameter table missing correct separator row');
        }

        // Check parameter row format
        const paramRowRegex = /^\| \*\*(.*?)\*\* \| (Required|Optional) \| (.*?) \|$/gm;
        const paramRows = [...operationMarkdown.matchAll(paramRowRegex)];
        
        if (paramRows.length === 0) {
            this.addWarning('No parameter rows found in correct format');
        }

        // Check table alignment
        const lines = operationMarkdown.split('\n');
        const tableLines = lines.filter(line => line.startsWith('|') && line.endsWith('|'));
        
        if (tableLines.length > 0) {
            const columnCounts = tableLines.map(line => (line.match(/\|/g) || []).length);
            const expectedColumns = 4; // | param | req | desc |
            
            columnCounts.forEach((count, index) => {
                if (count !== expectedColumns) {
                    this.addWarning(`Table row ${index + 1}: Inconsistent column count (${count} vs ${expectedColumns})`);
                }
            });
        }
    }

    /**
     * Check section order
     */
    checkSectionOrder(operationMarkdown) {
        const lines = operationMarkdown.split('\n');
        let headingIndex = -1;
        let commentIndex = -1;
        let exampleIndex = -1;
        let tableIndex = -1;

        lines.forEach((line, index) => {
            if (line.match(/^## /)) headingIndex = index;
            if (line.includes('<!--')) commentIndex = index;
            if (line.includes('Example prompts include:')) exampleIndex = index;
            if (line.includes('| Parameter |')) tableIndex = index;
        });

        // Check correct order: heading -> comment -> description -> examples -> table
        if (headingIndex >= 0 && commentIndex >= 0 && commentIndex <= headingIndex) {
            this.addError('HTML comment should come after heading');
        }

        if (exampleIndex >= 0 && tableIndex >= 0 && tableIndex <= exampleIndex) {
            this.addError('Parameter table should come after example prompts');
        }
    }

    /**
     * Check markdown syntax
     */
    checkMarkdownSyntax(documentMarkdown) {
        const lines = documentMarkdown.split('\n');
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            
            // Check for malformed links
            const linkMatches = line.match(/\[([^\]]*)\]\(([^)]*)\)/g);
            if (linkMatches) {
                linkMatches.forEach(link => {
                    if (link.includes('](') && !link.match(/\]\([^)]+\)/)) {
                        this.addError(`Line ${lineNum}: Malformed markdown link: ${link}`);
                    }
                });
            }

            // Check for unmatched bold/italic
            const boldCount = (line.match(/\*\*/g) || []).length;
            if (boldCount % 2 !== 0) {
                this.addWarning(`Line ${lineNum}: Unmatched bold markdown (**)`);
            }

            // Check for trailing spaces
            if (line.endsWith(' ') && line.trim() !== '') {
                this.addWarning(`Line ${lineNum}: Line has trailing spaces`);
            }
        });
    }

    /**
     * Check Microsoft documentation standards
     */
    checkMicrosoftStandards(documentMarkdown) {
        // Check for Microsoft-style includes
        if (!documentMarkdown.includes('[!INCLUDE')) {
            this.addWarning('Consider using Microsoft-style includes for common content');
        }

        // Check for Azure documentation links
        const azureLinks = documentMarkdown.match(/\[.*?\]\(\/azure\/.*?\)/g);
        if (!azureLinks || azureLinks.length === 0) {
            this.addWarning('Should include links to Azure documentation');
        }

        // Check for consistent terminology
        const inconsistentTerms = [
            { wrong: 'login', correct: 'sign in' },
            { wrong: 'setup', correct: 'set up' },
            { wrong: 'email', correct: 'email address' }
        ];

        inconsistentTerms.forEach(term => {
            if (documentMarkdown.toLowerCase().includes(term.wrong)) {
                this.addWarning(`Use "${term.correct}" instead of "${term.wrong}"`);
            }
        });
    }

    /**
     * Helper methods
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
     * Initialize format rules
     */
    initializeFormatRules() {
        return {
            requiredYamlFields: ['title', 'description', 'keywords', 'ms.service', 'ms.topic', 'ms.date'],
            requiredSections: [
                'tools for the Azure MCP Server',
                '[!INCLUDE [tip-about-params]',
                '## Related content'
            ],
            maxLineLength: 120,
            requiredService: 'azure-mcp-server',
            dateFormat: /^\d{4}-\d{2}-\d{2}$/
        };
    }
}

module.exports = FormatChecker;
