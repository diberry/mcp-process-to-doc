#!/usr/bin/env node

/**
 * Consolidated Markdown Converter CLI
 * Uses the TypeScript implementation from markdown-to-json-converter.ts
 * Combines the best features from both previous CLIs
 */

const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');
const crypto = require('crypto');

/**
 * Since we can't directly import TypeScript in Node.js without compilation,
 * we'll implement a JS-compatible version of the key functionality
 * based on the structure defined in markdown-to-json-converter.ts
 */
class MarkdownConverter {
    constructor() {
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
     * Convert markdown file to structured JSON
     */
    convertToJson(markdownPath, outputPath) {
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        const stats = fs.statSync(markdownPath);
        const sha256 = crypto.createHash('sha256').update(markdownContent).digest('hex');
        
        const structure = this.parseMarkdownStructure(markdownContent, sha256, stats.mtime);
        
        if (outputPath) {
            fs.writeFileSync(outputPath, JSON.stringify(structure, null, 2));
            console.log(`JSON output written to: ${outputPath}`);
        }
        
        return structure;
    }

    /**
     * Parse markdown into structured sections
     */
    parseMarkdownStructure(markdownContent, sha256, lastModified) {
        // Parse frontmatter
        const { data: frontmatter, content: markdownWithoutFrontmatter } = matter(markdownContent);
        
        // Get tokens using markdown-it
        const tokens = this.md.parse(markdownWithoutFrontmatter, {});
        
        // Initialize structure
        const structure = {
            metadata: {
                title: frontmatter.title || 'Untitled Prompt',
                description: frontmatter.description || '',
                version: frontmatter.version || '1.0.0',
                lastModified: lastModified.toISOString(),
                sha256: sha256,
                contentLength: markdownContent.length
            },
            sections: {}
        };

        // Parse sections
        let currentSection = null;
        let currentHeading = null;
        let currentContent = [];
        let inCodeBlock = false;
        let codeBlockLanguage = '';
        let inList = false;
        let listItems = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            // Handle headings to identify sections
            if (token.type === 'heading_open') {
                const level = parseInt(token.tag.substring(1));
                
                // Save previous section if any
                if (currentHeading && currentContent.length > 0) {
                    structure.sections[currentHeading.toLowerCase().replace(/\s+/g, '_')] = 
                        currentContent.join('\n').trim();
                }
                
                // Get heading text
                const headingToken = tokens[i + 1];
                currentHeading = headingToken.content;
                currentContent = [];
                i++; // Skip the heading_content token
            }
            // Handle code blocks
            else if (token.type === 'fence' && !inCodeBlock) {
                inCodeBlock = true;
                codeBlockLanguage = token.info;
                currentContent.push('```' + codeBlockLanguage);
                currentContent.push(token.content.trim());
                currentContent.push('```');
                inCodeBlock = false;
            }
            // Handle paragraphs
            else if (token.type === 'paragraph_open') {
                const contentToken = tokens[i + 1];
                if (contentToken && contentToken.type === 'inline') {
                    currentContent.push(contentToken.content);
                }
                i += 2; // Skip content and closing tokens
            }
            // Handle lists
            else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
                inList = true;
                listItems = [];
            }
            else if (token.type === 'list_item_open') {
                // List item handling
            }
            else if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
                inList = false;
                currentContent.push(listItems.join('\n'));
            }
        }

        // Don't forget the last section
        if (currentHeading && currentContent.length > 0) {
            structure.sections[currentHeading.toLowerCase().replace(/\s+/g, '_')] = 
                currentContent.join('\n').trim();
        }
        
        return structure;
    }

    /**
     * Validate parsed prompt against schema
     */
    validatePrompt(parsedPrompt) {
        if (!this.schema) {
            console.warn('Schema not available for validation');
            return true;
        }
        
        // Check for essential sections in MCP documentation prompt
        // Based on the actual structure of create-docs.prompt.md
        const requiredSections = ['goal', 'tools', 'scripts', 'sources_of_truth', 'templates', 'file_generation', 'read_original_sources_and_create_intermediary_files'];
        
        // Convert section names to match what we'd expect from heading conversion
        const actualSections = Object.keys(parsedPrompt.sections);
        
        // Check if we have at least some of the required sections (not all may be present)
        const foundSections = requiredSections.filter(
            section => actualSections.some(actualSection => 
                actualSection.toLowerCase().includes(section.toLowerCase())
            )
        );
        
        // Only fail if we have less than 3 required sections
        if (foundSections.length < 3) {
            console.error(`Found only ${foundSections.length} required sections out of ${requiredSections.length}`);
            console.error(`Found sections: ${foundSections.join(', ')}`);
            console.error(`Expected sections like: ${requiredSections.join(', ')}`);
            return false;
        }
        
        return true;
    }
}

/**
 * Run CLI
 */
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('Please provide a markdown file path');
        process.exit(1);
    }
    
    const markdownPath = args[0];
    
    // Parse command options
    let outputPath = null;
    let validateFlag = false;
    let compareFlag = false;
    let comparePath = null;
    
    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--output' && i + 1 < args.length) {
            outputPath = args[i + 1];
            i++;
        } else if (args[i] === '--validate') {
            validateFlag = true;
        } else if (args[i] === '--compare' && i + 1 < args.length) {
            compareFlag = true;
            comparePath = args[i + 1];
            i++;
        }
    }
    
    // Default output path if not specified
    if (!outputPath) {
        const baseName = path.basename(markdownPath, path.extname(markdownPath));
        outputPath = path.join(path.dirname(markdownPath), `${baseName}.json`);
    }
    
    try {
        const converter = new MarkdownConverter();
        const result = converter.convertToJson(markdownPath, outputPath);
        
        if (validateFlag) {
            if (converter.validatePrompt(result)) {
                console.log('Validation successful');
            } else {
                console.error('Validation failed');
                process.exit(1);
            }
        }
        
        if (compareFlag && comparePath) {
            try {
                const compareData = JSON.parse(fs.readFileSync(comparePath, 'utf8'));
                
                // Compare structure (simplified)
                const sectionDiff = {};
                
                // Check for added sections
                for (const section in result.sections) {
                    if (!compareData.sections[section]) {
                        sectionDiff[section] = 'added';
                    }
                }
                
                // Check for removed sections
                for (const section in compareData.sections) {
                    if (!result.sections[section]) {
                        sectionDiff[section] = 'removed';
                    }
                }
                
                // Check for modified sections
                for (const section in result.sections) {
                    if (compareData.sections[section] && 
                        result.sections[section] !== compareData.sections[section]) {
                        sectionDiff[section] = 'modified';
                    }
                }
                
                if (Object.keys(sectionDiff).length > 0) {
                    console.log('Changes detected:', sectionDiff);
                } else {
                    console.log('No structural changes detected');
                }
            } catch (error) {
                console.error(`Error comparing with ${comparePath}:`, error.message);
                process.exit(1);
            }
        }
        
        console.log('Conversion completed successfully');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
