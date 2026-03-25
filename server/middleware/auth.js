const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Accès non autorisé' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await db.query(
            'SELECT id, email, full_name, role, pole_id FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Non authentifié' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Vous n\'avez pas les permissions nécessaires' 
            });
        }
        
        next();
    };
};

module.exports = { authenticate, authorize };