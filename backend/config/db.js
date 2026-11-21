const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'batloung_farm',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    decimalNumbers: true
});

async function testConnection() {
    const connection = await db.getConnection();
    try {
        await connection.ping();
    } finally {
        connection.release();
    }
}

module.exports = db;
module.exports.testConnection = testConnection;
