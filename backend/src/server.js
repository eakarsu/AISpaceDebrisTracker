require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./database');

const authRoutes = require('./routes/auth');
const spaceObjectsRoutes = require('./routes/spaceObjects');
const satellitesRoutes = require('./routes/satellites');
const conjunctionEventsRoutes = require('./routes/conjunctionEvents');
const launchWindowsRoutes = require('./routes/launchWindows');
const debrisRemovalRoutes = require('./routes/debrisRemoval');
const aiRoutes = require('./routes/ai');
const propagateRoutes = require('./routes/propagate');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security
app.use(helmet({ contentSecurityPolicy: false }));

// CORS - env-based origin
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || `http://localhost:${process.env.FRONTEND_PORT || 3000}`)
  .split(',').map(o => o.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '10mb' }));

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/space-objects', spaceObjectsRoutes);
app.use('/api/satellites', satellitesRoutes);
app.use('/api/conjunction-events', conjunctionEventsRoutes);
app.use('/api/launch-windows', launchWindowsRoutes);
app.use('/api/debris-removal', debrisRemovalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/propagate', propagateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'operational', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await initDB();
    app.use('/api/collision-clustering', require('./routes/collisionClustering')); app.use('/api/sensor-fusion', require('./routes/sensorFusion')); app.use('/api/multi-mission-optimizer', require('./routes/multiMissionOptimizer')); app.use('/api/debris-removal-logistics', require('./routes/debrisRemovalLogistics')); app.use('/api/regulatory-compliance-scoring', require('./routes/regulatoryComplianceScoring')); app.use('/api/real-time-conjunction-alerting', require('./routes/realTimeConjunctionAlerting'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-driven-debris-characterization-from-limited-observations-frontend', require('./routes/gapNoAiDrivenDebrisCharacterizationFromLimitedObservationsFrontend'));
app.use('/api/gap-no-multi-target-rendezvous-optimization-endpoint', require('./routes/gapNoMultiTargetRendezvousOptimizationEndpoint'));
app.use('/api/gap-no-sensor-fusion-ml-for-observation-confidence', require('./routes/gapNoSensorFusionMlForObservationConfidence'));
app.use('/api/gap-no-webhooks-or-push-notifications-for-real-time-conjunction', require('./routes/gapNoWebhooksOrPushNotificationsForRealTimeConjunction'));
app.use('/api/gap-no-integration-with-norad-tle-feeds-or-jspoc', require('./routes/gapNoIntegrationWithNoradTleFeedsOrJspoc'));
app.use('/api/gap-no-3d-visualization-of-debris-clouds-at-the', require('./routes/gapNo3dVisualizationOfDebrisCloudsAtThe'));
app.use('/api/gap-no-regulatory-compliance-tracking-backend-outer-space-treaty', require('./routes/gapNoRegulatoryComplianceTrackingBackendOuterSpaceTreaty'));
app.use('/api/gap-no-audit-logging', require('./routes/gapNoAuditLogging'));
app.use('/api/gap-no-multi-tenant-operator-support', require('./routes/gapNoMultiTenantOperatorSupport'));

app.listen(PORT, () => {
      console.log(`Space Debris Tracker API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
