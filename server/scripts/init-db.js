const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

(async () => {
  try {
    console.log('🔄 Initialisation de la base de données...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });


    // Lire le fichier database.sql
    const sqlFile = path.join(__dirname, '../../database.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Exécuter database.sql : on split sur les délimiteurs des procédures.
    // On garde la logique "DELIMITER //" et on exécute le reste statement-by-statement.
    const sections = sqlContent.split('DELIMITER //');

    // Partie avant les procédures/fonctions
    const head = sections[0];
    if (head && head.trim()) {
      // Traiter DATABASE/USE/CREATE TABLE... en conservant les statements complets.
      const statements = head
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await connection.query(statement + ';');
      }
    }

    // Parties procédures/fonctions
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];

      const [procedurePart] = section.split('DELIMITER ;');
      if (!procedurePart || !procedurePart.trim()) continue;

      const procedureContent = procedurePart.replace(/\n/g, '\n').trim();

      try {
        await connection.query(procedureContent);
      } catch (err) {
        // Les procédures/fonctions peuvent échouer si elles existent déjà.
        if (err && err.message && !err.message.toLowerCase().includes('already exists')) {
          // n'affiche qu'un extrait
          console.warn('⚠️  Avertissement SQL proc/fonction:', String(err.message).slice(0, 140));
        }
      }
    }


    console.log('✅ Base de données initialisée avec succès!');
    await connection.end();
  } catch (err) {
    console.error('❌ Erreur lors de l\'initialisation:', err.message);
    process.exit(1);
  }
})();
