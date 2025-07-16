---
title: Azure Managed Grafana tools for Azure MCP Server
description: Learn how to use the Azure MCP Server with Azure Managed Grafana.
ms.topic: reference
ms.date: 07/14/2025
---

# Azure Managed Grafana tools for Azure MCP Server

The Azure MCP Server allows you to manage Azure Managed Grafana resources using natural language prompts. This helps you quickly list and manage your Grafana workspaces without remembering complex syntax.

[Azure Managed Grafana](../../../azure/managed-grafana/overview.md) is a data visualization platform built on top of the Grafana software by Grafana Labs. It's built as a fully managed Azure service operated and supported by Microsoft. Grafana helps you bring together metrics, logs and traces into a single user interface, with extensive support for data sources and graphing capabilities to view and analyze your application and infrastructure telemetry data in real-time.

[!INCLUDE [tip-about-params](../includes/tools/parameter-consideration.md)]

## List Grafana resources

<!-- azmcp grafana list -->

The Azure MCP Server can list all Azure Managed Grafana resources in a subscription. This allows you to view your deployed Grafana workspaces.

Example prompts include:

- **View Grafana resources**: "List all Azure Managed Grafana resources in my subscription."
- **Check Grafana workspaces**: "Show me all my Grafana instances."
- **List monitoring dashboards**: "What Azure Managed Grafana workspaces do I have?"
- **Show visualization resources**: "Display all my Grafana resources."
- **View monitoring tools**: "List all Grafana workspaces in my subscription."

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Subscription | Required | The ID or name of the Azure subscription containing the Grafana resources. |

## Related content

- [What are the Azure MCP Server tools?](../tools/index.md)
- [Get started using Azure MCP Server](../get-started.md)
