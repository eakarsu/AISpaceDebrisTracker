require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { initDB } = require('./database');

const authRoutes = require('./routes/auth');
const spaceObjectsRoutes = require('./routes/spaceObjects');
const satellitesRoutes = require('./routes/satellites');
const conjunctionEventsRoutes = require('./routes/conjunctionEvents');
const launchWindowsRoutes = require('./routes/launchWindows');
const debrisRemovalRoutes = require('./routes/debrisRemoval');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors({ origin: `http://localhost:${process.env.FRONTEND_PORT || 3000}`, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/space-objects', spaceObjectsRoutes);
app.use('/api/satellites', satellitesRoutes);
app.use('/api/conjunction-events', conjunctionEventsRoutes);
app.use('/api/launch-windows', launchWindowsRoutes);
app.use('/api/debris-removal', debrisRemovalRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'operational', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`🚀 Space Debris Tracker API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
