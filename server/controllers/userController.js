const bcrypt = require('bcryptjs');
const db = require('../config/database');

exports.getUsers = async (req, res) => {
    try {
        let query = `SELECT u.id, u.email, u.full_name, u.role, u.pole_id, p.name as pole_name
             FROM users u
             LEFT JOIN poles p ON u.pole_id = p.id`;
        const params = [];

        if (req.user.role === 'POLE_MANAGER') {
            query += ` WHERE u.pole_id = ?`;
            params.push(req.user.pole_id);
        }

        query += ` ORDER BY u.created_at DESC`;

        const [users] = await db.query(query, params);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
    }
};

exports.getUsersByPole = async (req, res) => {
    try {
        const poleId = Number(req.params.poleId);
        if (req.user.role === 'POLE_MANAGER' && Number(req.user.pole_id) !== poleId) {
            return res.status(403).json({ message: 'Vous ne pouvez voir que les membres de votre propre pôle' });
        }

        const [users] = await db.query(
            `SELECT u.id, u.email, u.full_name, u.role, u.pole_id, p.name as pole_name
             FROM users u
             LEFT JOIN poles p ON u.pole_id = p.id
             WHERE u.pole_id = ?
             ORDER BY u.created_at DESC`,
            [poleId]
        );

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs du pôle' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { email, password, fullName, role, poleId } = req.body;
        
        // Vérifier si l'utilisateur existe
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(
            `INSERT INTO users (email, password_hash, full_name, role, pole_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [email, hashedPassword, fullName, role || 'MEMBER', poleId || null]
        );
        
        const [newUser] = await db.query(
            `SELECT id, email, full_name, role, pole_id FROM users WHERE id = ?`,
            [result.insertId]
        );
        
        res.status(201).json(newUser[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, role, poleId } = req.body;
        
        await db.query(
            'UPDATE users SET full_name = ?, role = ?, pole_id = ? WHERE id = ?',
            [fullName, role, poleId, id]
        );
        
        res.json({ message: 'Utilisateur mis à jour avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};