const db = require('../config/database');

exports.createActivity = async (req, res) => {
    try {
        const { name, date, startTime, endTime, location, poleId, coordinatorId, memberIds } = req.body;
        
        // Vérifier que le pôle existe
        const [poles] = await db.query('SELECT id FROM poles WHERE id = ?', [poleId]);
        
        if (poles.length === 0) {
            return res.status(404).json({ message: 'Pôle non trouvé' });
        }
        
        // Vérifier les permissions
        if (req.user.role === 'POLE_MANAGER' && req.user.pole_id !== poleId) {
            return res.status(403).json({ message: 'Vous ne pouvez créer des activités que pour votre pôle' });
        }
        
        // Créer l'activité
        const [result] = await db.query(
            `INSERT INTO activities (name, date, start_time, end_time, location, pole_id, coordinator_id, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, date, startTime, endTime, location, poleId, coordinatorId, req.user.id]
        );
        
        const activityId = result.insertId;
        
        // Ajouter les membres
        if (memberIds && memberIds.length > 0) {
            for (const userId of memberIds) {
                await db.query(
                    'INSERT INTO assignments (activity_id, user_id) VALUES (?, ?)',
                    [activityId, userId]
                );
            }
        }
        
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
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'activité' });
    }
};

exports.getActivities = async (req, res) => {
    try {
        const { weekNumber, year, poleId } = req.query;
        
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
        
        // Filtrer par pôle
        if (req.user.role === 'POLE_MANAGER') {
            query += ` AND a.pole_id = ?`;
            params.push(req.user.pole_id);
        } else if (poleId) {
            query += ` AND a.pole_id = ?`;
            params.push(poleId);
        }
        
        // Filtrer par semaine
        if (weekNumber && year) {
            // Calculer la date de début de semaine
            const firstDayOfYear = new Date(year, 0, 1);
            const daysToAdd = (weekNumber - 1) * 7;
            const startDate = new Date(firstDayOfYear);
            startDate.setDate(firstDayOfYear.getDate() + daysToAdd);
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
        const { name, date, startTime, endTime, location, coordinatorId, memberIds } = req.body;
        
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
        if (req.user.role === 'POLE_MANAGER' && req.user.pole_id !== activity.pole_id) {
            return res.status(403).json({ message: 'Vous ne pouvez modifier que les activités de votre pôle' });
        }
        
        // Mettre à jour l'activité
        await db.query(
            `UPDATE activities 
             SET name = ?, date = ?, start_time = ?, end_time = ?, location = ?, coordinator_id = ?
             WHERE id = ?`,
            [name, date, startTime, endTime, location, coordinatorId, id]
        );
        
        // Mettre à jour les membres
        if (memberIds) {
            // Supprimer les anciens membres
            await db.query('DELETE FROM assignments WHERE activity_id = ?', [id]);
            
            // Ajouter les nouveaux membres
            for (const userId of memberIds) {
                await db.query(
                    'INSERT INTO assignments (activity_id, user_id) VALUES (?, ?)',
                    [id, userId]
                );
            }
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
        if (req.user.role === 'POLE_MANAGER' && req.user.pole_id !== activity.pole_id) {
            return res.status(403).json({ message: 'Vous ne pouvez supprimer que les activités de votre pôle' });
        }
        
        await db.query('DELETE FROM activities WHERE id = ?', [id]);
        
        res.json({ message: 'Activité supprimée avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
};