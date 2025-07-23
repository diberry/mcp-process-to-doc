/**
 * Output File Manager
 * 
 * Manages file output operations including directory structure creation,
 * file writing, backup management, and output validation.
 */

const fs = require('fs').promises;
const path = require('path');

class OutputFileManager {
    constructor(outputConfig = {}) {
        this.config = {
            baseOutputDir: outputConfig.baseOutputDir || './generated',
            createTimestampedDirs: outputConfig.createTimestampedDirs !== false,
            backupExisting: outputConfig.backupExisting !== false,
            validateOutput: outputConfig.validateOutput !== false,
            fileExtension: outputConfig.fileExtension || '.md',
            encoding: outputConfig.encoding || 'utf8',
            ...outputConfig
        };
        
        this.currentSession = null;
        this.writtenFiles = [];
        this.backupFiles = [];
    }

    /**
     * Initialize a new output session
     * @param {Object} sessionConfig - Session configuration
     * @returns {Promise<Object>} Session information
     */
    async initializeSession(sessionConfig = {}) {
        const timestamp = this.generateTimestamp();
        const sessionDir = this.config.createTimestampedDirs 
            ? path.join(this.config.baseOutputDir, timestamp)
            : this.config.baseOutputDir;

        this.currentSession = {
            id: sessionConfig.id || timestamp,
            timestamp,
            directory: sessionDir,
            contentDir: path.join(sessionDir, 'content'),
            logsDir: path.join(sessionDir, 'logs'),
            sourceDir: path.join(sessionDir, 'source-of-truth'),
            config: { ...this.config, ...sessionConfig }
        };

        // Create directory structure
        await this.createDirectoryStructure();

        this.writtenFiles = [];
        this.backupFiles = [];

        return this.currentSession;
    }

    /**
     * Write a single file
     * @param {string} filename - Filename (without extension unless specified)
     * @param {string} content - File content
     * @param {Object} options - Write options
     * @returns {Promise<Object>} File information
     */
    async writeFile(filename, content, options = {}) {
        if (!this.currentSession) {
            throw new Error('Output session not initialized. Call initializeSession() first.');
        }

        const fileInfo = this.prepareFileInfo(filename, options);
        
        // Backup existing file if it exists
        if (this.config.backupExisting && await this.fileExists(fileInfo.fullPath)) {
            await this.backupFile(fileInfo.fullPath);
        }

        // Validate content if requested
        if (this.config.validateOutput) {
            this.validateContent(content, fileInfo);
        }

        // Write the file
        await this.ensureDirectoryExists(path.dirname(fileInfo.fullPath));
        await fs.writeFile(fileInfo.fullPath, content, this.config.encoding);

        // Track written file
        this.writtenFiles.push(fileInfo);

        return fileInfo;
    }

    /**
     * Write multiple files in batch
     * @param {Array} files - Array of {filename, content, options} objects
     * @param {Object} batchOptions - Batch options
     * @returns {Promise<Array>} Array of file information objects
     */
    async writeFiles(files, batchOptions = {}) {
        const results = [];
        const errors = [];

        for (const file of files) {
            try {
                const fileInfo = await this.writeFile(file.filename, file.content, file.options);
                results.push(fileInfo);
            } catch (error) {
                errors.push({
                    filename: file.filename,
                    error: error.message
                });
            }
        }

        if (errors.length > 0 && batchOptions.failOnError) {
            throw new Error(`Failed to write ${errors.length} files: ${JSON.stringify(errors)}`);
        }

        return { results, errors };
    }

    /**
     * Write log file
     * @param {string} logType - Type of log (e.g., 'process', 'errors', 'debug')
     * @param {string} content - Log content
     * @param {Object} options - Log options
     * @returns {Promise<Object>} File information
     */
    async writeLogFile(logType, content, options = {}) {
        if (!this.currentSession) {
            throw new Error('Output session not initialized.');
        }

        const timestamp = options.includeTimestamp !== false ? this.generateTimestamp() : '';
        const filename = timestamp 
            ? `${logType}-${timestamp}.log`
            : `${logType}.log`;

        const logPath = path.join(this.currentSession.logsDir, filename);
        await this.ensureDirectoryExists(this.currentSession.logsDir);
        await fs.writeFile(logPath, content, this.config.encoding);

        return {
            filename,
            fullPath: logPath,
            type: 'log',
            size: content.length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Write source-of-truth file (original data)
     * @param {string} filename - Filename
     * @param {string} content - Content (usually JSON)
     * @param {Object} options - Write options
     * @returns {Promise<Object>} File information
     */
    async writeSourceFile(filename, content, options = {}) {
        if (!this.currentSession) {
            throw new Error('Output session not initialized.');
        }

        const sourcePath = path.join(this.currentSession.sourceDir, filename);
        await this.ensureDirectoryExists(this.currentSession.sourceDir);
        await fs.writeFile(sourcePath, content, this.config.encoding);

        return {
            filename,
            fullPath: sourcePath,
            type: 'source',
            size: content.length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate an index file listing all generated files
     * @param {Object} indexOptions - Index generation options
     * @returns {Promise<Object>} Index file information
     */
    async generateIndex(indexOptions = {}) {
        if (!this.currentSession) {
            throw new Error('Output session not initialized.');
        }

        const indexContent = this.buildIndexContent(indexOptions);
        const indexPath = path.join(this.currentSession.directory, 'index.md');
        
        await fs.writeFile(indexPath, indexContent, this.config.encoding);

        return {
            filename: 'index.md',
            fullPath: indexPath,
            type: 'index',
            size: indexContent.length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get session summary
     * @returns {Object} Session summary
     */
    getSessionSummary() {
        if (!this.currentSession) {
            return null;
        }

        return {
            sessionId: this.currentSession.id,
            directory: this.currentSession.directory,
            filesWritten: this.writtenFiles.length,
            backupsCreated: this.backupFiles.length,
            totalSize: this.writtenFiles.reduce((sum, file) => sum + (file.size || 0), 0),
            startTime: this.currentSession.timestamp,
            files: this.writtenFiles.map(f => ({
                filename: f.filename,
                path: f.relativePath,
                size: f.size,
                type: f.type
            }))
        };
    }

    /**
     * Clean up old sessions
     * @param {Object} cleanupOptions - Cleanup options
     * @returns {Promise<Object>} Cleanup summary
     */
    async cleanupOldSessions(cleanupOptions = {}) {
        const maxAge = cleanupOptions.maxAge || 7; // days
        const keepCount = cleanupOptions.keepCount || 10;
        
        try {
            const baseDir = this.config.baseOutputDir;
            const entries = await fs.readdir(baseDir, { withFileTypes: true });
            
            const sessionDirs = entries
                .filter(entry => entry.isDirectory() && this.isTimestampDir(entry.name))
                .map(entry => ({
                    name: entry.name,
                    path: path.join(baseDir, entry.name),
                    timestamp: this.parseTimestamp(entry.name)
                }))
                .sort((a, b) => b.timestamp - a.timestamp);

            let deleted = 0;
            const now = new Date();

            // Keep most recent directories
            const toDelete = sessionDirs.slice(keepCount);

            for (const dir of toDelete) {
                const ageInDays = (now - dir.timestamp) / (1000 * 60 * 60 * 24);
                if (ageInDays > maxAge) {
                    await this.deleteDirectory(dir.path);
                    deleted++;
                }
            }

            return {
                totalSessions: sessionDirs.length,
                deletedSessions: deleted,
                keptSessions: sessionDirs.length - deleted
            };
        } catch (error) {
            throw new Error(`Failed to cleanup old sessions: ${error.message}`);
        }
    }

    /**
     * Prepare file information
     * @param {string} filename - Filename
     * @param {Object} options - File options
     * @returns {Object} File information
     */
    prepareFileInfo(filename, options) {
        const targetDir = options.directory || this.currentSession.contentDir;
        const extension = options.extension || this.config.fileExtension;
        
        // Add extension if not present
        const finalFilename = path.extname(filename) ? filename : filename + extension;
        
        const fullPath = path.join(targetDir, finalFilename);
        const relativePath = path.relative(this.currentSession.directory, fullPath);

        return {
            filename: finalFilename,
            fullPath,
            relativePath,
            directory: targetDir,
            type: options.type || 'content',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Create directory structure for session
     */
    async createDirectoryStructure() {
        const dirs = [
            this.currentSession.directory,
            this.currentSession.contentDir,
            this.currentSession.logsDir,
            this.currentSession.sourceDir
        ];

        for (const dir of dirs) {
            await this.ensureDirectoryExists(dir);
        }
    }

    /**
     * Ensure directory exists
     * @param {string} dirPath - Directory path
     */
    async ensureDirectoryExists(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    /**
     * Check if file exists
     * @param {string} filePath - File path
     * @returns {Promise<boolean>} File exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Backup existing file
     * @param {string} filePath - File to backup
     */
    async backupFile(filePath) {
        const backupPath = filePath + '.backup.' + this.generateTimestamp();
        await fs.copyFile(filePath, backupPath);
        
        this.backupFiles.push({
            original: filePath,
            backup: backupPath,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Validate file content
     * @param {string} content - Content to validate
     * @param {Object} fileInfo - File information
     */
    validateContent(content, fileInfo) {
        // Basic validation
        if (!content || content.trim().length === 0) {
            throw new Error(`Empty content for file: ${fileInfo.filename}`);
        }

        // Validate markdown if it's a markdown file
        if (fileInfo.filename.endsWith('.md')) {
            this.validateMarkdown(content, fileInfo);
        }

        // Update file info with size
        fileInfo.size = Buffer.byteLength(content, this.config.encoding);
    }

    /**
     * Validate markdown content
     * @param {string} content - Markdown content
     * @param {Object} fileInfo - File information
     */
    validateMarkdown(content, fileInfo) {
        // Check for basic markdown structure
        if (!content.includes('#')) {
            console.warn(`Warning: No headers found in markdown file: ${fileInfo.filename}`);
        }

        // Check for YAML front matter if expected
        if (fileInfo.type === 'content' && !content.startsWith('---')) {
            console.warn(`Warning: No YAML front matter in: ${fileInfo.filename}`);
        }
    }

    /**
     * Build index content
     * @param {Object} options - Index options
     * @returns {string} Index content
     */
    buildIndexContent(options) {
        const session = this.currentSession;
        let content = `# Generated Documentation Index\n\n`;
        content += `**Session ID:** ${session.id}\n`;
        content += `**Generated:** ${new Date().toISOString()}\n`;
        content += `**Total Files:** ${this.writtenFiles.length}\n\n`;

        if (this.writtenFiles.length > 0) {
            content += `## Generated Files\n\n`;
            
            // Group files by type
            const filesByType = this.writtenFiles.reduce((groups, file) => {
                const type = file.type || 'content';
                if (!groups[type]) groups[type] = [];
                groups[type].push(file);
                return groups;
            }, {});

            Object.entries(filesByType).forEach(([type, files]) => {
                content += `### ${type.charAt(0).toUpperCase() + type.slice(1)} Files\n\n`;
                files.forEach(file => {
                    content += `- [${file.filename}](${file.relativePath})\n`;
                });
                content += '\n';
            });
        }

        return content;
    }

    /**
     * Generate timestamp string
     * @returns {string} Timestamp
     */
    generateTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19) + 'Z';
    }

    /**
     * Check if directory name is a timestamp
     * @param {string} dirName - Directory name
     * @returns {boolean} Is timestamp directory
     */
    isTimestampDir(dirName) {
        return /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/.test(dirName);
    }

    /**
     * Parse timestamp from directory name
     * @param {string} dirName - Directory name
     * @returns {Date} Parsed date
     */
    parseTimestamp(dirName) {
        const match = dirName.match(/^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
        if (match) {
            const isoString = match[1].replace('_', 'T').replace(/-/g, ':').substring(0, 19) + 'Z';
            return new Date(isoString);
        }
        return new Date(0);
    }

    /**
     * Delete directory recursively
     * @param {string} dirPath - Directory to delete
     */
    async deleteDirectory(dirPath) {
        await fs.rm(dirPath, { recursive: true, force: true });
    }

    /**
     * Get output configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update output configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

module.exports = OutputFileManager;
