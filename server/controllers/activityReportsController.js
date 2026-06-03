const db = require('../config/database');

// Super Admin - Voir tous les rapports d'activité
exports.getAllReports = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Permission refusée' });
        }

        const [reports] = await db.query(
            `SELECT ar.*, u.full_name as author_name, a.name as activity_name, a.date as activity_date
             FROM activity_reports ar
             JOIN users u ON ar.user_id = u.id
             JOIN activities a ON ar.activity_id = a.id
             ORDER BY ar.created_at DESC`
        );

        res.json(reports);
    } catch (err) {
        console.error('activityReports.getAllReports error:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des rapports' });
    }
};

exports.createReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { activity_id, content, attendance, technical_issues, suggestions } = req.body;

        if (!activity_id || !content) {
            return res.status(400).json({ message: 'activity_id et content sont requis' });
        }

        // vérifier que l'activité existe
        const [activities] = await db.query('SELECT * FROM activities WHERE id = ?', [activity_id]);
        if (activities.length === 0) {
            return res.status(404).json({ message: 'Activité non trouvée' });
        }

        // Seuls le Coordinateur Général de la semaine en cours ou le SUPER_ADMIN peuvent créer un rapport
        if (req.user.role !== 'SUPER_ADMIN' && !req.user.is_general_coordinator) {
            return res.status(403).json({ message: 'Uniquement le Coordinateur Général ou le Super Admin peut créer des rapports.' });
        }

        const [result] = await db.query(
            `INSERT INTO activity_reports (activity_id, user_id, content, attendance, technical_issues, suggestions)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [activity_id, userId, content, attendance || null, technical_issues || null, suggestions || null]
        );

        const reportId = result.insertId;
        const [reports] = await db.query(
            `SELECT ar.*, u.full_name as author_name FROM activity_reports ar JOIN users u ON ar.user_id = u.id WHERE ar.id = ?`,
            [reportId]
        );

        res.status(201).json(reports[0]);
    } catch (err) {
        console.error('activityReports.createReport error:', err);
        res.status(500).json({ message: 'Erreur lors de la création du rapport', error: err.sqlMessage || err.message });
    }
};

exports.getReportsByActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const [reports] = await db.query(
            `SELECT ar.*, u.full_name as author_name FROM activity_reports ar JOIN users u ON ar.user_id = u.id WHERE ar.activity_id = ? ORDER BY ar.created_at DESC`,
            [activityId]
        );
        res.json(reports);
    } catch (err) {
        console.error('activityReports.getReportsByActivity error:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des rapports' });
    }
};

exports.updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, attendance, technical_issues, suggestions } = req.body;

        const [rows] = await db.query('SELECT * FROM activity_reports WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Rapport non trouvé' });

        const report = rows[0];
        if (req.user.role !== 'SUPER_ADMIN' && !req.user.is_general_coordinator && Number(report.user_id) !== Number(req.user.id)) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce rapport' });
        }

        await db.query(
            `UPDATE activity_reports SET content = ?, attendance = ?, technical_issues = ?, suggestions = ? WHERE id = ?`,
            [content || report.content, attendance || report.attendance, technical_issues || report.technical_issues, suggestions || report.suggestions, id]
        );

        const [updated] = await db.query('SELECT ar.*, u.full_name as author_name FROM activity_reports ar JOIN users u ON ar.user_id = u.id WHERE ar.id = ?', [id]);
        res.json(updated[0]);
    } catch (err) {
        console.error('activityReports.updateReport error:', err);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du rapport' });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM activity_reports WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Rapport non trouvé' });

        const report = rows[0];
        if (req.user.role !== 'SUPER_ADMIN' && !req.user.is_general_coordinator && Number(report.user_id) !== Number(req.user.id)) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce rapport' });
        }

        await db.query('DELETE FROM activity_reports WHERE id = ?', [id]);
        res.json({ message: 'Rapport supprimé' });
    } catch (err) {
        console.error('activityReports.deleteReport error:', err);
        res.status(500).json({ message: 'Erreur lors de la suppression du rapport' });
    }
};
