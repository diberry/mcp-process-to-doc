#!/usr/bin/env node

/**
 * Consolidated Markdown Converter CLI
 * Uses the TypeScript implementation from markdown-to-json-converter.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import { MarkdownToJsonConverter, PromptStructure } from '../automation/markdown-to-json-converter.js';

/**
 * Run CLI
 */
async function main(): Promise<void> {
    const args: string[] = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Please provide a markdown file path');
        process.exit(1);
    }

    const markdownPath: string = args[0];

    // Parse command options
    let outputPath: string | null = null;
    let validateFlag: boolean = false;
    let compareFlag: boolean = false;
    let comparePath: string | null = null;

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
        const baseName: string = path.basename(markdownPath, path.extname(markdownPath));
        outputPath = path.join(path.dirname(markdownPath), `${baseName}.json`);
    }

    try {
        const converter = new MarkdownToJsonConverter();
        const result: PromptStructure = await converter.convertToJson(markdownPath, outputPath);

        if (outputPath) {
            console.log(`JSON output written to: ${outputPath}`);
        }

        if (validateFlag) {
            console.warn('Validation is not implemented in MarkdownToJsonConverter');
        }

        if (compareFlag && comparePath) {
            try {
                const compareData: PromptStructure = JSON.parse(fs.readFileSync(comparePath, 'utf8'));

                // Simplified comparison logic
                const addedSections = Object.keys(result).filter(key => !compareData[key]);
                const removedSections = Object.keys(compareData).filter(key => !result[key]);

                console.log('Comparison result:');
                console.log('Added sections:', addedSections);
                console.log('Removed sections:', removedSections);
            } catch (error) {
                console.error(`Error comparing with ${comparePath}:`, (error as Error).message);
                process.exit(1);
            }
        }

        console.log('Conversion completed successfully');
    } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
    }
}

main();
