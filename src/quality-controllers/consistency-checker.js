/**
 * Consistency Checker - Ensure consistent terminology and style
 * 
 * This module validates that generated documentation maintains consistent
 * terminology, style, and branding across all Azure MCP Server documentation.
 */

class ConsistencyChecker {
    constructor() {
        this.terminologyRules = this.initializeTerminologyRules();
        this.styleRules = this.initializeStyleRules();
        this.brandingRules = this.initializeBrandingRules();
        this.errors = [];
        this.warnings = [];
        this.documentHistory = new Map(); // Track consistency across documents
    }

    /**
     * Check consistency of a single document
     * @param {string} documentMarkdown - Document markdown content
     * @param {string} documentId - Unique identifier for the document
     * @returns {Object} Consistency check result
     */
    checkDocumentConsistency(documentMarkdown, documentId = 'unknown') {
        this.clearValidationState();
        
        this.checkTerminology(documentMarkdown);
        this.checkStyleConsistency(documentMarkdown);
        this.checkBrandingConsistency(documentMarkdown);
        this.checkInternalConsistency(documentMarkdown);
        
        // Store document terms for cross-document consistency
        this.storeDocumentTerms(documentMarkdown, documentId);
        
        return this.getValidationResult();
    }

    /**
     * Check consistency across multiple documents
     * @param {Array} documents - Array of {id, content} objects
     * @returns {Object} Cross-document consistency result
     */
    checkCrossDocumentConsistency(documents) {
        this.clearValidationState();
        
        const allTerms = new Map();
        const allServices = new Set();
        const allPatterns = new Map();

        // Collect terms from all documents
        documents.forEach(doc => {
            const terms = this.extractTermsFromDocument(doc.content);
            const services = this.extractServiceNames(doc.content);
            const patterns = this.extractPatterns(doc.content);

            terms.forEach((count, term) => {
                if (!allTerms.has(term)) {
                    allTerms.set(term, []);
                }
                allTerms.get(term).push({ docId: doc.id, count });
            });

            services.forEach(service => allServices.add(service));
            
            patterns.forEach((examples, pattern) => {
                if (!allPatterns.has(pattern)) {
                    allPatterns.set(pattern, []);
                }
                allPatterns.get(pattern).push({ docId: doc.id, examples });
            });
        });

        this.checkTerminologyConsistency(allTerms);
        this.checkServiceNamingConsistency(allServices);
        this.checkPatternConsistency(allPatterns);

        return this.getValidationResult();
    }

    /**
     * Check terminology consistency
     */
    checkTerminology(documentMarkdown) {
        // Check for incorrect terminology
        this.terminologyRules.incorrect.forEach(rule => {
            const regex = new RegExp(rule.wrong, 'gi');
            const matches = [...documentMarkdown.matchAll(regex)];
            
            matches.forEach(match => {
                const line = this.getLineNumber(documentMarkdown, match.index);
                this.addError(`Line ${line}: Use "${rule.correct}" instead of "${rule.wrong}"`);
            });
        });

        // Check for preferred terms
        this.terminologyRules.preferred.forEach(rule => {
            const wrongRegex = new RegExp(rule.avoid, 'gi');
            const correctRegex = new RegExp(rule.use, 'gi');
            
            const wrongMatches = [...documentMarkdown.matchAll(wrongRegex)];
            const correctMatches = [...documentMarkdown.matchAll(correctRegex)];
            
            if (wrongMatches.length > 0 && correctMatches.length === 0) {
                wrongMatches.forEach(match => {
                    const line = this.getLineNumber(documentMarkdown, match.index);
                    this.addWarning(`Line ${line}: Consider using "${rule.use}" instead of "${rule.avoid}"`);
                });
            }
        });

        // Check for consistent capitalization
        this.checkCapitalizationConsistency(documentMarkdown);
    }

    /**
     * Check capitalization consistency
     */
    checkCapitalizationConsistency(documentMarkdown) {
        const terms = this.terminologyRules.capitalization;
        
        terms.forEach(term => {
            const variations = this.findCapitalizationVariations(documentMarkdown, term.correct);
            
            variations.forEach(variation => {
                if (variation.text !== term.correct) {
                    const line = this.getLineNumber(documentMarkdown, variation.position);
                    this.addWarning(`Line ${line}: Use "${term.correct}" instead of "${variation.text}"`);
                }
            });
        });
    }

    /**
     * Find capitalization variations of a term
     */
    findCapitalizationVariations(text, correctTerm) {
        const variations = [];
        const words = correctTerm.split(' ');
        const pattern = words.map(word => word.split('').map(char => 
            char.match(/[a-zA-Z]/) ? `[${char.toLowerCase()}${char.toUpperCase()}]` : char
        ).join('')).join('\\s+');
        
        const regex = new RegExp(`\\b${pattern}\\b`, 'g');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            variations.push({
                text: match[0],
                position: match.index
            });
        }
        
        return variations;
    }

    /**
     * Check style consistency
     */
    checkStyleConsistency(documentMarkdown) {
        // Check heading style
        this.checkHeadingStyle(documentMarkdown);
        
        // Check list style
        this.checkListStyle(documentMarkdown);
        
        // Check code formatting
        this.checkCodeFormatting(documentMarkdown);
        
        // Check punctuation consistency
        this.checkPunctuation(documentMarkdown);
    }

    /**
     * Check heading style consistency
     */
    checkHeadingStyle(documentMarkdown) {
        const headings = [...documentMarkdown.matchAll(/^(#{1,6})\s+(.+)$/gm)];
        
        headings.forEach((heading, index) => {
            const [, hashes, text] = heading;
            const line = this.getLineNumber(documentMarkdown, heading.index);
            
            // Check title case for H1 and H2
            if (hashes.length <= 2 && !this.isTitleCase(text) && !this.isAllLowerCase(text)) {
                this.addWarning(`Line ${line}: Consider using title case for ${hashes.length === 1 ? 'H1' : 'H2'} heading`);
            }
            
            // Check for consistent patterns
            if (text.endsWith('.')) {
                this.addWarning(`Line ${line}: Headings should not end with periods`);
            }
        });
    }

    /**
     * Check list style consistency
     */
    checkListStyle(documentMarkdown) {
        const lines = documentMarkdown.split('\n');
        let inList = false;
        let listStyle = null; // 'dash' or 'asterisk'
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            if (trimmed.match(/^[-*]\s/)) {
                const currentStyle = trimmed.startsWith('-') ? 'dash' : 'asterisk';
                
                if (!inList) {
                    inList = true;
                    listStyle = currentStyle;
                } else if (listStyle !== currentStyle) {
                    this.addWarning(`Line ${index + 1}: Inconsistent list style (mixing - and *)`);
                }
            } else if (inList && !trimmed.match(/^\s/) && trimmed !== '') {
                inList = false;
                listStyle = null;
            }
        });
    }

    /**
     * Check code formatting consistency
     */
    checkCodeFormatting(documentMarkdown) {
        // Check inline code consistency
        const inlineCodeRegex = /`([^`]+)`/g;
        const inlineCodes = [...documentMarkdown.matchAll(inlineCodeRegex)];
        
        // Check for consistent formatting of similar items
        const codeTerms = new Map();
        inlineCodes.forEach(code => {
            const term = code[1].toLowerCase();
            if (!codeTerms.has(term)) {
                codeTerms.set(term, []);
            }
            codeTerms.get(term).push(code[1]);
        });

        codeTerms.forEach((variations, term) => {
            if (variations.length > 1) {
                const uniqueVariations = [...new Set(variations)];
                if (uniqueVariations.length > 1) {
                    this.addWarning(`Inconsistent formatting for "${term}": ${uniqueVariations.join(', ')}`);
                }
            }
        });
    }

    /**
     * Check punctuation consistency
     */
    checkPunctuation(documentMarkdown) {
        const lines = documentMarkdown.split('\n');
        
        lines.forEach((line, index) => {
            // Check for consistent quote styles
            if (line.includes('"') && line.includes('"')) {
                this.addWarning(`Line ${index + 1}: Mixed quote styles (use consistent quote marks)`);
            }
            
            // Check for Oxford comma consistency (basic check)
            const listPattern = /\w+,\s+\w+,?\s+and\s+\w+/g;
            const lists = [...line.matchAll(listPattern)];
            lists.forEach(list => {
                if (!list[0].includes(', and ')) {
                    this.addWarning(`Line ${index + 1}: Consider using Oxford comma: "${list[0]}"`);
                }
            });
        });
    }

    /**
     * Check branding consistency
     */
    checkBrandingConsistency(documentMarkdown) {
        // Check Azure branding
        this.brandingRules.azure.forEach(rule => {
            const wrongRegex = new RegExp(rule.wrong, 'gi');
            const matches = [...documentMarkdown.matchAll(wrongRegex)];
            
            matches.forEach(match => {
                const line = this.getLineNumber(documentMarkdown, match.index);
                this.addError(`Line ${line}: Use "${rule.correct}" instead of "${rule.wrong}"`);
            });
        });

        // Check MCP branding
        this.brandingRules.mcp.forEach(rule => {
            const regex = new RegExp(rule.pattern, 'gi');
            if (!regex.test(documentMarkdown)) {
                this.addWarning(`Document should include proper MCP branding: ${rule.description}`);
            }
        });
    }

    /**
     * Check internal document consistency
     */
    checkInternalConsistency(documentMarkdown) {
        // Check for consistent service name usage
        const serviceNames = this.extractServiceNames(documentMarkdown);
        if (serviceNames.size > 1) {
            this.addWarning(`Document mentions multiple services: ${[...serviceNames].join(', ')} - ensure this is intentional`);
        }

        // Check for consistent parameter naming
        this.checkParameterNamingConsistency(documentMarkdown);
        
        // Check for consistent example prompt patterns
        this.checkExamplePromptConsistency(documentMarkdown);
    }

    /**
     * Check parameter naming consistency
     */
    checkParameterNamingConsistency(documentMarkdown) {
        const parameterRegex = /\*\*(.*?)\*\*/g;
        const parameters = [...documentMarkdown.matchAll(parameterRegex)];
        
        const paramNames = new Map();
        parameters.forEach(param => {
            const name = param[1].toLowerCase();
            if (!paramNames.has(name)) {
                paramNames.set(name, []);
            }
            paramNames.get(name).push(param[1]);
        });

        paramNames.forEach((variations, name) => {
            const uniqueVariations = [...new Set(variations)];
            if (uniqueVariations.length > 1) {
                this.addWarning(`Inconsistent parameter naming: ${uniqueVariations.join(', ')}`);
            }
        });
    }

    /**
     * Check example prompt consistency
     */
    checkExamplePromptConsistency(documentMarkdown) {
        const promptRegex = /- \*\*(.*?)\*\*: "(.*?)"/g;
        const prompts = [...documentMarkdown.matchAll(promptRegex)];
        
        if (prompts.length === 0) return;

        // Check for consistent summary style
        const summaryStyles = prompts.map(p => this.analyzeSummaryStyle(p[1]));
        const styleVariations = [...new Set(summaryStyles)];
        
        if (styleVariations.length > 2) {
            this.addWarning('Example prompt summaries have inconsistent styles');
        }

        // Check for prompt variety
        const startWords = prompts.map(p => p[2].split(' ')[0].toLowerCase());
        const uniqueStarts = new Set(startWords);
        
        if (uniqueStarts.size < Math.min(3, prompts.length)) {
            this.addWarning('Example prompts should have more variety in sentence starters');
        }
    }

    /**
     * Analyze summary style (verb-first, noun-first, etc.)
     */
    analyzeSummaryStyle(summary) {
        const words = summary.toLowerCase().split(' ');
        const firstWord = words[0];
        
        // Common action verbs
        const actionVerbs = ['list', 'show', 'get', 'create', 'delete', 'view', 'find', 'check', 'manage'];
        
        if (actionVerbs.includes(firstWord)) {
            return 'verb-first';
        } else if (firstWord.match(/^(all|my|the)$/)) {
            return 'article-first';
        } else {
            return 'noun-first';
        }
    }

    /**
     * Helper methods
     */
    extractServiceNames(text) {
        const services = new Set();
        const servicePatterns = [
            /Azure\s+(\w+(?:\s+\w+)?)/g,
            /(\w+)\s+tools?\s+for\s+the\s+Azure\s+MCP\s+Server/g
        ];

        servicePatterns.forEach(pattern => {
            const matches = [...text.matchAll(pattern)];
            matches.forEach(match => services.add(match[1]));
        });

        return services;
    }

    extractTermsFromDocument(text) {
        const terms = new Map();
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        
        words.forEach(word => {
            if (word.length > 3) { // Skip short words
                terms.set(word, (terms.get(word) || 0) + 1);
            }
        });
        
        return terms;
    }

    extractPatterns(text) {
        const patterns = new Map();
        
        // Extract example prompt patterns
        const promptRegex = /- \*\*(.*?)\*\*: "(.*?)"/g;
        const prompts = [...text.matchAll(promptRegex)];
        
        if (prompts.length > 0) {
            patterns.set('example-prompts', prompts.map(p => p[2]));
        }
        
        return patterns;
    }

    isTitleCase(text) {
        const words = text.split(' ');
        return words.every(word => {
            if (word.length === 0) return true;
            const firstChar = word[0];
            return firstChar === firstChar.toUpperCase();
        });
    }

    isAllLowerCase(text) {
        return text === text.toLowerCase();
    }

    getLineNumber(text, position) {
        const beforePosition = text.substring(0, position);
        return (beforePosition.match(/\n/g) || []).length + 1;
    }

    storeDocumentTerms(markdown, documentId) {
        const terms = this.extractTermsFromDocument(markdown);
        this.documentHistory.set(documentId, {
            terms: terms,
            lastUpdated: Date.now()
        });
    }

    /**
     * Initialize rule sets
     */
    initializeTerminologyRules() {
        return {
            incorrect: [
                { wrong: 'login', correct: 'sign in' },
                { wrong: 'setup', correct: 'set up' },
                { wrong: 'email', correct: 'email address' },
                { wrong: 'username', correct: 'user name' },
                { wrong: 'backend', correct: 'back end' },
                { wrong: 'frontend', correct: 'front end' },
                { wrong: 'realtime', correct: 'real time' },
                { wrong: 'data base', correct: 'database' }
            ],
            preferred: [
                { avoid: 'utilize', use: 'use' },
                { avoid: 'in order to', use: 'to' },
                { avoid: 'due to the fact that', use: 'because' }
            ],
            capitalization: [
                { correct: 'Azure MCP Server' },
                { correct: 'Azure Storage' },
                { correct: 'Azure Key Vault' },
                { correct: 'Azure Cosmos DB' },
                { correct: 'Azure Monitor' },
                { correct: 'Azure Kubernetes Service' },
                { correct: 'Azure SQL Database' },
                { correct: 'Azure AI Foundry' },
                { correct: 'Azure Load Testing' }
            ]
        };
    }

    initializeStyleRules() {
        return {
            headings: {
                noTrailingPeriods: true,
                titleCaseForH1H2: true
            },
            lists: {
                consistentBullets: true,
                preferDashes: true
            },
            punctuation: {
                oxfordComma: true,
                consistentQuotes: true
            }
        };
    }

    initializeBrandingRules() {
        return {
            azure: [
                { wrong: 'Microsoft Azure', correct: 'Azure' },
                { wrong: 'Azure Cloud', correct: 'Azure' },
                { wrong: 'Azure Portal', correct: 'Azure portal' }
            ],
            mcp: [
                { pattern: 'Azure MCP Server', description: 'Proper MCP branding' },
                { pattern: 'natural language prompts', description: 'Key MCP value proposition' }
            ]
        };
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
}

module.exports = ConsistencyChecker;
