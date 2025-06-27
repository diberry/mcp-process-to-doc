---
title: Azure Datadog Tools 
description: Learn how to use the Azure MCP Server with Azure Datadog resources.
keywords: azure mcp server, azmcp, datadog, monitoring
author: diberry
ms.author: diberry
ms.date: 06/27/2025
content_well_notification: 
  - AI-contribution
ai-usage: ai-assisted
ms.topic: reference
ms.custom: build-2025
--- 
# Azure Datadog tools for the Azure MCP Server

The Azure MCP Server allows you to manage Azure Datadog resources using natural language prompts. This allows you to quickly access Datadog monitoring information and manage monitored resources without remembering complex syntax.

[Datadog on Azure](/azure/partner-solutions/datadog/overview) provides a native integration that allows you to monitor your Azure resources using Datadog's comprehensive monitoring and analytics platform. This integration enables centralized monitoring, logging, and alerting across your Azure infrastructure.

[!INCLUDE [tip-about-params](../includes/tools/parameter-consideration.md)]

## List monitored resources

The Azure MCP Server can list monitored resources in a Datadog integration.

Example prompts include:

- **List monitored resources**: "Show me all resources monitored by Datadog in my resource group."
- **Get monitoring overview**: "What resources are being monitored by Datadog?"
- **Check monitored services**: "List all resources monitored by my 'production-datadog' integration"
- **View monitoring scope**: "Show me which resources are being tracked by Datadog"
- **Get resource monitoring status**: "What Azure resources are connected to Datadog monitoring?"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription containing the Datadog resource.          |
| **Resource group** | Required | The name of the Azure resource group containing the Datadog resource.                                    |
| **Datadog resource**          | Required | The name of the Datadog resource.                                      |

## Related content

- [What are the Azure MCP Server tools?](index.md)
- [Get started using Azure MCP Server](../get-started.md)
