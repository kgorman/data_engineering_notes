# Adding Probabilistic Reasoning to MongoDB Atlas Stream Processing with LLMs

*Originally published on [TowardsDev](https://towardsdev.com/adding-probabilistic-reasoning-to-mongodb-atlas-stream-processing-with-llms-f3381aae39e3) on April 2, 2025*

![Heavy Equipment - Yellow excavator on construction site](assets/excavator-hero.jpg)
*Photo by [AnimGraph Lab](https://unsplash.com/@dimitryzub?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash) on [Unsplash](https://unsplash.com/photos/yellow-excavator-on-gray-concrete-road-during-daytime-jibUsRaauLY?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash)*

AI is transforming every layer of computing — from infrastructure to user interfaces — and streaming data systems are no exception. So, you might wonder, what about Atlas Stream Processing? Let me show you.

First of all, if you aren't familiar with Atlas Stream Processing you can check out [this post here](https://medium.com/mongodb/mongodb-atlas-stream-processing-your-first-steps-bcb2814034ca), but the TL;DR is that it's a first-class, cost-effective, performant, and easy-to-use interface to streaming systems for MongoDB Atlas. If you are a MongoDB user and want to integrate data in motion, Atlas Stream Processing is for you.

In this post, I am going to show you how to easily integrate Atlas Stream Processing with OpenAI to use an LLM to process data and add probabilistic capabilities to your stream processing pipelines. I am also going to show you how you can parse JSON results from the LLM back into the pipeline and write this potentially highly dynamic data (potentially a new schema for each event) into MongoDB.

## Why would I use an LLM with a stream processor?

Generally speaking, stream processors excel at deterministic logic — filtering, transforming, and routing data based on defined rules. But what if your use case demands something less binary, like inferring likely causes from symptoms, estimating time to resolution, or generating recommendations based on a stream of data? 

By integrating an LLM into your stream pipeline, you introduce **probabilistic reasoning** into the flow — allowing your system to interpret ambiguous input, make educated guesses, and enrich events with intelligent, context-aware insights. This massively expands what is possible in stream processing, especially in domains like:

- **Diagnostics**: Interpreting error logs and sensor data
- **Customer service**: Understanding sentiment and intent
- **Risk analysis**: Assessing probability of various outcomes
- **Anomaly detection**: Identifying unusual patterns that require human-like reasoning

## A note on prompting

When integrating LLMs into stream processing pipelines, the prompt becomes a critical piece of your pipeline. Since LLMs respond based on the input they receive, the structure, tone, and clarity of your prompt will directly impact the consistency and quality of the output. 

In this use case, the prompt guides the model to return structured JSON suitable for downstream processing. However, prompts can — and often should — be highly variable, tailored to different data types, equipment categories, or diagnostic needs. 

**Key considerations for prompts in streaming contexts:**

- Version and test prompts carefully
- Expect consistent schema formats
- Small wording changes can lead to unpredictable results
- Consider making prompts dynamic (from `$lookup` queries or message headers)

## How to use AI with Atlas Stream Processing

Integrating an LLM with Atlas Stream Processing is more straightforward than you might think. At a high level we are going to:

1. Call out to the LLM API for each message flowing through our pipeline
2. Create a window stage to aggregate data ahead of the call (to avoid hitting the API too frequently)
3. Return the results of the LLM to the processor
4. Enrich the data and continue processing the pipeline

The general data flow looks like this:

```
Kafka Topic → Stream Processor → LLM API Call → Data Enrichment → MongoDB
```

## Example: Equipment Maintenance App using LLM and Atlas Stream Processing

Let's dive into the code and build a processor. Our use case will be to process maintenance records for heavy equipment. Imagine a technician in the field servicing a large piece of heavy equipment like an excavator.

The technicians scribble in information about the problem, and that data gets transmitted through Apache Kafka and lands in the MongoDB database. Now, what if we want to enrich that data to process that natural language as it flows to give some potential problems and fixes, and add a simple time estimate for the work using AI? Enter the LLM.

### Input Data (Before LLM Processing)

For example, if we have technicians entering data like this **BEFORE** processing/enrichment via the LLM:

```json
{
  "machine_id": "CAT-D8T-2",
  "machine_type": "CAT-980L Loader",
  "engine_hours": 9632,
  "year_of_manufacture": 2013,
  "timestamp": "2025-03-25T15:18:13Z",
  "issue_report": "Issue logged for CAT-980L Loader: Hydraulic fluid leakage suspected. Sensor shows hydraulic pressure at 2224.83 psi, which is within normal range, but visual inspection reveals seepage around hydraulic fittings. With engine hours at 9632, it's likely the seals or hoses are worn. Replacing them should do the trick.",
  "sensor_data": {
    "hydraulic_pressure": 2224.83,
    "temperature": 154.93,
    "vibration": 0.2
  },
  "maintenance_history": [
    {
      "date": "2020-04-15",
      "work_performed": "Hydraulic system overhaul"
    }
  ]
}
```

### Output Data (After LLM Processing)

We can process that data through the pipeline, and enrich the message so it now shows probable issues and an estimation of the time required to fix them. So the data **AFTER** processing/enrichment via the LLM looks like this:

```json
{
  "content": {
    "machine_id": "CAT-D8T",
    "issue": {
      "description": "Lower than optimal hydraulic pressure possibly due to a hydraulic fluid leak.",
      "likely_causes": [
        "Worn or damaged seals around the main hydraulic pump",
        "Hydraulic line leaks",
        "Failure of hydraulic components"
      ],
      "recommended_actions": [
        "Inspect hydraulic fluid levels and check for visible leaks.",
        "Examine seals around the main hydraulic pump for wear or damage.",
        "Conduct a pressure test to assess the system's integrity.",
        "Inspect hydraulic lines and fittings for signs of wear or leaks.",
        "Replace any defective seals, lines, or components as needed."
      ]
    },
    "diagnosis": {
      "initial_inspection_needed": true,
      "likely_parts_needed": [
        "Replacement seals",
        "Hydraulic fluid",
        "New hydraulic lines (if damaged)"
      ],
      "estimated_repair_time": "4-6 hours",
      "severity": "medium",
      "urgency": "moderate"
    }
  }
}
```

The data not only becomes enriched with potential recommended actions but also has a list of required parts and an estimation of the time to fix the issue.

## Implementation Steps

### Step 1: The Connection Registry

There are two main steps to achieving this — one is to create the connection registry for the sources and sinks required:

1. **Kafka topic connection** - for the input stream
2. **Database connection** - for writing enriched data  
3. **HTTPS endpoint connection** - for the OpenAI API

You can use the Atlas CLI/API or just use the Atlas UI by clicking on **Stream Processing → [instance] → Connections** and add a new connection.

![Connection Registry](assets/connection-registry.png)
*Creating an HTTPS connection registry entry for OpenAI completions API*

### Step 2: The Processor

Below is the code for the processor. The key with this example is to ensure the LLM prompt returns valid JSON (it will return it as a string datatype, however) then we instruct the `$https` operator to parse the string to JSON using the `parseJSONStrings` config parameter. 

**This is the trick to happy LLM interoperability when using the `$https` operator and AI!**

Lastly, note how dynamic the schema can be, after all this isn't a declarative interface, we are prompting an AI to give us probabilistic results. MongoDB is highly adaptable for this type of use case.

```javascript
// Define a processor
let processor = [
  // Kafka source
  {
    $source: {
      connectionName: "cat_maint_demo_topic",
      topic: "maint_demo_topic"
    },
  },
  
  // The HTTPS stage - call the LLM (this is LLM specific)
  // Use the payload field to present the required keys to the API
  // Results are placed into apiResults document
  // parseJsonStrings ensures the results are parsed to JSON
  // The prompt must indicate to return in JSON response format
  {
    $https: {
      connectionName: "AzureChatGPT",
      method: "POST",
      as: "apiResults",
      config: {parseJsonStrings: true},  // Ensure this is here!
      payload: [
        {
          $project: {
            _id: 0,
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are an expert heavy equipment maintenance technician. Analyze the provided maintenance report and return a JSON response with likely causes, recommended actions, required parts, and time estimates. Always return valid JSON only."
              },
              {
                role: "user", 
                content: {
                  $concat: [
                    "Equipment: ", "$machine_type", 
                    " (", {$toString: "$engine_hours"}, " hours). ",
                    "Issue: ", "$issue_report", ". ",
                    "Sensor data: ", {$toString: "$sensor_data"},
                    ". Please provide diagnosis in JSON format with fields: likely_causes (array), recommended_actions (array), likely_parts_needed (array), estimated_repair_time (string), severity (low/medium/high), urgency (low/moderate/high)."
                  ]
                }
              }
            ],
            max_tokens: 500,
            temperature: 0.3
          }
        }
      ]
    }
  },
  
  // Extract the content from the LLM response
  {
    $addFields: {
      llm_analysis: {
        $arrayElemAt: ["$apiResults.choices.message.content", 0]
      }
    }
  },
  
  // Merge original data with LLM analysis
  {
    $addFields: {
      enriched_data: {
        $mergeObjects: [
          "$$ROOT",
          {
            ai_analysis: "$llm_analysis",
            processed_timestamp: "$$NOW"
          }
        ]
      }
    }
  },
  
  // Clean up and prepare for output
  {
    $project: {
      apiResults: 0,
      llm_analysis: 0
    }
  },
  
  // Write to MongoDB
  {
    $merge: {
      into: {
        connectionName: "MaintenanceDB",
        db: "equipment",
        coll: "enriched_maintenance_reports"
      }
    }
  }
];
```

## Common Questions

A few common questions come up when using this operator in this way, so let me try to address a couple up front.

### 1. How is performance?

The `$https` stage is executed per message. So in a high-volume streaming use case, that could be a lot of calls. Performance is gated mostly on LLM performance. 

**Solution**: Use a window stage (tumbling, hopping, session, etc) and process calls at the end of the window period, like every 10 seconds or once a day. This depends on your use case but helps reduce the number of calls required.

**Example**: An IoT use case could perform `avg()` on the temperature before calling the LLM every hour.

### 2. How are costs?

Similar to performance, you may want to use various techniques like a window or matching only particular messages to help reduce the number of calls to the LLM to save costs/tokens.

**Cost optimization strategies:**
- Use windowing to batch requests
- Filter messages before LLM calls
- Use cheaper models for simpler analysis
- Cache common responses

### 3. What about Atlas Vector Search? How does it play into this?

[Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/tutorials/vector-search-quick-start/) is a great way to add **memory** to this process. Think of the LLM as the reasoning agent and Vector Search indexes on MongoDB data as the memory. 

One could construct a pipeline that ties these two together to add:
- Common fixes from historical data
- Historical work on specific machines
- Manufacturer maintenance procedures
- Similar issue patterns

This is a larger topic that requires its own wider discussion.

### 4. Going further with custom models

If this was a real example, we might want to train our model directly on the history of maintenance of our equipment using:
- Manufacturer maintenance procedure manuals
- Historical fixes stored in databases (like MongoDB)
- Equipment-specific knowledge bases

This would yield better results over time, making the LLM (at this point likely proprietary) smarter at reasoning what is wrong with our fleet.

## Conclusion

Using this approach, you are now able to weave probabilistic reasoning into your stream processing using an LLM and the new `$https` operator stage for Atlas Stream Processing.

**Key takeaways:**
- LLMs add probabilistic reasoning to deterministic stream processing
- The `$https` operator with `parseJsonStrings: true` is crucial for JSON responses
- MongoDB's flexible schema handles dynamic AI-generated data well
- Performance and cost considerations require thoughtful architecture
- Vector Search can add "memory" to make the system even more intelligent

**Next steps:**
- Try the [Atlas Stream Processing tutorial](https://www.mongodb.com/docs/atlas/atlas-stream-processing/tutorial/)
- Experiment with different LLM prompts for your use case
- Consider windowing strategies for high-volume streams
- Explore Vector Search integration for enhanced context

## Related Articles

- [MongoDB Atlas Stream Processing: Your First Steps](https://medium.com/mongodb/mongodb-atlas-stream-processing-your-first-steps-bcb2814034ca)
- [Atlas Vector Search Quick Start](https://www.mongodb.com/docs/atlas/atlas-vector-search/tutorials/vector-search-quick-start/)

---

*Have questions or want to discuss this approach? Feel free to reach out or leave a comment below.*
