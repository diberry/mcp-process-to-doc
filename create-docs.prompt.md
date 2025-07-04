# Copilot instructions

You are a senior content developer. Complete these instructions. Verify the final result and flag any issues in the `azmcp.log` file you create in this repo. Avoid making assumptions. If you need additional context to accurately answer the user, ask the user for the missing information. Be specific about which context you need.

## Read original sources

1. Read the azmcp-commands.md at this [URL](https://github.com/Azure/azure-mcp/blob/main/docs/azmcp-commands.md) and find all entries which don't have a corresponding JSON services or tools in tools.json at this [URL](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/tools/tools.json). Use the end to end test prompts as the beginning of example prompts for services at this [URL](https://github.com/Azure/azure-mcp/blob/main/e2eTests/e2eTestPrompts.md).

## Update local tools.json

1. Copy over the tools.json to this project's root and create those entries in the local tools.json file.
2. Find each new tools primary documentation page on Microsoft Learn, if it exists, and add the  documentation URL to the new entry in the tools.json file. If it doesn't exist, leave the documentation URL blank. Use this documentation to understand branding and terminology specific to this tool that should be used in the documentation file for the mcp server you generate. Neither the azmcp-commands.md or the tools.json has the branding information required to create the new documentation files. Use the branding information from the existing documentation files in this workspace to create the new documentation files. Use the Azure Learn knowledge service tool to get that important branding information.

## Create local documentation

1. Take the new entries in the local tools.json to create a new file documentation file for each new server in the tools.json. Plac those files in a timestamped directory. Follow the format of the azure-app-confguration.md at this [URL](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/tools/app-configuration.md) to create each new server's doc file. Notice any relative or absolute links in the app-configuration.md file that you should mimic in the new files. 

### Additional regulations for documentation generation

1. For any new tools in existing servers, create the markdown files with just the new information in the correct mcp server format using the app configuration as an example - so I can copy/paste it into the existing document which isn't in this workspace. Name the file with a postfix of `-partial` so I know it isn't the whole file.
2. If a tool is specific to a 3rd party but the server is Azure Native ISV, use the 3rd party tool branding only in that tool's section. Datadog is an example of this. The server name should be azure-native-isv and the tool name should be the 3rd party name, like `datadog` in this case.
3. If a tool has subcategories as identified as an H4 name in the azmcp-commands.md file, like Azure Monitor Operations as the H3, then Log Analytics as the H4, then use subcategory as the tool name, like `Subcategory: Toolname` such as `Log Analytics: list workspaces`.
4. If the tool has examples for parameters denoted with `# Examples:`, create prompts that are similar to the examples in the azmcp-commands.md file so the reader understands how to use the parameters. Make sure the final examples in the new files use natural language for the example values instead of syntactic or semantical provided examples. Use the same format as the app-configuration.md file for the prompts.
5. Make sure any H2s for tools with example prompts include an HTML comment which is the exact text from azmcp-commands.md file that correspond to that H2. Make sure all H2s or H3s are sentence case. 
6. Ensure all links to Learn documentation is relative and not absolute. For example, use `../get-started.md` instead of `https://learn.microsoft.com/en-us/azure/mcp-server/get-started.md`. Any URLs which aren't in `/azure/developer` need a non-relative and non-absolutepath such as `/azure/...`. It also must not include the language code like `en-us` in the URL. It should be relative to the current file. Test the links to ensure they work correctly.
7. Make sure the markdown bullets use `-` (dash). 
8. You don't need to add ms.custom for build 2025 as that is a past event. It is not needed for the new files.

## Navigation updates

1. Update ALL navigation and landing page files to include the new services. Provide the complete updated versions of the following files with the new servers/tools added following the existing format and alphabetical ordering:
    * [Main landing page](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/index.yml) - Add to tools reference section. The landing page has a list of the first 5 tools in alpha order than a link to the rest. Don't have more than 4 individual tools listed in the landing page.
    * [MCP tools TOC](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/TOC.yml) - Add navigation entries
    * [MCP available server tools include](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/includes/tools/supported-azure-services.md) - Add service descriptions

## Editorial review

Review any new markdown files using [Editorial instructions](editorial-review.md).

## Backup policy
1. tools.json.bak is a backup file which may include existing PRs of content which haven't been merged yet. Do not edit it. It is used to restore the tools.json if needed.
