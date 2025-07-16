---
title: Azure Terraform Best Practices tools for Azure MCP Server
description: Learn how to use the Azure MCP Server to get Azure Terraform best practices.
ms.topic: reference
ms.date: 07/14/2025
---

# Azure Terraform Best Practices tools for Azure MCP Server

The Azure MCP Server allows you to retrieve Azure Terraform best practices using natural language prompts. This helps you implement infrastructure as code (IaC) using Terraform on Azure following recommended practices.

[Terraform](../../../azure/developer/terraform/overview.md) is a popular open-source infrastructure as code tool that allows you to create, manage, and update Azure resources in a consistent and repeatable way. Following best practices helps ensure your Terraform deployments are secure, scalable, and maintainable.

[!INCLUDE [tip-about-params](../includes/tools/parameter-consideration.md)]

## Get Azure Terraform best practices

<!-- azmcp azureterraformbestpractices get -->

The Azure MCP Server can retrieve and provide Azure Terraform best practices. This helps you implement Terraform code that follows recommended guidelines for working with Azure resources.

Example prompts include:

- **View Terraform guidance**: "Fetch the Azure Terraform best practices."
- **Get Terraform recommendations**: "Show me Azure Terraform best practices and generate a code sample to get a secret from Azure Key Vault."
- **Learn Terraform standards**: "What are the recommended practices for using Terraform with Azure resources?"
- **Terraform implementation advice**: "Help me understand the best way to structure Terraform code for Azure."
- **IaC best practices**: "What are the guidelines for deploying Azure resources with Terraform?"

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Code sample | Optional | If specified, generates a code sample demonstrating how to implement the best practices. |

## Related content

- [What are the Azure MCP Server tools?](../tools/index.md)
- [Get started using Azure MCP Server](../get-started.md)
