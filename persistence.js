"use strict";
/**
 * Alternative persistence approach using a persistent workspace directory
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistentWorkspaceDir = void 0;
exports.initializePersistentWorkspace = initializePersistentWorkspace;
exports.getPersistentFilePath = getPersistentFilePath;
exports.persistentFileExists = persistentFileExists;
exports.saveToPersistentWorkspace = saveToPersistentWorkspace;
exports.loadFromPersistentWorkspace = loadFromPersistentWorkspace;
exports.listPersistentFiles = listPersistentFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("node:path"));
// Create a persistent workspace directory that doesn't change between runs
const persistentWorkspaceDir = path.join(__dirname, "../persistent-workspace");
exports.persistentWorkspaceDir = persistentWorkspaceDir;
/**
 * Ensure persistent workspace exists and initialize it
 */
function initializePersistentWorkspace() {
    if (!fs.existsSync(persistentWorkspaceDir)) {
        fs.mkdirSync(persistentWorkspaceDir, { recursive: true });
        console.log(`Created persistent workspace: ${persistentWorkspaceDir}`);
    }
}
/**
 * Get the path to a persistent file
 * @param {string} fileName - Name of the file
 * @returns {string} Full path to the persistent file
 */
function getPersistentFilePath(fileName) {
    return path.join(persistentWorkspaceDir, fileName);
}
/**
 * Check if a persistent file exists
 * @param {string} fileName - Name of the file to check
 * @returns {boolean} Whether the file exists
 */
function persistentFileExists(fileName) {
    return fs.existsSync(getPersistentFilePath(fileName));
}
/**
 * Save content to persistent workspace
 * @param {string} fileName - Name of the file
 * @param {string} content - Content to save
 */
function saveToPersistentWorkspace(fileName, content) {
    const filePath = getPersistentFilePath(fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Saved to persistent workspace: ${filePath}`);
}
/**
 * Load content from persistent workspace
 * @param {string} fileName - Name of the file to load
 * @returns {string} File content
 */
function loadFromPersistentWorkspace(fileName) {
    const filePath = getPersistentFilePath(fileName);
    return fs.readFileSync(filePath, 'utf8');
}
/**
 * List all files in persistent workspace
 * @returns {string[]} Array of file names
 */
function listPersistentFiles() {
    if (!fs.existsSync(persistentWorkspaceDir)) {
        return [];
    }
    return fs.readdirSync(persistentWorkspaceDir);
}
//# sourceMappingURL=persistence.js.map