const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'bmkxhddui88xlnd3oqst-mysql.services.clever-cloud.com',
    user: 'ubb1hzetrzofyjuc',
    password: 'CxrqBtc9aQ1pxtnuKRBv',
    database: 'bmkxhddui88xlnd3oqst',
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

function handleDisconnect() {
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err.stack);
            setTimeout(handleDisconnect, 2000);
            return;
        }
        console.log('Connected to the database');
    });

    db.on('error', function(err) {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
            err.code === 'ECONNRESET' ||
            err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

module.exports = db;