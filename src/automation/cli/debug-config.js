#!/usr/bin/env node

/**
 * Debug script to compare prompt parsing vs current config
 */

const PromptParser = require('../../config/prompt-parser');

async function debug() {
    try {
        const parser = new PromptParser();
        
        console.log('🔍 Parsing prompt file...');
        const parsedConfig = await parser.parsePrompt();
        
        console.log('\n📋 Sources from prompt:');
        console.log(JSON.stringify(parsedConfig.sources, null, 2));
        
        console.log('\n📋 Content rules from prompt:');
        console.log(JSON.stringify(parsedConfig.contentRules, null, 2));
        
        console.log('\n🔍 Validating integrity...');
        const integrity = await parser.validatePromptIntegrity();
        
        console.log('\n📊 Integrity check:');
        console.log(`Valid: ${integrity.isValid}`);
        console.log(`Discrepancies: ${integrity.discrepancies.length}`);
        
        if (integrity.discrepancies.length > 0) {
            console.log('\n❌ Discrepancies found:');
            integrity.discrepancies.forEach(d => console.log(`  - ${d}`));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debug();
