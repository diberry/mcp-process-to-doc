---
title: Bicep tools for Azure MCP Server
description: Learn how to use the Azure MCP Server with Bicep schemas.
ms.topic: reference
ms.date: 07/14/2025
---

# Bicep tools for Azure MCP Server

The Azure MCP Server allows you to work with Bicep schemas using natural language prompts. This helps you develop Bicep templates for Azure resource deployment more effectively.

[Bicep](../../../azure/azure-resource-manager/bicep/overview.md) is a domain-specific language (DSL) that uses declarative syntax to deploy Azure resources. It provides concise syntax, reliable type safety, and support for code reuse, offering the best authoring experience for your infrastructure-as-code solutions in Azure.

[!INCLUDE [tip-about-params](../includes/tools/parameter-consideration.md)]

## Get Bicep schema

<!-- azmcp bicepschema get -->

The Azure MCP Server can retrieve Bicep schema information for Azure resource types. This helps you understand how to properly structure Bicep templates for different Azure resources.

Example prompts include:

- **Get resource schema**: "How can I use Bicep to create an Azure OpenAI service?"
- **Learn Bicep structure**: "Show me the Bicep schema for Azure Kubernetes Service."
- **View Bicep template format**: "What's the schema for deploying a Virtual Machine with Bicep?"
- **Get Bicep properties**: "I need the schema for Azure App Service in Bicep."
- **Bicep syntax guidance**: "Help me understand the Bicep structure for Azure Storage Accounts."

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Resource type | Required | The Azure resource type for which to retrieve the Bicep schema (e.g., "Microsoft.Compute/virtualMachines", "Microsoft.Storage/storageAccounts"). |

## Related content

- [What are the Azure MCP Server tools?](../tools/index.md)
- [Get started using Azure MCP Server](../get-started.md)
