const mysql = require('mysql2/promise');
require('dotenv').config();

async function init() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || 'root',
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'crismatech_db'}\`;`);
        console.log('Database created or successfully verified.');
        await connection.end();
    } catch (err) {
        console.error('Failed to create database:', err.message);
    }
}

init();
