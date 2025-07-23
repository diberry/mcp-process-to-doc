/**
 * Command Parser for Azure MCP Documentation Generation
 * 
 * This module provides robust parsing of azmcp-commands.md to extract
 * detailed command information including parameters, descriptions, and examples.
 */

const fs = require('fs');
const path = require('path');

class CommandParser {
    constructor() {
        this.commandsData = new Map();
        this.rawContent = '';
    }

    /**
     * Parse the azmcp-commands.md file and extract command information
     * @param {string} filePath - Path to the azmcp-commands.md file
     * @returns {Map} Map of command information
     */
    parseCommandsFile(filePath) {
        try {
            this.rawContent = fs.readFileSync(filePath, 'utf8');
            console.log(`Successfully read commands file: ${filePath}`);
            
            this.extractCommands();
            console.log(`Extracted ${this.commandsData.size} commands from file`);
            
            return this.commandsData;
        } catch (error) {
            console.error(`Error parsing commands file: ${error.message}`);
            return new Map();
        }
    }

    /**
     * Extract commands from the markdown content
     */
    extractCommands() {
        // Split content into sections based on headers
        const sections = this.splitIntoSections();
        
        sections.forEach(section => {
            this.parseSection(section);
        });
    }

    /**
     * Split content into logical sections
     */
    splitIntoSections() {
        const lines = this.rawContent.split('\n');
        const sections = [];
        let currentSection = [];
        let inCommandBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Detect command blocks or function definitions
            if (this.isCommandHeader(line) || this.isFunctionDefinition(line)) {
                if (currentSection.length > 0) {
                    sections.push(currentSection.join('\n'));
                    currentSection = [];
                }
                inCommandBlock = true;
            }
            
            currentSection.push(line);
            
            // End section on next header or significant break
            if (inCommandBlock && i < lines.length - 1) {
                const nextLine = lines[i + 1];
                if (this.isNewCommandStart(nextLine) && currentSection.length > 5) {
                    sections.push(currentSection.join('\n'));
                    currentSection = [];
                    inCommandBlock = false;
                }
            }
        }
        
        if (currentSection.length > 0) {
            sections.push(currentSection.join('\n'));
        }
        
        return sections;
    }

    /**
     * Check if line is a command header
     */
    isCommandHeader(line) {
        return line.match(/^#+\s+/);
    }

    /**
     * Check if line is a function definition
     */
    isFunctionDefinition(line) {
        return line.includes('mcp_azure_mcp_ser_azmcp_') || 
               line.includes('function') || 
               line.includes('def ') ||
               line.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/);
    }

    /**
     * Check if this is the start of a new command
     */
    isNewCommandStart(line) {
        return this.isCommandHeader(line) || 
               this.isFunctionDefinition(line) ||
               line.trim() === '' && line.length === 0;
    }

    /**
     * Parse a section to extract command information
     */
    parseSection(sectionContent) {
        const lines = sectionContent.split('\n');
        
        // Extract command name and basic info
        const commandInfo = this.extractBasicCommandInfo(lines);
        if (!commandInfo) return;
        
        // Extract parameters
        commandInfo.parameters = this.extractParameters(lines);
        
        // Extract description
        commandInfo.description = this.extractDescription(lines);
        
        // Extract examples
        commandInfo.examples = this.extractExamples(lines);
        
        // Extract return information
        commandInfo.returns = this.extractReturns(lines);
        
        // Store the command info
        this.commandsData.set(commandInfo.fullCommand, commandInfo);
    }

    /**
     * Extract basic command information from section
     */
    extractBasicCommandInfo(lines) {
        let commandName = '';
        let toolName = '';
        let operation = '';
        
        // Look for function names that follow the pattern
        for (const line of lines) {
            // Pattern: mcp_azure_mcp_ser_azmcp_{tool}_{operation}
            const functionMatch = line.match(/mcp_azure_mcp_ser_azmcp_([a-zA-Z0-9_-]+)_([a-zA-Z0-9_-]+)/);
            if (functionMatch) {
                toolName = functionMatch[1].replace(/_/g, '-');
                operation = functionMatch[2].replace(/_/g, '-');
                commandName = `azmcp ${toolName} ${operation}`;
                break;
            }
            
            // Alternative pattern: direct command in comments or text
            const commandMatch = line.match(/azmcp\s+([a-zA-Z0-9-]+)\s+([a-zA-Z0-9-]+)/);
            if (commandMatch) {
                toolName = commandMatch[1];
                operation = commandMatch[2];
                commandName = line.trim();
                break;
            }
            
            // Header pattern
            const headerMatch = line.match(/^#+\s+(.+)/);
            if (headerMatch) {
                const headerText = headerMatch[1].toLowerCase();
                if (headerText.includes('azmcp')) {
                    commandName = headerText;
                    const parts = headerText.split(/\s+/);
                    if (parts.length >= 3) {
                        toolName = parts[1];
                        operation = parts.slice(2).join(' ');
                    }
                    break;
                }
            }
        }
        
        if (!commandName) return null;
        
        return {
            fullCommand: commandName,
            toolName: toolName,
            operation: operation,
            rawContent: lines.join('\n')
        };
    }

    /**
     * Extract parameters from section content
     */
    extractParameters(lines) {
        const parameters = [];
        let inParamsSection = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Detect parameter sections
            if (line.toLowerCase().includes('parameter') || 
                line.toLowerCase().includes('argument') ||
                line.toLowerCase().includes('option')) {
                inParamsSection = true;
                continue;
            }
            
            if (inParamsSection) {
                // Extract parameter from various formats
                const param = this.parseParameterLine(line);
                if (param) {
                    parameters.push(param);
                }
                
                // Stop if we hit a new section
                if (line.match(/^#+/) && !line.toLowerCase().includes('parameter')) {
                    break;
                }
            }
        }
        
        // If no parameters found in structured format, look for JSON-like patterns
        if (parameters.length === 0) {
            parameters.push(...this.extractParametersFromJSON(lines));
        }
        
        return parameters;
    }

    /**
     * Parse a single parameter line
     */
    parseParameterLine(line) {
        // Various parameter formats
        const patterns = [
            // JSON-like: "name": "description"
            /"([^"]+)":\s*"([^"]+)"/,
            // Markdown: - **name**: description
            /[*-]\s*\*\*([^*]+)\*\*[:\s]*(.+)/,
            // Simple: name - description
            /([a-zA-Z0-9-_]+)\s*[-:]\s*(.+)/,
            // With type: name (type): description
            /([a-zA-Z0-9-_]+)\s*\([^)]+\)[:\s]*(.+)/
        ];
        
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                return {
                    name: match[1].trim(),
                    description: match[2].trim(),
                    required: this.isParameterRequired(line),
                    type: this.extractParameterType(line)
                };
            }
        }
        
        return null;
    }

    /**
     * Determine if parameter is required
     */
    isParameterRequired(line) {
        const requiredIndicators = ['required', 'mandatory', 'must'];
        const optionalIndicators = ['optional', 'optional', 'can be'];
        
        const lowerLine = line.toLowerCase();
        
        if (requiredIndicators.some(indicator => lowerLine.includes(indicator))) {
            return true;
        }
        if (optionalIndicators.some(indicator => lowerLine.includes(indicator))) {
            return false;
        }
        
        // Default to required if unclear
        return true;
    }

    /**
     * Extract parameter type from line
     */
    extractParameterType(line) {
        const typePatterns = [
            /\(([^)]+)\)/,  // (string), (integer), etc.
            /type:\s*([a-zA-Z]+)/i,
            /string|integer|boolean|array|object/i
        ];
        
        for (const pattern of typePatterns) {
            const match = line.match(pattern);
            if (match) {
                return match[1] || match[0];
            }
        }
        
        return 'string';  // default type
    }

    /**
     * Extract parameters from JSON-like structures
     */
    extractParametersFromJSON(lines) {
        const parameters = [];
        const content = lines.join('\n');
        
        // Look for JSON objects containing parameter definitions
        const jsonBlocks = content.match(/\{[\s\S]*?\}/g) || [];
        
        jsonBlocks.forEach(block => {
            try {
                // Try to parse as JSON
                const parsed = JSON.parse(block);
                if (parsed.properties) {
                    Object.entries(parsed.properties).forEach(([name, prop]) => {
                        parameters.push({
                            name: name,
                            description: prop.description || `The ${name} parameter`,
                            required: parsed.required?.includes(name) || false,
                            type: prop.type || 'string'
                        });
                    });
                }
            } catch (e) {
                // Not valid JSON, try to extract manually
                const paramMatches = block.match(/"([^"]+)":\s*{[^}]*"description":\s*"([^"]+)"/g) || [];
                paramMatches.forEach(match => {
                    const paramMatch = match.match(/"([^"]+)":\s*{[^}]*"description":\s*"([^"]+)"/);
                    if (paramMatch) {
                        parameters.push({
                            name: paramMatch[1],
                            description: paramMatch[2],
                            required: true,  // default
                            type: 'string'   // default
                        });
                    }
                });
            }
        });
        
        return parameters;
    }

    /**
     * Extract description from section
     */
    extractDescription(lines) {
        let description = '';
        let foundDescription = false;
        
        for (const line of lines) {
            // Skip headers and function definitions
            if (this.isCommandHeader(line) || this.isFunctionDefinition(line)) {
                continue;
            }
            
            // Look for description patterns
            if (line.toLowerCase().includes('description') && line.includes(':')) {
                const descMatch = line.match(/description[:\s]+(.+)/i);
                if (descMatch) {
                    description = descMatch[1].trim();
                    foundDescription = true;
                }
                continue;
            }
            
            // If we haven't found a description yet, use the first meaningful text
            if (!foundDescription && line.trim() && 
                !line.includes('function') && 
                !line.includes('parameter') &&
                !line.includes('{') &&
                !line.includes('}') &&
                line.length > 10) {
                description = line.trim();
                foundDescription = true;
            }
        }
        
        return description || 'No description available';
    }

    /**
     * Extract examples from section
     */
    extractExamples(lines) {
        const examples = [];
        
        for (const line of lines) {
            // Look for example patterns
            if (line.toLowerCase().includes('example') || 
                line.includes('azmcp ') ||
                line.match(/^\s*[>`]/)) {
                
                const cleanExample = line.replace(/^[>\s`*-]+/, '').trim();
                if (cleanExample && cleanExample.length > 5) {
                    examples.push(cleanExample);
                }
            }
        }
        
        return examples;
    }

    /**
     * Extract return information from section
     */
    extractReturns(lines) {
        let returns = '';
        
        for (const line of lines) {
            if (line.toLowerCase().includes('return') && line.includes(':')) {
                const returnMatch = line.match(/return[s]?[:\s]+(.+)/i);
                if (returnMatch) {
                    returns = returnMatch[1].trim();
                    break;
                }
            }
            
            // Look for output descriptions
            if (line.toLowerCase().includes('output') || 
                line.toLowerCase().includes('result')) {
                returns = line.trim();
                break;
            }
        }
        
        return returns || 'Returns operation results';
    }

    /**
     * Get command information by command string
     */
    getCommandInfo(commandString) {
        return this.commandsData.get(commandString) || null;
    }

    /**
     * Get all commands for a specific tool
     */
    getToolCommands(toolName) {
        const toolCommands = new Map();
        
        for (const [command, info] of this.commandsData) {
            if (info.toolName === toolName) {
                toolCommands.set(command, info);
            }
        }
        
        return toolCommands;
    }

    /**
     * Export parsed data for debugging
     */
    exportParsedData(outputPath) {
        const data = {};
        for (const [command, info] of this.commandsData) {
            data[command] = info;
        }
        
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`Exported parsed command data to: ${outputPath}`);
    }
}

module.exports = CommandParser;
