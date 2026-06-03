const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });

    const [weekly] = await pool.query('SHOW COLUMNS FROM weekly_programs');
    console.log('weekly_programs columns:');
    weekly.forEach(col => console.log(col.Field, col.Type));

    const [activities] = await pool.query('SHOW COLUMNS FROM activities');
    console.log('\nactivities columns:');
    activities.forEach(col => console.log(col.Field, col.Type));

    const [poles] = await pool.query("SHOW TABLES LIKE 'weekly_programs'");
    console.log('\nweekly_programs exists:', poles.length > 0);

    await pool.end();
  } catch (err) {
    console.error('ERROR', err.message, err.sqlMessage || '');
    process.exit(1);
  }
})();
