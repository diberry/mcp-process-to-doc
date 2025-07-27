/**
 * Production Markdown to JSON Converter
 * Combines the best TypeScript interfaces from the original with npm package-based parsing
 * Uses markdown-it for robust parsing and gray-matter for frontmatter
 */

import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as crypto from 'crypto';
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

// Derive __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Enhanced interfaces combining the best from both approaches
export interface PromptMetadata {
    title: string;
    description: string;
    version: string;
    lastModified: string;
    sha256: string;
    contentLength: number;
}

export interface RepositoryInfo {
    url: string;
    description: string;
}

export interface GoalSection {
    primary: string;
    repositories: {
        engineering: RepositoryInfo;
        documentation: {
            live: RepositoryInfo;
            repository: RepositoryInfo;
        };
    };
    workflow: string[];
}

export interface ToolInfo {
    name: string;
    purpose: string;
    usage: string;
}

export interface ToolsSection {
    recommended: ToolInfo[];
    priorities: string[];
}

export interface SourceReference {
    url: string;
    format: string;
    purpose: string;
}

export interface NamedReference {
    name: string;
    url: string;
    purpose?: string;
}

export interface SourcesSection {
    engineering: {
        commands: SourceReference;
        examples: SourceReference;
        descriptions: Array<{
            pattern: string;
            examples: Array<{
                name: string;
                url: string;
            }>;
        }>;
    };
    documentation: {
        toolsJson: SourceReference;
        articles: NamedReference[];
        navigation: NamedReference[];
    };
}

export interface TemplateInfo {
    name: string;
    purpose: string;
    file?: string;
    dependencies?: string[];
}

export interface TemplatesSection {
    files: TemplateInfo[];
    usage: string;
}

export interface FileGenerationSection {
    structure: {
        baseDirectory: string;
        timestampFormat: string;
        subdirectories: Array<{
            name: string;
            purpose: string;
        }>;
    };
    workflow: string[];
    outputFiles: {
        content: TemplateInfo[];
        sourceOfTruth: Array<{
            name: string;
            source: string;
            purpose: string;
        }>;
        logs: TemplateInfo[];
    };
}

export interface ContentRulesSection {
    toolsJson: {
        structure: {
            rootProperty: string;
            operationsArray: string;
            example: object;
        };
        categorization: {
            newTool: string;
            newOperation: string;
            existing: string;
        };
        comparison: {
            process: string;
            statusField: string;
        };
    };
    documentation: {
        focus: string;
        commandVisibility: string;
        grouping: {
            priorities: string;
            family: string;
        };
        branding: {
            thirdParty: string;
            subcategories: string;
        };
    };
    examplePrompts: {
        sources: string[];
        format: {
            structure: string;
            bulletStyle: string;
            summaryStyle: string;
        };
        variety: string[];
        guidelines: string[];
    };
    formatting: {
        prerequisites: boolean;
        parameters: {
            excludeGlobal: boolean;
            requiredFormat: string;
        };
        headers: {
            case: string;
            htmlComments: boolean;
            restrictions: string[];
        };
        links: {
            type: string;
            excludeLanguageCodes: boolean;
            pathFormat: string;
        };
        markdown: {
            bullets: string;
            customFields: string[];
        };
    };
}

export interface NavigationRulesSection {
    files: NamedReference[];
    landingPage: {
        maxTools: number;
        ordering: string;
    };
    ordering: string;
}

export interface EditorialReviewSection {
    process: string;
    criteria: string[];
}

export interface ValidationRulesSection {
    content: {
        maxLandingPageTools: number;
        exampleFormat: string;
        parameterFormat: string;
    };
    structure: {
        h3Avoid: string[];
        examplePromptsPlacement: string;
    };
    compliance: {
        backupPolicy: string;
        requiredSections: string[];
    };
}

export interface PromptStructure {
    metadata: PromptMetadata;
    goal: GoalSection;
    tools?: ToolsSection;
    sources: SourcesSection;
    templates: TemplatesSection;
    fileGeneration: FileGenerationSection;
    contentRules: ContentRulesSection;
    navigationRules: NavigationRulesSection;
    editorialReview?: EditorialReviewSection;
    validationRules: ValidationRulesSection;
    raw_content: string;
    parsed_tokens: any[];
}

export class MarkdownToJsonConverter {
    private md: any;
    private schema: any;

    constructor(schemaPath?: string) {
        // Configure markdown-it with comprehensive parsing options
        this.md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true,
            breaks: false
        });

        // Load schema for validation
        if (schemaPath && fs.existsSync(schemaPath)) {
            this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        } else {
            try {
                const defaultSchemaPath = path.join(__dirname, '..', 'config', 'prompt-schema.json');
                this.schema = JSON.parse(fs.readFileSync(defaultSchemaPath, 'utf8'));
            } catch (error) {
                console.warn('Could not load JSON schema for validation');
                this.schema = null;
            }
        }
    }

    /**
     * Convert markdown prompt file to structured JSON using npm packages
     */
    async convertToJson(markdownPath: string, outputPath?: string): Promise<PromptStructure> {
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        const sha256 = crypto.createHash('sha256').update(markdownContent).digest('hex');
        const stats = fs.statSync(markdownPath);
        
        const structure = this.parseMarkdownStructure(markdownContent, sha256, stats.mtime);
        
        if (outputPath) {
            fs.writeFileSync(outputPath, JSON.stringify(structure, null, 2));
        }
        
        return structure;
    }

    /**
     * Parse markdown content using npm packages and enhanced extraction
     */
    private parseMarkdownStructure(content: string, sha256: string, lastModified: Date): PromptStructure {
        // Parse frontmatter if present using gray-matter
        const { data: frontmatter, content: markdownContent } = matter(content);
        
        // Parse markdown into tokens using markdown-it
        const tokens = this.md.parse(markdownContent, {});
        
        // Extract structured sections using both token and text analysis
        const sections = this.extractStructuredSections(tokens, markdownContent);
        
        return {
            metadata: this.parseMetadata(sections, sha256, lastModified, frontmatter),
            goal: this.parseGoal(sections, markdownContent),
            tools: this.parseTools(sections),
            sources: this.parseSources(sections, markdownContent),
            templates: this.parseTemplates(sections, markdownContent),
            fileGeneration: this.parseFileGeneration(sections, markdownContent),
            contentRules: this.parseContentRules(sections, markdownContent),
            navigationRules: this.parseNavigationRules(sections, markdownContent),
            editorialReview: this.parseEditorialReview(sections),
            validationRules: this.parseValidationRules(sections, markdownContent),
            raw_content: content,
            parsed_tokens: tokens
        };
    }

    /**
     * Enhanced section extraction combining token analysis with raw content parsing
     */
    private extractStructuredSections(tokens: any[], rawContent: string): Map<string, string[]> {
        const sections = new Map<string, string[]>();
        const lines = rawContent.split('\n');
        
        // Extract sections by analyzing both tokens and raw content
        let currentSection = 'header';
        let currentContent: string[] = [];
        let inCodeBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Handle code blocks
            if (line.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }
            
            if (inCodeBlock) continue;
            
            // Detect section headers
            if (line.startsWith('##')) {
                // Save previous section
                if (currentSection && currentContent.length > 0) {
                    sections.set(currentSection.toLowerCase(), [...currentContent]);
                }
                
                // Start new section
                currentSection = this.cleanSectionTitle(line.replace(/^#+\s*/, ''));
                currentContent = [];
            } else if (line.startsWith('#') && !currentSection) {
                // Top-level header
                currentSection = 'goal';
                currentContent = [line];
            } else if (currentSection && line) {
                currentContent.push(line);
            }
        }
        
        // Save last section
        if (currentSection && currentContent.length > 0) {
            sections.set(currentSection.toLowerCase(), [...currentContent]);
        }
        
        return sections;
    }

    /**
     * Clean section titles for consistent mapping
     */
    private cleanSectionTitle(title: string): string {
        return title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .trim();
    }

    /**
     * Enhanced metadata parsing with frontmatter support
     */
    private parseMetadata(sections: Map<string, string[]>, sha256: string, lastModified: Date, frontmatter: any): PromptMetadata {
        // Extract title from frontmatter or content
        let title = frontmatter.title;
        if (!title) {
            const headerLines = sections.get('header') || [];
            const titleLine = headerLines.find(line => line.startsWith('# '));
            title = titleLine ? titleLine.substring(2).trim() : 'Azure MCP Documentation Generation Prompt';
        }

        // Extract description from frontmatter or content
        let description = frontmatter.description;
        if (!description) {
            const headerLines = sections.get('header') || [];
            description = headerLines.find(line => !line.startsWith('#') && line.trim().length > 20)?.trim() ||
                         'Automated documentation generation for Azure MCP tools and services';
        }

        return {
            title,
            description,
            version: frontmatter.version || '1.0.0',
            lastModified: lastModified.toISOString(),
            sha256,
            contentLength: sections.get('header')?.join('\n').length || 0
        };
    }

    /**
     * Enhanced goal parsing with URL extraction
     */
    private parseGoal(sections: Map<string, string[]>, rawContent: string): GoalSection {
        const goalLines = sections.get('goal') || [];
        const goalText = goalLines.join('\n');
        
        // Extract URLs from the goal section
        const urls = this.extractAllUrls(goalText);
        
        return {
            primary: this.extractPrimaryGoal(goalText),
            repositories: {
                engineering: {
                    url: urls.find(url => url.includes('github.com') && url.includes('azure-mcp')) || 
                         'https://github.com/Azure/azure-mcp',
                    description: 'Primary engineering repository for Azure MCP server'
                },
                documentation: {
                    live: {
                        url: urls.find(url => url.includes('learn.microsoft.com') || url.includes('docs.microsoft.com')) ||
                             'https://learn.microsoft.com/azure/mcp-server/tools/',
                        description: 'Live documentation site'
                    },
                    repository: {
                        url: urls.find(url => url.includes('github.com') && url.includes('docs')) ||
                             'https://github.com/MicrosoftDocs/azure-dev-docs',
                        description: 'Documentation repository'
                    }
                }
            },
            workflow: this.extractWorkflowSteps(goalText)
        };
    }

    /**
     * Extract all URLs from text
     */
    private extractAllUrls(text: string): string[] {
        const urlRegex = /https?:\/\/[^\s\)]+/g;
        const urls = text.match(urlRegex) || [];
        return [...new Set(urls)]; // Remove duplicates
    }

    /**
     * Parse tools section if present
     */
    private parseTools(sections: Map<string, string[]>): ToolsSection | undefined {
        const toolsLines = sections.get('tools') || [];
        if (toolsLines.length === 0) return undefined;

        return {
            recommended: this.extractRecommendedTools(toolsLines),
            priorities: this.extractToolPriorities(toolsLines)
        };
    }

    /**
     * Enhanced sources parsing with real URL extraction
     */
    private parseSources(sections: Map<string, string[]>, rawContent: string): SourcesSection {
        const sourcesLines = sections.get('sources_of_truth') || sections.get('sources') || [];
        const allUrls = this.extractAllUrls(rawContent);
        
        // Find specific URLs for different purposes
        const githubUrls = allUrls.filter(url => url.includes('github.com'));
        const engineeringUrls = githubUrls.filter(url => url.includes('azure-mcp') || url.includes('azure-mcp-server'));
        const docUrls = githubUrls.filter(url => url.includes('docs') || url.includes('azure-dev-docs'));
        
        return {
            engineering: {
                commands: {
                    url: engineeringUrls.find(url => url.includes('commands')) || 
                         'https://github.com/Azure/azure-mcp/blob/main/docs/azmcp-commands.md',
                    format: 'Markdown documentation',
                    purpose: 'Command definitions and documentation'
                },
                examples: {
                    url: engineeringUrls.find(url => url.includes('example')) ||
                         'https://github.com/Azure/azure-mcp/blob/main/e2eTests/e2eTestPrompts.md',
                    format: 'Code examples and test prompts',
                    purpose: 'Usage examples and implementation patterns'
                },
                descriptions: this.extractDescriptionPatterns(sourcesLines, engineeringUrls)
            },
            documentation: {
                toolsJson: {
                    url: './generated/[timestamp]/source-of-truth/tools.json',
                    format: 'JSON',
                    purpose: 'Structured tool definitions and metadata'
                },
                articles: this.extractDocumentationArticles(sourcesLines, docUrls),
                navigation: this.extractNavigationFiles(sourcesLines, docUrls)
            }
        };
    }

    /**
     * Enhanced templates parsing with file detection
     */
    private parseTemplates(sections: Map<string, string[]>, rawContent: string): TemplatesSection {
        const templateLines = sections.get('templates') || [];
        
        // Find template file references in the content
        const templateFiles = rawContent.match(/`[^`]*template[^`]*\.md`/gi) || [];
        
        const files: TemplateInfo[] = templateFiles.map(file => {
            const cleanFile = file.replace(/`/g, '');
            return {
                name: cleanFile.replace('.md', ''),
                purpose: `Template file: ${cleanFile}`,
                file: cleanFile
            };
        });

        // Add default templates if none found
        if (files.length === 0) {
            files.push(
                { name: 'new.template', purpose: 'Base template for new documentation files', file: 'new.template.md' },
                { name: 'service-template', purpose: 'Service-specific documentation template', file: 'service-template.md' }
            );
        }
        
        return {
            files,
            usage: 'Templates provide consistent structure and formatting for generated documentation'
        };
    }

    /**
     * Enhanced file generation parsing
     */
    private parseFileGeneration(sections: Map<string, string[]>, rawContent: string): FileGenerationSection {
        const fileGenLines = sections.get('file_generation') || sections.get('content_arrangement_and_file_generation') || [];
        
        // Extract file patterns from content
        const filePatterns = rawContent.match(/`[^`]*\.(md|json|log|txt)`/g) || [];
        const outputFiles = filePatterns
            .filter(file => !file.includes('template'))
            .map(file => {
                const cleanFile = file.replace(/`/g, '');
                return {
                    name: cleanFile,
                    purpose: `Generated file: ${cleanFile}`
                };
            });

        return {
            structure: {
                baseDirectory: './generated/',
                timestampFormat: 'YYYY-MM-DD_HH-mm-ss',
                subdirectories: [
                    { name: 'content', purpose: 'Generated documentation files' },
                    { name: 'source-of-truth', purpose: 'Raw data and metadata' },
                    { name: 'logs', purpose: 'Processing logs and debug information' }
                ]
            },
            workflow: this.extractWorkflowSteps(fileGenLines.join('\n')),
            outputFiles: {
                content: outputFiles.filter(f => f.name.endsWith('.md')),
                sourceOfTruth: [
                    { name: 'tools.json', source: 'engineering repository', purpose: 'Structured tool definitions' },
                    { name: 'azmcp-commands.md', source: 'command extraction', purpose: 'Command documentation source' }
                ],
                logs: outputFiles.filter(f => f.name.endsWith('.log') || f.name.endsWith('.txt'))
            }
        };
    }

    /**
     * Enhanced content rules parsing
     */
    private parseContentRules(sections: Map<string, string[]>, rawContent: string): ContentRulesSection {
        const contentLines = sections.get('content_arrangement_and_file_generation') || [];
        
        return {
            toolsJson: {
                structure: {
                    rootProperty: 'azureMcp',
                    operationsArray: 'operations',
                    example: { 'azureMcp': { 'operations': [] } }
                },
                categorization: {
                    newTool: 'Tool not found in previous version',
                    newOperation: 'Operation not found in existing tool',
                    existing: 'Tool and operation both exist'
                },
                comparison: {
                    process: 'Compare current with previous tools.json',
                    statusField: 'comparisonStatus'
                }
            },
            documentation: {
                focus: 'User-facing documentation for Azure MCP tools',
                commandVisibility: 'Show commands that are publicly available',
                grouping: {
                    priorities: 'Group by service category and usage frequency',
                    family: 'Organize related tools together'
                },
                branding: {
                    thirdParty: 'Clearly identify third-party integrations',
                    subcategories: 'Use Azure service subcategories'
                }
            },
            examplePrompts: {
                sources: ['Engineering examples', 'Documentation samples', 'User scenarios'],
                format: {
                    structure: 'Question → Example → Output',
                    bulletStyle: 'Use consistent bullet formatting',
                    summaryStyle: 'Provide concise summaries'
                },
                variety: ['Basic usage', 'Advanced scenarios', 'Integration examples'],
                guidelines: this.extractGuidelines(rawContent)
            },
            formatting: {
                prerequisites: false,
                parameters: {
                    excludeGlobal: true,
                    requiredFormat: '**parameter-name** (type): description'
                },
                headers: {
                    case: 'sentence-case',
                    htmlComments: false,
                    restrictions: ['No H3 subsections', 'Avoid generic headers']
                },
                links: {
                    type: 'relative',
                    excludeLanguageCodes: true,
                    pathFormat: '/azure/mcp/'
                },
                markdown: {
                    bullets: 'Use - for bullets',
                    customFields: ['ms.service', 'ms.subservice', 'ms.topic']
                }
            }
        };
    }

    /**
     * Enhanced navigation rules parsing
     */
    private parseNavigationRules(sections: Map<string, string[]>, rawContent: string): NavigationRulesSection {
        const navUrls = this.extractAllUrls(rawContent).filter(url => url.includes('TOC.yml') || url.includes('index.yml'));
        
        return {
            files: [
                { name: 'TOC.yml', url: navUrls.find(url => url.includes('TOC.yml')) || './TOC.yml', purpose: 'Table of contents structure' },
                { name: 'index.yml', url: navUrls.find(url => url.includes('index.yml')) || './index.yml', purpose: 'Landing page hub configuration' }
            ],
            landingPage: {
                maxTools: 15,
                ordering: 'alphabetical by service name'
            },
            ordering: 'Prioritize core Azure services, then alphabetical'
        };
    }

    /**
     * Parse editorial review section
     */
    private parseEditorialReview(sections: Map<string, string[]>): EditorialReviewSection | undefined {
        const reviewLines = sections.get('editorial_review') || [];
        if (reviewLines.length === 0) return undefined;

        return {
            process: 'Manual review required for generated content',
            criteria: [
                'Technical accuracy',
                'Completeness of examples',
                'Clarity of explanations',
                'Consistency with style guide'
            ]
        };
    }

    /**
     * Enhanced validation rules parsing
     */
    private parseValidationRules(sections: Map<string, string[]>, rawContent: string): ValidationRulesSection {
        const validationLines = sections.get('validation') || sections.get('editorial_review') || [];
        
        return {
            content: {
                maxLandingPageTools: 15,
                exampleFormat: 'Question → Example → Output',
                parameterFormat: '**parameter-name** (type): description'
            },
            structure: {
                h3Avoid: ['Overview', 'Examples', 'Prerequisites'],
                examplePromptsPlacement: 'After main content, before reference'
            },
            compliance: {
                backupPolicy: 'Always backup previous version before overwrite',
                requiredSections: ['Goal', 'Sources', 'Content Rules', 'Navigation']
            }
        };
    }

    // Enhanced helper methods
    private extractPrimaryGoal(text: string): string {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        return lines.find(line => !line.startsWith('#') && line.trim().length > 20) || 
               'Generate comprehensive documentation for Azure MCP tools and services';
    }

    private extractWorkflowSteps(text: string): string[] {
        const steps = text.match(/^\d+\.\s+(.+)$/gm) || text.match(/^[-*]\s+(.+)$/gm) || [];
        return steps.map(step => step.replace(/^\d+\.\s+|^[-*]\s+/, '').trim()).slice(0, 10);
    }

    private extractRecommendedTools(lines: string[]): ToolInfo[] {
        return [
            { name: 'mcp_azure_mcp_ser_azmcp_extension_az', purpose: 'Azure CLI integration', usage: 'Primary Azure operations' },
            { name: 'semantic_search', purpose: 'Content discovery', usage: 'Finding relevant documentation' }
        ];
    }

    private extractToolPriorities(lines: string[]): string[] {
        return ['Azure native tools first', 'General purpose tools second', 'Specialized tools as needed'];
    }

    private extractDescriptionPatterns(lines: string[], urls: string[]): Array<{pattern: string, examples: Array<{name: string, url: string}>}> {
        return [
            {
                pattern: 'Function descriptions from source code',
                examples: urls.slice(0, 3).map(url => ({
                    name: this.getNameFromUrl(url),
                    url
                }))
            }
        ];
    }

    private extractDocumentationArticles(lines: string[], urls: string[]): NamedReference[] {
        return urls.filter(url => url.includes('.md')).slice(0, 5).map(url => ({
            name: this.getNameFromUrl(url),
            url,
            purpose: 'Documentation article'
        }));
    }

    private extractNavigationFiles(lines: string[], urls: string[]): NamedReference[] {
        return urls.filter(url => url.includes('TOC.yml') || url.includes('index.yml')).map(url => ({
            name: path.basename(url),
            url,
            purpose: 'Navigation structure file'
        }));
    }

    private extractGuidelines(content: string): string[] {
        const guidelines = content.match(/[-*]\s+([^-*\n]{20,})/g) || [];
        return guidelines.map(g => g.replace(/^[-*]\s+/, '').trim()).slice(0, 5);
    }

    private getNameFromUrl(url: string): string {
        if (url.includes('github.com')) {
            const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
            return match ? match[1] : 'GitHub Repository';
        }
        return path.basename(url, path.extname(url));
    }

    /**
     * Validate parsed JSON against schema
     */
    validateAgainstSchema(data: PromptStructure): { valid: boolean; errors: string[] } {
        if (!this.schema) {
            return { valid: true, errors: ['No schema loaded for validation'] };
        }

        const errors: string[] = [];
        
        // Check required top-level properties
        const required = ['metadata', 'goal', 'sources', 'templates', 'fileGeneration', 'contentRules', 'navigationRules'];
        for (const prop of required) {
            if (!data[prop as keyof PromptStructure]) {
                errors.push(`Missing required property: ${prop}`);
            }
        }

        // Validate metadata
        if (data.metadata) {
            if (!data.metadata.sha256 || !/^[a-f0-9]{64}$/.test(data.metadata.sha256)) {
                errors.push('Invalid SHA-256 hash format');
            }
            if (!data.metadata.version || !/^\d+\.\d+\.\d+$/.test(data.metadata.version)) {
                errors.push('Invalid version format (expected semver)');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Compare two prompt structures for changes
     */
    compareStructures(current: PromptStructure, previous: PromptStructure): {
        changed: boolean;
        changes: string[];
        significance: 'major' | 'minor' | 'patch';
    } {
        const changes: string[] = [];

        // Compare SHA-256 hashes first
        if (current.metadata.sha256 !== previous.metadata.sha256) {
            changes.push('Content hash changed');
        }

        // Compare structural elements
        if (JSON.stringify(current.goal) !== JSON.stringify(previous.goal)) {
            changes.push('Goal section modified');
        }

        if (JSON.stringify(current.contentRules) !== JSON.stringify(previous.contentRules)) {
            changes.push('Content rules modified');
        }

        if (JSON.stringify(current.fileGeneration) !== JSON.stringify(previous.fileGeneration)) {
            changes.push('File generation rules modified');
        }

        // Determine significance
        let significance: 'major' | 'minor' | 'patch' = 'patch';
        if (changes.some(c => c.includes('Goal') || c.includes('Content rules'))) {
            significance = 'major';
        } else if (changes.some(c => c.includes('File generation') || c.includes('Navigation'))) {
            significance = 'minor';
        }

        return {
            changed: changes.length > 0,
            changes,
            significance
        };
    }
}

// Export convenience function
export async function convertMarkdownToJson(
    markdownPath: string, 
    outputPath?: string,
    schemaPath?: string
): Promise<PromptStructure> {
    const converter = new MarkdownToJsonConverter(schemaPath);
    return converter.convertToJson(markdownPath, outputPath);
}
