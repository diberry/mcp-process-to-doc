import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

/**
 * DirectoryManager handles directory creation and validation operations.
 */
export class DirectoryManager {
  /**
   * Create a directory at the specified path.
   * Creates parent directories if they don't exist.
   * @param dirPath - The path where the directory should be created
   */
  createDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Validate the directory structure using the configuration and schema.
   * @param configPath - Path to the configuration file
   * @param schemaPath - Path to the schema file
   * @returns true if the configuration is valid according to the schema
   * @throws Error if validation fails or files cannot be read
   */
  validateDirectoryStructure(configPath: string, schemaPath: string): boolean {
    try {
      // Read configuration and schema files
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      
      const config = JSON.parse(configContent);
      const schema = JSON.parse(schemaContent);
      
      // Validate configuration against schema
      const ajv = new Ajv.default();
      const validate = ajv.compile(schema);
      const valid = validate(config);
      
      if (!valid && validate.errors) {
        throw new Error(`Configuration validation failed: ${JSON.stringify(validate.errors, null, 2)}`);
      }
      
      return valid;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Directory structure validation failed: ${error.message}`);
      }
      throw new Error('Directory structure validation failed: Unknown error');
    }
  }

  /**
   * Create the directory structure based on a configuration object.
   * @param basePath - The base path where directories should be created
   * @param config - The configuration object defining the directory structure
   */
  private createDirectoryStructure(basePath: string, config: any): void {
    if (config.children) {
      Object.keys(config.children).forEach(childName => {
        const childPath = path.join(basePath, childName);
        this.createDirectory(childPath);
        
        // Recursively create subdirectories
        this.createDirectoryStructure(childPath, config.children[childName]);
      });
    }
  }

  /**
   * Create directories based on configuration.
   * @param rootPath - The root path where directories should be created
   * @param configPath - Path to the configuration file
   */
  createDirectoriesFromConfig(rootPath: string, configPath: string): void {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    this.createDirectoryStructure(rootPath, config);
  }
}