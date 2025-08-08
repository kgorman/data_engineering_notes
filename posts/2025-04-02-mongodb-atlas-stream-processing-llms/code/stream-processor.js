// MongoDB Atlas Stream Processing Pipeline with LLM Integration
// Equipment Maintenance Analysis Example

/**
 * Stream Processing Pipeline that integrates with OpenAI to add
 * probabilistic reasoning to equipment maintenance data
 */

// Define the complete processor pipeline
let processor = [
  // Step 1: Source - Read from Kafka topic
  {
    $source: {
      connectionName: "cat_maint_demo_topic",
      topic: "maint_demo_topic"
    },
  },
  
  // Step 2: Optional windowing for batch processing (uncomment if needed for high volume)
  /*
  {
    $tumblingWindow: {
      interval: {
        size: 10,
        unit: "second"
      }
    }
  },
  */
  
  // Step 3: Filter messages that need LLM analysis (optional)
  {
    $match: {
      "issue_report": { $exists: true, $ne: "" },
      "machine_type": { $exists: true }
    }
  },
  
  // Step 4: HTTPS stage - Call the LLM API
  {
    $https: {
      connectionName: "AzureChatGPT",  // This should match your connection registry name
      method: "POST",
      as: "apiResults",
      config: {
        parseJsonStrings: true  // Critical: This parses JSON strings returned by LLM
      },
      payload: [
        {
          $project: {
            _id: 0,
            model: "gpt-4o-mini",  // Use the model you prefer
            messages: [
              {
                role: "system",
                content: "You are an expert heavy equipment maintenance technician with 20+ years of experience. Analyze the provided maintenance report and return a JSON response with likely causes, recommended actions, required parts, and time estimates. Your response must be valid JSON only, no additional text."
              },
              {
                role: "user", 
                content: {
                  $concat: [
                    "EQUIPMENT ANALYSIS REQUEST\n",
                    "Equipment Type: ", "$machine_type", "\n",
                    "Machine ID: ", "$machine_id", "\n",
                    "Engine Hours: ", {$toString: "$engine_hours"}, "\n",
                    "Year: ", {$toString: "$year_of_manufacture"}, "\n",
                    "Issue Report: ", "$issue_report", "\n",
                    "Current Sensor Data: ", {$toString: "$sensor_data"}, "\n",
                    "Previous Maintenance: ", {$toString: "$maintenance_history"}, "\n\n",
                    "Please analyze this data and return a JSON object with the following structure:\n",
                    "{\n",
                    "  \"likely_causes\": [\"cause1\", \"cause2\"],\n",
                    "  \"recommended_actions\": [\"action1\", \"action2\"],\n",
                    "  \"likely_parts_needed\": [\"part1\", \"part2\"],\n",
                    "  \"estimated_repair_time\": \"X-Y hours\",\n",
                    "  \"severity\": \"low|medium|high\",\n",
                    "  \"urgency\": \"low|moderate|high\",\n",
                    "  \"confidence_score\": 0.85,\n",
                    "  \"additional_notes\": \"Any relevant observations\"\n",
                    "}"
                  ]
                }
              }
            ],
            max_tokens: 800,
            temperature: 0.3,  // Lower temperature for more consistent results
            top_p: 0.9
          }
        }
      ]
    }
  },
  
  // Step 5: Extract and parse the LLM response
  {
    $addFields: {
      llm_response_raw: {
        $arrayElemAt: ["$apiResults.choices.message.content", 0]
      }
    }
  },
  
  // Step 6: Add metadata and enrich the document
  {
    $addFields: {
      ai_analysis: "$llm_response_raw",
      processing_metadata: {
        processed_timestamp: "$$NOW",
        processor_version: "1.0",
        llm_model: "gpt-4o-mini",
        confidence_threshold: 0.7
      },
      // Preserve original data
      original_data: {
        machine_id: "$machine_id",
        machine_type: "$machine_type",
        engine_hours: "$engine_hours",
        year_of_manufacture: "$year_of_manufacture",
        timestamp: "$timestamp",
        issue_report: "$issue_report",
        sensor_data: "$sensor_data",
        maintenance_history: "$maintenance_history"
      }
    }
  },
  
  // Step 7: Clean up temporary fields
  {
    $project: {
      apiResults: 0,
      llm_response_raw: 0
    }
  },
  
  // Step 8: Optional validation (uncomment to add validation logic)
  /*
  {
    $match: {
      "ai_analysis.confidence_score": { $gte: 0.6 }
    }
  },
  */
  
  // Step 9: Write enriched data to MongoDB
  {
    $merge: {
      into: {
        connectionName: "MaintenanceDB",  // Your database connection name
        db: "equipment",
        coll: "enriched_maintenance_reports"
      },
      whenMatched: "replace",
      whenNotMatched: "insert"
    }
  }
];

// Export the processor for use
processor;
