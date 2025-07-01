# Copilot instructions

1. Read the azmcp-commands.md at this URL (https://github.com/Azure/azure-mcp/blob/main/docs/azmcp-commands.md) and find all entries which don't have a cooresponding JSON object(s) in tools.json.
2. Create those entries in the tools.json.
3. Take the new entries in the tools.json to create a new file documentation file for each new server in the tools.json. Please those files in a timestamped directory. Follow the format of the azure-app-confguration.md at this URL (https://github.com/MicrosoftDocs/azure-dev-docs/blob/main/articles/azure-mcp-server/tools/app-configuration.md) to create each new server's doc fil
4. For any new tools in existing servers, create the markdown files with just the new information so I can copy/paste it into the existing document which isn't in this workspace. Name the file with a postfix of `-partial` so I know it isn't the whole file.
5. If a tool is specific to a 3rd party but the server is Azure Native ISV, use the 3rd party tool branding only in that tool's section. 
6. Neither the azmcp-commands.md or the tools.json has the branding information required to create the new documentation files. Use the branding information from the existing documentation files in this workspace to create the new documentation files. Use the Azure Learn knowledge service tool to get that important branding information.