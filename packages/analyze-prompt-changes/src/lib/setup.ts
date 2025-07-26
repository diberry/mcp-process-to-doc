import { promises as fs } from 'node:fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface SystemFile {
    path: string;
    access: 'read' | 'write';
}

export const timeStamp = new Date().toISOString();

export const systemFiles: Record<string, SystemFile> = {
    'prompt': {
        path: path.join(__dirname, '../../../../create-docs.prompt.md'),
        access: 'read'
    },
    'current':{
        path: path.join(__dirname, '../../../../generated/current.log'),
        access: 'write'
    },
    'workflow-config.json': {
        path: path.join(__dirname, `../../../../generated/${timeStamp}/workflow/workflow-config.json`),
        access: 'write'
    },
    'prompt.json': {
        path: path.join(__dirname, `../../../../generated/${timeStamp}/prompt/prompt.json`),
        access: 'write'
    },
    'change-history.json': {
        path: path.join(__dirname, `../../../../generated/${timeStamp}/logs/change-history.json`),
        access: 'write'
    },
    'change-report': {
        path: path.join(__dirname, `../../../../generated/${timeStamp}/reports/analyze-prompt-changes.md`),
        access: 'write'
    }
};

export async function ensurePathsExist(): Promise<void> {

    // if prompt doens't exist - completely fail
    if (!systemFiles['prompt'].path || !(await fs.stat(systemFiles['prompt'].path).catch(() => false))) {
        console.error('Prompt file does not exist. Please ensure the prompt file is correctly set up.');
        process.exit(1);
    }


    for (const key in systemFiles) {
        const filePath = systemFiles[key].path;
        const dirPath = path.dirname(filePath);

        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error(`Failed to create directory for ${key}:`, error);
        }
    }

    // if current doesn't exist, create it and set the value to the timestamp
    const currentFilePath = systemFiles['current'].path;
    try {
        if (!(await fs.stat(currentFilePath).catch(() => false))) {
            await fs.writeFile(currentFilePath, `${timeStamp}`);
        }
    } catch (error) {
        console.error(`Failed to initialize current file:`, error);
    }
}
