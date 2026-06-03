const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.register = async (req, res) => {
    try {
        const { email, password, fullName, role, poleId } = req.body;
        
        // Vérifier si l'utilisateur existe déjà
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Créer l'utilisateur
        const [result] = await db.query(
            `INSERT INTO users (email, password_hash, full_name, role, pole_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [email, hashedPassword, fullName, role || 'MEMBER', poleId || null]
        );
        
        const [newUser] = await db.query(
            `SELECT id, email, full_name, role, pole_id FROM users WHERE id = ?`,
            [result.insertId]
        );
        
        // Générer le token
        const token = jwt.sign(
            { id: newUser[0].id, email: newUser[0].email, role: newUser[0].role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: newUser[0],
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Vérifier si l'utilisateur existe
        const [users] = await db.query(
            `SELECT u.*, p.name as pole_name 
             FROM users u 
             LEFT JOIN poles p ON u.pole_id = p.id 
             WHERE u.email = ?`,
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
        
        const user = users[0];
        
        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
        
        // Générer le token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.json({
            message: 'Connexion réussie',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                poleId: user.pole_id,
                poleName: user.pole_name
            },
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
};