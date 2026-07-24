'use strict';
const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./database');

async function prepareRuntime() {
  await initDB();
  const email = (process.env.PROVISION_ADMIN_EMAIL || 'runtime-admin@example.com').trim().toLowerCase();
  const passwordHash = await bcrypt.hash(process.env.PROVISION_ADMIN_PASSWORD || 'RuntimeAcceptance123!', 12);
  await pool.query(
    `INSERT INTO users(email,password,name,role) VALUES($1,$2,$3,'admin')
     ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role='admin'`,
    [email, passwordHash, process.env.PROVISION_ADMIN_NAME || 'RuntimeAdmin']
  );
}

module.exports = { prepareRuntime };
