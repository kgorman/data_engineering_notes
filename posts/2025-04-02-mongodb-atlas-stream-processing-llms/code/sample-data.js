// Sample input data for testing the MongoDB Atlas Stream Processing + LLM pipeline
// This represents the type of data that would come from your Kafka topic

// Example 1: Hydraulic System Issue
const sampleMaintenanceReport1 = {
  "machine_id": "CAT-D8T-2024-001",
  "machine_type": "CAT-980L Loader",
  "engine_hours": 9632,
  "year_of_manufacture": 2013,
  "timestamp": "2025-03-25T15:18:13Z",
  "operator_id": "TECH-4429",
  "location": "Site-Alpha-Zone-3",
  "issue_report": "Issue logged for CAT-980L Loader: Hydraulic fluid leakage suspected. Sensor shows hydraulic pressure at 2224.83 psi, which is within normal range, but visual inspection reveals seepage around hydraulic fittings. With engine hours at 9632, it's likely the seals or hoses are worn. Replacing them should do the trick. Machine still operational but needs attention soon.",
  "sensor_data": {
    "hydraulic_pressure": 2224.83,
    "hydraulic_temperature": 154.93,
    "engine_temperature": 195.2,
    "vibration": 0.2,
    "fuel_level": 0.65,
    "oil_pressure": 45.8
  },
  "maintenance_history": [
    {
      "date": "2020-04-15",
      "work_performed": "Hydraulic system overhaul",
      "parts_replaced": ["hydraulic_pump", "main_seals"],
      "technician": "TECH-2241",
      "hours_worked": 8.5
    },
    {
      "date": "2023-08-22", 
      "work_performed": "Routine maintenance",
      "parts_replaced": ["filters", "fluids"],
      "technician": "TECH-3312",
      "hours_worked": 2.0
    }
  ],
  "priority": "medium"
};

// Example 2: Engine Performance Issue
const sampleMaintenanceReport2 = {
  "machine_id": "CAT-D9R-2024-007",
  "machine_type": "CAT-D9R Bulldozer", 
  "engine_hours": 15420,
  "year_of_manufacture": 2011,
  "timestamp": "2025-03-26T09:45:22Z",
  "operator_id": "TECH-5567",
  "location": "Site-Beta-Zone-1",
  "issue_report": "Engine performance degraded significantly. Loss of power under load, black smoke from exhaust, and rough idle. Fuel consumption increased by approximately 20% over last week. Error codes showing issues with fuel injection system. Machine struggles on inclines and takes longer to reach operating speed.",
  "sensor_data": {
    "engine_temperature": 220.5,
    "turbo_pressure": 18.2,
    "fuel_pressure": 42.1,
    "exhaust_temperature": 1150.8,
    "vibration": 0.8,
    "fuel_level": 0.45,
    "oil_pressure": 38.2
  },
  "error_codes": ["P0087", "P0172", "P0299"],
  "maintenance_history": [
    {
      "date": "2019-06-10",
      "work_performed": "Engine overhaul",
      "parts_replaced": ["pistons", "rings", "injectors"],
      "technician": "TECH-1156",
      "hours_worked": 24.0
    },
    {
      "date": "2024-01-15",
      "work_performed": "Fuel system service",
      "parts_replaced": ["fuel_filters", "fuel_pump"],
      "technician": "TECH-4429", 
      "hours_worked": 6.5
    }
  ],
  "priority": "high"
};

// Example 3: Electrical System Issue  
const sampleMaintenanceReport3 = {
  "machine_id": "CAT-336-2024-012",
  "machine_type": "CAT-336 Excavator",
  "engine_hours": 7230,
  "year_of_manufacture": 2018,
  "timestamp": "2025-03-26T14:22:10Z", 
  "operator_id": "TECH-6634",
  "location": "Site-Gamma-Zone-2",
  "issue_report": "Intermittent electrical issues affecting multiple systems. Dashboard lights flickering, radio cutting out, and occasional loss of power to hydraulic controls. Battery voltage seems normal but alternator output fluctuating. Issue appears weather-related as problems worsen in damp conditions.",
  "sensor_data": {
    "battery_voltage": 12.4,
    "alternator_output": 13.1,
    "engine_temperature": 185.3,
    "hydraulic_pressure": 2890.5,
    "vibration": 0.15,
    "fuel_level": 0.78,
    "oil_pressure": 48.9
  },
  "maintenance_history": [
    {
      "date": "2022-11-03",
      "work_performed": "Electrical system inspection",
      "parts_replaced": ["battery", "alternator_belt"],
      "technician": "TECH-7788",
      "hours_worked": 3.5
    },
    {
      "date": "2024-02-28",
      "work_performed": "Preventive maintenance", 
      "parts_replaced": ["air_filter", "oil_filter"],
      "technician": "TECH-3312",
      "hours_worked": 1.5
    }
  ],
  "priority": "medium"
};

// Expected LLM output structure (for reference)
const expectedLLMOutput = {
  "likely_causes": [
    "Worn hydraulic seals around main pump",
    "Deteriorated hydraulic hoses due to age and hours",
    "Hydraulic fitting wear from vibration"
  ],
  "recommended_actions": [
    "Inspect hydraulic fluid levels and check for visible leaks",
    "Examine seals around main hydraulic pump for wear or damage", 
    "Conduct pressure test to assess system integrity",
    "Inspect hydraulic lines and fittings for signs of wear",
    "Replace defective seals, lines, or components as needed"
  ],
  "likely_parts_needed": [
    "Hydraulic pump seal kit",
    "Hydraulic fluid (5 gallons)",
    "Hydraulic hose assembly",
    "Hydraulic fittings"
  ],
  "estimated_repair_time": "4-6 hours",
  "severity": "medium", 
  "urgency": "moderate",
  "confidence_score": 0.85,
  "additional_notes": "Given the machine age and hours, this is expected wear. Monitor closely to prevent major system failure."
};

// Export sample data for testing
module.exports = {
  sampleMaintenanceReport1,
  sampleMaintenanceReport2, 
  sampleMaintenanceReport3,
  expectedLLMOutput
};
