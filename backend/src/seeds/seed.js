require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const { pool, initDB } = require('../database');

async function seed() {
  console.log('Initializing database tables...');
  await initDB();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear existing data
    await client.query('DELETE FROM ai_analyses');
    await client.query('DELETE FROM debris_removal_missions');
    await client.query('DELETE FROM launch_windows');
    await client.query('DELETE FROM conjunction_events');
    await client.query('DELETE FROM satellites');
    await client.query('DELETE FROM space_objects');
    await client.query('DELETE FROM users');

    // Reset sequences
    await client.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE space_objects_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE satellites_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE conjunction_events_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE launch_windows_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE debris_removal_missions_id_seq RESTART WITH 1");

    // Seed user
    const hashedPassword = await bcrypt.hash('SpaceDebris2024!', 10);
    await client.query(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3)",
      ['admin@spacedebris.gov', hashedPassword, 'Mission Commander']
    );
    console.log('User seeded: admin@spacedebris.gov / SpaceDebris2024!');

    // Seed 15 space objects
    const spaceObjects = [
      ['COSMOS 2251 DEB', '34001', 'Debris', 'LEO', 74.0, 850, 780, 101.2, '2009-02-10', 'Russia', 0.05, 'Active Tracking'],
      ['FENGYUN 1C DEB', '29479', 'Debris', 'LEO', 99.0, 890, 195, 96.7, '2007-01-11', 'China', 0.03, 'Active Tracking'],
      ['IRIDIUM 33 DEB', '33776', 'Debris', 'LEO', 86.4, 800, 690, 99.8, '2009-02-10', 'USA', 0.08, 'Active Tracking'],
      ['SL-8 R/B', '12345', 'Rocket Body', 'LEO', 82.9, 980, 950, 104.5, '1982-05-20', 'Russia', 5.2, 'Decaying'],
      ['ARIANE 5 R/B', '27445', 'Rocket Body', 'GTO', 7.0, 35786, 250, 630.0, '2002-12-11', 'ESA', 12.5, 'Stable'],
      ['DELTA II DEB', '25001', 'Debris', 'LEO', 36.0, 650, 400, 93.5, '1998-01-17', 'USA', 0.01, 'Decaying'],
      ['BREEZE-M DEB', '38746', 'Debris', 'MEO', 49.0, 19200, 350, 345.0, '2012-08-06', 'Russia', 2.3, 'Stable'],
      ['TITAN TRANSTAGE DEB', '03692', 'Debris', 'GEO', 12.5, 36200, 35500, 1420.0, '1968-09-19', 'USA', 0.7, 'Stable'],
      ['CENTAUR R/B', '28874', 'Rocket Body', 'GTO', 28.5, 35800, 185, 628.0, '2005-08-12', 'USA', 15.8, 'Stable'],
      ['COSMOS 1408 DEB', '49863', 'Debris', 'LEO', 82.6, 500, 440, 94.1, '2021-11-15', 'Russia', 0.02, 'Active Tracking'],
      ['H-2A R/B', '33496', 'Rocket Body', 'LEO', 98.6, 680, 660, 97.9, '2009-01-23', 'Japan', 4.1, 'Decaying'],
      ['PEGASUS DEB', '23106', 'Debris', 'LEO', 82.0, 720, 600, 97.5, '1994-06-27', 'USA', 0.004, 'Active Tracking'],
      ['CZ-4C R/B', '41458', 'Rocket Body', 'LEO', 97.8, 820, 490, 99.3, '2016-08-10', 'China', 6.8, 'Decaying'],
      ['MICROSAT-R DEB', '44208', 'Debris', 'LEO', 96.6, 300, 270, 90.3, '2019-03-27', 'India', 0.01, 'Decaying'],
      ['SOLWIND P78-1 DEB', '13552', 'Debris', 'LEO', 97.6, 630, 520, 96.2, '1985-09-13', 'USA', 0.06, 'Active Tracking']
    ];
    for (const obj of spaceObjects) {
      await client.query(
        `INSERT INTO space_objects (name, norad_id, object_type, orbit_type, inclination, apogee, perigee, period, launch_date, country, rcs, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        obj
      );
    }
    console.log('15 space objects seeded');

    // Seed 15 satellites
    const satellites = [
      ['STARLINK-5001', '55001', 'SpaceX', 'Communication', 'LEO', 550, 53.0, '2023-03-15', 7, 92.5, 'Operational'],
      ['GPS IIF-12', '40294', 'US Space Force', 'Navigation', 'MEO', 20200, 55.0, '2015-02-05', 15, 78.3, 'Operational'],
      ['ISS (ZARYA)', '25544', 'NASA/Roscosmos', 'Space Station', 'LEO', 420, 51.6, '1998-11-20', 30, 45.0, 'Operational'],
      ['HUBBLE SPACE TELESCOPE', '20580', 'NASA', 'Science', 'LEO', 540, 28.5, '1990-04-24', 35, 0, 'Operational'],
      ['SENTINEL-6A', '46984', 'ESA/NASA', 'Earth Observation', 'LEO', 1336, 66.0, '2020-11-21', 10, 95.0, 'Operational'],
      ['GOES-18', '51850', 'NOAA', 'Weather', 'GEO', 35786, 0.0, '2022-03-01', 15, 99.1, 'Operational'],
      ['JAMES WEBB SPACE TELESCOPE', '50463', 'NASA/ESA', 'Science', 'L2', 1500000, 0, '2021-12-25', 20, 98.5, 'Operational'],
      ['TIANGONG CSS', '48274', 'CNSA', 'Space Station', 'LEO', 390, 41.5, '2021-04-29', 15, 88.0, 'Operational'],
      ['WORLDVIEW-3', '40115', 'Maxar', 'Earth Observation', 'LEO', 617, 97.2, '2014-08-13', 12, 67.5, 'Operational'],
      ['GALILEO-FOC SAT-23', '43567', 'ESA', 'Navigation', 'MEO', 23222, 56.0, '2018-07-25', 15, 88.0, 'Operational'],
      ['LANDSAT 9', '49260', 'USGS/NASA', 'Earth Observation', 'LEO', 705, 98.2, '2021-09-27', 10, 97.0, 'Operational'],
      ['ASTRA 1N', '37775', 'SES', 'Communication', 'GEO', 35786, 0.0, '2011-08-06', 15, 62.0, 'Operational'],
      ['COSMOS 2558', '53328', 'Russian MoD', 'Surveillance', 'LEO', 440, 97.3, '2022-08-01', 10, 85.0, 'Operational'],
      ['INMARSAT-6 F1', '51862', 'Inmarsat', 'Communication', 'GEO', 35786, 0.0, '2021-12-22', 15, 98.0, 'Operational'],
      ['TERRA', '25994', 'NASA', 'Earth Observation', 'LEO', 705, 98.1, '1999-12-18', 20, 12.0, 'End of Life']
    ];
    for (const sat of satellites) {
      await client.query(
        `INSERT INTO satellites (name, norad_id, operator, mission_type, orbit_type, altitude, inclination, launch_date, expected_lifetime, fuel_remaining, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        sat
      );
    }
    console.log('15 satellites seeded');

    // Seed 15 conjunction events
    const conjunctionEvents = [
      ['ISS (ZARYA)', 'COSMOS 1408 DEB', '2026-04-15 08:30:00', 0.45, 0.00025, 14.2, 'Critical', 'Avoidance maneuver planned'],
      ['STARLINK-5001', 'FENGYUN 1C DEB', '2026-04-16 14:22:00', 1.2, 0.00008, 12.8, 'High', 'Auto-avoidance activated'],
      ['HUBBLE SPACE TELESCOPE', 'SL-8 R/B', '2026-04-17 03:45:00', 3.8, 0.00002, 10.5, 'Medium', 'Monitoring'],
      ['SENTINEL-6A', 'DELTA II DEB', '2026-04-18 19:10:00', 0.8, 0.00015, 13.7, 'Critical', 'Maneuver executed'],
      ['GPS IIF-12', 'BREEZE-M DEB', '2026-04-19 11:55:00', 15.2, 0.000001, 5.3, 'Low', 'No action required'],
      ['TIANGONG CSS', 'COSMOS 2251 DEB', '2026-04-20 06:30:00', 0.32, 0.00045, 14.8, 'Critical', 'Emergency maneuver'],
      ['WORLDVIEW-3', 'IRIDIUM 33 DEB', '2026-04-21 22:18:00', 2.1, 0.00005, 11.2, 'Medium', 'Under review'],
      ['LANDSAT 9', 'CZ-4C R/B', '2026-04-22 16:40:00', 5.5, 0.000008, 9.8, 'Low', 'Monitoring'],
      ['TERRA', 'PEGASUS DEB', '2026-04-23 09:15:00', 1.5, 0.00012, 13.1, 'High', 'Maneuver planned'],
      ['COSMOS 2558', 'MICROSAT-R DEB', '2026-04-24 01:30:00', 0.9, 0.00018, 14.5, 'Critical', 'Coordination with military'],
      ['STARLINK-5001', 'SOLWIND P78-1 DEB', '2026-04-25 12:00:00', 4.2, 0.000005, 8.9, 'Low', 'Auto-tracking'],
      ['ISS (ZARYA)', 'H-2A R/B', '2026-04-26 07:45:00', 0.68, 0.00032, 13.9, 'Critical', 'Crew shelter protocol'],
      ['GOES-18', 'TITAN TRANSTAGE DEB', '2026-04-27 20:30:00', 25.0, 0.0000005, 3.2, 'Low', 'No action required'],
      ['GALILEO-FOC SAT-23', 'ARIANE 5 R/B', '2026-04-28 15:10:00', 8.7, 0.000003, 6.7, 'Low', 'Monitoring'],
      ['INMARSAT-6 F1', 'CENTAUR R/B', '2026-04-29 10:22:00', 12.4, 0.000002, 4.1, 'Low', 'No action required']
    ];
    for (const evt of conjunctionEvents) {
      await client.query(
        `INSERT INTO conjunction_events (primary_object, secondary_object, tca, miss_distance, probability, relative_velocity, status, action_taken)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        evt
      );
    }
    console.log('15 conjunction events seeded');

    // Seed 15 launch windows
    const launchWindows = [
      ['STARLINK GROUP 9-1', 'KSC LC-39A', 'LEO 550km 53°', '2026-05-01 14:00:00', '2026-05-01 18:00:00', 'Falcon 9', 15600, 'Clear', 'Approved', 'Scheduled'],
      ['ARTEMIS III', 'KSC LC-39B', 'TLI', '2026-06-15 09:00:00', '2026-06-15 11:00:00', 'SLS Block 1', 27500, 'Pending', 'Under Review', 'Planning'],
      ['GPS III SV07', 'CCSFS SLC-40', 'MEO 20200km', '2026-05-10 06:30:00', '2026-05-10 08:30:00', 'Falcon 9', 4400, 'Clear', 'Approved', 'Confirmed'],
      ['SENTINEL-2C', 'CSG ELA-3', 'SSO 786km', '2026-05-20 01:15:00', '2026-05-20 01:45:00', 'Vega-C', 1200, 'Clear', 'Approved', 'Scheduled'],
      ['CREW DRAGON-12', 'KSC LC-39A', 'LEO ISS', '2026-07-01 12:00:00', '2026-07-01 16:00:00', 'Falcon 9', 12000, 'Pending', 'Pending', 'Planning'],
      ['ASTRA 1P', 'CSG ELA-3', 'GTO', '2026-05-25 22:00:00', '2026-05-26 02:00:00', 'Ariane 6', 11500, 'Clear', 'Approved', 'Scheduled'],
      ['CHANDRAYAAN-4', 'SDSC SHAR', 'TLI', '2026-08-10 04:00:00', '2026-08-10 06:00:00', 'LVM3', 3900, 'Pending', 'Under Review', 'Planning'],
      ['WORLDVIEW LEGION 3', 'VAFB SLC-4E', 'SSO 500km', '2026-05-15 18:30:00', '2026-05-15 19:30:00', 'Falcon 9', 1400, 'Clear', 'Approved', 'Confirmed'],
      ['O3B MPOWER 7-10', 'CCSFS SLC-40', 'MEO 8062km', '2026-06-01 08:00:00', '2026-06-01 12:00:00', 'Falcon 9', 7000, 'Pending', 'Approved', 'Scheduled'],
      ['EUCLID-2', 'CSG ELA-3', 'L2', '2026-09-15 10:00:00', '2026-09-15 12:00:00', 'Ariane 6', 2100, 'Pending', 'Under Review', 'Planning'],
      ['KUIPER 1-60', 'CCSFS SLC-41', 'LEO 590km', '2026-05-05 16:00:00', '2026-05-05 20:00:00', 'Atlas V', 9500, 'Clear', 'Approved', 'Confirmed'],
      ['INTELSAT 44', 'KSC LC-39A', 'GTO', '2026-06-20 23:00:00', '2026-06-21 01:00:00', 'Falcon Heavy', 6400, 'Pending', 'Pending', 'Planning'],
      ['NROL-192', 'VAFB SLC-6', 'Classified', '2026-07-15 05:00:00', '2026-07-15 07:00:00', 'Delta IV Heavy', 0, 'Clear', 'Approved', 'Scheduled'],
      ['TIANZHOU-8', 'Wenchang LC-2', 'LEO CSS', '2026-05-30 03:00:00', '2026-05-30 05:00:00', 'Long March 7', 6000, 'Pending', 'Approved', 'Scheduled'],
      ['MARS SAMPLE RETURN', 'CCSFS SLC-41', 'TMI', '2026-10-01 08:00:00', '2026-10-15 08:00:00', 'Atlas V', 4850, 'Pending', 'Under Review', 'Planning']
    ];
    for (const lw of launchWindows) {
      await client.query(
        `INSERT INTO launch_windows (mission_name, launch_site, target_orbit, window_start, window_end, vehicle, payload_mass, weather_status, debris_clearance, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        lw
      );
    }
    console.log('15 launch windows seeded');

    // Seed 15 debris removal missions
    const debrisRemovalMissions = [
      ['CLEARSPACE-1', 'VESPA (Upper Stage)', 'Capture & Deorbit', 110000000, '2026-09-01', 180, 0.75, 'In Development', 'ClearSpace SA'],
      ['ELSA-d Phase 2', 'COSMOS 2251 DEB', 'Magnetic Capture', 85000000, '2027-03-15', 120, 0.82, 'Planning', 'Astroscale'],
      ['ADRAS-J2', 'H-2A R/B (33496)', 'Robotic Arm', 95000000, '2027-06-01', 90, 0.78, 'Planning', 'Astroscale'],
      ['REMORA-1', 'SL-8 R/B (12345)', 'Net Capture', 72000000, '2027-09-01', 150, 0.65, 'Concept', 'JAXA'],
      ['CLEAN ORBIT-1', 'FENGYUN 1C DEB Field', 'Laser Ablation', 200000000, '2028-01-15', 365, 0.45, 'Research', 'ESA'],
      ['DRACO-1', 'BREEZE-M DEB', 'Ion Beam Shepherd', 130000000, '2027-12-01', 240, 0.60, 'Planning', 'Airbus Defence'],
      ['CLEAN-X', 'CENTAUR R/B (28874)', 'Harpoon Capture', 65000000, '2027-04-15', 100, 0.70, 'In Development', 'Surrey Space Centre'],
      ['ORBIT GUARDIAN-1', 'TITAN TRANSTAGE DEB', 'Tethered Deorbit', 88000000, '2028-06-01', 200, 0.55, 'Concept', 'NASA JPL'],
      ['PHOENIX-ADR', 'ARIANE 5 R/B', 'Robotic Grapple', 115000000, '2027-08-01', 160, 0.72, 'Planning', 'DARPA'],
      ['SLING-1', 'DELTA II DEB Cluster', 'Electromagnetic Tether', 55000000, '2028-03-01', 180, 0.50, 'Research', 'Tethers Unlimited'],
      ['KESSLER SHIELD', 'LEO Debris Field', 'Foam Deorbit', 45000000, '2028-09-01', 90, 0.40, 'Concept', 'LeoLabs'],
      ['COLLECT-R', 'CZ-4C R/B', 'Tentacle Capture', 78000000, '2027-11-01', 130, 0.68, 'Planning', 'CNSA'],
      ['NETRA-ADR', 'MICROSAT-R DEB', 'Net & Drag Sail', 42000000, '2028-01-01', 75, 0.72, 'Concept', 'ISRO'],
      ['OSA-2', 'Defunct GEO Satellites', 'GEO Servicing', 250000000, '2027-07-01', 365, 0.85, 'In Development', 'Northrop Grumman'],
      ['SPACE SWEEPER-1', 'Multiple LEO Targets', 'Multi-Target ADR', 180000000, '2028-06-15', 540, 0.62, 'Research', 'Korea Aerospace']
    ];
    for (const drm of debrisRemovalMissions) {
      await client.query(
        `INSERT INTO debris_removal_missions (mission_name, target_object, method, estimated_cost, launch_date, duration_days, success_probability, status, agency)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        drm
      );
    }
    console.log('15 debris removal missions seeded');

    await client.query('COMMIT');
    console.log('\nDatabase seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
