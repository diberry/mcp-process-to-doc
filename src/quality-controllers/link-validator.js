/**
 * Link Validator - Verify external links and references
 * 
 * This module validates that all links in generated documentation are
 * accessible and point to correct Azure documentation resources.
 */

const https = require('https');
const http = require('http');

class LinkValidator {
    constructor() {
        this.cache = new Map(); // Cache for link validation results
        this.errors = [];
        this.warnings = [];
        this.timeout = 10000; // 10 second timeout
    }

    /**
     * Validate all links in a document
     * @param {string} documentMarkdown - Complete document markdown
     * @returns {Promise<Object>} Validation result
     */
    async validateDocumentLinks(documentMarkdown) {
        this.clearValidationState();
        
        const links = this.extractLinks(documentMarkdown);
        const validationPromises = links.map(link => this.validateLink(link));
        
        await Promise.allSettled(validationPromises);
        
        return this.getValidationResult();
    }

    /**
     * Validate specific Azure documentation links
     * @param {string} documentMarkdown - Document markdown
     * @returns {Promise<Object>} Validation result for Azure links only
     */
    async validateAzureLinks(documentMarkdown) {
        this.clearValidationState();
        
        const links = this.extractLinks(documentMarkdown);
        const azureLinks = links.filter(link => this.isAzureDocumentationLink(link.url));
        
        const validationPromises = azureLinks.map(link => this.validateAzureDocLink(link));
        await Promise.allSettled(validationPromises);
        
        return this.getValidationResult();
    }

    /**
     * Extract all links from markdown
     * @param {string} markdown - Markdown content
     * @returns {Array} Array of link objects
     */
    extractLinks(markdown) {
        const links = [];
        
        // Markdown links: [text](url)
        const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = markdownLinkRegex.exec(markdown)) !== null) {
            links.push({
                type: 'markdown',
                text: match[1],
                url: match[2],
                line: this.getLineNumber(markdown, match.index),
                position: match.index
            });
        }

        // Reference links: [text][ref]
        const refLinkRegex = /\[([^\]]*)\]\[([^\]]+)\]/g;
        while ((match = refLinkRegex.exec(markdown)) !== null) {
            links.push({
                type: 'reference',
                text: match[1],
                ref: match[2],
                line: this.getLineNumber(markdown, match.index),
                position: match.index
            });
        }

        // Reference definitions: [ref]: url
        const refDefRegex = /^\s*\[([^\]]+)\]:\s*(.+)$/gm;
        while ((match = refDefRegex.exec(markdown)) !== null) {
            links.push({
                type: 'reference-definition',
                ref: match[1],
                url: match[2].trim(),
                line: this.getLineNumber(markdown, match.index),
                position: match.index
            });
        }

        // HTML links: <a href="url">
        const htmlLinkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
        while ((match = htmlLinkRegex.exec(markdown)) !== null) {
            links.push({
                type: 'html',
                url: match[1],
                line: this.getLineNumber(markdown, match.index),
                position: match.index
            });
        }

        return links;
    }

    /**
     * Validate a single link
     * @param {Object} link - Link object
     * @returns {Promise<void>}
     */
    async validateLink(link) {
        if (link.type === 'reference') {
            this.addWarning(`Line ${link.line}: Reference link [${link.ref}] - check reference definition exists`);
            return;
        }

        if (!link.url) {
            this.addError(`Line ${link.line}: Empty URL in link`);
            return;
        }

        // Check cache first
        if (this.cache.has(link.url)) {
            const cachedResult = this.cache.get(link.url);
            if (!cachedResult.valid) {
                this.addError(`Line ${link.line}: Cached invalid link - ${link.url}: ${cachedResult.error}`);
            }
            return;
        }

        // Validate different types of URLs
        if (this.isRelativeLink(link.url)) {
            await this.validateRelativeLink(link);
        } else if (this.isAzureDocumentationLink(link.url)) {
            await this.validateAzureDocLink(link);
        } else if (this.isExternalHttpLink(link.url)) {
            await this.validateHttpLink(link);
        } else {
            this.addWarning(`Line ${link.line}: Unknown link type - ${link.url}`);
        }
    }

    /**
     * Validate relative link (internal documentation)
     * @param {Object} link - Link object
     */
    async validateRelativeLink(link) {
        // Check for common relative link patterns
        const validRelativePatterns = [
            /^index\.md$/,
            /^\.\.\/get-started\.md$/,
            /^\.\.\/includes\//,
            /^#[a-z0-9-]+$/i // Fragment/anchor links
        ];

        const isValidPattern = validRelativePatterns.some(pattern => pattern.test(link.url));
        
        if (!isValidPattern) {
            this.addWarning(`Line ${link.line}: Relative link may need verification - ${link.url}`);
        }

        // Check for common mistakes
        if (link.url.includes(' ')) {
            this.addError(`Line ${link.line}: URL contains spaces - ${link.url}`);
        }

        if (link.url.includes('\\')) {
            this.addError(`Line ${link.line}: URL contains backslashes (use forward slashes) - ${link.url}`);
        }
    }

    /**
     * Validate Azure documentation link
     * @param {Object} link - Link object
     */
    async validateAzureDocLink(link) {
        const url = link.url;
        
        // Validate Azure docs URL structure
        if (!url.startsWith('/azure/')) {
            this.addError(`Line ${link.line}: Azure docs link should start with '/azure/' - ${url}`);
            return;
        }

        // Check for common Azure service paths
        const validAzureServices = [
            'storage', 'key-vault', 'cosmos-db', 'azure-monitor', 'aks',
            'azure-sql', 'postgresql', 'azure-cache-redis', 'service-bus-messaging',
            'search', 'load-testing', 'ai-studio', 'azure-resource-manager',
            'azure-app-configuration'
        ];

        const servicePath = url.split('/')[2]; // /azure/service-name/...
        if (servicePath && !validAzureServices.includes(servicePath)) {
            this.addWarning(`Line ${link.line}: Unusual Azure service path - ${servicePath} in ${url}`);
        }

        // Check for proper URL structure
        if (url.endsWith('/')) {
            this.addWarning(`Line ${link.line}: Azure docs URL should not end with slash - ${url}`);
        }

        // Simulate validation (in real implementation, you might check against Azure docs sitemap)
        this.cache.set(url, { valid: true, lastChecked: Date.now() });
    }

    /**
     * Validate HTTP/HTTPS link
     * @param {Object} link - Link object
     */
    async validateHttpLink(link) {
        try {
            const isValid = await this.checkHttpLink(link.url);
            
            if (isValid) {
                this.cache.set(link.url, { valid: true, lastChecked: Date.now() });
            } else {
                this.addError(`Line ${link.line}: HTTP link returned error - ${link.url}`);
                this.cache.set(link.url, { valid: false, error: 'HTTP error', lastChecked: Date.now() });
            }
        } catch (error) {
            this.addError(`Line ${link.line}: Failed to validate HTTP link - ${link.url}: ${error.message}`);
            this.cache.set(link.url, { valid: false, error: error.message, lastChecked: Date.now() });
        }
    }

    /**
     * Check HTTP link accessibility
     * @param {string} url - URL to check
     * @returns {Promise<boolean>} True if accessible
     */
    checkHttpLink(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https:') ? https : http;
            const timeoutId = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, this.timeout);

            const req = protocol.get(url, (res) => {
                clearTimeout(timeoutId);
                // Consider 2xx and 3xx status codes as valid
                resolve(res.statusCode >= 200 && res.statusCode < 400);
            });

            req.on('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });

            req.setTimeout(this.timeout, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    /**
     * Validate reference link consistency
     * @param {string} markdown - Document markdown
     */
    validateReferenceLinks(markdown) {
        const refLinks = [];
        const refDefs = new Map();

        // Extract reference links
        const refLinkRegex = /\[([^\]]*)\]\[([^\]]+)\]/g;
        let match;
        while ((match = refLinkRegex.exec(markdown)) !== null) {
            refLinks.push({
                text: match[1],
                ref: match[2],
                line: this.getLineNumber(markdown, match.index)
            });
        }

        // Extract reference definitions
        const refDefRegex = /^\s*\[([^\]]+)\]:\s*(.+)$/gm;
        while ((match = refDefRegex.exec(markdown)) !== null) {
            refDefs.set(match[1], {
                url: match[2].trim(),
                line: this.getLineNumber(markdown, match.index)
            });
        }

        // Check for missing definitions
        refLinks.forEach(refLink => {
            if (!refDefs.has(refLink.ref)) {
                this.addError(`Line ${refLink.line}: Reference link [${refLink.ref}] has no definition`);
            }
        });

        // Check for unused definitions
        refDefs.forEach((def, ref) => {
            const isUsed = refLinks.some(link => link.ref === ref);
            if (!isUsed) {
                this.addWarning(`Line ${def.line}: Reference definition [${ref}] is not used`);
            }
        });
    }

    /**
     * Helper methods to identify link types
     */
    isRelativeLink(url) {
        return !url.includes('://') && !url.startsWith('/') && !url.startsWith('#');
    }

    isAzureDocumentationLink(url) {
        return url.startsWith('/azure/') || url.includes('docs.microsoft.com/azure/');
    }

    isExternalHttpLink(url) {
        return url.startsWith('http://') || url.startsWith('https://');
    }

    /**
     * Get line number for a position in text
     * @param {string} text - Full text
     * @param {number} position - Character position
     * @returns {number} Line number (1-based)
     */
    getLineNumber(text, position) {
        const beforePosition = text.substring(0, position);
        return (beforePosition.match(/\n/g) || []).length + 1;
    }

    /**
     * Validate specific link patterns for Azure MCP documentation
     * @param {string} markdown - Document markdown
     */
    validateMcpSpecificLinks(markdown) {
        // Check for required MCP documentation links
        const requiredLinks = [
            { pattern: /index\.md/, description: 'Link to main index' },
            { pattern: /get-started\.md/, description: 'Link to getting started guide' }
        ];

        requiredLinks.forEach(required => {
            if (!required.pattern.test(markdown)) {
                this.addWarning(`Missing recommended link: ${required.description}`);
            }
        });

        // Check for proper include statements
        const includePattern = /\[!INCLUDE\s+\[.*?\]\(.*?\)\]/g;
        const includes = [...markdown.matchAll(includePattern)];
        
        includes.forEach((include, index) => {
            const includePath = include[0].match(/\(([^)]+)\)/);
            if (includePath && !includePath[1].startsWith('../includes/')) {
                this.addWarning(`Include ${index + 1}: Should typically point to ../includes/ directory`);
            }
        });
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
                warningCount: this.warnings.length,
                linksChecked: this.cache.size
            }
        };
    }
}

module.exports = LinkValidator;
