# Prompt Change Detection

A system for converting, analyzing, and tracking changes in Markdown prompt files for MCP documentation generation.

## Overview

This package provides tools to convert Markdown prompt files to JSON, analyze changes, and update code based on prompt modifications. It uses robust parsing with npm packages like markdown-it and gray-matter, combined with TypeScript interfaces for strong typing.

## Features

- **Markdown to JSON Conversion**: Convert structured Markdown files to JSON with frontmatter support
- **Change Detection**: Analyze differences between prompt versions
- **Validation**: Ensure prompts meet structural requirements
- **Integration**: Apply prompt changes to code elements

## Installation

```bash
npm install @mcp-process-to-doc/prompt-change-detection
```

## Usage

### Convert a Markdown Prompt to JSON

```bash
npx convert-prompt path/to/prompt.md --output path/to/output.json --validate
```

Options:
- `--output <path>`: Specify output JSON file path (default: same name as input with .json extension)
- `--validate`: Validate the converted JSON against schema requirements
- `--compare <path>`: Compare with another JSON file to detect changes

### Analyze Prompt Changes

```bash
npx analyze-prompt-changes path/to/prompt.json path/to/previous-prompt.json
```

### Apply Prompt Updates

```bash
npx apply-prompt-updates path/to/changes.json
```

### Validate Integration

```bash
npx validate-integration path/to/prompt.json
```

## Development

The package uses TypeScript for core functionality with JavaScript CLI wrappers.

Core files:
- `src/automation/markdown-to-json-converter.ts`: Main TypeScript converter with interfaces
- `src/cli/markdown-converter-cli.js`: Consolidated CLI for markdown conversion

## Scripts

- `npm run convert`: Run the markdown converter
- `npm run analyze`: Analyze prompt changes
- `npm run apply`: Apply prompt updates
- `npm run validate`: Validate prompt integration
- `npm run sync`: Run analysis and apply changes
- `npm run start`: Full workflow (convert, sync, validate)
