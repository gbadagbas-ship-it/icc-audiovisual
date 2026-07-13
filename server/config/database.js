const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Allow toggling SSL with env var `DB_USE_SSL=true` (useful for hosted DBs like Aiven).
// For local development, leave it undefined/false to avoid `HANDSHAKE_NO_SSL_SUPPORT`.
const useSsl = (process.env.DB_USE_SSL === 'true') || (process.env.DB_HOST && process.env.DB_HOST.includes('aiven'));

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

if (useSsl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

const promisePool = pool.promise();

module.exports = promisePool;