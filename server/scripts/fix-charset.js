const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

(async () => {
  try {
    console.log('🔄 Correction du charset pour utf8mb4 (support des emojis)...');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Tables avec colonnes TEXT qui doivent supporter les emojis
    const tables = [
      {
        name: 'activity_reports',
        columns: ['content', 'attendance', 'technical_issues', 'suggestions']
      },
      {
        name: 'weekly_reports',
        columns: ['what_worked', 'what_didnt_work', 'observations', 'attendance', 'technical_issues', 'suggestions']
      },
      {
        name: 'activities',
        columns: ['name', 'location']
      },
      {
        name: 'poles',
        columns: ['name', 'description']
      },
      {
        name: 'users',
        columns: ['email', 'full_name']
      }
    ];

    for (const table of tables) {
      for (const column of table.columns) {
        try {
          await connection.query(
            `ALTER TABLE \`${table.name}\` MODIFY \`${column}\` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          );
          console.log(`  ✅ ${table.name}.${column}`);
        } catch (err) {
          if (err.code === 'ER_BAD_FIELD_ERROR') {
            console.warn(`  ⚠️  Colonne ${table.name}.${column} n'existe pas, ignoré`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log('✅ Charset corrigé avec succès! Les emojis sont maintenant supportés.');
    await connection.end();
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
})();