---
title: Azure RBAC Tools 
description: Learn how to use the Azure MCP Server with Azure Role-Based Access Control (RBAC).
keywords: azure mcp server, azmcp, rbac, roles, permissions
author: diberry
ms.author: diberry
ms.date: 06/27/2025
content_well_notification: 
  - AI-contribution
ai-usage: ai-assisted
ms.topic: reference
ms.custom: build-2025
--- 
# Azure RBAC tools for the Azure MCP Server

The Azure MCP Server allows you to manage Azure Role-Based Access Control (RBAC) using natural language prompts. This allows you to quickly view role assignments and permissions without remembering complex syntax.

[Azure Role-Based Access Control (RBAC)](/azure/role-based-access-control/overview) helps you manage who has access to Azure resources, what they can do with those resources, and what areas they have access to. RBAC is an authorization system built on Azure Resource Manager that provides fine-grained access management of Azure resources.

[!INCLUDE [tip-about-params](../includes/tools/parameter-consideration.md)]

## List role assignments

The Azure MCP Server can list Azure RBAC role assignments for a specific scope.

Example prompts include:

- **List role assignments**: "Show me all role assignments for my subscription."
- **Get user permissions**: "What role assignments exist for resource group '/subscriptions/abc/resourceGroups/myRG'?"
- **Check access control**: "List RBAC assignments for scope '/subscriptions/xyz123'"
- **View permissions**: "Show me role assignments at the management group level"
- **Audit access**: "What roles are assigned in my subscription scope?"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription to query for role assignments.          |
| **Scope** | Required | The scope to list role assignments for (e.g., subscription, resource group, or resource).                                    |

### Scope Examples

The scope parameter can be set to different levels:

- **Subscription scope**: `/subscriptions/{subscription-id}`
- **Resource group scope**: `/subscriptions/{subscription-id}/resourceGroups/{resource-group-name}`
- **Resource scope**: `/subscriptions/{subscription-id}/resourceGroups/{resource-group-name}/providers/{resource-provider}/{resource-type}/{resource-name}`
- **Management group scope**: `/providers/Microsoft.Management/managementGroups/{management-group-id}`

## Related content

- [What are the Azure MCP Server tools?](index.md)
- [Get started using Azure MCP Server](../get-started.md)
