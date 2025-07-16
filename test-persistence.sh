#!/bin/bash

# Test the simplified persistence system
echo "Testing simplified persistence system..."

# Create a test run
TIMESTAMP=$(date -u +"%Y-%m-%d_%H-%M-%S-%3NZ")
echo "Test timestamp: $TIMESTAMP"

# Create directories as the system would
mkdir -p "generated/$TIMESTAMP/agent-notes"
mkdir -p "generated/$TIMESTAMP/content"
mkdir -p "generated/$TIMESTAMP/source-of-truth"

# Simulate agent notes being written
echo "Analysis started at $(date)" > "generated/$TIMESTAMP/agent-notes/analysis-log.txt"
echo "Found 32 new functions" > "generated/$TIMESTAMP/agent-notes/function-analysis.txt"
echo "{ \"currentTimestamp\": \"$TIMESTAMP\", \"agentNotesDir\": \"./generated/$TIMESTAMP/agent-notes\" }" > "generated/$TIMESTAMP/agent-notes/run-state.json"

# Simulate generated content
cat > "generated/$TIMESTAMP/content/new.md" << 'EOF'
# New Azure MCP Functions Analysis

## Summary
- **Total functions in azmcp-commands.md**: 70
- **Existing functions in tools.json**: 38  
- **New functions discovered**: 32

## New Functions List
1. mcp_azure_mcp_ser_azmcp-test-function
2. mcp_azure_mcp_ser_azmcp-another-function
EOF

echo "Created test persistence structure:"
find "generated/$TIMESTAMP" -type f | sort

echo ""
echo "Key simplifications made:"
echo "1. Single timestamp-based directory per run"
echo "2. Agent notes separated in dedicated subdirectory"
echo "3. No complex thread state management"
echo "4. Clear separation of input/output files"
echo "5. Agent explicitly instructed to write to agent-notes"
