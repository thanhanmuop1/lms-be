const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://root:nYuvgkXOWMmnN5VZS2njn5Z1EKoImHWX@dpg-ctl85btumphs73d7vtvg-a/lms_zkxw',
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

module.exports = pool;