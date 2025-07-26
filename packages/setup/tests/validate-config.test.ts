import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

const ajv = new Ajv();

// Load the schema
const schemaPath = path.resolve(__dirname, '../config/setup-schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

// Load the configuration file
const configPath = path.resolve(__dirname, '../config/setup.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

describe('Setup Config Validation', () => {
  it('should validate setup.config.json against setup-schema.json', () => {
    const validate = ajv.compile(schema);
    const valid = validate(config);

    console.error('Validation errors:', validate);
    console.error('Valide:', valid);
    

    expect(valid).toBe(true);
  });
});
