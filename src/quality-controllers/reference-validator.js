/**
 * Reference Validator - Ensure accurate cross-references
 * 
 * This module validates all types of references within Azure MCP Server documentation,
 * including internal links, command references, parameter references, and cross-document
 * consistency to ensure accuracy and prevent broken references.
 */

const fs = require('fs');
const path = require('path');

class ReferenceValidator {
    constructor(sourceDirectory = null) {
        this.sourceDirectory = sourceDirectory;
        this.documentMap = new Map(); // Store all documents for cross-reference checking
        this.commandRegistry = new Map(); // Store all available commands
        this.parameterRegistry = new Map(); // Store all parameters by command
        this.errors = [];
        this.warnings = [];
        this.validatedUrls = new Map(); // Cache for URL validation
    }

    /**
     * Validate all references in a document
     * @param {string} documentMarkdown - Document markdown content
     * @param {string} documentId - Unique identifier for the document
     * @param {Object} metadata - Document metadata including commands and parameters
     * @returns {Object} Validation result
     */
    validateDocumentReferences(documentMarkdown, documentId = 'unknown', metadata = {}) {
        this.clearValidationState();
        
        // Register this document
        this.registerDocument(documentId, documentMarkdown, metadata);
        
        // Validate different types of references
        this.validateInternalLinks(documentMarkdown, documentId);
        this.validateCommandReferences(documentMarkdown, documentId);
        this.validateParameterReferences(documentMarkdown, documentId);
        this.validateExternalReferences(documentMarkdown, documentId);
        this.validateAnchorLinks(documentMarkdown, documentId);
        this.validateCodeReferences(documentMarkdown, documentId);
        
        return this.getValidationResult();
    }

    /**
     * Validate cross-document references across multiple documents
     * @param {Array} documents - Array of {id, content, metadata} objects
     * @returns {Object} Cross-reference validation result
     */
    validateCrossDocumentReferences(documents) {
        this.clearValidationState();
        
        // Register all documents first
        documents.forEach(doc => {
            this.registerDocument(doc.id, doc.content, doc.metadata || {});
        });
        
        // Validate cross-document references
        documents.forEach(doc => {
            this.validateCrossReferences(doc.content, doc.id);
            this.validateSharedReferences(doc.content, doc.id);
        });
        
        return this.getValidationResult();
    }

    /**
     * Register a document in the validation system
     */
    registerDocument(documentId, content, metadata) {
        // Extract headings for anchor validation
        const headings = this.extractHeadings(content);
        
        // Extract commands if this is a command document
        const commands = this.extractCommands(content, metadata);
        
        // Extract parameters
        const parameters = this.extractParameters(content, metadata);
        
        this.documentMap.set(documentId, {
            content: content,
            headings: headings,
            commands: commands,
            parameters: parameters,
            metadata: metadata
        });
        
        // Update registries
        commands.forEach(cmd => this.commandRegistry.set(cmd.name, cmd));
        parameters.forEach(param => {
            if (!this.parameterRegistry.has(param.command)) {
                this.parameterRegistry.set(param.command, new Map());
            }
            this.parameterRegistry.get(param.command).set(param.name, param);
        });
    }

    /**
     * Validate internal document links (markdown links within the document)
     */
    validateInternalLinks(documentMarkdown, documentId) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const links = [...documentMarkdown.matchAll(linkRegex)];
        
        links.forEach(link => {
            const [fullMatch, linkText, linkUrl] = link;
            const line = this.getLineNumber(documentMarkdown, link.index);
            
            if (linkUrl.startsWith('#')) {
                // Anchor link - validate it exists
                this.validateAnchorReference(linkUrl, documentId, line);
            } else if (linkUrl.startsWith('./') || linkUrl.startsWith('../')) {
                // Relative link - validate file exists
                this.validateRelativeLink(linkUrl, documentId, line);
            } else if (!linkUrl.startsWith('http')) {
                // Potentially malformed link
                this.addWarning(`Line ${line}: Potentially malformed link: "${linkUrl}"`);
            }
        });
    }

    /**
     * Validate command references in the document
     */
    validateCommandReferences(documentMarkdown, documentId) {
        // Look for command references in various formats
        const commandPatterns = [
            /`([a-zA-Z-]+)`/g, // Inline code that might be commands
            /\*\*Command:\*\*\s*`([^`]+)`/g, // Explicit command declarations
            /tool:\s*([a-zA-Z_-]+)/g // Tool references
        ];
        
        commandPatterns.forEach(pattern => {
            const matches = [...documentMarkdown.matchAll(pattern)];
            matches.forEach(match => {
                const commandName = match[1];
                const line = this.getLineNumber(documentMarkdown, match.index);
                
                if (!this.isValidCommand(commandName)) {
                    this.addError(`Line ${line}: Reference to unknown command: "${commandName}"`);
                }
            });
        });
        
        // Validate tool function references
        this.validateToolReferences(documentMarkdown, documentId);
    }

    /**
     * Validate tool function references
     */
    validateToolReferences(documentMarkdown, documentId) {
        const toolRegex = /mcp_azure_mcp_ser_azmcp_([a-zA-Z_-]+)/g;
        const toolMatches = [...documentMarkdown.matchAll(toolRegex)];
        
        toolMatches.forEach(match => {
            const toolName = match[1];
            const line = this.getLineNumber(documentMarkdown, match.index);
            
            // Check if tool exists in our command registry
            const fullToolName = `mcp_azure_mcp_ser_azmcp_${toolName}`;
            if (!this.commandRegistry.has(fullToolName)) {
                this.addError(`Line ${line}: Reference to unknown tool: "${fullToolName}"`);
            }
        });
    }

    /**
     * Validate parameter references
     */
    validateParameterReferences(documentMarkdown, documentId) {
        // Extract parameter table sections
        const parameterSections = this.extractParameterSections(documentMarkdown);
        
        parameterSections.forEach(section => {
            const { command, parameters, startLine } = section;
            
            parameters.forEach(param => {
                // Validate parameter exists for this command
                if (!this.isValidParameter(command, param.name)) {
                    this.addError(`Line ${startLine}: Unknown parameter "${param.name}" for command "${command}"`);
                }
                
                // Validate parameter type consistency
                this.validateParameterType(param, command, startLine);
            });
        });
        
        // Validate inline parameter references
        this.validateInlineParameterReferences(documentMarkdown, documentId);
    }

    /**
     * Validate inline parameter references (e.g., in example text)
     */
    validateInlineParameterReferences(documentMarkdown, documentId) {
        const paramRefRegex = /`([a-zA-Z-]+)`/g;
        const refs = [...documentMarkdown.matchAll(paramRefRegex)];
        
        refs.forEach(ref => {
            const paramName = ref[1];
            const line = this.getLineNumber(documentMarkdown, ref.index);
            
            // Check if this looks like a parameter name and validate it
            if (this.looksLikeParameterName(paramName)) {
                const isValid = this.isValidParameterAcrossCommands(paramName);
                if (!isValid) {
                    this.addWarning(`Line ${line}: Reference to potentially unknown parameter: "${paramName}"`);
                }
            }
        });
    }

    /**
     * Validate external references (URLs, Azure docs, etc.)
     */
    validateExternalReferences(documentMarkdown, documentId) {
        const urlRegex = /https?:\/\/[^\s)]+/g;
        const urls = [...documentMarkdown.matchAll(urlRegex)];
        
        urls.forEach(url => {
            const urlString = url[0];
            const line = this.getLineNumber(documentMarkdown, url.index);
            
            // Validate Azure documentation URLs
            if (urlString.includes('docs.microsoft.com')) {
                this.validateAzureDocsUrl(urlString, line);
            }
            
            // Check for common URL issues
            this.validateUrlFormat(urlString, line);
        });
        
        // Validate Azure service references
        this.validateAzureServiceReferences(documentMarkdown, documentId);
    }

    /**
     * Validate Azure documentation URLs
     */
    validateAzureDocsUrl(url, line) {
        // Check for common issues in Azure docs URLs
        if (url.includes('/en-us/') && !url.includes('azure')) {
            this.addWarning(`Line ${line}: Azure docs URL should typically include 'azure': ${url}`);
        }
        
        // Check for deprecated URL patterns
        if (url.includes('msdn.microsoft.com')) {
            this.addWarning(`Line ${line}: MSDN URLs are deprecated, use docs.microsoft.com: ${url}`);
        }
        
        // Validate URL structure
        if (!url.match(/https:\/\/docs\.microsoft\.com\/[a-z-]+\/azure/)) {
            this.addWarning(`Line ${line}: Azure docs URL may be malformed: ${url}`);
        }
    }

    /**
     * Validate URL format
     */
    validateUrlFormat(url, line) {
        // Check for common URL issues
        if (url.endsWith('.')) {
            this.addWarning(`Line ${line}: URL ends with period, may be formatting issue: ${url}`);
        }
        
        if (url.includes(' ')) {
            this.addError(`Line ${line}: URL contains spaces: ${url}`);
        }
        
        // Check for incomplete URLs
        if (url.length < 10) {
            this.addWarning(`Line ${line}: URL seems too short: ${url}`);
        }
    }

    /**
     * Validate Azure service references
     */
    validateAzureServiceReferences(documentMarkdown, documentId) {
        const servicePatterns = [
            /Azure\s+([A-Z][a-zA-Z\s]+)/g,
            /Microsoft\s+([A-Z][a-zA-Z\s]+)/g
        ];
        
        servicePatterns.forEach(pattern => {
            const matches = [...documentMarkdown.matchAll(pattern)];
            matches.forEach(match => {
                const serviceName = match[1].trim();
                const line = this.getLineNumber(documentMarkdown, match.index);
                
                if (!this.isValidAzureService(serviceName)) {
                    this.addWarning(`Line ${line}: Potentially unknown Azure service: "${serviceName}"`);
                }
            });
        });
    }

    /**
     * Validate anchor links within the document
     */
    validateAnchorLinks(documentMarkdown, documentId) {
        const anchorRegex = /#([a-zA-Z0-9-_]+)/g;
        const anchors = [...documentMarkdown.matchAll(anchorRegex)];
        
        const documentInfo = this.documentMap.get(documentId);
        if (!documentInfo) return;
        
        anchors.forEach(anchor => {
            const anchorName = anchor[1];
            const line = this.getLineNumber(documentMarkdown, anchor.index);
            
            // Check if anchor exists as a heading
            const headingExists = documentInfo.headings.some(heading => 
                this.normalizeAnchor(heading) === anchorName
            );
            
            if (!headingExists) {
                this.addError(`Line ${line}: Anchor link references non-existent heading: "#${anchorName}"`);
            }
        });
    }

    /**
     * Validate code references (code blocks, function names, etc.)
     */
    validateCodeReferences(documentMarkdown, documentId) {
        // Extract code blocks
        const codeBlockRegex = /```[\s\S]*?```/g;
        const codeBlocks = [...documentMarkdown.matchAll(codeBlockRegex)];
        
        codeBlocks.forEach(block => {
            const content = block[0];
            const line = this.getLineNumber(documentMarkdown, block.index);
            
            // Validate references within code blocks
            this.validateCodeBlockReferences(content, line);
        });
        
        // Validate inline code references
        const inlineCodeRegex = /`([^`]+)`/g;
        const inlineCodes = [...documentMarkdown.matchAll(inlineCodeRegex)];
        
        inlineCodes.forEach(code => {
            const content = code[1];
            const line = this.getLineNumber(documentMarkdown, code.index);
            
            this.validateInlineCodeReference(content, line);
        });
    }

    /**
     * Validate references within code blocks
     */
    validateCodeBlockReferences(codeContent, line) {
        // Look for command references in code blocks
        const commandRefs = codeContent.match(/mcp_azure_mcp_ser_azmcp_\w+/g) || [];
        
        commandRefs.forEach(ref => {
            if (!this.commandRegistry.has(ref)) {
                this.addError(`Line ${line}: Code block references unknown command: "${ref}"`);
            }
        });
    }

    /**
     * Validate inline code references
     */
    validateInlineCodeReference(content, line) {
        // Check if this looks like a command or parameter
        if (content.startsWith('mcp_azure_') && !this.commandRegistry.has(content)) {
            this.addError(`Line ${line}: Inline code references unknown command: "${content}"`);
        }
        
        // Check common parameter patterns
        if (this.looksLikeParameterName(content)) {
            const isValid = this.isValidParameterAcrossCommands(content);
            if (!isValid) {
                this.addWarning(`Line ${line}: Inline code may reference unknown parameter: "${content}"`);
            }
        }
    }

    /**
     * Validate cross-document references
     */
    validateCrossReferences(documentMarkdown, documentId) {
        // Look for references to other documents
        const docRefRegex = /\[([^\]]+)\]\(([^)]+\.md[^)]*)\)/g;
        const docRefs = [...documentMarkdown.matchAll(docRefRegex)];
        
        docRefs.forEach(ref => {
            const [, linkText, filePath] = ref;
            const line = this.getLineNumber(documentMarkdown, ref.index);
            
            // Check if referenced document exists
            if (!this.documentExists(filePath)) {
                this.addError(`Line ${line}: Reference to non-existent document: "${filePath}"`);
            }
        });
    }

    /**
     * Validate shared references (commands, parameters used across documents)
     */
    validateSharedReferences(documentMarkdown, documentId) {
        // This would validate that shared elements are consistently defined
        // across documents (implementation depends on specific requirements)
        
        const sharedCommands = this.extractSharedCommandReferences(documentMarkdown);
        sharedCommands.forEach(command => {
            if (!this.commandRegistry.has(command.name)) {
                this.addError(`Document ${documentId}: References unknown shared command: "${command.name}"`);
            }
        });
    }

    /**
     * Helper methods
     */
    extractHeadings(markdown) {
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        const headings = [];
        let match;
        
        while ((match = headingRegex.exec(markdown)) !== null) {
            headings.push({
                level: match[1].length,
                text: match[2].trim(),
                anchor: this.normalizeAnchor(match[2].trim())
            });
        }
        
        return headings;
    }

    extractCommands(content, metadata) {
        const commands = [];
        
        // Extract from metadata if available
        if (metadata.commands) {
            commands.push(...metadata.commands);
        }
        
        // Extract from content
        const commandRegex = /mcp_azure_mcp_ser_azmcp_([a-zA-Z_-]+)/g;
        const matches = [...content.matchAll(commandRegex)];
        
        matches.forEach(match => {
            const commandName = match[0];
            if (!commands.find(cmd => cmd.name === commandName)) {
                commands.push({
                    name: commandName,
                    source: 'content'
                });
            }
        });
        
        return commands;
    }

    extractParameters(content, metadata) {
        const parameters = [];
        
        // Extract from parameter tables
        const tableRegex = /\|\s*Parameter\s*\|\s*Type\s*\|\s*Required\s*\|\s*Description\s*\|[\s\S]*?\n(?=\n|\z)/g;
        const tables = [...content.matchAll(tableRegex)];
        
        tables.forEach(table => {
            const rows = table[0].split('\n').slice(2); // Skip header and separator
            rows.forEach(row => {
                const cells = row.split('|').map(cell => cell.trim());
                if (cells.length >= 4 && cells[1]) {
                    parameters.push({
                        name: cells[1].replace(/[`*]/g, ''),
                        type: cells[2],
                        required: cells[3],
                        description: cells[4],
                        command: 'unknown' // Would need context to determine
                    });
                }
            });
        });
        
        return parameters;
    }

    extractParameterSections(markdown) {
        // This would extract parameter sections and associate them with commands
        // Implementation depends on document structure
        return [];
    }

    extractSharedCommandReferences(markdown) {
        // Extract commands that are referenced across documents
        const commandRegex = /mcp_azure_mcp_ser_azmcp_([a-zA-Z_-]+)/g;
        const matches = [...markdown.matchAll(commandRegex)];
        
        return matches.map(match => ({
            name: match[0],
            position: match.index
        }));
    }

    normalizeAnchor(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    validateAnchorReference(anchor, documentId, line) {
        const anchorName = anchor.substring(1); // Remove #
        const documentInfo = this.documentMap.get(documentId);
        
        if (documentInfo) {
            const headingExists = documentInfo.headings.some(heading => 
                heading.anchor === anchorName
            );
            
            if (!headingExists) {
                this.addError(`Line ${line}: Anchor reference "${anchor}" not found in document`);
            }
        }
    }

    validateRelativeLink(linkUrl, documentId, line) {
        // This would validate that relative file paths exist
        // Implementation depends on file system access
        this.addWarning(`Line ${line}: Relative link validation not implemented: ${linkUrl}`);
    }

    isValidCommand(commandName) {
        return this.commandRegistry.has(commandName);
    }

    isValidParameter(command, parameterName) {
        const commandParams = this.parameterRegistry.get(command);
        return commandParams && commandParams.has(parameterName);
    }

    isValidParameterAcrossCommands(parameterName) {
        // Check if parameter exists in any command
        for (const [command, params] of this.parameterRegistry) {
            if (params.has(parameterName)) {
                return true;
            }
        }
        return false;
    }

    looksLikeParameterName(name) {
        // Heuristic to determine if a string looks like a parameter name
        return name.match(/^[a-z-]+$/) && name.includes('-') && name.length > 3;
    }

    isValidAzureService(serviceName) {
        const knownServices = [
            'Storage', 'Key Vault', 'Cosmos DB', 'Monitor', 'Kubernetes Service',
            'SQL Database', 'AI Foundry', 'Load Testing', 'Functions', 'App Service',
            'Virtual Machines', 'Service Bus', 'Application Insights'
        ];
        
        return knownServices.some(service => 
            serviceName.toLowerCase().includes(service.toLowerCase())
        );
    }

    validateParameterType(param, command, line) {
        // Validate parameter type consistency
        const expectedTypes = ['string', 'number', 'boolean', 'array', 'object'];
        if (!expectedTypes.includes(param.type.toLowerCase())) {
            this.addWarning(`Line ${line}: Unknown parameter type "${param.type}" for parameter "${param.name}"`);
        }
    }

    documentExists(filePath) {
        // This would check if a document exists
        // Implementation depends on file system access or document registry
        return this.documentMap.has(filePath) || this.documentMap.has(path.basename(filePath, '.md'));
    }

    getLineNumber(text, position) {
        const beforePosition = text.substring(0, position);
        return (beforePosition.match(/\n/g) || []).length + 1;
    }

    /**
     * Validation state management
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
                warningCount: this.warnings.length,
                validatedDocuments: this.documentMap.size,
                validatedCommands: this.commandRegistry.size,
                validatedParameters: Array.from(this.parameterRegistry.values())
                    .reduce((total, params) => total + params.size, 0)
            }
        };
    }
}

module.exports = ReferenceValidator;
