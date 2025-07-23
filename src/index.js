/**
 * Legacy Entry Point - Compatibility Layer
 * 
 * This file maintains compatibility with the old API while delegating
 * to the new modular architecture.
 */

const AzureMcpDocGenerator = require('./main');

/**
 * Legacy Enhanced Documentation Generator
 * Provides backward compatibility with the old API
 */
class EnhancedDocumentationGenerator {
    constructor() {
        this.generator = new AzureMcpDocGenerator();
        this.currentSession = null;
    }

    /**
     * Initialize the generator with configuration
     */
    async initialize(config = {}) {
        await this.generator.initialize(config);
        
        // Get the current session info for compatibility
        const outputManager = this.generator.getComponent('outputFileManager');
        if (outputManager) {
            await outputManager.initializeSession({
                id: `legacy-session-${Date.now()}`
            });
            this.currentSession = outputManager.currentSession?.directory;
        }
        
        console.log(`Session initialized: ${this.currentSession}`);
    }

    /**
     * Generate documentation for a single tool
     */
    async generateSingleTool(toolName, options = {}) {
        console.log(`Generating documentation for tool: ${toolName}`);
        
        try {
            const result = await this.generator.generateSingleTool(toolName, options);
            console.log(`✅ Generated documentation for: ${toolName}`);
            return result;
        } catch (error) {
            console.error(`❌ Failed to generate ${toolName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate documentation for all tools
     */
    async generateAllTools(options = {}) {
        console.log('Generating documentation for all tools...');
        
        try {
            const result = await this.generator.generateDocumentation(options);
            console.log(`✅ Generated documentation for all tools`);
            return result;
        } catch (error) {
            console.error(`❌ Failed to generate all tools: ${error.message}`);
            throw error;
        }
    }

    /**
     * Regenerate tools.json from commands
     */
    async regenerateToolsJson(options = {}) {
        console.log('Regenerating tools.json...');
        
        try {
            const toolsExtractor = this.generator.getComponent('toolsExtractor');
            const result = await toolsExtractor.regenerateToolsJson(options);
            console.log(`✅ Regenerated tools.json`);
            return result;
        } catch (error) {
            console.error(`❌ Failed to regenerate tools.json: ${error.message}`);
            throw error;
        }
    }

    /**
     * Run quality checks on generated content
     */
    async runQualityChecks(contentDir = null) {
        console.log(`Running quality checks...`);
        
        try {
            let targetDir = contentDir;
            if (!targetDir && this.currentSession) {
                targetDir = require('path').join(this.currentSession, 'content');
            }
            
            const result = await this.generator.validateDocumentation(targetDir || './generated');
            console.log(`✅ Quality checks completed`);
            return result;
        } catch (error) {
            console.error(`❌ Quality checks failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Complete workflow: regenerate tools, generate docs, run quality checks
     */
    async runCompleteWorkflow(options = {}) {
        console.log('🚀 Starting complete documentation generation workflow...\n');
        
        try {
            const result = await this.generator.generateDocumentation({
                regenerateTools: options.regenerateTools !== false,
                enableQualityControl: true,
                generateLogs: true,
                ...options
            });
            
            console.log('🎉 Complete workflow finished successfully!');
            console.log(`📁 Output directory: ${this.currentSession}`);
            
            return result;
        } catch (error) {
            console.error('❌ Workflow failed:', error.message);
            throw error;
        }
    }

    /**
     * Get current session directory
     */
    getCurrentSession() {
        return this.currentSession;
    }
}

module.exports = EnhancedDocumentationGenerator;

// Also export the new generator for those who want to use it directly
module.exports.AzureMcpDocGenerator = AzureMcpDocGenerator;

// CLI usage
if (require.main === module) {
    async function main() {
        const generator = new EnhancedDocumentationGenerator();
        await generator.initialize();
        
        const args = process.argv.slice(2);
        const command = args[0] || 'workflow';
        
        try {
            switch (command) {
                case 'workflow':
                    await generator.runCompleteWorkflow();
                    break;
                case 'docs':
                    await generator.generateAllTools();
                    break;
                case 'tool':
                    if (!args[1]) {
                        console.error('Tool name required: node index.js tool <toolname>');
                        process.exit(1);
                    }
                    await generator.generateSingleTool(args[1]);
                    break;
                case 'tools-json':
                    await generator.regenerateToolsJson();
                    break;
                case 'quality':
                    await generator.runQualityChecks();
                    break;
                default:
                    console.log('Usage: node index.js [workflow|docs|tool <name>|tools-json|quality]');
            }
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    }
    
    main();
}
