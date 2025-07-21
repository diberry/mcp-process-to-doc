#!/bin/bash

# Get the current timestamp
TIMESTAMP=$(cat ./generated/current.log)
echo "Using timestamp directory: $TIMESTAMP"

# Define directories
SOURCE_DIR="./generated/$TIMESTAMP/source-of-truth"
CONTENT_DIR="./generated/$TIMESTAMP/content"
LOGS_DIR="./generated/$TIMESTAMP/logs"

echo "Extracting detailed command information from azmcp-commands.md..."

# Extract sections with command examples
grep -A 1 -B 0 "^```bash" "$SOURCE_DIR/azmcp-commands.md" | grep -v "```bash" | grep "^#" | sed 's/^# //' > "$LOGS_DIR/command-sections.txt"

# Extract command blocks and their descriptions
csplit -s -z "$SOURCE_DIR/azmcp-commands.md" '/^### Azure/' '{*}'
for f in xx*; do
  if grep -q "^```bash" "$f"; then
    title=$(grep "^### Azure" "$f" | head -1 | sed 's/^### //')
    echo "== $title ==" > "$LOGS_DIR/section-$f.txt"
    grep -A 1 "^```bash" "$f" | grep -v "```bash" | grep "^azmcp" >> "$LOGS_DIR/section-$f.txt"
  fi
  rm "$f"
done

# Combine all sections
cat "$LOGS_DIR/section-xx"* > "$LOGS_DIR/all-commands-with-sections.txt"

# Extract detailed command information
grep -n "^### " "$SOURCE_DIR/azmcp-commands.md" | while read -r line; do
    line_num=$(echo "$line" | cut -d':' -f1)
    section=$(echo "$line" | cut -d':' -f2- | sed 's/^### //')
    
    # Get next 20 lines to capture commands
    next_section_line=$((line_num + 1))
    section_content=$(tail -n +$next_section_line "$SOURCE_DIR/azmcp-commands.md" | head -n 20)
    
    # Look for command lines
    echo "$section_content" | grep "^azmcp" | while read -r cmd; do
        echo "$section | $cmd" >> "$LOGS_DIR/commands-with-sections.txt"
    done
done

echo "Extraction complete. Detailed command information available in $LOGS_DIR/"
