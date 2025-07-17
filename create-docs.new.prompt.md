# Copilot instructions

You are a senior content developer. Complete these instructions. Verify the final result and flag any issues in the `azmcp.log` file you create in this repo. Avoid making assumptions. If you need additional context to accurately answer the user, ask the user for the missing information. Be specific about which context you need.

## Goal

Discover new tools and operations in the engineering repository then go through the process of creating documentation for those tools in the MCP server documentation. The final result is a set of new documentation files that are ready for editorial review and publishing.

- [Engineering repository](https://github.com/Azure/azure-mcp)
- [Live published documentation](https://learn.microsoft.com/en-us/azure/mcp-server/tools/)
- [Live published documentation repository](https://github.com/MicrosoftDocs/azure-dev-docs)

Use this repo as a scratchpad to create the new documentation files. The final result is a set of new documentation files that are ready for editorial review and publishing.

## Read original sources and create intermediary files

Goal: 
- Read source files to understand what is provided by the engineering team and what is provided by the content team.
- Create intermediary file new.md to track new tools and operations that need documentation.
- Update the tools.json file with new tools and operations in a way that is ready for automation to generate documentation files.

Steps:
1. Copy the azmcp-commands.md at this [URL](https://github.com/Azure/azure-mcp/blob/main/docs/azmcp-commands.md) to this repo. This is a list of all known tools by the engineering team. 
1. [URL](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/tools/tools.json) is a list of all known tools by the content team.
1. Compare the two files to find new tools or new tool commands. Create a list of the new tools and commands in `./new.md` using the format specified in `new.md.template`. 
1. Create `./new.md`, organize tools into two clear sections:
   - **Completely New Tool Categories**: For tools that do not exist at all in the current tools.json, mark them as (NEW TOOL CATEGORY).
   - **New Operations for Existing Tool Categories**: For new operations added to tools that already exist in tools.json, mark them as (NEW OPERATIONS).
   This distinction is important for determining whether to create entirely new documentation files or just update existing ones.
1. Copy over the tools.json to this project's root and merge all tools from the remote tools.json file with any new tools identified during processing. Ensure no duplicates exist.
1. Find each new tool's primary documentation page on Microsoft Learn, if it exists, and add the documentation URL to the new entry in the tools.json file. If it doesn't exist, leave the documentation URL blank. Use this documentation to understand branding and terminology specific to this tool that should be used in the documentation file for the MCP server you generate. Neither the azmcp-commands.md nor the tools.json has the branding information required to create the new documentation files. Use the branding information from the existing documentation files in this workspace to create the new documentation files. Use the Azure Learn knowledge service tool to get that important branding information.
