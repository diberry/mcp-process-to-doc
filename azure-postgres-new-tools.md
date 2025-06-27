# Azure PostgreSQL - Additional Tools Documentation

## Set server parameter

The Azure MCP Server can set a specific parameter of a PostgreSQL server to a specific value, allowing you to configure server settings.

Example prompts include:

- **Configure connection limit**: "Set the 'max_connections' parameter to '200' on my PostgreSQL server 'prod-db-server'."
- **Update memory settings**: "Change the 'shared_buffers' parameter to '256MB' on my database server"
- **Modify timeout setting**: "Set 'statement_timeout' to '30000' on PostgreSQL server in resource group 'db-rg'"
- **Configure logging**: "Update the 'log_statement' parameter to 'all' on my production database"
- **Adjust performance**: "Set 'max_worker_processes' to '8' on my PostgreSQL server"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription containing the PostgreSQL server.          |
| **Resource group** | Required | The name of the Azure resource group containing the server.                                    |
| **User name**          | Required | The user name to access the PostgreSQL server.                                      |
| **Server**        | Required | The PostgreSQL server name to be configured.                                               |
| **Param**        | Required | The PostgreSQL parameter name to be set.                                               |
| **Value**        | Required | The value to set for the PostgreSQL parameter.                                               |
