const db = require('../config/database');

exports.getPoles = async (req, res) => {
    try {
        const [poles] = await db.query(
            `SELECT p.*, COUNT(u.id) as user_count 
             FROM poles p
             LEFT JOIN users u ON p.id = u.pole_id
             GROUP BY p.id`
        );
        res.json(poles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération des pôles' });
    }
};

exports.createPole = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO poles (name, description) VALUES (?, ?)',
            [name, description]
        );
        
        const [newPole] = await db.query('SELECT * FROM poles WHERE id = ?', [result.insertId]);
        
        res.status(201).json(newPole[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la création du pôle' });
    }
};

exports.updatePole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        await db.query(
            'UPDATE poles SET name = ?, description = ? WHERE id = ?',
            [name, description, id]
        );
        
        res.json({ message: 'Pôle mis à jour avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
};

exports.deletePole = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier si le pôle a des activités
        const [activities] = await db.query(
            'SELECT id FROM activities WHERE pole_id = ? LIMIT 1',
            [id]
        );
        
        if (activities.length > 0) {
            return res.status(400).json({ 
                message: 'Impossible de supprimer ce pôle car il a des activités associées' 
            });
        }
        
        await db.query('DELETE FROM poles WHERE id = ?', [id]);
        
        res.json({ message: 'Pôle supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};