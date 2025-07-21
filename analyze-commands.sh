#!/bin/bash

# Get the current timestamp
TIMESTAMP=$(cat ./generated/current.log)
echo "Using timestamp directory: $TIMESTAMP"

# Define directories
SOURCE_DIR="./generated/$TIMESTAMP/source-of-truth"
CONTENT_DIR="./generated/$TIMESTAMP/content"
LOGS_DIR="./generated/$TIMESTAMP/logs"

echo "Analyzing commands to identify new tools and operations..."

# Create a mapping file of root commands to their proper names in tools.json
cat "$LOGS_DIR/tools-json-roots.txt" > "$LOGS_DIR/mapping.txt"

# Find root commands in azmcp-commands.md that don't exist in tools.json
echo "==== NEW TOOL ROOTS ====" > "$LOGS_DIR/new-tools.txt"
while read -r cmd; do
  found=0
  while read -r mapped; do
    root_cmd=$(echo "$mapped" | cut -d':' -f2 | xargs)
    if [[ "$cmd" == "$root_cmd" ]]; then
      found=1
      break
    fi
  done < "$LOGS_DIR/tools-json-roots.txt"
  
  if [[ $found -eq 0 ]]; then
    echo "$cmd" >> "$LOGS_DIR/new-tools.txt"
  fi
done < "$LOGS_DIR/azmcp-commands-root.txt"

# Extract operations from azmcp-commands.md
echo "==== NEW OPERATIONS ====" > "$LOGS_DIR/new-operations.txt"

# Combine the operations files for comprehensive analysis
cat "$LOGS_DIR/azmcp-operations.txt" "$LOGS_DIR/azmcp-operations-with-category.txt" "$LOGS_DIR/azmcp-complex-operations.txt" | sort | uniq > "$LOGS_DIR/all-operations.txt"

# Copy the existing tools.json as our starting point
cp "$SOURCE_DIR/tools.json" "$CONTENT_DIR/tools.json"

echo "Analysis complete. New tools and operations identified."
echo "See $LOGS_DIR/new-tools.txt and $LOGS_DIR/new-operations.txt for details."
echo "You now have a base tools.json file at $CONTENT_DIR/tools.json to update with new tools and operations."
