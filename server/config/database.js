const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 17727, // Utilisez le port fourni par l'hébergeur
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl:{
        rejectUnauthorized: false
      },
    charset: 'utf8mb4'
});

const promisePool = pool.promise();

module.exports = promisePool;