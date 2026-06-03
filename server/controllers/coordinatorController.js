const db = require('../config/database');

// Assigner un coordinateur général pour une semaine
exports.assignGeneralCoordinator = async (req, res) => {
    try {
        const { weekNumber, year, userId } = req.body;
        
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Permission refusée' });
        }
        
        // Vérifier que l'utilisateur existe
        const [user] = await db.query('SELECT id, full_name FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Supprimer l'ancien CG pour cette semaine
        await db.query(
            'DELETE FROM weekly_coordinators WHERE week_number = ? AND year = ?',
            [weekNumber, year]
        );
        
        // Désactiver l'ancien statut CG pour tous
        await db.query(
            'UPDATE users SET is_general_coordinator = FALSE, active_week_number = NULL, active_year = NULL'
        );
        
        // Ajouter le nouveau CG
        await db.query(
            `INSERT INTO weekly_coordinators (week_number, year, user_id, assigned_by)
             VALUES (?, ?, ?, ?)`,
            [weekNumber, year, userId, req.user.id]
        );
        
        // Activer le statut CG pour cet utilisateur
        await db.query(
            `UPDATE users SET is_general_coordinator = TRUE, active_week_number = ?, active_year = ?
             WHERE id = ?`,
            [weekNumber, year, userId]
        );
        
        res.json({ 
            message: `Coordinateur général assigné pour la semaine ${weekNumber}/${year}`,
            coordinator: user[0]
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de l\'assignation' });
    }
};

// Récupérer le coordinateur général de la semaine en cours
exports.getCurrentGeneralCoordinator = async (req, res) => {
    try {
        const today = new Date();
        const weekNumber = getWeekNumber(today);
        const year = today.getFullYear();
        
        const [coordinators] = await db.query(
            `SELECT u.id, u.full_name, u.email
             FROM weekly_coordinators wc
             JOIN users u ON wc.user_id = u.id
             WHERE wc.week_number = ? AND wc.year = ?`,
            [weekNumber, year]
        );
        
        res.json(coordinators[0] || null);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur' });
    }
};

// Récupérer tous les coordinateurs généraux (historique)
exports.getAllGeneralCoordinators = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Permission refusée' });
        }
        
        const [coordinators] = await db.query(
            `SELECT wc.*, u.full_name as coordinator_name, a.full_name as assigned_by_name
             FROM weekly_coordinators wc
             JOIN users u ON wc.user_id = u.id
             JOIN users a ON wc.assigned_by = a.id
             ORDER BY wc.year DESC, wc.week_number DESC`
        );
        
        res.json(coordinators);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur' });
    }
};

function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}