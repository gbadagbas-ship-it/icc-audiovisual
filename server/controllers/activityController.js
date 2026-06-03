const db = require('../config/database');

const getStartDateOfWeek = (weekNumber, year) => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (weekNumber - 1) * 7;
    const startDate = new Date(firstDayOfYear);
    startDate.setDate(firstDayOfYear.getDate() + daysToAdd);
    return startDate;
};

const getWeekNumber = (date) => {
    const target = new Date(date);
    const firstDayOfYear = new Date(target.getFullYear(), 0, 1);
    const pastDaysOfYear = Math.floor((target - firstDayOfYear) / 86400000);
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const invalidateWeekForPole = async (date, poleId) => {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime()) || !poleId) {
        throw new Error('Date ou pôle invalide pour l\'invalidation de semaine');
    }

    const weekNumber = getWeekNumber(date);
    const year = parsedDate.getFullYear();
    const startDate = getStartDateOfWeek(weekNumber, year);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    await db.query(
        `UPDATE weekly_programs
         SET status = 'pending', validated_by = NULL, validated_at = NULL
         WHERE week_number = ? AND year = ? AND pole_id = ?`,
        [weekNumber, year, poleId]
    );

    await db.query(
        `UPDATE activities
         SET status = 'pending', validated_by = NULL, validated_at = NULL
         WHERE date >= ? AND date < ? AND pole_id = ?`,
        [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], poleId]
    );
};

exports.createActivity = async (req, res) => {
    try {
        const { name, date, startTime, endTime, location, poleId, coordinatorId, memberIds } = req.body;
        const normalizedCoordinatorId = coordinatorId ? Number(coordinatorId) : null;
        const normalizedMemberIds = Array.isArray(memberIds) ? memberIds.map(id => Number(id)) : [];

        if (!name || !date || !startTime || !endTime || !poleId) {
            return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
        }

        if (normalizedMemberIds.length < 2) {
            return res.status(400).json({ message: 'Vous devez programmer au moins 2 membres' });
        }

        if (isNaN(Number(poleId))) {
            return res.status(400).json({ message: 'Le pôle sélectionné est invalide' });
        }

        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: 'La date fournie est invalide' });
        }

        // Vérifier que le pôle existe
        const [poles] = await db.query('SELECT id FROM poles WHERE id = ?', [poleId]);
        
        if (poles.length === 0) {
            return res.status(404).json({ message: 'Pôle non trouvé' });
        }
        
        // Vérifier les permissions
        const userPoleId = Number(req.user.pole_id);
        const requestedPoleId = Number(poleId);
        if (req.user.role === 'POLE_MANAGER' && userPoleId !== requestedPoleId) {
            return res.status(403).json({ message: 'Vous ne pouvez créer des activités que pour votre pôle' });
        }
        
        // Créer l'activité en attente de validation
        const [result] = await db.query(
            `INSERT INTO activities (name, date, start_time, end_time, location, pole_id, coordinator_id, created_by, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [name, date, startTime, endTime, location, poleId, normalizedCoordinatorId, req.user.id]
        );
        
        const activityId = result.insertId;
        
        // Ajouter les membres
        if (normalizedMemberIds.length > 0) {
            for (const userId of normalizedMemberIds) {
                await db.query(
                    'INSERT INTO assignments (activity_id, user_id) VALUES (?, ?)',
                    [activityId, userId]
                );
            }
        }

        // Invalider la semaine du pôle si elle était déjà validée
        await invalidateWeekForPole(date, poleId);
        
        // Récupérer l'activité complète
        const [activity] = await db.query(
            `SELECT a.*, p.name as pole_name, u.full_name as coordinator_name
             FROM activities a
             LEFT JOIN poles p ON a.pole_id = p.id
             LEFT JOIN users u ON a.coordinator_id = u.id
             WHERE a.id = ?`,
            [activityId]
        );
        
        // Récupérer les membres
        const [members] = await db.query(
            `SELECT u.id, u.full_name 
             FROM assignments a
             JOIN users u ON a.user_id = u.id
             WHERE a.activity_id = ?`,
            [activityId]
        );
        
        res.status(201).json({
            ...activity[0],
            members
        });
    } catch (error) {
        console.error('CreateActivity error:', error);
        res.status(500).json({ 
            message: error.message || 'Erreur lors de la création de l\'activité',
            error: error.sqlMessage || null
        });
    }
};

// exports.getActivities = async (req, res) => {
//     try {
//         const { weekNumber, year, poleId } = req.query;
        
//         let query = `
//             SELECT a.*, 
//                    p.name as pole_name, 
//                    u.full_name as coordinator_name,
//                    c.full_name as creator_name
//             FROM activities a
//             LEFT JOIN poles p ON a.pole_id = p.id
//             LEFT JOIN users u ON a.coordinator_id = u.id
//             LEFT JOIN users c ON a.created_by = c.id
//             WHERE 1=1
//         `;
        
//         const params = [];
        
//         // Filtrer par pôle
//         if (req.user.role === 'POLE_MANAGER') {
//             query += ` AND a.pole_id = ?`;
//             params.push(req.user.pole_id);
//         } else if (poleId) {
//             query += ` AND a.pole_id = ?`;
//             params.push(poleId);
//         }
        
//         // Filtrer par semaine
//         if (weekNumber && year) {
//             // Calculer la date de début de semaine
//             const firstDayOfYear = new Date(year, 0, 1);
//             const daysToAdd = (weekNumber - 1) * 7;
//             const startDate = new Date(firstDayOfYear);
//             startDate.setDate(firstDayOfYear.getDate() + daysToAdd);
//             const endDate = new Date(startDate);
//             endDate.setDate(startDate.getDate() + 7);
            
//             query += ` AND a.date >= ? AND a.date < ?`;
//             params.push(startDate.toISOString().split('T')[0]);
//             params.push(endDate.toISOString().split('T')[0]);
//         }
        
//         query += ` ORDER BY a.date ASC, a.start_time ASC`;
        
//         const [activities] = await db.query(query, params);
        
//         // Récupérer les membres pour chaque activité
//         for (let activity of activities) {
//             const [members] = await db.query(
//                 `SELECT u.id, u.full_name 
//                  FROM assignments a
//                  JOIN users u ON a.user_id = u.id
//                  WHERE a.activity_id = ?`,
//                 [activity.id]
//             );
//             activity.members = members;
//         }
        
//         res.json(activities);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Erreur lors de la récupération des activités' });
//     }
// };




// Récupérer les activités (avec filtre public/validée)
exports.getActivities = async (req, res) => {
    try {
        const { weekNumber, year, poleId, public } = req.query;
        
        let query = `
            SELECT a.*, 
                   p.name as pole_name, 
                   u.full_name as coordinator_name,
                   c.full_name as creator_name
            FROM activities a
            LEFT JOIN poles p ON a.pole_id = p.id
            LEFT JOIN users u ON a.coordinator_id = u.id
            LEFT JOIN users c ON a.created_by = c.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Membres connectés : ne voir que les activités validées
        if (public === 'true' || (req.user && req.user.role === 'MEMBER')) {
            query += ` AND a.status = 'validated'`;
        }
        
        // Filtrer par pôle pour les responsables de pôle et pour le paramètre poleId
        if (req.user && req.user.role === 'POLE_MANAGER') {
            query += ` AND a.pole_id = ?`;
            params.push(req.user.pole_id);
        } else if (poleId) {
            query += ` AND a.pole_id = ?`;
            params.push(poleId);
        }
        
        // Filtrer par semaine
        if (weekNumber && year) {
            const startDate = getStartDateOfWeek(weekNumber, year);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 7);
            
            query += ` AND a.date >= ? AND a.date < ?`;
            params.push(startDate.toISOString().split('T')[0]);
            params.push(endDate.toISOString().split('T')[0]);
        }
        
        query += ` ORDER BY a.date ASC, a.start_time ASC`;
        
        const [activities] = await db.query(query, params);
        
        // Récupérer les membres pour chaque activité
        for (let activity of activities) {
            const [members] = await db.query(
                `SELECT u.id, u.full_name 
                 FROM assignments a
                 JOIN users u ON a.user_id = u.id
                 WHERE a.activity_id = ?`,
                [activity.id]
            );
            activity.members = members;
        }
        
        res.json(activities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération des activités' });
    }
};































exports.updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, date, startTime, endTime, location, poleId, coordinatorId, memberIds } = req.body;
        const normalizedCoordinatorId = coordinatorId ? Number(coordinatorId) : null;
        const normalizedMemberIds = Array.isArray(memberIds) ? memberIds.map(id => Number(id)) : [];
        
        // Vérifier que l'activité existe
        const [activities] = await db.query(
            'SELECT * FROM activities WHERE id = ?',
            [id]
        );
        
        if (activities.length === 0) {
            return res.status(404).json({ message: 'Activité non trouvée' });
        }
        
        const activity = activities[0];
        
        // Vérifier les permissions
        if (req.user.role === 'POLE_MANAGER' && Number(req.user.pole_id) !== Number(activity.pole_id)) {
            return res.status(403).json({ message: 'Vous ne pouvez modifier que les activités de votre pôle' });
        }
        if (req.user.role === 'POLE_MANAGER' && Number(poleId) !== Number(activity.pole_id)) {
            return res.status(403).json({ message: 'Vous ne pouvez pas changer de pôle' });
        }
        
        // Mettre à jour l'activité avec un statut en attente de validation
        const previousDate = activity.date;
        const previousPoleId = activity.pole_id;
        await db.query(
            `UPDATE activities 
             SET name = ?, date = ?, start_time = ?, end_time = ?, location = ?, pole_id = ?, coordinator_id = ?, status = 'pending', validated_by = NULL, validated_at = NULL
             WHERE id = ?`,
            [name, date, startTime, endTime, location, poleId, normalizedCoordinatorId, id]
        );
        
        // Mettre à jour les membres
        if (normalizedMemberIds.length > 0) {
            // Supprimer les anciens membres
            await db.query('DELETE FROM assignments WHERE activity_id = ?', [id]);
            
            // Ajouter les nouveaux membres
            for (const userId of normalizedMemberIds) {
                await db.query(
                    'INSERT INTO assignments (activity_id, user_id) VALUES (?, ?)',
                    [id, userId]
                );
            }
        }

        // Invalider la semaine pour le pôle concerné
        await invalidateWeekForPole(date, poleId);
        if (date !== previousDate || Number(poleId) !== Number(previousPoleId)) {
            await invalidateWeekForPole(previousDate, previousPoleId);
        }
        
        res.json({ message: 'Activité mise à jour avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
};

exports.deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier que l'activité existe
        const [activities] = await db.query(
            'SELECT * FROM activities WHERE id = ?',
            [id]
        );
        
        if (activities.length === 0) {
            return res.status(404).json({ message: 'Activité non trouvée' });
        }
        
        const activity = activities[0];
        
        // Vérifier les permissions
        if (req.user.role === 'POLE_MANAGER' && Number(req.user.pole_id) !== Number(activity.pole_id)) {
            return res.status(403).json({ message: 'Vous ne pouvez supprimer que les activités de votre pôle' });
        }
        
        await db.query('DELETE FROM activities WHERE id = ?', [id]);
        await invalidateWeekForPole(activity.date, activity.pole_id);
        
        res.json({ message: 'Activité supprimée avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};