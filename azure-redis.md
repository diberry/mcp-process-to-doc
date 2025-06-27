---
title: Azure Redis Tools 
description: Learn how to use the Azure MCP Server with Azure Redis services.
keywords: azure mcp server, azmcp, redis, cache
author: diberry
ms.author: diberry
ms.date: 06/27/2025
content_well_notification: 
  - AI-contribution
ai-usage: ai-assisted
ms.topic: reference
ms.custom: build-2025
--- 
# Azure Redis tools for the Azure MCP Server

The Azure MCP Server allows you to manage Azure Redis resources, including Redis clusters and caches using natural language prompts. This allows you to quickly access cache information and manage Redis databases without remembering complex syntax.

[Azure Cache for Redis](/azure/azure-cache-for-redis/cache-overview) provides an in-memory data structure store, used as a database, cache, and message broker. [Azure Managed Redis](/azure/azure-cache-for-redis/managed-redis-overview) offers enterprise-grade Redis capabilities with enhanced security and compliance features.

[!INCLUDE [tip-about-params](../includes/tools/parameter-consideration.md)]

## List Redis clusters

The Azure MCP Server can list Redis clusters in the Azure Managed Redis or Azure Redis Enterprise services.

Example prompts include:

- **List all clusters**: "Show me all Redis clusters in my subscription."
- **Get cluster overview**: "List Redis Enterprise clusters"
- **Find clusters**: "What Redis clusters do I have available?"
- **Check cluster resources**: "Show my managed Redis clusters"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription containing the Redis clusters.          |

## List cluster databases

The Azure MCP Server can list databases in an Azure Redis cluster.

Example prompts include:

- **List databases**: "Show me all databases in my Redis cluster 'my-redis-cluster'."
- **Get database list**: "What databases are available in the Redis cluster?"
- **Check cluster databases**: "List all databases in the 'production-redis' cluster"
- **View database structure**: "Show databases for my Redis cluster in resource group 'rg-cache'"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription containing the Redis cluster.          |
| **Resource group** | Required | The name of the Azure resource group containing the cluster.                                    |
| **Cluster**          | Required | The name of the Redis cluster.                                      |

## List Redis caches

The Azure MCP Server can list Redis caches in the Azure Cache for Redis service.

Example prompts include:

- **List all caches**: "Show me all Redis caches in my subscription."
- **Get cache overview**: "List Azure Cache for Redis instances"
- **Find caches**: "What Redis caches do I have?"
- **Check cache resources**: "Show my Redis cache instances"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription containing the Redis caches.          |

## List cache access policies

The Azure MCP Server can list access policy assignments in an Azure Redis cache.

Example prompts include:

- **List access policies**: "Show me access policies for my Redis cache 'my-cache'."
- **Get policy assignments**: "What access policies are configured for the Redis cache?"
- **Check cache permissions**: "List access policy assignments for 'production-cache'"
- **View security policies**: "Show access policies for Redis cache in resource group 'rg-cache'"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription containing the Redis cache.          |
| **Resource group** | Required | The name of the Azure resource group containing the cache.                                    |
| **Cache**          | Required | The name of the Redis cache.                                      |

## Related content

- [What are the Azure MCP Server tools?](index.md)
- [Get started using Azure MCP Server](../get-started.md)
