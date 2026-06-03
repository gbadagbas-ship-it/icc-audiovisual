const db = require('../config/database');

// Valider une semaine entière
exports.validateWeek = async (req, res) => {
    try {
        const { weekNumber, year, poleId } = req.body;
        
        if (!weekNumber || !year || !poleId) {
            return res.status(400).json({ message: 'Semaine, année et pôle requis' });
        }
        
        // Vérifier les permissions (super admin uniquement)
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Permission refusée' });
        }
        
        // Mettre à jour ou créer l'entrée weekly_programs
        const [existing] = await db.query(
            'SELECT id FROM weekly_programs WHERE week_number = ? AND year = ? AND pole_id = ?',
            [weekNumber, year, poleId]
        );
        
        if (existing.length > 0) {
            await db.query(
                `UPDATE weekly_programs 
                 SET status = 'validated', validated_by = ?, validated_at = NOW()
                 WHERE week_number = ? AND year = ? AND pole_id = ?`,
                [req.user.id, weekNumber, year, poleId]
            );
        } else {
            await db.query(
                `INSERT INTO weekly_programs (week_number, year, pole_id, status, validated_by, validated_at)
                 VALUES (?, ?, ?, 'validated', ?, NOW())`,
                [weekNumber, year, poleId, req.user.id]
            );
        }
        
        // Mettre à jour le statut des activités de cette semaine
        const startDate = getStartDateOfWeek(weekNumber, year);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        
        await db.query(
            `UPDATE activities 
             SET status = 'validated', validated_by = ?, validated_at = NOW()
             WHERE date >= ? AND date < ? AND pole_id = ?`,
            [req.user.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], poleId]
        );
        
        res.json({ 
            message: 'Programmation validée avec succès',
            week: weekNumber,
            year: year
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la validation' });
    }
};

// Vérifier si une semaine est validée
exports.isWeekValidated = async (req, res) => {
    try {
        const { weekNumber, year } = req.params;
        
        const [result] = await db.query(
            'SELECT status, validated_at FROM weekly_programs WHERE week_number = ? AND year = ?',
            [weekNumber, year]
        );
        
        const isValidated = result.length > 0 && result[0].status === 'validated';
        
        res.json({ 
            isValidated,
            week: weekNumber,
            year: year,
            validatedAt: result[0]?.validated_at || null
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la vérification' });
    }
};

// Obtenir le statut de validation pour toutes les semaines
exports.getWeeksStatus = async (req, res) => {
    try {
        const { weekNumber, year } = req.query;
        let query = 'SELECT week_number, year, pole_id, status, validated_at FROM weekly_programs';
        const params = [];

        if (weekNumber && year) {
            query += ' WHERE week_number = ? AND year = ?';
            params.push(weekNumber, year);
        }

        query += ' ORDER BY year DESC, week_number DESC, pole_id ASC';

        const [weeks] = await db.query(query, params);
        res.json(weeks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur' });
    }
};

// Fonction utilitaire pour obtenir la date de début d'une semaine
function getStartDateOfWeek(weekNumber, year) {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (weekNumber - 1) * 7;
    const startDate = new Date(firstDayOfYear);
    startDate.setDate(firstDayOfYear.getDate() + daysToAdd);
    return startDate;
}