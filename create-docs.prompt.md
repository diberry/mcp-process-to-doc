# Copilot instructions

You are a senior content developer. Complete these instructions. Verify the final result and flag any issues in the `azmcp.log` file you create in this repo. Avoid making assumptions. If you need additional context to accurately answer the user, ask the user for the missing information. Be specific about which context you need.

## Goal

Discover new tools and operations in the engineering repository then go through the process of creating documentation for those tools in the MCP server documentation. The final result is a set of new documentation files that are ready for editorial review and publishing.

- [Engineering repository](https://github.com/Azure/azure-mcp)
- [Live published documentation](https://learn.microsoft.com/en-us/azure/mcp-server/tools/)
- [Live published documentation repository](https://github.com/MicrosoftDocs/azure-dev-docs)

Use this repo as a scratchpad to create the new documentation files. The final result is a set of new documentation files that are ready for editorial review and publishing.

## Tools

Use and prioritize the following tools to help you complete this task:

- Use the `fetch_webpage` tool when you need to download files from the internet. 
- Use the `azure_bestpractices_get` tool to get the latest Azure best practices to help with constructing documentation.
- Use the `azure_knowledge_service` tool to get the latest Azure documentation and branding information to help with constructing documentation.

## Scripts

All scripts should be written to a ./src directory in this repo. The scripts should be written in a way that they can be run locally or in the cloud. The scripts should be written in a way that they can be run multiple times without causing issues.

If you need to run a cli command or a series of commands, create a bash script, then execute the script, continue to improve on the script so all your work is repeatable. Use the `run_bash_script` tool to run the script.

If you need a programming language, prefer JavaScript. Use the `run_javascript` tool to run the JavaScript code.

## File generation

1. Create a new directory inside the `./generated` folder with a timestamp in the name, such as `2025-07-17_14-00-00`, to store the new documentation files. Update the `./generated/current.log` file with the name of this new directory. This will be used to track the current `<timestamp>` directory you are working on.
2. Any files you download, create, or edit should be placed in this new directory then worked on.
3. At the end of this process, you should have created files in the following folders under the timestamp folder: 
    - `./generated/<timestamp>/content` - files your create
    - `./generated/<timestamp>/source-of-truth` - original files you downloaded from source, don't edit these files
    - `./generated/<timestamp>/logs` - logs or intermediary files you created during the process
4. Do not change files outside this `./generated` directory. 
5. Create or update the `current.log` file in the `./generated` directory (not a timestamp subdirectory) with the name of the timestamp directory. If you start over, or start from a pause, use this file to track the current timestamp directory you are working on. This is so you can continue where you left off if needed.

At the end of this entire file's process, you should have the following files with their editorial review
- in the `./generated/<timestamp>/content` directory:
    - `tools.json` - the updated tools.json file with the new tools and operations added
    - `new.md`
    - `<tool-name>.md` for each new tool
    - `<tool-name>-partial.md` for each new operation in an existing tool
    - `index.yml` - the main landing page for the MCP server tools updated with the new tools
    - `TOC.yml` - the MCP server tools TOC updated with the new tools
    - `supported-azure-services.md` - the MCP server tools supported Azure services include updated
- in the `./generated/<timestamp>/source-of-truth` directory:
    - `azmcp-commands.md` - the source of truth for the tools and operations provided by the engineering team
    - `tools.json` - the updated tools.json file with the new tools and operations added
- in the `./generated/<timestamp>/logs` directory:
    - `azmcp.log` - a log file that contains any issues or errors encountered during the process - any reasoning, questions, or issues you encountered during the process should be logged here.


## Read original sources and create intermediary files

Goal: 
- Read source files to understand what is provided by the engineering team and what is provided by the content team.
- Create intermediary file `new.md` to track new tools and operations that need documentation.
- Create updated `tools.json` file with new tools and operations in a way that is ready for automation to generate documentation files.

Steps:
1. Copy the `azmcp-commands.md` at this [URL](https://github.com/Azure/azure-mcp/blob/main/docs/azmcp-commands.md) to this repo. This is a list of all known tools by the engineering team. 
1. Read the `azmcp-commands.md` file and remember the contents. This helps to find tools and operations which haven't been documented.

    - Don't assume a consistent markdown format. Prefer to search for the actual command names in the azmcp-commands.md file.
    - a tool starts with `azmcp` (the mcp server name) and is followed by the tool name, such as `azmcp appconfig` for the `appconfig` tool.
    - a tool operation follows the tool name, such as `azmcp appconfig list`. 
    - a tool operation may have a category name such as `azmcp appconfig account list` where `account` is the category name and `list` is the operation name.

1. Copy the `tools.json` into the `./generated/<timestamp>/source-of-truth` directory at [URL](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/tools/tools.json) as source of truth. This is a list of all known tools by the content team.
1. Create a new `tools.json` file in the `./generated/<timestamp>/content` directory. This will be used to track new tools and operations that need documentation.
    - each tool will have its tool command listed under it in the `root` property.
    - each operation will have its operation command as the property `name` tools array for that top level tool. 
    - For example: this is a tool with an operation category then an operation. The tool name is in the `root` property as `appconfig` (the word(s) following `azmcp`). The first operation for the `appconfig` tool in the `account` category and is the  `list` operation. 

    ```json
    {
        "azure-app-configuration": {
            "root": "azmcp appconfig",
            "tools": [
                {
                    "name": "account list",
                    "description": "List App Configuration stores in a subscription.",
                    "params": [
                        {
                            "name": "subscription",
                            "description": "The Azure subscription ID or name",
                            "required": true
                        }
                    ]
                },
        ...
    ```
    - For example: this is a tool without an operation category. The tool name is in the `root` property as `extension`. The only operation for the `extension` tool is `az`.


    ```json
    ...
    "azure-cli-extension": {
        "root": "azmcp extension",
        "tools": [
            {
                "name": "az",
                "description": "Execute an Azure CLI command.",
                "params": [
                    {
                        "name": "command",
                        "description": "The Azure CLI command to execute (without the 'az' prefix)",
                        "required": true
                    }
                ]
            }
        ]
    },
    ...
    ```

    - Use this information to be able to create a list of known tools and operations found in the content team's `tools.json` file. This will be used to determine which tools and operations are new and need documentation.

1. Compare `azmcp-commands.md` file to the `./generated/<timestamp>/content/tools.json` to find new tools or new tool operations. Each new tool or tool operation should mark the `azmcp-commands.md` file with a `status` of `new` indicating it is new.

    - If a tool exists in `azmcp-commands.md` but not in `tools.json`, it is a new tool.
    - If a tool operation exists in `azmcp-commands.md` but not in `tools.json`, it is a new operation for an existing tool.
    - If a tool exists in both files, it is an existing tool with no new operations.

## Create a new.md 

Create a `new.md` file to communicate to engineering what the list of new or updated documentation is.

1. Find all the tools and operations in `./generated/<timestamp>/content/tools.json` that have a `status` of `new`. These are the tools and operations that need documentation.
1. Create a list of the unique tools and operations in `./new.md` using the format specified in `new.md.template`.
1. Create `./new.md`, organize tools into two clear sections:
   - **Completely New Tool Categories**: For tools that do not exist at all in the current tools.json, mark them as (NEW TOOL CATEGORY).
   - **New Operations for Existing Tool Categories**: For new operations added to tools that already exist in tools.json, mark them as (NEW OPERATIONS).
   This distinction is important for determining whether to create entirely new documentation files or just update existing ones.

## Create local documentation

1. Take the new entries in the local tools.json to create a new file documentation file for each new server in the tools.json. Place those files in a timestamped directory. Follow the format of the azure-app-configuration.md at this [URL](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/tools/app-configuration.md) to create each new server's doc file. Notice any relative or absolute links in the app-configuration.md file that you should mimic in the new files.
1. Find each new tool's primary documentation page on Microsoft Learn, if it exists, and add the documentation URL to the new entry in the tools.json file. If it doesn't exist, leave the documentation URL blank. Use this documentation to understand branding and terminology specific to this tool that should be used in the documentation file for the MCP server you generate. Neither the azmcp-commands.md nor the tools.json has the branding information required to create the new documentation files. Use the branding information from the existing documentation files in this workspace to create the new documentation files. Use the Azure Learn knowledge service tool to get that important branding information.
1. For the `azmcp extension` tool, each operation such as `azd` or `azd` should have their own documentation file. Use the existing documentation files in this workspace as a guide for how to create these new documentation files. It should also have its own entry in the TOC and Index files. 

To create example prompts for the new documentation files, follow these steps:

- Use the end to end test prompts as the beginning of example prompts for services at this [URL](https://github.com/Azure/azure-mcp/blob/main/e2eTests/e2eTestPrompts.md).
-  Use any example prompts in [URL](https://github.com/Azure/azure-mcp/blob/main/docs/azmcp-commands.md) to influence the example prompts in the new documentation files you create.
- Use the example prompts in the existing documentation files in this workspace to influence the example prompts in the new documentation files you create.
- When creating the example prompt list in an operation section, each prompt should be a markdown bullet as a dash, then a summary of the prompt purpose, then the prompt itself. The following is a real section of example prompts from the [app-configuration.md](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/tools/app-configuration.md) file:

    ```markdown
    Example prompts include:

    - **Delete a setting**: "Remove the 'AppName:TemporaryConfig' key from my 'myappconfigstore' App Configuration store."
    - **Delete a labeled setting**: "Delete the 'AppName:FeatureFlag' setting with label 'test'"
    - **Remove configuration**: "Delete the old database connection string from my 'contoso-appconfig'"
    - **Clean up settings**: "Delete all test settings with label 'deprecated'"
    - **Purge config**: "Delete the temporary API key 'TempAuth' from app-config-dev"
    ```

Additional regulations for documentation generation: 

1. For any new tools in existing servers, create the markdown files with just the new information in the correct mcp server format using the app configuration as an example - so I can copy/paste it into the existing document which isn't in this workspace. Name the file with a postfix of `-partial` so I know it isn't the whole file.
2. If a tool is specific to a 3rd party but the server is Azure Native ISV, use the 3rd party tool branding only in that tool's section. Datadog is an example of this. The server name should be azure-native-isv and the tool name should be the 3rd party name, like `datadog` in this case.
3. If a tool has subcategories as identified as an H4 name in the azmcp-commands.md file, like Azure Monitor Operations as the H3, then Log Analytics as the H4, then use subcategory as the tool name, like `Subcategory: Toolname` such as `Log Analytics: list workspaces`.
4. If the tool has examples for parameters denoted with `# Examples:`, create prompts that are similar to the examples in the azmcp-commands.md file so the reader understands how to use the parameters. Make sure the final examples in the new files use natural language for the example values instead of syntactic or semantical provided examples. Use the same format as the app-configuration.md file for the prompts.
5. Make sure any H2s for tools with example prompts include an HTML comment which is the exact text from azmcp-commands.md file that correspond to that H2. Make sure all H2s or H3s are sentence case. 
6. Ensure all links to Learn documentation is relative and not absolute. For example, use `../get-started.md` instead of `https://learn.microsoft.com/en-us/azure/mcp-server/get-started.md`. Any URLs which aren't in `/azure/developer` need a non-relative and non-absolutepath such as `/azure/...`. It also must not include the language code like `en-us` in the URL. It should be relative to the current file. Test the links to ensure they work correctly.
7. Make sure the markdown bullets use `-` (dash). 
8. You don't need to add ms.custom for build 2025 as that is a past event. It is not needed for the new files.

## Navigation updates

Goal: Provide updated navigation and landing page files to include the new services. 

In the `./generated/<timestamp>/content` directory, provide the complete updated versions of the following files with the new servers/tools added following the existing format and alphabetical ordering:
    * [Main landing page](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/index.yml) - Add to tools reference section. The landing page has a list of the first 5 tools in alpha order than a link to the rest. Don't have more than 4 individual tools listed in the landing page.
    * [MCP tools TOC](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/TOC.yml) - Add navigation entries
    * [MCP available server tools include](https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/includes/tools/supported-azure-services.md) - Add service descriptions

## Editorial review

Using [Editorial instructions](editorial-review.md) to review the new documentation files. The editorial review is a separate process from the documentation generation process. The editorial review is done by a content developer who will review the new documentation files and provide feedback or approve them for publishing.

## Backup policy
1. tools.json.bak is a backup file which may include existing PRs of content which haven't been merged yet. Do not edit it. It is used to restore the tools.json if needed.
