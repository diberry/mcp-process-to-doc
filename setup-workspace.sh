#!/bin/bash

# Generate timestamp in the format YYYY-MM-DD_HH-MM-SS
TIMESTAMP=$(date -u +"%Y-%m-%d_%H-%M-%S")
echo "Using timestamp: $TIMESTAMP"

# Update current.log with the timestamp
echo "$TIMESTAMP" > ./generated/current.log
echo "Updated current.log with timestamp: $TIMESTAMP"

# Create necessary directories
mkdir -p "./generated/$TIMESTAMP/content" 
mkdir -p "./generated/$TIMESTAMP/source-of-truth" 
mkdir -p "./generated/$TIMESTAMP/logs"
echo "Created directory structure under ./generated/$TIMESTAMP/"

# Download azmcp-commands.md from the engineering repository
echo "Downloading azmcp-commands.md..."
wget -q -O "./generated/$TIMESTAMP/source-of-truth/azmcp-commands.md" https://raw.githubusercontent.com/Azure/azure-mcp/main/docs/azmcp-commands.md
if [ $? -eq 0 ]; then
    echo "Successfully downloaded azmcp-commands.md"
else
    echo "Failed to download azmcp-commands.md"
    exit 1
fi

# Download tools.json from the content repository
echo "Downloading tools.json..."
wget -q -O "./generated/$TIMESTAMP/source-of-truth/tools.json" https://raw.githubusercontent.com/MicrosoftDocs/azure-dev-docs/main/articles/azure-mcp-server/tools/tools.json
if [ $? -eq 0 ]; then
    echo "Successfully downloaded tools.json"
else
    echo "Failed to download tools.json"
    exit 1
fi

echo "Setup complete! The workspace is ready at ./generated/$TIMESTAMP/"
echo "Now you can proceed with creating the updated tools.json file in ./generated/$TIMESTAMP/content/"
