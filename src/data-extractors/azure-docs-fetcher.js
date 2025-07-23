/**
 * Azure Documentation Fetcher
 * 
 * Fetches Azure service documentation and branding information
 * to enrich generated documentation with accurate service descriptions,
 * official terminology, and proper Azure branding.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class AzureDocsFetcher {
    constructor() {
        this.cache = new Map();
        this.serviceMetadata = this.initializeServiceMetadata();
        this.azureDocsBaseUrl = 'https://docs.microsoft.com/en-us/azure';
    }

    /**
     * Fetch Azure service documentation and branding
     * @param {string} serviceName - Name of the Azure service
     * @returns {Object} Service documentation and branding information
     */
    async fetchServiceInfo(serviceName) {
        const normalizedService = this.normalizeServiceName(serviceName);
        
        // Check cache first
        if (this.cache.has(normalizedService)) {
            return this.cache.get(normalizedService);
        }

        try {
            const serviceInfo = await this.getServiceInfo(normalizedService);
            this.cache.set(normalizedService, serviceInfo);
            return serviceInfo;
        } catch (error) {
            console.warn(`Failed to fetch info for ${serviceName}:`, error.message);
            return this.getDefaultServiceInfo(normalizedService);
        }
    }

    /**
     * Get service information from various sources
     */
    async getServiceInfo(serviceName) {
        const metadata = this.serviceMetadata[serviceName] || {};
        
        return {
            serviceName: metadata.displayName || this.formatServiceName(serviceName),
            description: metadata.description || await this.fetchServiceDescription(serviceName),
            documentationUrl: metadata.documentationUrl || this.buildDocumentationUrl(serviceName),
            keywords: metadata.keywords || this.generateDefaultKeywords(serviceName),
            category: metadata.category || 'Azure Service',
            branding: this.getServiceBranding(serviceName),
            relatedServices: metadata.relatedServices || [],
            commonUseCases: metadata.commonUseCases || []
        };
    }

    /**
     * Fetch service description from Azure documentation
     */
    async fetchServiceDescription(serviceName) {
        try {
            const url = this.buildDocumentationUrl(serviceName);
            const content = await this.fetchWebContent(url);
            return this.extractServiceDescription(content);
        } catch (error) {
            return this.getDefaultDescription(serviceName);
        }
    }

    /**
     * Extract service description from documentation content
     */
    extractServiceDescription(content) {
        // Simple extraction - in production, this would be more sophisticated
        const patterns = [
            /<meta name="description" content="([^"]+)"/i,
            /<p[^>]*>([^<]{100,300})<\/p>/i,
            /overview[^.]*\.([^.]{50,200}\.)/i
        ];

        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                return this.cleanDescription(match[1]);
            }
        }

        return null;
    }

    /**
     * Fetch web content with error handling
     */
    async fetchWebContent(url) {
        return new Promise((resolve, reject) => {
            const request = https.get(url, { timeout: 5000 }, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${response.statusCode}`));
                    }
                });
            });

            request.on('timeout', () => {
                request.abort();
                reject(new Error('Request timeout'));
            });

            request.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Get Azure service branding information
     */
    getServiceBranding(serviceName) {
        const brandingMap = {
            'storage': {
                icon: '🗄️',
                color: '#0078d4',
                category: 'Storage'
            },
            'cosmos': {
                icon: '🌐',
                color: '#0078d4',
                category: 'Database'
            },
            'monitor': {
                icon: '📊',
                color: '#0078d4',
                category: 'Management'
            },
            'keyvault': {
                icon: '🔐',
                color: '#0078d4',
                category: 'Security'
            },
            'aks': {
                icon: '☸️',
                color: '#0078d4',
                category: 'Compute'
            }
        };

        const key = this.getBrandingKey(serviceName);
        return brandingMap[key] || {
            icon: '🔷',
            color: '#0078d4',
            category: 'Azure Service'
        };
    }

    /**
     * Initialize service metadata
     */
    initializeServiceMetadata() {
        return {
            'storage': {
                displayName: 'Azure Storage',
                description: 'Cloud storage solution for modern data storage scenarios including object, file, queue, and table storage.',
                documentationUrl: 'https://docs.microsoft.com/en-us/azure/storage/',
                keywords: ['storage', 'blob', 'file', 'queue', 'table', 'data lake'],
                category: 'Storage',
                relatedServices: ['Azure Data Lake', 'Azure Files', 'Azure Backup'],
                commonUseCases: ['Web applications', 'Content distribution', 'Backup and restore', 'Data archiving']
            },
            'cosmos': {
                displayName: 'Azure Cosmos DB',
                description: 'Globally distributed, multi-model database service for building highly available applications.',
                documentationUrl: 'https://docs.microsoft.com/en-us/azure/cosmos-db/',
                keywords: ['database', 'nosql', 'global distribution', 'multi-model'],
                category: 'Database',
                relatedServices: ['Azure SQL Database', 'Azure Database for PostgreSQL'],
                commonUseCases: ['Global applications', 'IoT applications', 'Real-time analytics', 'Content management']
            },
            'monitor': {
                displayName: 'Azure Monitor',
                description: 'Comprehensive monitoring solution for collecting, analyzing, and responding to telemetry from cloud and on-premises environments.',
                documentationUrl: 'https://docs.microsoft.com/en-us/azure/azure-monitor/',
                keywords: ['monitoring', 'metrics', 'logs', 'alerts', 'telemetry'],
                category: 'Management and Governance',
                relatedServices: ['Application Insights', 'Log Analytics', 'Azure Alerts'],
                commonUseCases: ['Application monitoring', 'Infrastructure monitoring', 'Performance optimization', 'Troubleshooting']
            },
            'keyvault': {
                displayName: 'Azure Key Vault',
                description: 'Cloud service for securely storing and accessing secrets, keys, and certificates.',
                documentationUrl: 'https://docs.microsoft.com/en-us/azure/key-vault/',
                keywords: ['security', 'secrets', 'keys', 'certificates', 'encryption'],
                category: 'Security',
                relatedServices: ['Azure Active Directory', 'Azure Security Center'],
                commonUseCases: ['Secret management', 'Key management', 'Certificate management', 'Encryption']
            },
            'aks': {
                displayName: 'Azure Kubernetes Service',
                description: 'Managed Kubernetes service for deploying and managing containerized applications.',
                documentationUrl: 'https://docs.microsoft.com/en-us/azure/aks/',
                keywords: ['kubernetes', 'containers', 'orchestration', 'microservices'],
                category: 'Compute',
                relatedServices: ['Azure Container Registry', 'Azure Service Fabric'],
                commonUseCases: ['Microservices', 'Container orchestration', 'DevOps', 'Application modernization']
            }
        };
    }

    /**
     * Helper methods
     */
    normalizeServiceName(serviceName) {
        return serviceName.toLowerCase()
            .replace(/azure\s+/g, '')
            .replace(/\s+/g, '')
            .replace(/-/g, '')
            .replace(/mcp/g, '')
            .replace(/server/g, '');
    }

    formatServiceName(serviceName) {
        const words = serviceName.split(/[-_\s]+/);
        return words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    buildDocumentationUrl(serviceName) {
        const serviceMap = {
            'storage': 'storage',
            'cosmos': 'cosmos-db',
            'monitor': 'azure-monitor',
            'keyvault': 'key-vault',
            'aks': 'aks'
        };

        const urlPath = serviceMap[serviceName] || serviceName;
        return `${this.azureDocsBaseUrl}/${urlPath}/`;
    }

    generateDefaultKeywords(serviceName) {
        const baseKeywords = ['azure', 'mcp', 'server'];
        const serviceKeywords = serviceName.split(/[-_\s]+/);
        return [...baseKeywords, ...serviceKeywords];
    }

    getBrandingKey(serviceName) {
        const keyMap = {
            'storage': 'storage',
            'cosmosdb': 'cosmos',
            'cosmos': 'cosmos',
            'monitor': 'monitor',
            'keyvault': 'keyvault',
            'kubernetes': 'aks',
            'aks': 'aks'
        };

        const normalized = this.normalizeServiceName(serviceName);
        return Object.keys(keyMap).find(key => normalized.includes(key)) || 'default';
    }

    cleanDescription(description) {
        return description
            .replace(/\s+/g, ' ')
            .replace(/[""]/g, '"')
            .trim();
    }

    getDefaultDescription(serviceName) {
        return `Azure ${this.formatServiceName(serviceName)} service for managing cloud resources through the Azure MCP Server.`;
    }

    getDefaultServiceInfo(serviceName) {
        return {
            serviceName: this.formatServiceName(serviceName),
            description: this.getDefaultDescription(serviceName),
            documentationUrl: this.buildDocumentationUrl(serviceName),
            keywords: this.generateDefaultKeywords(serviceName),
            category: 'Azure Service',
            branding: this.getServiceBranding(serviceName),
            relatedServices: [],
            commonUseCases: ['Resource management', 'Azure operations', 'Cloud automation']
        };
    }

    /**
     * Batch fetch multiple services
     */
    async fetchMultipleServices(serviceNames) {
        const results = {};
        
        await Promise.all(
            serviceNames.map(async (serviceName) => {
                try {
                    results[serviceName] = await this.fetchServiceInfo(serviceName);
                } catch (error) {
                    console.warn(`Failed to fetch ${serviceName}:`, error.message);
                    results[serviceName] = this.getDefaultServiceInfo(serviceName);
                }
            })
        );

        return results;
    }

    /**
     * Save cached information to file
     */
    async saveCacheToFile(filePath) {
        const cacheData = Object.fromEntries(this.cache);
        fs.writeFileSync(filePath, JSON.stringify(cacheData, null, 2));
    }

    /**
     * Load cached information from file
     */
    async loadCacheFromFile(filePath) {
        if (fs.existsSync(filePath)) {
            const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            this.cache = new Map(Object.entries(cacheData));
        }
    }
}

module.exports = AzureDocsFetcher;
