const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'bmkxhddui88xlnd3oqst-mysql.services.clever-cloud.com',
    user: 'ubb1hzetrzofyjuc',
    password: 'CxrqBtc9aQ1pxtnuKRBv',
    database: 'bmkxhddui88xlnd3oqst'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database');
});

module.exports = db;