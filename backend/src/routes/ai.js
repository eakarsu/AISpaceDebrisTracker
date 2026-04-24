const express = require('express');
const fetch = require('node-fetch');
const { pool } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

async function callOpenRouter(prompt, systemPrompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Space Debris Tracker'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'OpenRouter API error');
  }
  return data.choices[0].message.content;
}

async function saveAnalysis(feature, inputData, result, model) {
  await pool.query(
    'INSERT INTO ai_analyses (feature, input_data, result, model_used) VALUES ($1, $2, $3, $4)',
    [feature, JSON.stringify(inputData), JSON.stringify({ analysis: result }), model]
  );
}

// Collision Probability Calculator
router.post('/collision-probability', auth, async (req, res) => {
  try {
    const { object1, object2, distance, relativeVelocity } = req.body;
    const systemPrompt = `You are an expert space situational awareness analyst specializing in orbital mechanics and collision probability assessment. Provide detailed, professional analysis with specific numerical estimates. Format your response with clear sections using markdown headers (##). Include: Risk Assessment, Probability Analysis, Recommended Actions, and Timeline.`;
    const prompt = `Analyze the collision probability between these two space objects:

Object 1: ${object1}
Object 2: ${object2}
Closest Approach Distance: ${distance} km
Relative Velocity: ${relativeVelocity} km/s

Provide a comprehensive collision probability assessment including:
1. Estimated collision probability (with confidence interval)
2. Risk classification (Critical/High/Medium/Low)
3. Contributing orbital factors
4. Recommended avoidance maneuvers if needed
5. Monitoring timeline and decision points`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
    await saveAnalysis('collision-probability', req.body, result, model);
    res.json({ analysis: result, model, timestamp: new Date().toISOString(), feature: 'Collision Probability Calculator' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orbital Decay Prediction
router.post('/orbital-decay', auth, async (req, res) => {
  try {
    const { objectName, altitude, inclination, area, mass } = req.body;
    const systemPrompt = `You are an expert in orbital mechanics and atmospheric drag modeling. Provide detailed reentry predictions with specific timelines and risk assessments. Format your response with clear sections using markdown headers (##). Include: Decay Timeline, Risk Zones, Impact Assessment, and Monitoring Recommendations.`;
    const prompt = `Predict the orbital decay and reentry for this space object:

Object: ${objectName}
Current Altitude: ${altitude} km
Inclination: ${inclination}°
Cross-sectional Area: ${area} m²
Mass: ${mass} kg

Provide:
1. Estimated time to reentry
2. Decay rate analysis considering solar activity
3. Predicted reentry corridor
4. Ground impact risk assessment
5. Key altitude milestones and timeline
6. Recommended monitoring frequency`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
    await saveAnalysis('orbital-decay', req.body, result, model);
    res.json({ analysis: result, model, timestamp: new Date().toISOString(), feature: 'Orbital Decay Prediction' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Maneuver Planning Assistant
router.post('/maneuver-planning', auth, async (req, res) => {
  try {
    const { satelliteName, currentOrbit, targetOrbit, fuelRemaining, threat } = req.body;
    const systemPrompt = `You are an expert satellite operations engineer specializing in orbital maneuver planning. Provide detailed maneuver plans with delta-v budgets and timing. Format your response with clear sections using markdown headers (##). Include: Maneuver Plan, Delta-V Budget, Timeline, Risk Assessment, and Fuel Analysis.`;
    const prompt = `Plan an optimal maneuver for this satellite:

Satellite: ${satelliteName}
Current Orbit: ${currentOrbit}
Target/Safe Orbit: ${targetOrbit}
Fuel Remaining: ${fuelRemaining}%
Threat/Reason: ${threat}

Provide:
1. Optimal maneuver sequence (burns, timing, direction)
2. Delta-v budget for each burn
3. Fuel consumption estimate
4. Post-maneuver orbit verification plan
5. Risk assessment for the maneuver
6. Alternative maneuver options`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
    await saveAnalysis('maneuver-planning', req.body, result, model);
    res.json({ analysis: result, model, timestamp: new Date().toISOString(), feature: 'Maneuver Planning Assistant' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debris Field Analysis
router.post('/debris-analysis', auth, async (req, res) => {
  try {
    const { region, altitudeRange, source, objectCount } = req.body;
    const systemPrompt = `You are a space debris environment analyst specializing in debris field characterization and risk modeling. Provide comprehensive debris field analysis with statistical assessments. Format your response with clear sections using markdown headers (##). Include: Field Characterization, Density Analysis, Risk Assessment, Mitigation Recommendations, and Trend Projections.`;
    const prompt = `Analyze this debris field:

Region: ${region}
Altitude Range: ${altitudeRange}
Source Event: ${source}
Estimated Object Count: ${objectCount}

Provide:
1. Debris field characterization (size distribution, velocity spread)
2. Spatial density analysis
3. Collision risk to operational satellites
4. Expected field evolution over time
5. Mitigation recommendations
6. Comparison with historical debris events`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
    await saveAnalysis('debris-analysis', req.body, result, model);
    res.json({ analysis: result, model, timestamp: new Date().toISOString(), feature: 'Debris Field Analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Launch Window Optimizer
router.post('/launch-optimization', auth, async (req, res) => {
  try {
    const { missionName, launchSite, targetOrbit, payloadMass, vehicle } = req.body;
    const systemPrompt = `You are a launch operations analyst specializing in launch window optimization considering space debris avoidance, orbital mechanics, and mission constraints. Format your response with clear sections using markdown headers (##). Include: Optimal Windows, Debris Avoidance Analysis, Trajectory Options, Risk Assessment, and Recommendations.`;
    const prompt = `Optimize launch windows for this mission:

Mission: ${missionName}
Launch Site: ${launchSite}
Target Orbit: ${targetOrbit}
Payload Mass: ${payloadMass} kg
Launch Vehicle: ${vehicle}

Provide:
1. Top 3 optimal launch windows (with specific time ranges)
2. Debris avoidance analysis for each window
3. Trajectory optimization recommendations
4. Weather and environmental considerations
5. Backup window options
6. Risk ranking for each window`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
    await saveAnalysis('launch-optimization', req.body, result, model);
    res.json({ analysis: result, model, timestamp: new Date().toISOString(), feature: 'Launch Window Optimizer' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get AI analysis history
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_analyses ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
