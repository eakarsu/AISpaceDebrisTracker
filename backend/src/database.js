const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'space_debris_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS space_objects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        norad_id VARCHAR(50) UNIQUE,
        object_type VARCHAR(100),
        orbit_type VARCHAR(100),
        inclination DECIMAL,
        apogee DECIMAL,
        perigee DECIMAL,
        period DECIMAL,
        launch_date DATE,
        country VARCHAR(100),
        rcs DECIMAL,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS satellites (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        norad_id VARCHAR(50) UNIQUE,
        operator VARCHAR(255),
        mission_type VARCHAR(100),
        orbit_type VARCHAR(100),
        altitude DECIMAL,
        inclination DECIMAL,
        launch_date DATE,
        expected_lifetime INTEGER,
        fuel_remaining DECIMAL,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conjunction_events (
        id SERIAL PRIMARY KEY,
        primary_object VARCHAR(255),
        secondary_object VARCHAR(255),
        tca TIMESTAMP,
        miss_distance DECIMAL,
        probability DECIMAL,
        relative_velocity DECIMAL,
        status VARCHAR(50),
        action_taken VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS launch_windows (
        id SERIAL PRIMARY KEY,
        mission_name VARCHAR(255),
        launch_site VARCHAR(255),
        target_orbit VARCHAR(100),
        window_start TIMESTAMP,
        window_end TIMESTAMP,
        vehicle VARCHAR(255),
        payload_mass DECIMAL,
        weather_status VARCHAR(50),
        debris_clearance VARCHAR(50),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS debris_removal_missions (
        id SERIAL PRIMARY KEY,
        mission_name VARCHAR(255),
        target_object VARCHAR(255),
        method VARCHAR(100),
        estimated_cost DECIMAL,
        launch_date DATE,
        duration_days INTEGER,
        success_probability DECIMAL,
        status VARCHAR(50),
        agency VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY,
        feature VARCHAR(100),
        input_data JSONB,
        result JSONB,
        model_used VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database tables:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
