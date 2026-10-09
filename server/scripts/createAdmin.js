const bcrypt = require('bcryptjs');
const db = require('../config/database');

const createAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        const fullName = process.env.ADMIN_FULL_NAME || 'Super Admin';

        if (!email || !password || password.length < 12) {
            throw new Error('Définissez ADMIN_EMAIL et ADMIN_PASSWORD (12 caractères minimum).');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            `INSERT INTO users (email, password_hash, full_name, role) 
             VALUES (?, ?, ?, 'SUPER_ADMIN')`,
            [email, hashedPassword, fullName]
        );
        console.log('Admin créé avec succès !');
    } catch (error) {
        console.error('Erreur:', error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
};

createAdmin();