---
title: Azure Monitor partial update for Azure MCP Server
description: New operations for Azure Monitor in Azure MCP Server.
ms.topic: reference
ms.date: 07/14/2025
---

# Azure Monitor new operations

## Query resource logs

<!-- azmcp monitor resource log query -->

The Azure MCP Server can query logs for specific Azure resources. This helps you analyze and troubleshoot issues with specific resources.

Example prompts include:

- **View resource logs**: "Show me the logs for the past hour for the resource myVM in the Log Analytics workspace myWorkspace."
- **Check resource errors**: "Display error logs from my web app in my Log Analytics workspace for the last 24 hours."
- **Analyze resource performance**: "Query the performance logs for my SQL database from my analytics workspace."
- **Find resource warnings**: "Show me warning logs from my storage account in my monitoring workspace."
- **Investigate resource issues**: "Get logs about connection failures for my virtual machine from my Log Analytics workspace."

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Subscription | Required | The ID or name of the Azure subscription containing the resource and workspace. |
| Resource name | Required | The name of the resource to query logs for. |
| Resource group | Optional | The name of the resource group containing the resource. |
| Workspace name | Required | The name of the Log Analytics workspace containing the logs. |
| Query | Optional | A specific query to run against the logs. If not provided, a default query will be used. |
| Time range | Optional | The time period to query logs for (e.g., "1h", "24h", "7d"). Defaults to "1h" if not specified. |

## Query workspace logs

<!-- azmcp monitor workspace log query -->

The Azure MCP Server can perform enhanced Log Analytics queries on workspaces. This allows for more advanced log analysis across your Azure resources.

Example prompts include:

- **Analyze logs**: "Show me the logs for the past hour in the Log Analytics workspace myWorkspace."
- **View error patterns**: "Query my monitoring workspace for error events in the last 4 hours."
- **Track performance**: "Check response time trends in my Log Analytics workspace over the last day."
- **Monitor security events**: "Show me security alerts from my Log Analytics workspace from the past week."
- **Review system health**: "Get system health metrics from my monitoring workspace for the last 48 hours."

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Subscription | Required | The ID or name of the Azure subscription containing the workspace. |
| Workspace name | Required | The name of the Log Analytics workspace to query. |
| Query | Optional | A specific Kusto Query Language (KQL) query to run. If not provided, a default query will be used. |
| Time range | Optional | The time period to query logs for (e.g., "1h", "24h", "7d"). Defaults to "1h" if not specified. |
