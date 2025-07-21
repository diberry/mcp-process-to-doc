#!/bin/bash

# Get the current timestamp
TIMESTAMP=$(cat ./generated/current.log)
echo "Using timestamp directory: $TIMESTAMP"

# Define directories
SOURCE_DIR="./generated/$TIMESTAMP/source-of-truth"
CONTENT_DIR="./generated/$TIMESTAMP/content"
LOGS_DIR="./generated/$TIMESTAMP/logs"

echo "Extracting commands from azmcp-commands.md..."

# Extract actual commands from azmcp-commands.md - focus on lines that start with "azmcp"
grep -o "azmcp [^ ]*" "$SOURCE_DIR/azmcp-commands.md" | sort | uniq > "$LOGS_DIR/azmcp-commands-root.txt"

# Extract full command lines from azmcp-commands.md (commands with their operations)
grep -o "azmcp [^ ]* [^ ]*" "$SOURCE_DIR/azmcp-commands.md" | sort | uniq > "$LOGS_DIR/azmcp-operations.txt"

# Extract more detailed commands with categories (3-part commands)
grep -o "azmcp [^ ]* [^ ]* [^ ]*" "$SOURCE_DIR/azmcp-commands.md" | sort | uniq > "$LOGS_DIR/azmcp-operations-with-category.txt"

# For even more complex commands (4+ parts)
grep -o "azmcp [^ ]* [^ ]* [^ ]* [^ ]*" "$SOURCE_DIR/azmcp-commands.md" | sort | uniq > "$LOGS_DIR/azmcp-complex-operations.txt"

# Extract all full command lines (everything after azmcp until end of line or first flag) for comprehensive reference
grep "azmcp" "$SOURCE_DIR/azmcp-commands.md" | grep -v "server start" | sed 's/^[^a]*//' | sed 's/\s*\-\-.*//' | sort | uniq > "$LOGS_DIR/azmcp-full-commands.txt"

# Extract tool root names from the current tools.json
jq -r 'keys[]' "$SOURCE_DIR/tools.json" > "$LOGS_DIR/tools-json-keys.txt"

# Extract tool root commands from the current tools.json
jq -r 'to_entries[] | "\(.key): \(.value.root)"' "$SOURCE_DIR/tools.json" > "$LOGS_DIR/tools-json-roots.txt"

# Extract operations from the current tools.json
jq -r 'to_entries[] | "\(.key): \(.value.root) - \(.value.tools[].name)"' "$SOURCE_DIR/tools.json" > "$LOGS_DIR/tools-json-operations.txt"

echo "Command extraction complete. Files created in $LOGS_DIR/"
echo "Now you can proceed with creating the tools.json file with new operations marked."
