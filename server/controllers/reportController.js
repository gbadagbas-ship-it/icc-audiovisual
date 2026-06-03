const db = require('../config/database');

// Soumettre un rapport (CG uniquement)
exports.submitReport = async (req, res) => {
    try {
        const { weekNumber, year, whatWorked, whatDidntWork, observations, attendance, technicalIssues, suggestions } = req.body;
        
        // Vérifier que l'utilisateur est bien coordinateur général pour cette semaine
        const [coordinatorCheck] = await db.query(
            'SELECT id FROM weekly_coordinators WHERE week_number = ? AND year = ? AND user_id = ?',
            [weekNumber, year, req.user.id]
        );
        
        if (coordinatorCheck.length === 0 && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Vous n\'êtes pas coordinateur général cette semaine' });
        }
        
        // Vérifier si un rapport existe déjà
        const [existing] = await db.query(
            'SELECT id FROM weekly_reports WHERE week_number = ? AND year = ? AND coordinator_id = ?',
            [weekNumber, year, req.user.id]
        );
        
        if (existing.length > 0) {
            // Mettre à jour
            await db.query(
                `UPDATE weekly_reports 
                 SET what_worked = ?, what_didnt_work = ?, observations = ?, 
                     attendance = ?, technical_issues = ?, suggestions = ?, submitted_at = NOW()
                 WHERE week_number = ? AND year = ? AND coordinator_id = ?`,
                [whatWorked, whatDidntWork, observations, attendance, technicalIssues, suggestions, weekNumber, year, req.user.id]
            );
        } else {
            // Créer
            await db.query(
                `INSERT INTO weekly_reports (week_number, year, coordinator_id, what_worked, what_didnt_work, observations, attendance, technical_issues, suggestions)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [weekNumber, year, req.user.id, whatWorked, whatDidntWork, observations, attendance, technicalIssues, suggestions]
            );
        }
        
        res.json({ message: 'Rapport soumis avec succès' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la soumission du rapport' });
    }
};

// Récupérer le rapport d'un CG (pour consultation/modification)
exports.getReport = async (req, res) => {
    try {
        const { weekNumber, year } = req.params;
        
        // Vérifier les permissions
        let query = `
            SELECT r.*, u.full_name as coordinator_name, u.email as coordinator_email, p.name as coordinator_service
            FROM weekly_reports r
            JOIN users u ON r.coordinator_id = u.id
            LEFT JOIN poles p ON u.pole_id = p.id
            WHERE r.week_number = ? AND r.year = ?
        `;
        const params = [weekNumber, year];
        
        // Si c'est un CG, il ne voit que son propre rapport
        if (req.user.role === 'POLE_MANAGER' && !req.user.is_general_coordinator) {
            query += ` AND r.coordinator_id = ?`;
            params.push(req.user.id);
        }
        
        const [reports] = await db.query(query, params);
        
        res.json(reports[0] || null);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur' });
    }
};

// Super Admin - Voir tous les rapports
exports.getAllReports = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Permission refusée' });
        }

        const [reports] = await db.query(
            `SELECT r.*, u.full_name as coordinator_name, u.email as coordinator_email, p.name as coordinator_service
             FROM weekly_reports r
             JOIN users u ON r.coordinator_id = u.id
             LEFT JOIN poles p ON u.pole_id = p.id
             ORDER BY r.year DESC, r.week_number DESC`
        );

        res.json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur' });
    }
};

// Super Admin - Supprimer un rapport CG
exports.deleteReport = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Permission refusée' });
        }

        const { id } = req.params;
        const [result] = await db.query('DELETE FROM weekly_reports WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Rapport non trouvé' });
        }

        res.json({ message: 'Rapport supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};