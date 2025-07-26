/**
 * Prompt Parser - Parse create-docs.prompt.md and extract structured configuration
 * 
 * This module parses the prompt file and maintains synchronization with workflow-config.json
 */

import { promises as fs } from 'node:fs';
import * as path from 'path';
import { fileURLToPath } from 'url';


// Derive __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Content rules type definition
 */
export interface ContentRules {
    'example-prompts': {
        count?: number;
        variety?: string[];
    };
    parameters: {
        format?: string;
        'exclude-global'?: boolean;
    };
    headers: {
        case?: string;
        'html-comments'?: boolean;
    };
    links: {
        type?: string;
        'exclude-language-codes'?: boolean;
    };
    markdown: {
        bullets?: string;
        'no-prerequisites'?: boolean;
    };
}

/**
 * Validation rules type definition
 */
export interface ValidationRules {
    content: {
        'max-landing-page-tools'?: number;
        'example-format'?: string;
        [key: string]: any;
    };
    structure: {
        'h3-avoid'?: string[];
        'example-prompts-placement'?: string;
        [key: string]: any;
    };
}

/**
 * Output structure type definition
 */
export interface OutputStructure {
    structure: {
        directories: string[];
        'timestamp-format'?: string;
    };
    files: {
        content: string[];
        'source-of-truth': string[];
        logs: string[];
    };
}

/**
 * Templates type definition
 */
export interface TemplateInfo {
    primary?: string;
    partial?: string;
    [key: string]: string | undefined;
}

/**
 * Sources type definition
 */
export interface SourceDetail {
    name: string;
    url: string;
    type?: string;
}

export interface Sources {
    engineering: Record<string, string>;
    documentation: {
        examples: Record<string, string>;
        navigation: Record<string, string>;
        [key: string]: any;
    };
    [key: string]: any;
}

/**
 * Tool categorization type definition
 */
export interface ToolCategorization {
    'new-tool'?: {
        condition: string;
        action: string;
        marker: string;
    };
    'new-operation'?: {
        condition: string;
        action: string;
        marker: string;
    };
    'third-party'?: {
        condition: string;
        branding: string;
    };
    [key: string]: any;
}

export interface ParsedConfig {
    sources: Sources;
    templates: TemplateInfo;
    output: OutputStructure;
    contentRules: ContentRules;
    validationRules: ValidationRules;
    toolCategorization: ToolCategorization;
}

export interface ValidatePromptResult {
    isValid: boolean;
    discrepancies: string[];
    currentConfig: any; // Could be more specific but we'd need the workflow config schema
    parsedConfig: ParsedConfig;
}

export interface WorkflowConfigChange {
    section: string;
    type: string;
    old: any;
    new: any;
}

export interface UpdateWorkflowResult {
    success: boolean;
    updatedConfig: any; // Could be more specific with the schema
    changes: WorkflowConfigChange[];
}

export interface ImpactAnalysis {
    impactedModules: string[];
    severity: string;
    recommendations: string[];
}

export default class PromptParser {

 public promptFilePath: string;
 public configPath: string;
 public parsedContent: ParsedConfig | null;
 public promptJsonPath: string;

    constructor(promptFilePath:string, configPath:string, promptJsonPath:string) {
        this.promptFilePath = promptFilePath;
        this.configPath = configPath;
        this.parsedContent = null;
        this.promptJsonPath = promptJsonPath;
    }

    /**
     * Parse the prompt file and extract structured configuration
     */
    async parsePrompt(): Promise<ParsedConfig> {
        try {
            const promptContent = await fs.readFile(this.promptFilePath, 'utf8');
            
            const config: ParsedConfig = {
                sources: this.extractSources(promptContent),
                templates: this.extractTemplates(promptContent),
                output: this.extractOutputStructure(promptContent),
                contentRules: this.extractContentRules(promptContent),
                validationRules: this.extractValidationRules(promptContent),
                toolCategorization: this.extractToolCategorization(promptContent)
            };

            this.parsedContent = config;

            // Save parsed prompt to systemFiles['prompt.json'].path
            await fs.writeFile(this.promptJsonPath, JSON.stringify(config, null, 2));

            return config;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to parse prompt file: ${errorMessage}`);
        }
    }

    /**
     * Extract source URLs from prompt
     */
    extractSources(content: string): Sources {
        const sources: Sources = {
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
    extractTemplates(content: string): TemplateInfo {
        const templates: TemplateInfo = {};
        
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
    extractOutputStructure(content: string): OutputStructure {
        const output: OutputStructure = {
            structure: { directories: [] as string[] },
            files: { content: [] as string[], 'source-of-truth': [] as string[], logs: [] as string[] }
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

        //Extract expected files
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
     * Content rules type definition
     */


    /**
     * Extract content generation rules
     */
    extractContentRules(content: string): ContentRules {
        const rules: ContentRules = {
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
    extractValidationRules(content: string): ValidationRules {
        const rules: ValidationRules = {
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
    extractToolCategorization(content: string): ToolCategorization {
        const categorization: ToolCategorization = {};

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
    async validatePromptIntegrity(): Promise<ValidatePromptResult> {
        try {
            const currentConfig = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
            const parsedConfig = await this.parsePrompt();

            const discrepancies: string[] = [];

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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to validate prompt integrity: ${errorMessage}`);
        }
    }

    /**
     * Update workflow-config.json based on prompt changes
     */
    async updateWorkflowConfig(): Promise<UpdateWorkflowResult> {
        try {
            const parsedConfig = await this.parsePrompt();

            const workflowDirectoryPath = path.dirname(this.configPath);
            console.log(`Attempting to create directory: ${workflowDirectoryPath}`);

            // Ensure the workflow directory exists
            try {
                await fs.mkdir(workflowDirectoryPath, { recursive: true });
            } catch (dirError) {
                console.error(`❌ Failed to create directory: ${workflowDirectoryPath}`, dirError);
                throw new Error(`Failed to create workflow directory: ${dirError}`);
            }

            // Ensure the workflow-config.json file exists
            try {
                await fs.access(this.configPath);
            } catch (fileError) {
                console.warn(`⚠️ Workflow config file not found. Creating a new one at: ${this.configPath}`);
                try {
                    await fs.writeFile(this.configPath, JSON.stringify({}, null, 2));
                } catch (createFileError) {
                    console.error(`❌ Failed to create workflow config file: ${this.configPath}`, createFileError);
                    throw new Error(`Failed to create workflow config file: ${createFileError}`);
                }
            }

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

            try {
                await fs.writeFile(this.configPath, JSON.stringify(updatedConfig, null, 2));
            } catch (writeError) {
                console.error(`❌ Failed to write updated workflow config file: ${this.configPath}`, writeError);
                throw new Error(`Failed to write updated workflow config file: ${writeError}`);
            }

            return {
                success: true,
                updatedConfig,
                changes: this.identifyChanges(currentConfig, updatedConfig)
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Error updating workflow config: ${errorMessage}`);
            throw new Error(`Failed to update workflow config: ${errorMessage}`);
        }
    }

    /**
     * Identify specific changes between configurations
     */
    identifyChanges(oldConfig: any, newConfig: any): WorkflowConfigChange[] {
        const changes: WorkflowConfigChange[] = [];

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
    async generateImpactAnalysis(changes: WorkflowConfigChange[]): Promise<ImpactAnalysis> {
        const impactedModules: string[] = [];

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

        const uniqueModules = [...new Set(impactedModules)];
        
        // Determine severity based on number of impacted modules
        let severity = 'low';
        if (uniqueModules.length > 3) {
            severity = 'high';
        } else if (uniqueModules.length > 1) {
            severity = 'medium';
        }

        // Generate recommendations
        const recommendations: string[] = [];
        if (uniqueModules.includes('data-extractors/*')) {
            recommendations.push('Update source data extraction logic');
        }
        if (uniqueModules.includes('content-builders/*')) {
            recommendations.push('Update content generation rules');
        }

        return {
            impactedModules: uniqueModules,
            severity,
            recommendations
        };
    }
}

// Already exported as default class
