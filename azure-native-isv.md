---
title: Azure Native ISV - Datadog Tools 
description: Learn how to use the Azure MCP Server with Datadog, an Azure Native ISV partner solution.
keywords: azure mcp server, azmcp, datadog, monitoring, native isv, partner solutions
author: diberry
ms.author: diberry
ms.date: 06/27/2025
content_well_notification: 
  - AI-contribution
ai-usage: ai-assisted
ms.topic: reference
ms.custom: build-2025
--- 
# Azure Native ISV tools for the Azure MCP Server

The Azure MCP Server allows you to manage ISV resources through Azure Native ISV integration using natural language prompts. This allows you to quickly access third party functionality without remembering complex syntax.

Azure Native ISV (Independent Software Vendor) partners provide comprehensive solutions that integrate seamlessly with Azure. These [Azure partner solutions](/azure/partner-solutions/datadog/overview) offer native integrations that allow you to monitor and manage your Azure resources using third-party capabilities. Azure Native ISV integrations enable centralized functionality across your Azure infrastructure through seamless partner solutions.

[!INCLUDE [tip-about-params](../includes/tools/parameter-consideration.md)]

## List Datadog monitored resources

The Azure MCP Server can list monitored resources in a Datadog Azure Native ISV integration.

Example prompts include:

- **List monitored resources**: "Show me all resources monitored by Datadog in my resource group."
- **Get monitoring overview**: "What resources are being monitored by the Datadog Azure Native ISV integration?"
- **Check monitored services**: "List all resources monitored by my 'production-datadog' Azure Native ISV integration"
- **View monitoring scope**: "Show me which resources are being tracked by Datadog partner solution"
- **Get resource monitoring status**: "What Azure resources are connected to Datadog Azure Native ISV monitoring?"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription containing the Datadog Azure Native ISV resource.          |
| **Resource group** | Required | The name of the Azure resource group containing the Datadog Azure Native ISV resource.                                    |
| **Datadog resource**          | Required | The name of the Datadog Azure Native ISV resource.                                      |

## Related content

- [What are the Azure MCP Server tools?](index.md)
- [Get started using Azure MCP Server](../get-started.md)
