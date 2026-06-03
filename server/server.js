const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// Configuration CORS pour accepter Netlify
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://votre-app.netlify.app',
        'https://*.netlify.app'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const poleRoutes = require('./routes/poleRoutes');
const activityRoutes = require('./routes/activityRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/poles', poleRoutes);
app.use('/api/activities', activityRoutes);

// Route de santé
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Serveur démarré avec succès' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Une erreur est survenue' });
});

// Initialisation de la base de données
async function initDatabase() {
    // Lire le fichier SQL (à la racine du projet, un niveau au-dessus de server/)
    const sqlFilePath = path.join(__dirname, '..', 'database.sql');

    if (!fs.existsSync(sqlFilePath)) {
        console.warn(`[DB Init] Fichier database.sql introuvable à ${sqlFilePath}, initialisation ignorée.`);
        return;
    }

    let connection;
    try {
        // Connexion sans sélectionner de base de données pour pouvoir la créer si besoin
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        console.log('[DB Init] Connexion établie, exécution du script SQL...');

        let sql = fs.readFileSync(sqlFilePath, 'utf8');

        // Rendre les CREATE TABLE idempotents en ajoutant IF NOT EXISTS
        sql = sql.replace(/CREATE TABLE(?!\s+IF NOT EXISTS)/gi, 'CREATE TABLE IF NOT EXISTS');

        // Rendre les INSERT idempotents en utilisant INSERT IGNORE
        sql = sql.replace(/^INSERT INTO/gim, 'INSERT IGNORE INTO');

        await connection.query(sql);

        console.log('[DB Init] Base de données initialisée avec succès.');
    } catch (err) {
        // Une erreur d'initialisation ne doit pas empêcher le démarrage du serveur
        console.error('[DB Init] Erreur lors de l\'initialisation de la base de données :', err.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Démarrage : initialiser la BDD puis lancer le serveur
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
});
