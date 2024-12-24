const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'bmkxhddui88xlnd3oqst-mysql.services.clever-cloud.com',
  user: 'ubb1hzetrzofyjuc',
  password: 'CxrqBtc9aQ1pxtnuKRBv',
  database: 'bmkxhddui88xlnd3oqst',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export promise wrapper
module.exports = pool.promise();