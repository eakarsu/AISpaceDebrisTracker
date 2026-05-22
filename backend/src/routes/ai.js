const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');
const { default: rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// AI rate limiter
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'AI rate limit exceeded. Maximum 20 AI calls per hour.' },
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : ipKeyGenerator(req),
});

// parseAIJson utility
function parseAIJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) {}
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  try { return JSON.parse(cleaned); } catch (_) {}
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch (_) {}
  }
  return null;
}

async function callOpenRouter(prompt, systemPrompt) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e = new Error('AI provider not configured (OPENROUTER_API_KEY missing)');
    e.statusCode = 503;
    throw e;
  }
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
      'X-Title': 'AI Space Debris Tracker'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt || 'You are an expert space situational awareness analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'OpenRouter API error');
  }
  return data.choices[0].message.content;
}

async function saveAnalysis(feature, inputData, result, model, userId) {
  try {
    await pool.query(
      'INSERT INTO ai_analyses (feature, input_data, result, model_used, user_id) VALUES ($1, $2, $3, $4, $5)',
      [feature, JSON.stringify(inputData), JSON.stringify({ analysis: result }), model, userId || null]
    );
  } catch (e) { console.error('Failed to save analysis:', e.message); }
}

// Collision Probability Calculator
router.post('/collision-probability', auth, aiRateLimiter, async (req, res) => {
  try {
    const { object1, object2, distance, relativeVelocity } = req.body;

    // Fetch related conjunction events from DB for grounding
    const conjunctions = await pool.query(
      `SELECT primary_object, secondary_object, miss_distance, probability, relative_velocity, status
       FROM conjunction_events ORDER BY created_at DESC LIMIT 5`
    );

    const systemPrompt = `You are an expert space situational awareness analyst. Always respond with valid JSON only.`;
    const prompt = `Analyze the collision probability between these two space objects.
Object 1: ${object1}
Object 2: ${object2}
Closest Approach Distance: ${distance} km
Relative Velocity: ${relativeVelocity} km/s

Recent conjunction events in database for reference:
${JSON.stringify(conjunctions.rows, null, 2)}

Respond ONLY with valid JSON:
{
  "analysis": {
    "risk_level": "<Critical|High|Medium|Low>",
    "probability": <number 0-1>,
    "recommended_actions": ["<string>", ...],
    "timeline": "<string>",
    "estimated_probability": "<string>",
    "avoidance_maneuver_needed": <true|false>,
    "monitoring_frequency": "<string>"
  }
}`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(result);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
    await saveAnalysis('collision-probability', req.body, parsed?.analysis || result, model, req.user?.id);

    res.json({
      analysis: parsed?.analysis || { summary: result },
      model, timestamp: new Date().toISOString(),
      feature: 'Collision Probability Calculator',
      comparisons: conjunctions.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orbital Decay Prediction
router.post('/orbital-decay', auth, aiRateLimiter, async (req, res) => {
  try {
    const { objectName, altitude, inclination, area, mass } = req.body;

    // Fetch related space objects at similar altitude
    const similar = await pool.query(
      `SELECT name, perigee, inclination, rcs, status
       FROM space_objects
       WHERE perigee BETWEEN $1 AND $2
       LIMIT 5`,
      [Math.max(0, (parseFloat(altitude) || 0) - 50), (parseFloat(altitude) || 0) + 50]
    );

    const systemPrompt = 'You are an expert in orbital mechanics. Always respond with valid JSON only.';
    const prompt = `Predict the orbital decay and reentry for this space object.
Object: ${objectName}
Current Altitude: ${altitude} km
Inclination: ${inclination}°
Cross-sectional Area: ${area} m²
Mass: ${mass} kg

Similar objects in database at nearby altitudes:
${JSON.stringify(similar.rows, null, 2)}

Respond ONLY with valid JSON:
{
  "analysis": {
    "risk_level": "<Critical|High|Medium|Low>",
    "probability": <number 0-1>,
    "recommended_actions": ["<string>", ...],
    "timeline": "<estimated reentry date range>",
    "decay_rate": "<string>",
    "reentry_window": "<string>",
    "impact_risk": "<string>"
  }
}`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(result);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
    await saveAnalysis('orbital-decay', req.body, parsed?.analysis || result, model, req.user?.id);

    res.json({
      analysis: parsed?.analysis || { summary: result },
      model, timestamp: new Date().toISOString(),
      feature: 'Orbital Decay Prediction'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Maneuver Planning Assistant
router.post('/maneuver-planning', auth, aiRateLimiter, async (req, res) => {
  try {
    const { satelliteName, currentOrbit, targetOrbit, fuelRemaining, threat } = req.body;

    // Get satellite details from DB
    const satDetails = await pool.query(
      `SELECT name, orbit_type, altitude, fuel_remaining, status FROM satellites WHERE name ILIKE $1 LIMIT 1`,
      [`%${satelliteName}%`]
    );

    const systemPrompt = 'You are an expert satellite operations engineer. Always respond with valid JSON only.';
    const prompt = `Plan an optimal maneuver for this satellite.
Satellite: ${satelliteName}
Current Orbit: ${currentOrbit}
Target/Safe Orbit: ${targetOrbit}
Fuel Remaining: ${fuelRemaining}%
Threat/Reason: ${threat}
${satDetails.rows[0] ? `\nDB Record: ${JSON.stringify(satDetails.rows[0])}` : ''}

Respond ONLY with valid JSON:
{
  "analysis": {
    "risk_level": "<Critical|High|Medium|Low>",
    "probability": <number 0-1>,
    "recommended_actions": ["<string>", ...],
    "timeline": "<maneuver timing>",
    "delta_v_budget": "<string>",
    "fuel_consumption": "<string>",
    "maneuver_sequence": ["<step>", ...]
  }
}`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(result);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
    await saveAnalysis('maneuver-planning', req.body, parsed?.analysis || result, model, req.user?.id);

    res.json({
      analysis: parsed?.analysis || { summary: result },
      model, timestamp: new Date().toISOString(),
      feature: 'Maneuver Planning Assistant'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debris Field Analysis
router.post('/debris-analysis', auth, aiRateLimiter, async (req, res) => {
  try {
    const { region, altitudeRange, source, objectCount } = req.body;

    // Fetch debris objects in similar altitude range from DB
    const [minAlt, maxAlt] = (altitudeRange || '200-2000').split('-').map(Number);
    const objects = await pool.query(
      `SELECT name, object_type, perigee, apogee, country, rcs FROM space_objects
       WHERE perigee BETWEEN $1 AND $2 LIMIT 10`,
      [minAlt || 0, maxAlt || 2000]
    );

    const systemPrompt = 'You are a space debris environment analyst. Always respond with valid JSON only.';
    const prompt = `Analyze this debris field.
Region: ${region}
Altitude Range: ${altitudeRange}
Source Event: ${source}
Estimated Object Count: ${objectCount}

Objects in similar altitude range from database:
${JSON.stringify(objects.rows, null, 2)}

Respond ONLY with valid JSON:
{
  "analysis": {
    "risk_level": "<Critical|High|Medium|Low>",
    "probability": <number 0-1>,
    "recommended_actions": ["<string>", ...],
    "timeline": "<field evolution timeline>",
    "density_assessment": "<string>",
    "collision_risk": "<string>",
    "mitigation_priority": "<Urgent|High|Medium|Low>"
  }
}`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(result);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
    await saveAnalysis('debris-analysis', req.body, parsed?.analysis || result, model, req.user?.id);

    res.json({
      analysis: parsed?.analysis || { summary: result },
      model, timestamp: new Date().toISOString(),
      feature: 'Debris Field Analysis'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Launch Window Optimizer
router.post('/launch-optimization', auth, aiRateLimiter, async (req, res) => {
  try {
    const { missionName, launchSite, targetOrbit, payloadMass, vehicle } = req.body;

    // Fetch existing launch windows from DB
    const windows = await pool.query(
      `SELECT mission_name, launch_site, target_orbit, window_start, window_end, debris_clearance, status
       FROM launch_windows ORDER BY created_at DESC LIMIT 5`
    );

    const systemPrompt = 'You are a launch operations analyst. Always respond with valid JSON only.';
    const prompt = `Optimize launch windows for this mission.
Mission: ${missionName}
Launch Site: ${launchSite}
Target Orbit: ${targetOrbit}
Payload Mass: ${payloadMass} kg
Launch Vehicle: ${vehicle}

Recent launch windows in database:
${JSON.stringify(windows.rows, null, 2)}

Respond ONLY with valid JSON:
{
  "analysis": {
    "risk_level": "<Critical|High|Medium|Low>",
    "probability": <number 0-1>,
    "recommended_actions": ["<string>", ...],
    "timeline": "<primary window>",
    "optimal_windows": ["<window 1>", "<window 2>", "<window 3>"],
    "debris_avoidance_rating": "<Good|Moderate|Poor>",
    "backup_windows": ["<string>", ...]
  }
}`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(result);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
    await saveAnalysis('launch-optimization', req.body, parsed?.analysis || result, model, req.user?.id);

    res.json({
      analysis: parsed?.analysis || { summary: result },
      model, timestamp: new Date().toISOString(),
      feature: 'Launch Window Optimizer'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/reentry-predict - Predict reentry for low-orbit objects
router.post('/reentry-predict', auth, aiRateLimiter, async (req, res) => {
  try {
    const { object_id, altitude_threshold = 400 } = req.body;

    // Fetch objects below threshold altitude
    const query = object_id
      ? await pool.query('SELECT * FROM space_objects WHERE id=$1', [object_id])
      : await pool.query('SELECT * FROM space_objects WHERE perigee < $1 AND status != \'Decayed\' ORDER BY perigee ASC LIMIT 10', [altitude_threshold]);

    const objects = query.rows;
    if (objects.length === 0) return res.json({ analysis: [], message: 'No objects found below threshold' });

    const systemPrompt = 'You are an expert in orbital mechanics and reentry prediction. Always respond with valid JSON only.';
    const prompt = `Predict reentry windows for these space objects below ${altitude_threshold}km altitude.
Objects:
${JSON.stringify(objects, null, 2)}

Respond ONLY with valid JSON:
{
  "analysis": {
    "risk_level": "<Critical|High|Medium|Low>",
    "probability": <number 0-1>,
    "recommended_actions": ["<string>", ...],
    "timeline": "<estimated reentry window>",
    "objects_analyzed": <number>,
    "high_risk_objects": ["<object name>", ...],
    "reentry_predictions": [{"name":"<string>","reentry_window":"<string>","risk":"<High|Medium|Low>"}]
  }
}`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(result);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
    await saveAnalysis('reentry-predict', { object_id, altitude_threshold }, parsed?.analysis || result, model, req.user?.id);

    res.json({
      analysis: parsed?.analysis || { summary: result },
      objects_checked: objects.length,
      model, timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/reentry-monitor - Auto-create alerts for objects with reentry < 30 days
router.post('/reentry-monitor', auth, aiRateLimiter, async (req, res) => {
  try {
    const objects = await pool.query(
      `SELECT * FROM space_objects WHERE perigee < 400 AND status != 'Decayed' ORDER BY perigee ASC LIMIT 20`
    );

    if (objects.rows.length === 0) {
      return res.json({ message: 'No objects below 400km to monitor', alerts_created: 0 });
    }

    const systemPrompt = 'You are an expert in orbital mechanics. Always respond with valid JSON only.';
    const prompt = `Evaluate these ${objects.rows.length} space objects below 400km for reentry risk within 30 days.
Objects:
${JSON.stringify(objects.rows, null, 2)}

Respond ONLY with valid JSON:
{
  "analysis": {
    "risk_level": "<Critical|High|Medium|Low>",
    "probability": <number 0-1>,
    "recommended_actions": ["<string>", ...],
    "timeline": "<overall assessment>",
    "imminent_reentries": [{"name":"<string>","days_to_reentry":<number>,"risk_level":"<string>"}]
  }
}`;

    const result = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(result);
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
    await saveAnalysis('reentry-monitor', { objects_count: objects.rows.length }, parsed?.analysis || result, model, req.user?.id);

    res.json({
      analysis: parsed?.analysis || { summary: result },
      objects_monitored: objects.rows.length,
      model, timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/history - Get AI analysis history with pagination
router.get('/history', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const feature = req.query.feature;

    let whereClause = feature ? 'WHERE feature=$3' : '';
    const params = feature ? [limit, offset, feature] : [limit, offset];

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ai_analyses${feature ? ' WHERE feature=$1' : ''}`,
      feature ? [feature] : []
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, feature, result, model_used, created_at FROM ai_analyses ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debris characterization — characterize debris fragment from limited observations
router.post('/debris-characterize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { observations, parentObject, sizeEstimate, materialHints } = req.body;
    const recent = await pool.query(
      `SELECT name, object_type, mass_kg, size_m, material, status FROM space_objects
       WHERE object_type ILIKE '%debris%' ORDER BY created_at DESC LIMIT 10`
    ).catch(() => ({ rows: [] }));

    const prompt = `Characterize this debris fragment from limited observations.
Observations: ${JSON.stringify(observations || [])}
Parent object hint: ${parentObject || 'unknown'}
Size estimate: ${sizeEstimate || 'unknown'}
Material hints: ${materialHints || 'unknown'}
Recent debris context: ${JSON.stringify(recent.rows)}

Respond ONLY with JSON:
{
  "likely_origin": "rocket_body|payload_fragment|collision_remnant|natural|unknown",
  "size_class": "<1cm|1-10cm|10cm-1m|>1m",
  "mass_estimate_kg": <number>,
  "material_likely": "...",
  "tracking_priority": "low|medium|high|critical",
  "confidence": "low|medium|high",
  "rationale": "..."
}`;
    const text = await callOpenRouter(prompt);
    const parsed = parseAIJson(text);
    if (!parsed) return res.status(422).json({ error: 'AI returned invalid JSON', raw: text });
    await saveAnalysis('debris-characterize', req.body, parsed, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', req.user?.id);
    res.json({ analysis: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Predictive collision clustering — group debris by likely fragmentation parent
router.post('/collision-clustering', auth, aiRateLimiter, async (req, res) => {
  try {
    const { region } = req.body;
    const debrisRows = await pool.query(
      `SELECT id, name, object_type, status FROM space_objects ORDER BY created_at DESC LIMIT 50`
    ).catch(() => ({ rows: [] }));
    const conjunctions = await pool.query(
      `SELECT primary_object, secondary_object, miss_distance, probability FROM conjunction_events ORDER BY created_at DESC LIMIT 30`
    ).catch(() => ({ rows: [] }));

    const prompt = `Cluster debris by likely fragmentation parent and recommend mitigation priority.
Region of interest: ${region || 'all'}
Tracked objects: ${JSON.stringify(debrisRows.rows)}
Recent conjunctions: ${JSON.stringify(conjunctions.rows)}

Respond ONLY with JSON:
{
  "clusters": [{"parent": "...", "members": ["..."], "estimated_population": <number>, "altitude_band_km": "...", "priority": "low|medium|high|critical"}],
  "recommended_priority_order": ["..."],
  "summary": "..."
}`;
    const text = await callOpenRouter(prompt);
    const parsed = parseAIJson(text);
    if (!parsed) return res.status(422).json({ error: 'AI returned invalid JSON', raw: text });
    await saveAnalysis('collision-clustering', req.body, parsed, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', req.user?.id);
    res.json({ analysis: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multi-target rendezvous optimization
router.post('/rendezvous-optimization', auth, aiRateLimiter, async (req, res) => {
  try {
    const { servicer, targets = [], deltaV_budget_mps, mission_window_days, constraints } = req.body || {};
    if (!servicer) return res.status(400).json({ error: 'servicer is required' });
    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ error: 'targets[] is required' });
    }
    const recent = await pool.query(
      `SELECT name, object_type, status FROM space_objects ORDER BY created_at DESC LIMIT 20`
    ).catch(() => ({ rows: [] }));

    const prompt = `Plan a multi-target rendezvous mission for an active debris removal / servicing spacecraft.
Servicer: ${JSON.stringify(servicer)}
Targets (ordered or unordered list): ${JSON.stringify(targets).slice(0, 2500)}
Delta-V budget (m/s): ${deltaV_budget_mps ?? 'unspecified'}
Mission window (days): ${mission_window_days ?? 'unspecified'}
Constraints: ${JSON.stringify(constraints || {})}
Recent tracked objects: ${JSON.stringify(recent.rows).slice(0, 1500)}

Respond ONLY with JSON:
{
  "recommended_sequence": [{"target_id": "...", "name": "...", "estimated_dv_mps": <number>, "transfer_days": <number>, "rationale": "..."}],
  "total_delta_v_mps": <number>,
  "total_duration_days": <number>,
  "feasibility": "feasible|tight|infeasible",
  "risk_flags": ["..."],
  "alternatives": [{"sequence": ["..."], "trade_off": "..."}],
  "summary": "..."
}`;
    const text = await callOpenRouter(prompt);
    const parsed = parseAIJson(text);
    if (!parsed) return res.status(422).json({ error: 'AI returned invalid JSON', raw: text });
    await saveAnalysis('rendezvous-optimization', req.body, parsed, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', req.user?.id);
    res.json({ analysis: parsed });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message });
  }
});

// Regulatory compliance scoring
router.post('/regulatory-compliance', auth, aiRateLimiter, async (req, res) => {
  try {
    const { mission, frameworks = ['UN_OST', 'ITU', 'FCC', 'ESA_DEBRIS_MITIGATION'], jurisdiction, mitigation_plan } = req.body || {};
    if (!mission) return res.status(400).json({ error: 'mission is required' });

    const prompt = `Score regulatory and debris-mitigation compliance for a proposed space mission.
Mission: ${JSON.stringify(mission).slice(0, 2000)}
Frameworks: ${JSON.stringify(frameworks)}
Jurisdiction: ${jurisdiction || 'unspecified'}
Mitigation plan: ${JSON.stringify(mitigation_plan || {}).slice(0, 1500)}

Respond ONLY with JSON:
{
  "overall_score": <0-100>,
  "framework_scores": [{"framework": "...", "score": <0-100>, "status": "compliant|partial|non_compliant", "notes": "..."}],
  "key_gaps": ["..."],
  "required_actions": [{"action": "...", "priority": "low|medium|high", "owner": "..."}],
  "risk_summary": "...",
  "documentation_recommendations": ["..."]
}`;
    const text = await callOpenRouter(prompt);
    const parsed = parseAIJson(text);
    if (!parsed) return res.status(422).json({ error: 'AI returned invalid JSON', raw: text });
    await saveAnalysis('regulatory-compliance', req.body, parsed, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', req.user?.id);
    res.json({ analysis: parsed });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message });
  }
});

// Multi-target rendezvous optimization (canonical path per audit backlog)
router.post('/multi-target-rendezvous', auth, aiRateLimiter, async (req, res) => {
  try {
    const { targets = [] } = req.body || {};
    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ error: 'targets[] is required' });
    }
    const recent = await pool.query(
      `SELECT name, object_type, perigee, apogee, status FROM space_objects ORDER BY created_at DESC LIMIT 20`
    ).catch(() => ({ rows: [] }));

    const prompt = `Plan an optimal multi-target rendezvous sequence for a servicing / debris-removal spacecraft.
Targets (id, optional TLE, last_known orbit, priority): ${JSON.stringify(targets).slice(0, 2500)}
Recent tracked objects for context: ${JSON.stringify(recent.rows).slice(0, 1500)}

Respond ONLY with JSON:
{
  "sequence": [{"target_id": "...", "order": <number>, "estimated_dv_mps": <number>, "transfer_days": <number>, "rationale": "..."}],
  "total_delta_v": <number>,
  "time_window": "<string, e.g. 'YYYY-MM-DD to YYYY-MM-DD'>",
  "risks": ["..."],
  "rationale": "..."
}`;
    const text = await callOpenRouter(prompt);
    const parsed = parseAIJson(text);
    if (!parsed) return res.status(422).json({ error: 'AI returned invalid JSON', raw: text });
    await saveAnalysis('multi-target-rendezvous', req.body, parsed, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', req.user?.id);
    res.json({ analysis: parsed });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message });
  }
});

// Regulatory compliance scoring (canonical path per audit backlog)
router.post('/regulatory-compliance-score', auth, aiRateLimiter, async (req, res) => {
  try {
    const { mission } = req.body || {};
    if (!mission || typeof mission !== 'object') {
      return res.status(400).json({ error: 'mission object is required' });
    }

    const prompt = `Score a proposed space mission against major regulatory and debris-mitigation frameworks (UN COPUOS, FCC, ITU, ESA).
Mission description: ${String(mission.description || 'unspecified').slice(0, 1500)}
Orbit: ${JSON.stringify(mission.orbit || 'unspecified')}
Debris mitigation plan: ${JSON.stringify(mission.debris_mitigation_plan || {}).slice(0, 1500)}
End-of-life plan: ${JSON.stringify(mission.end_of_life_plan || {}).slice(0, 1500)}

Respond ONLY with JSON:
{
  "overall_score": <0-100>,
  "scores_by_framework": {
    "UNCOPUOS": <0-100>,
    "FCC": <0-100>,
    "ITU": <0-100>,
    "ESA": <0-100>
  },
  "gaps": ["..."],
  "recommendations": ["..."]
}`;
    const text = await callOpenRouter(prompt);
    const parsed = parseAIJson(text);
    if (!parsed) return res.status(422).json({ error: 'AI returned invalid JSON', raw: text });
    await saveAnalysis('regulatory-compliance-score', req.body, parsed, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', req.user?.id);
    res.json({ analysis: parsed });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message });
  }
});

module.exports = router;
