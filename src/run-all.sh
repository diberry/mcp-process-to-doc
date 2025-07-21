#!/bin/bash

# Master script to run the entire documentation generation process

# Show commands being executed
set -x

# Exit on error
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to log messages
log() {
  echo -e "${GREEN}$(date -u +"%Y-%m-%dT%H:%M:%SZ") - $1${NC}"
}

error() {
  echo -e "${RED}$(date -u +"%Y-%m-%dT%H:%M:%SZ") - ERROR: $1${NC}"
  exit 1
}

warning() {
  echo -e "${YELLOW}$(date -u +"%Y-%m-%dT%H:%M:%SZ") - WARNING: $1${NC}"
}

# Check if a timestamp was provided
if [ -n "$1" ]; then
  log "Using provided timestamp: $1"
  npm start -- --use-existing "$1"
else
  log "Starting with a new timestamp"
  npm start
fi

# Make sure the process exited cleanly
if [ $? -ne 0 ]; then
  error "Initial setup failed"
fi

# Get the current timestamp from current.log
TIMESTAMP=$(cat ./generated/current.log)
TIMESTAMP_DIR="./generated/$TIMESTAMP"
log "Working with timestamp: $TIMESTAMP"

# Create the directory structure if it doesn't exist
mkdir -p "$TIMESTAMP_DIR/content"
mkdir -p "$TIMESTAMP_DIR/logs"
mkdir -p "$TIMESTAMP_DIR/source-of-truth"

# Generate the tools.json file
log "Generating tools.json"
npm run generate-tools
if [ $? -ne 0 ]; then
  error "Failed to generate tools.json"
fi

# Test the generated tools.json file
log "Testing tools.json"
npm run test
if [ $? -ne 0 ]; then
  error "tools.json validation failed"
fi

# Generate the new.md file
log "Generating new.md"
npm run create-new-md
if [ $? -ne 0 ]; then
  error "Failed to generate new.md"
fi

# Generate documentation files for all new tools and operations
log "Generating documentation files"
node src/generate-all-docs.js
if [ $? -ne 0 ]; then
  error "Failed to generate documentation files"
fi

# Update navigation files
log "Updating navigation files"
log "Updating TOC.yml"
node src/update-toc.js || warning "Failed to update TOC.yml"

log "Updating index.yml"
node src/update-index.js || warning "Failed to update index.yml"

log "Updating supported-azure-services.md"
node src/update-supported-services.js || warning "Failed to update supported-azure-services.md"

# Even if some navigation files fail to update, consider this step a success
# as we can manually fix the navigation files later

# Generate a final report
log "Generating final report"

cat > "${TIMESTAMP_DIR}/content/progress-report.md" << EOL
# Documentation Generation Report

## Generation Details
- Timestamp: ${TIMESTAMP}
- Generation Date: $(date -u +"%Y-%m-%d")
- Generation Time: $(date -u +"%H:%M:%S UTC")

## Summary
- New tools identified: $(wc -l < "${TIMESTAMP_DIR}/logs/new-tools.txt" || echo "unknown")
- New operations identified: $(wc -l < "${TIMESTAMP_DIR}/logs/new-operations.txt" || echo "unknown")
- Documentation files generated: $(find "${TIMESTAMP_DIR}/content" -name "*.md" | wc -l)

## Generated Files
$(find "${TIMESTAMP_DIR}/content" -name "*.md" -printf "- %f\n" | sort)

## Next Steps
1. Review the generated documentation files
2. Check for any warnings or errors in the logs
3. Manually fix any issues with navigation files if necessary
4. Verify the content is correct and complete
5. Submit the documentation for editorial review
EOL

log "Final report generated at: ${TIMESTAMP_DIR}/content/progress-report.md"

# Final message
log "Documentation generation process completed successfully"
log "Output files are available in: ./generated/$TIMESTAMP/content"
log "Log files are available in: ./generated/$TIMESTAMP/logs"
