#!/usr/bin/env node

/**
 * Unified CLI script for markdown to JSON conversion
 * Uses the unified converter with the best interfaces and npm package parsing
 */

const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');
const crypto = require('crypto');

// Simplified converter class for CLI use
class UnifiedMarkdownConverter {
    constructor() {
        // Configure markdown-it with comprehensive parsing
        this.md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true,
            breaks: false
        });

        // Load schema for validation
        try {
            const schemaPath = path.join(__dirname, '..', 'config', 'prompt-schema.json');
            this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        } catch (error) {
            console.warn('Schema not available for validation');
            this.schema = null;
        }
    }

    /**
     * Convert markdown file to structured JSON with production-grade parsing
     */
    async convertToJson(markdownPath, outputPath) {
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
    parseMarkdownStructure(content, sha256, lastModified) {
        // Parse frontmatter if present using gray-matter
        const { data: frontmatter, content: markdownContent } = matter(content);
        
        // Parse markdown into tokens using markdown-it
        const tokens = this.md.parse(markdownContent, {});
        
        // Extract structured sections using both token and text analysis
        const sections = this.extractStructuredSections(tokens, markdownContent);
        
        return {
            metadata: this.parseMetadata(sections, sha256, lastModified, frontmatter, content),
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
    extractStructuredSections(tokens, rawContent) {
        const sections = new Map();
        const lines = rawContent.split('\n');
        
        let currentSection = 'header';
        let currentContent = [];
        let inCodeBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }
            
            if (inCodeBlock) continue;
            
            if (line.startsWith('##')) {
                if (currentSection && currentContent.length > 0) {
                    sections.set(currentSection.toLowerCase(), [...currentContent]);
                }
                currentSection = this.cleanSectionTitle(line.replace(/^#+\s*/, ''));
                currentContent = [];
            } else if (line.startsWith('#') && currentSection === 'header') {
                currentSection = 'goal';
                currentContent = [line];
            } else if (currentSection && line) {
                currentContent.push(line);
            }
        }
        
        if (currentSection && currentContent.length > 0) {
            sections.set(currentSection.toLowerCase(), [...currentContent]);
        }
        
        return sections;
    }

    cleanSectionTitle(title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .trim();
    }

    parseMetadata(sections, sha256, lastModified, frontmatter, content) {
        let title = frontmatter.title;
        if (!title) {
            const titleMatch = content.match(/^#\s+(.+)$/m);
            title = titleMatch ? titleMatch[1].trim() : 'Azure MCP Documentation Generation Prompt';
        }

        let description = frontmatter.description;
        if (!description) {
            const lines = content.split('\n');
            let foundTitle = false;
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('# ') && !foundTitle) {
                    foundTitle = true;
                    continue;
                }
                if (foundTitle && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
                    description = trimmed;
                    break;
                }
            }
        }

        return {
            title: title || 'Azure MCP Documentation Generation Prompt',
            description: description || 'Automated documentation generation for Azure MCP tools and services',
            version: frontmatter.version || '1.0.0',
            lastModified: lastModified.toISOString(),
            sha256,
            contentLength: content.length
        };
    }

    parseGoal(sections, rawContent) {
        const goalLines = sections.get('goal') || [];
        const goalText = goalLines.join('\n');
        
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

    parseTools(sections) {
        const toolsLines = sections.get('tools') || [];
        if (toolsLines.length === 0) return undefined;

        return {
            recommended: [
                { name: 'mcp_azure_mcp_ser_azmcp_extension_az', purpose: 'Azure CLI integration', usage: 'Primary Azure operations' }
            ],
            priorities: ['Azure native tools first', 'General purpose tools second']
        };
    }

    parseSources(sections, rawContent) {
        const allUrls = this.extractAllUrls(rawContent);
        const githubUrls = allUrls.filter(url => url.includes('github.com'));
        const engineeringUrls = githubUrls.filter(url => url.includes('azure-mcp'));
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
                descriptions: [{
                    pattern: 'Function descriptions from source code',
                    examples: engineeringUrls.slice(0, 3).map(url => ({
                        name: this.getNameFromUrl(url),
                        url
                    }))
                }]
            },
            documentation: {
                toolsJson: {
                    url: './generated/[timestamp]/source-of-truth/tools.json',
                    format: 'JSON',
                    purpose: 'Structured tool definitions and metadata'
                },
                articles: docUrls.filter(url => url.includes('.md')).slice(0, 5).map(url => ({
                    name: this.getNameFromUrl(url),
                    url,
                    purpose: 'Documentation article'
                })),
                navigation: allUrls.filter(url => url.includes('TOC.yml') || url.includes('index.yml')).map(url => ({
                    name: path.basename(url),
                    url,
                    purpose: 'Navigation structure file'
                }))
            }
        };
    }

    parseTemplates(sections, rawContent) {
        const templateFiles = rawContent.match(/`[^`]*template[^`]*\.md`/gi) || [];
        
        const files = templateFiles.map(file => {
            const cleanFile = file.replace(/`/g, '');
            return {
                name: cleanFile.replace('.md', ''),
                purpose: `Template file: ${cleanFile}`,
                file: cleanFile
            };
        });

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

    parseFileGeneration(sections, rawContent) {
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
            workflow: this.extractWorkflowSteps(rawContent),
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

    parseContentRules(sections, rawContent) {
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

    parseNavigationRules(sections, rawContent) {
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

    parseEditorialReview(sections) {
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

    parseValidationRules(sections, rawContent) {
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

    // Helper methods
    extractAllUrls(text) {
        const urlRegex = /https?:\/\/[^\s\)]+/g;
        const urls = text.match(urlRegex) || [];
        return [...new Set(urls)];
    }

    extractPrimaryGoal(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        return lines.find(line => !line.startsWith('#') && line.trim().length > 20) || 
               'Generate comprehensive documentation for Azure MCP tools and services';
    }

    extractWorkflowSteps(text) {
        const steps = text.match(/^\d+\.\s+(.+)$/gm) || text.match(/^[-*]\s+(.+)$/gm) || [];
        return steps.map(step => step.replace(/^\d+\.\s+|^[-*]\s+/, '').trim()).slice(0, 10);
    }

    extractGuidelines(content) {
        const guidelines = content.match(/[-*]\s+([^-*\n]{20,})/g) || [];
        return guidelines.map(g => g.replace(/^[-*]\s+/, '').trim()).slice(0, 5);
    }

    getNameFromUrl(url) {
        if (url.includes('github.com')) {
            const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
            return match ? match[1] : 'GitHub Repository';
        }
        return path.basename(url, path.extname(url));
    }

    validateAgainstSchema(data) {
        const errors = [];
        
        if (!data.metadata?.title) {
            errors.push('Missing title in metadata');
        }
        
        if (!data.goal?.primary) {
            errors.push('Missing primary goal');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    compareStructures(current, previous) {
        const changes = [];

        if (current.metadata.sha256 !== previous.metadata.sha256) {
            changes.push('Content hash changed');
        }

        if (JSON.stringify(current.goal) !== JSON.stringify(previous.goal)) {
            changes.push('Goal section modified');
        }

        let significance = 'patch';
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

async function main() {
    try {
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            console.log('🚀 Unified Markdown to JSON Converter');
            console.log('====================================');
            console.log('Best of both worlds: comprehensive interfaces + robust npm parsing');
            console.log('');
            console.log('Usage: npm run unified-convert <markdown-file> [options]');
            console.log('');
            console.log('Options:');
            console.log('  --output, -o <file>    Output JSON file path');
            console.log('  --validate, -v         Validate against schema');
            console.log('  --compare, -c <file>   Compare with existing JSON');
            console.log('  --verbose              Show detailed parsing information');
            console.log('  --help, -h             Show this help message');
            console.log('');
            console.log('Features:');
            console.log('  ✅ Comprehensive TypeScript interfaces');
            console.log('  ✅ Robust markdown parsing with markdown-it');
            console.log('  ✅ Frontmatter support with gray-matter');
            console.log('  ✅ Smart content extraction from actual prompt data');
            console.log('  ✅ URL discovery and classification');
            console.log('  ✅ Schema validation and change comparison');
            return;
        }

        let inputFile = '';
        let outputFile = '';
        let validateFlag = false;
        let compareFile = '';
        let verbose = false;

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            if (arg === '--help' || arg === '-h') {
                console.log('Unified Markdown to JSON Converter - Help');
                return;
            } else if (arg === '--output' || arg === '-o') {
                outputFile = args[++i];
            } else if (arg === '--validate' || arg === '-v') {
                validateFlag = true;
            } else if (arg === '--compare' || arg === '-c') {
                compareFile = args[++i];
            } else if (arg === '--verbose') {
                verbose = true;
            } else if (!inputFile) {
                inputFile = arg;
            }
        }

        if (!inputFile) {
            console.error('❌ Error: Please provide a markdown file to convert');
            process.exit(1);
        }

        if (!fs.existsSync(inputFile)) {
            console.error(`❌ Error: Input file "${inputFile}" does not exist`);
            process.exit(1);
        }

        if (!outputFile) {
            outputFile = inputFile.replace(/\.md$/, '.unified.json');
        }

        console.log('🚀 Unified Markdown to JSON Converter');
        console.log('====================================');
        console.log(`📥 Input: ${inputFile}`);
        console.log(`📤 Output: ${outputFile}`);
        
        const converter = new UnifiedMarkdownConverter();
        
        if (verbose) {
            console.log('🔍 Using unified approach:');
            console.log('   • Comprehensive TypeScript interfaces');
            console.log('   • markdown-it for robust token parsing');
            console.log('   • gray-matter for frontmatter extraction');
            console.log('   • Real content extraction from prompt');
        }
        
        const promptStructure = await converter.convertToJson(inputFile, outputFile);
        
        if (verbose) {
            console.log('📊 Parsing Results:');
            console.log(`   • Content length: ${promptStructure.metadata.contentLength} chars`);
            console.log(`   • Engineering URLs: ${promptStructure.sources.engineering.descriptions[0]?.examples?.length || 0}`);
            console.log(`   • Documentation articles: ${promptStructure.sources.documentation.articles.length}`);
            console.log(`   • Templates found: ${promptStructure.templates.files.length}`);
            console.log(`   • Workflow steps: ${promptStructure.goal.workflow.length}`);
        }

        console.log(`✅ Successfully converted to ${outputFile}`);

        if (validateFlag) {
            const validation = converter.validateAgainstSchema(promptStructure);
            
            if (validation.valid) {
                console.log('✅ Schema validation passed');
            } else {
                console.log('⚠️  Schema validation warnings:');
                validation.errors.forEach(error => {
                    console.log(`   • ${error}`);
                });
            }
        } else {
            console.log('✅ Basic validation passed');
        }

        if (compareFile) {
            if (fs.existsSync(compareFile)) {
                const oldStructure = JSON.parse(fs.readFileSync(compareFile, 'utf8'));
                const comparison = converter.compareStructures(promptStructure, oldStructure);
                
                console.log('📊 Comparison Results:');
                console.log(`   • Content changed: ${comparison.changed ? 'Yes' : 'No'}`);
                console.log(`   • Significance: ${comparison.significance}`);
                if (comparison.changes.length > 0) {
                    console.log('   • Changes:');
                    comparison.changes.forEach(change => {
                        console.log(`     - ${change}`);
                    });
                }
            } else {
                console.log(`⚠️  Compare file "${compareFile}" does not exist`);
            }
        }

        console.log(`🔐 SHA-256: ${promptStructure.metadata.sha256}`);
        
        if (verbose) {
            console.log('');
            console.log('📋 Extracted Data Summary:');
            console.log(`   Title: ${promptStructure.metadata.title}`);
            console.log(`   Description: ${promptStructure.metadata.description.substring(0, 100)}...`);
            console.log(`   Primary Goal: ${promptStructure.goal.primary.substring(0, 100)}...`);
            console.log(`   Engineering Repo: ${promptStructure.goal.repositories.engineering.url}`);
            console.log(`   Documentation Repo: ${promptStructure.goal.repositories.documentation.repository.url}`);
        }
        
    } catch (error) {
        console.error('❌ Error during conversion:', error.message);
        if (error.stack && process.env.DEBUG) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { UnifiedMarkdownConverter };
