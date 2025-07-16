---
title: Azure Kubernetes Service partial update for Azure MCP Server
description: New operations for Azure Kubernetes Service in Azure MCP Server.
ms.topic: reference
ms.date: 07/14/2025
---

# Azure Kubernetes Service new operations

## List clusters

<!-- azmcp aks cluster list -->

The Azure MCP Server can list all Azure Kubernetes Service (AKS) clusters in a subscription. This allows you to quickly see all your deployed AKS resources.

Example prompts include:

- **View Kubernetes resources**: "List all AKS clusters in my subscription."
- **Check container deployments**: "Show me my Azure Kubernetes Service clusters."
- **List container orchestrators**: "What AKS clusters do I have?"
- **View cluster inventory**: "Display all Kubernetes services in my subscription."
- **Check cluster resources**: "List all my AKS instances."

| Parameter | Required/Optional | Description |
|-----------|------------------|-------------|
| Subscription | Required | The ID or name of the Azure subscription containing the AKS clusters. |
