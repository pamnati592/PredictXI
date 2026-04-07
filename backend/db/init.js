const fs = require('fs');
const path = require('path');
const pool = require('./connection');

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Database schema initialized');
  } catch (err) {
    console.error('Error initializing database schema:', err.message);
    throw err;
  }
}

module.exports = { initDb };
