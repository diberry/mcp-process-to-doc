#!/bin/bash

# Define the current timestamp directory
TIMESTAMP=$(cat ./generated/current.log)
SOURCE_DIR="./generated/$TIMESTAMP/source-of-truth"
CONTENT_DIR="./generated/$TIMESTAMP/content"
LOGS_DIR="./generated/$TIMESTAMP/logs"

echo "Generating lists of tools and operations..."

# Extract tool operations from azmcp-commands.md
grep -E '^\s*azmcp [a-z-]+ [a-z-]+ [a-z-]+' "$SOURCE_DIR/azmcp-commands.md" | sort > "$LOGS_DIR/azmcp-commands-list.txt"

# Create a list of tools in the tools.json file
jq -r 'keys[]' "$SOURCE_DIR/tools.json" > "$LOGS_DIR/tools-root-list.txt"

# Create a list of operations per tool in the tools.json file
jq -r 'to_entries[] | "\(.key) - \(.value.root) - \(.value.tools[].name)"' "$SOURCE_DIR/tools.json" > "$LOGS_DIR/tools-operations-list.txt"

echo "Tools and operations extracted to logs directory"
echo "Now you can proceed with creating the updated tools.json file"
