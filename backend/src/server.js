require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool } = require('./database');

const authRoutes = require('./routes/auth');
const spaceObjectsRoutes = require('./routes/spaceObjects');
const satellitesRoutes = require('./routes/satellites');
const conjunctionEventsRoutes = require('./routes/conjunctionEvents');
const launchWindowsRoutes = require('./routes/launchWindows');
const debrisRemovalRoutes = require('./routes/debrisRemoval');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;
if ((process.env.JWT_SECRET || '').length < 32 || !process.env.GOVERNANCE_TENANT_ID || !process.env.DATABASE_URL) throw new Error('JWT_SECRET (32+ characters), GOVERNANCE_TENANT_ID, and DATABASE_URL are required');
const generatedRoutesEnabled = process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production';

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
app.get('/api/health', (req, res) => res.json({ status: 'operational', timestamp: new Date().toISOString() }));
app.use('/api', authMiddleware);
app.use('/api/space-objects', spaceObjectsRoutes);
app.use('/api/satellites', satellitesRoutes);
app.use('/api/conjunction-events', conjunctionEventsRoutes);
app.use('/api/launch-windows', launchWindowsRoutes);
app.use('/api/debris-removal', debrisRemovalRoutes);
if (generatedRoutesEnabled) app.use('/api/ai', require('./routes/ai'));
if (generatedRoutesEnabled) app.use('/api/propagate', require('./routes/propagate'));
app.use('/api/governed-debris-operations', require('./governance'));
app.use('/api/governance', require('./governance'));

async function start() {
  try {
    await pool.query('SELECT 1');
    if (generatedRoutesEnabled) app.use('/api/collision-clustering', require('./routes/collisionClustering'));

app.listen(PORT, () => {
      console.log(`Space Debris Tracker API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
