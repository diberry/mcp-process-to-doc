# Azure Monitor - Additional Tools Documentation

## Get entity health

The Azure MCP Server can get the health of an entity using Azure Monitor health models.

Example prompts include:

- **Check entity health**: "Get the health status of entity 'vm-001' using health model 'VirtualMachine'."
- **Monitor resource health**: "What is the health of my application entity in the production model?"
- **Health assessment**: "Check the health status using model 'DatabaseHealth' for entity 'db-server-01'"
- **Resource monitoring**: "Get health information for my web server entity"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription containing the resource.          |
| **Resource group** | Required | The name of the Azure resource group.                                    |
| **Model name**          | Required | The name of the health model to use.                                      |
| **Entity**        | Required | The entity ID to get health information for.                                               |

## Query metrics

The Azure MCP Server can query Azure Monitor metrics for a resource to get performance and usage data.

Example prompts include:

- **Query CPU metrics**: "Get CPU percentage metrics for my virtual machine 'vm-prod-01'."
- **Get storage metrics**: "Show me storage transaction metrics for my storage account"
- **Monitor memory usage**: "Query memory metrics for resource 'web-server' with namespace 'microsoft.compute/virtualmachines'"
- **Performance monitoring**: "Get metrics for 'Percentage CPU,Available Memory Bytes' from my VM"
- **Custom time range**: "Query metrics from 2024-01-01 to 2024-01-02 with hourly intervals"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription containing the resource.          |
| **Resource name** | Required | The name of the Azure resource to query metrics for.                                    |
| **Metric namespace**          | Required | The metric namespace (e.g., 'microsoft.compute/virtualmachines').                                      |
| **Metric names**        | Required | The metric names to query (comma-separated for multiple).                                               |
| **Resource group**        | Optional | The name of the Azure resource group.                                               |
| **Resource type**        | Optional | The type of the Azure resource.                                               |
| **Start time**        | Optional | The start time for the metric query (ISO 8601 format).                                               |
| **End time**        | Optional | The end time for the metric query (ISO 8601 format).                                               |
| **Interval**        | Optional | The time interval for the metric query (e.g., 'PT1H' for 1 hour).                                               |
| **Aggregation**        | Optional | The aggregation method for the metrics (e.g., 'Average', 'Maximum').                                               |
| **Filter**        | Optional | The filter to apply to the metrics.                                               |
| **Max buckets**        | Optional | The maximum number of buckets to return.                                               |

## List metric definitions

The Azure MCP Server can list available metric definitions for a resource to discover what metrics are available.

Example prompts include:

- **List available metrics**: "What metrics are available for my storage account 'mystorageaccount'?"
- **Discover VM metrics**: "Show me all metric definitions for virtual machines"
- **Find transaction metrics**: "List metrics related to 'transaction' for my resource"
- **Explore metric options**: "What performance metrics can I query for resource type 'Microsoft.Storage/storageAccounts'?"
- **Search specific metrics**: "Find metrics containing 'CPU' in their definition"

| Parameter | Required or optional | Description |
|-----------|-------------|-------------|
| **Subscription** | Required | The ID of the subscription containing the resource.          |
| **Resource name** | Required | The name of the Azure resource to get metric definitions for.                                    |
| **Resource group**        | Optional | The name of the Azure resource group.                                               |
| **Resource type**        | Optional | The type of the Azure resource.                                               |
| **Metric namespace**        | Optional | The metric namespace to filter definitions.                                               |
| **Search string**        | Optional | The search string to filter metric definitions.                                               |
| **Limit**        | Optional | The maximum number of metric definitions to return.                                               |
