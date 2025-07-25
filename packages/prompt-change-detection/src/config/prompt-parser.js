/**
 * Prompt Parser - Parse create-docs.prompt.md and extract structured configuration
 * 
 * This module parses the prompt file and maintains synchronization with workflow-config.json
 */

const fs = require('fs').promises;
const path = require('path');

class PromptParser {
    constructor(promptFilePath = null, configPath = null) {
        // Default to root project directory for prompt file (4 levels up from packages/prompt-change-detection/src/config/)
        this.promptFilePath = promptFilePath || path.join(__dirname, '../../../../create-docs.prompt.md');
        this.configPath = configPath || path.join(__dirname, 'workflow-config.json');
        this.parsedContent = null;
    }

    /**
     * Parse the prompt file and extract structured configuration
     */
    async parsePrompt() {
        try {
            const promptContent = await fs.readFile(this.promptFilePath, 'utf8');
            
            const config = {
                sources: this.extractSources(promptContent),
                templates: this.extractTemplates(promptContent),
                output: this.extractOutputStructure(promptContent),
                contentRules: this.extractContentRules(promptContent),
                validationRules: this.extractValidationRules(promptContent),
                toolCategorization: this.extractToolCategorization(promptContent)
            };

            this.parsedContent = config;
            return config;
        } catch (error) {
            throw new Error(`Failed to parse prompt file: ${error.message}`);
        }
    }

    /**
     * Extract source URLs from prompt
     */
    extractSources(content) {
        const sources = {
            engineering: {},
            documentation: { examples: {}, navigation: {} }
        };

        // Extract engineering sources
        const azmcpCommandsMatch = content.match(/azmcp-commands\.md.*?\[URL\]\((https:\/\/[^)]+)\)/);
        if (azmcpCommandsMatch) sources.engineering['azmcp-commands'] = azmcpCommandsMatch[1];

        const e2ePromptsMatch = content.match(/e2eTestPrompts\.md.*?\[URL\]\((https:\/\/[^)]+)\)/);
        if (e2ePromptsMatch) sources.engineering['e2e-test-prompts'] = e2ePromptsMatch[1];

        // Extract documentation sources
        const toolsJsonMatch = content.match(/tools\.json.*?\[URL\]\((https:\/\/[^)]+)\)/);
        if (toolsJsonMatch) sources.documentation['tools-json'] = toolsJsonMatch[1];

        // Extract example documentation links
        const exampleMatches = content.matchAll(/\[([^\]]+)\]\((https:\/\/github\.com\/MicrosoftDocs\/azure-dev-docs[^)]+\.md)\)/g);
        for (const match of exampleMatches) {
            const name = match[1].toLowerCase().replace(/[^a-z0-9]/g, '-');
            sources.documentation.examples[name] = match[2];
        }

        // Extract navigation links
        const tocMatch = content.match(/TOC.*?\[URL\]\((https:\/\/[^)]+TOC\.yml)\)/);
        if (tocMatch) sources.documentation.navigation.toc = tocMatch[1];

        const indexMatch = content.match(/landing page.*?\[URL\]\((https:\/\/[^)]+index\.yml)\)/);
        if (indexMatch) sources.documentation.navigation.index = indexMatch[1];

        return sources;
    }

    /**
     * Extract template information
     */
    extractTemplates(content) {
        const templates = {};
        
        const templateMatches = content.matchAll(/`([^`]+\.template\.md)`/g);
        for (const match of templateMatches) {
            const templateName = match[1];
            if (templateName.includes('generated-documentation')) {
                templates.primary = templateName;
            } else if (templateName.includes('new')) {
                templates.partial = templateName;
            }
        }

        return templates;
    }

    /**
     * Extract output structure requirements
     */
    extractOutputStructure(content) {
        const output = {
            structure: { directories: [] },
            files: { content: [], 'source-of-truth': [], logs: [] }
        };

        // Extract timestamp format
        const timestampMatch = content.match(/timestamp.*?(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
        if (timestampMatch) {
            output.structure['timestamp-format'] = 'YYYY-MM-DD_HH-mm-ss';
        }

        // Extract directories
        const dirMatches = content.matchAll(/\.\/(generated\/[^`]+)`\s*-\s*([^-\n]+)/g);
        for (const match of dirMatches) {
            const dirType = match[2].trim().toLowerCase();
            if (dirType.includes('content')) output.structure.directories.push('content');
            if (dirType.includes('source')) output.structure.directories.push('source-of-truth');
            if (dirType.includes('log')) output.structure.directories.push('logs');
        }

        // Extract expected files
        const fileMatches = content.matchAll(/`([^`]+\.(md|json|yml))`/g);
        for (const match of fileMatches) {
            const fileName = match[1];
            if (fileName.includes('tools.json')) output.files.content.push('tools.json');
            if (fileName.includes('new.md')) output.files.content.push('new.md');
            if (fileName.includes('index.yml')) output.files.content.push('index.yml');
            if (fileName.includes('TOC.yml')) output.files.content.push('TOC.yml');
        }

        return output;
    }

    /**
     * Extract content generation rules
     */
    extractContentRules(content) {
        const rules = {
            'example-prompts': {},
            parameters: {},
            headers: {},
            links: {},
            markdown: {}
        };

        // Extract example prompt rules
        if (content.includes('5 tools in alpha order')) {
            rules['example-prompts'].count = 5;
        }
        if (content.includes('variety of questions, statements, incomplete')) {
            rules['example-prompts'].variety = ['question', 'statement', 'incomplete', 'verbose'];
        }

        // Extract parameter rules
        if (content.includes('Required or optional')) {
            rules.parameters.format = 'Required or Optional';
        }
        if (content.includes("Don't duplicate parameters")) {
            rules.parameters['exclude-global'] = true;
        }

        // Extract header rules
        if (content.includes('sentence case formatting')) {
            rules.headers.case = 'sentence';
        }
        if (content.includes('HTML comment containing the exact command')) {
            rules.headers['html-comments'] = true;
        }

        // Extract link rules
        if (content.includes('relative and not absolute')) {
            rules.links.type = 'relative';
        }
        if (content.includes('must not include the language code like `en-us`')) {
            rules.links['exclude-language-codes'] = true;
        }

        // Extract markdown rules
        if (content.includes('markdown bullets use `-` (dash)')) {
            rules.markdown.bullets = 'dash';
        }
        if (content.includes("doesn't have a prereqs section. Do not add one")) {
            rules.markdown['no-prerequisites'] = true;
        }

        return rules;
    }

    /**
     * Extract validation rules
     */
    extractValidationRules(content) {
        const rules = {
            content: {},
            structure: {}
        };

        // Extract content validation rules
        if (content.includes('more than 4 individual tools listed')) {
            rules.content['max-landing-page-tools'] = 4;
        }
        if (content.includes('All example prompts follow the bold summary format without quotes')) {
            rules.content['example-format'] = 'bold-summary-without-quotes';
        }

        // Extract structure rules
        if (content.includes('No H3 headings for "Parameters" or "Example prompts"')) {
            rules.structure['h3-avoid'] = ['Parameters', 'Example prompts'];
        }
        if (content.includes('Example prompts section appears BEFORE parameters table')) {
            rules.structure['example-prompts-placement'] = 'before-parameters';
        }

        return rules;
    }

    /**
     * Extract tool categorization rules
     */
    extractToolCategorization(content) {
        const categorization = {};

        if (content.includes('NEW TOOL CATEGORY')) {
            categorization['new-tool'] = {
                condition: 'exists in azmcp-commands.md but not in tools.json',
                action: 'create-full-documentation',
                marker: 'NEW TOOL CATEGORY'
            };
        }

        if (content.includes('NEW OPERATIONS')) {
            categorization['new-operation'] = {
                condition: 'tool exists but operation new',
                action: 'create-partial-documentation',
                marker: 'NEW OPERATIONS'
            };
        }

        if (content.includes('Azure Native ISV')) {
            categorization['third-party'] = {
                condition: 'server is azure-native-isv',
                branding: 'use-third-party-only'
            };
        }

        return categorization;
    }

    /**
     * Compare parsed configuration with existing workflow-config.json
     */
    async validatePromptIntegrity() {
        try {
            const currentConfig = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
            const parsedConfig = await this.parsePrompt();

            const discrepancies = [];

            // Compare sources
            if (JSON.stringify(currentConfig.sources) !== JSON.stringify(parsedConfig.sources)) {
                discrepancies.push('Sources configuration mismatch');
            }

            // Compare content rules
            if (JSON.stringify(currentConfig['content-rules']) !== JSON.stringify(parsedConfig.contentRules)) {
                discrepancies.push('Content rules mismatch');
            }

            return {
                isValid: discrepancies.length === 0,
                discrepancies,
                currentConfig,
                parsedConfig
            };
        } catch (error) {
            throw new Error(`Failed to validate prompt integrity: ${error.message}`);
        }
    }

    /**
     * Update workflow-config.json based on prompt changes
     */
    async updateWorkflowConfig() {
        try {
            const parsedConfig = await this.parsePrompt();
            const currentConfig = JSON.parse(await fs.readFile(this.configPath, 'utf8'));

            // Merge parsed configuration with existing
            const updatedConfig = {
                ...currentConfig,
                sources: parsedConfig.sources,
                templates: parsedConfig.templates,
                output: parsedConfig.output,
                'content-rules': parsedConfig.contentRules,
                'validation-rules': parsedConfig.validationRules,
                'tool-categorization': parsedConfig.toolCategorization
            };

            await fs.writeFile(this.configPath, JSON.stringify(updatedConfig, null, 2));
            
            return {
                success: true,
                updatedConfig,
                changes: this.identifyChanges(currentConfig, updatedConfig)
            };
        } catch (error) {
            throw new Error(`Failed to update workflow config: ${error.message}`);
        }
    }

    /**
     * Identify specific changes between configurations
     */
    identifyChanges(oldConfig, newConfig) {
        const changes = [];

        // Compare each major section
        const sections = ['sources', 'templates', 'output', 'content-rules', 'validation-rules', 'tool-categorization'];
        
        for (const section of sections) {
            if (JSON.stringify(oldConfig[section]) !== JSON.stringify(newConfig[section])) {
                changes.push({
                    section,
                    type: 'modified',
                    old: oldConfig[section],
                    new: newConfig[section]
                });
            }
        }

        return changes;
    }

    /**
     * Generate impact analysis for prompt changes
     */
    async generateImpactAnalysis(changes) {
        const impactedModules = [];

        for (const change of changes) {
            switch (change.section) {
                case 'sources':
                    impactedModules.push('data-extractors/*');
                    break;
                case 'content-rules':
                    impactedModules.push('content-builders/*');
                    break;
                case 'validation-rules':
                    impactedModules.push('quality-controllers/*');
                    break;
                case 'output':
                    impactedModules.push('file-generators/*');
                    break;
                case 'templates':
                    impactedModules.push('template-processors/*');
                    break;
            }
        }

        return {
            changes,
            impactedModules: [...new Set(impactedModules)],
            updateRequired: impactedModules.length > 0
        };
    }
}

module.exports = PromptParser;
