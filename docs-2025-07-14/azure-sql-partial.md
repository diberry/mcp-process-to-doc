---
title: Azure SQL partial update for Azure MCP Server
description: New operations for Azure SQL in Azure MCP Server.
ms.topic: reference
ms.date: 07/14/2025
---

# Azure SQL new operations

## Show database details

<!-- azmcp sql db show -->

The Azure MCP Server can show detailed information about an Azure SQL database. This helps you view configuration, performance settings, and other important details about your database.

Example prompts include:

- **View database information**: "Show me the details of SQL database myDB in server myServer."
- **Check database configuration**: "Get the configuration details for the SQL database contosoDB on server contoso-sql-server."
- **Review database settings**: "What are the settings for my SQL database productionDB?"
- **Display database specs**: "Show me the specifications of the database analytics in my SQL server."
- **Examine database properties**: "What are the properties of my SQL database inventory on server inventory-sql?"

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Subscription | Required | The ID or name of the Azure subscription containing the SQL server and database. |
| Server name | Required | The name of the SQL server hosting the database. |
| Database name | Required | The name of the SQL database to show details for. |
| Resource group | Optional | The name of the resource group containing the SQL server. |

## List Entra ID admins

<!-- azmcp sql server entraadmin list -->

The Azure MCP Server can list Microsoft Entra ID administrators configured for an Azure SQL server. This helps you manage and audit authentication settings for your SQL servers.

Example prompts include:

- **View admin accounts**: "List Microsoft Entra ID administrators for SQL server myServer."
- **Check authentication settings**: "Show me the Entra ID administrators configured for SQL server analytics-sql."
- **Audit admin access**: "What Microsoft Entra ID administrators are set up for my SQL server production-db-server?"
- **Review admin permissions**: "Get the Entra admins for my SQL server inventory-db."
- **Display admin configuration**: "Show me which Entra accounts have admin access to my SQL server."

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Subscription | Required | The ID or name of the Azure subscription containing the SQL server. |
| Server name | Required | The name of the SQL server to list Entra ID administrators for. |
| Resource group | Optional | The name of the resource group containing the SQL server. |
