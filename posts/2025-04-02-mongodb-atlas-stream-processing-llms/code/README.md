# MongoDB Atlas Stream Processing - Connection Configuration

This directory contains configuration examples for setting up the required connections for the LLM-enhanced stream processing pipeline.

## Required Connections

### 1. Kafka Source Connection

**Connection Type**: `kafka`
**Name**: `cat_maint_demo_topic`

```json
{
  "name": "cat_maint_demo_topic",
  "type": "kafka",
  "config": {
    "bootstrapServers": "your-kafka-broker:9092",
    "authentication": {
      "mechanism": "SCRAM-SHA-512",
      "username": "${kafka_username}",
      "password": "${kafka_password}"
    },
    "security": {
      "protocol": "SASL_SSL"
    }
  }
}
```

### 2. MongoDB Sink Connection

**Connection Type**: `atlas`
**Name**: `MaintenanceDB`

```json
{
  "name": "MaintenanceDB",
  "type": "atlas",
  "config": {
    "clusterName": "your-atlas-cluster",
    "database": "equipment",
    "collection": "enriched_maintenance_reports"
  }
}
```

### 3. OpenAI API Connection

**Connection Type**: `https`
**Name**: `AzureChatGPT`

```json
{
  "name": "AzureChatGPT", 
  "type": "https",
  "config": {
    "baseUrl": "https://api.openai.com/v1/chat/completions",
    "headers": {
      "Authorization": "Bearer ${openai_api_key}",
      "Content-Type": "application/json"
    },
    "timeout": 30000
  }
}
```

### Alternative: Azure OpenAI Connection

If using Azure OpenAI instead:

```json
{
  "name": "AzureChatGPT",
  "type": "https", 
  "config": {
    "baseUrl": "https://your-resource.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-02-15-preview",
    "headers": {
      "api-key": "${azure_openai_key}",
      "Content-Type": "application/json"
    },
    "timeout": 30000
  }
}
```

## Environment Variables

Store sensitive values as environment variables or use Atlas App Services Values:

- `kafka_username`: Your Kafka SASL username
- `kafka_password`: Your Kafka SASL password  
- `openai_api_key`: Your OpenAI API key
- `azure_openai_key`: Your Azure OpenAI API key (if using Azure)

## Setting Up Connections via Atlas CLI

You can create these connections using the Atlas CLI:

```bash
# Create Kafka connection
atlas streams connection create \
  --type kafka \
  --name cat_maint_demo_topic \
  --config config/kafka-connection.json

# Create MongoDB connection  
atlas streams connection create \
  --type atlas \
  --name MaintenanceDB \
  --config config/atlas-connection.json

# Create HTTPS connection for OpenAI
atlas streams connection create \
  --type https \
  --name AzureChatGPT \
  --config config/openai-connection.json
```

## Testing Connections

After creating connections, test them with simple processors:

### Test Kafka Connection
```javascript
[
  {
    $source: {
      connectionName: "cat_maint_demo_topic",
      topic: "maint_demo_topic"
    }
  },
  {
    $limit: 1
  }
]
```

### Test OpenAI Connection
```javascript
[
  {
    $documents: [{"test": "hello"}]
  },
  {
    $https: {
      connectionName: "AzureChatGPT",
      method: "POST",
      as: "result",
      payload: [{
        $project: {
          model: "gpt-4o-mini",
          messages: [{
            role: "user", 
            content: "Say hello in JSON format"
          }],
          max_tokens: 50
        }
      }]
    }
  }
]
```

## Security Best Practices

1. **Use Atlas App Services Values** for storing API keys securely
2. **Rotate API keys** regularly
3. **Monitor API usage** to detect unusual activity
4. **Use least-privilege** access for database connections
5. **Enable connection encryption** where possible

## Troubleshooting

### Common Issues

1. **Authentication failures**: Verify credentials and permissions
2. **Timeout errors**: Increase timeout values for LLM calls
3. **Rate limiting**: Implement exponential backoff and windowing
4. **JSON parsing errors**: Ensure LLM prompts specify JSON-only responses

### Monitoring

Monitor these metrics:
- Connection health and availability
- API call latency and success rates  
- Token usage and costs
- Stream processing throughput
- Error rates and types
