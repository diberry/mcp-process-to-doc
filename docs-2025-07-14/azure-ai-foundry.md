---
title: Azure AI Foundry tools for Azure MCP Server
description: Learn how to use the Azure MCP Server with Azure AI Foundry.
ms.topic: reference
ms.date: 07/14/2025
---

# Azure AI Foundry tools for Azure MCP Server

The Azure MCP Server allows you to manage Azure AI Foundry resources using natural language prompts. This helps you quickly list available models and manage model deployments without remembering complex syntax.

[Azure AI Foundry](../../../azure/ai-foundry/what-is-azure-ai-foundry.md) is a unified platform for developing and deploying generative AI applications and Azure AI APIs responsibly. It provides a comprehensive set of AI capabilities, a simplified user interface, and code-first experiences, making it a complete platform for building, testing, deploying, and managing intelligent solutions.

[!INCLUDE [tip-about-params](../includes/tools/parameter-consideration.md)]

## List models

<!-- azmcp foundry models list -->

The Azure MCP Server can list all available AI Foundry models. This helps you see which models are available for deployment.

Example prompts include:

- **View available models**: "List all AI Foundry models."
- **Check model availability**: "What AI Foundry models are available for deployment?"
- **Show model catalog**: "Show me the available AI Foundry models."
- **Browse model options**: "What generative AI models can I deploy on my AI Foundry resource?"
- **View model selection**: "Display the catalog of AI Foundry models."

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Subscription | Required | The ID or name of the Azure subscription containing the AI Foundry resource. |
| Resource name | Optional | The name of the AI Foundry resource to query. |
| Resource group | Optional | The name of the resource group containing the AI Foundry resource. |

## Deploy model

<!-- azmcp foundry models deploy -->

The Azure MCP Server can deploy an AI Foundry model, making it available for use in your applications.

Example prompts include:

- **Create model deployment**: "Deploy a GPT4o instance on my resource myAiFoundry."
- **Set up AI model**: "Deploy the latest Claude model to my AI Foundry resource aiResources."
- **Provision model**: "Create a deployment of Llama 3 in my AI Foundry workspace."
- **Deploy foundation model**: "Set up a GPT-4 deployment named 'content-gen' on my AI Foundry resource."
- **Initialize AI model**: "Deploy Azure OpenAI model to my foundry instance 'dev-foundry'."

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Subscription | Required | The ID or name of the Azure subscription containing the AI Foundry resource. |
| Resource name | Required | The name of the AI Foundry resource where the model will be deployed. |
| Resource group | Optional | The name of the resource group containing the AI Foundry resource. |
| Model name | Required | The name of the model to deploy (e.g., "gpt-4o", "claude-3", etc.). |
| Deployment name | Optional | A custom name for your deployment. If not specified, a default name will be generated. |
| Capacity | Optional | The capacity allocation for the deployment. |

## List model deployments

<!-- azmcp foundry models deployments list -->

The Azure MCP Server can list all AI Foundry model deployments that have been created, allowing you to see which models are currently deployed and available for use.

Example prompts include:

- **View active deployments**: "List all AI Foundry model deployments."
- **Check deployment status**: "Show me all AI Foundry model deployments in my resource myAiFoundry."
- **List running models**: "What AI models are currently deployed in my AI Foundry workspace?"
- **Review model deployments**: "Show me the status of all my AI Foundry deployments."
- **View deployed models**: "List all the AI models I've deployed in my Foundry resource."

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Subscription | Required | The ID or name of the Azure subscription containing the AI Foundry resource. |
| Resource name | Required | The name of the AI Foundry resource to query for deployments. |
| Resource group | Optional | The name of the resource group containing the AI Foundry resource. |

## Related content

- [What are the Azure MCP Server tools?](../tools/index.md)
- [Get started using Azure MCP Server](../get-started.md)
