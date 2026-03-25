const bcrypt = require('bcryptjs');
const db = require('../config/database');

const createAdmin = async () => {
    const email = 'admin@icc.com';
    const password = 'admin123';
    const fullName = 'Super Admin';
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        await db.query(
            `INSERT INTO users (email, password_hash, full_name, role) 
             VALUES (?, ?, ?, 'SUPER_ADMIN')`,
            [email, hashedPassword, fullName]
        );
        console.log('Admin créé avec succès !');
    } catch (error) {
        console.error('Erreur:', error.message);
    }
    
    process.exit();
};

createAdmin();