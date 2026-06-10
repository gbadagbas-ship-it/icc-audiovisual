import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AssignGeneralCoordinator = () => {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [currentCG, setCurrentCG] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weekInfo, setWeekInfo] = useState({});

    useEffect(() => {
        fetchData();
        getCurrentWeek();
    }, []);

    const getCurrentWeek = () => {
        const today = new Date();
        const weekNumber = getWeekNumber(today);
        const year = today.getFullYear();
        setWeekInfo({ weekNumber, year });
    };

    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const fetchData = async () => {
        try {
            const [usersRes, currentCGRes] = await Promise.all([
                api.get('/users'),
                api.get('/coordinators/current')
            ]);
            
            // Filtrer pour n'avoir que les membres (pas les super admin)
            const members = usersRes.data.filter(u => u.role !== 'SUPER_ADMIN');
            setUsers(members);
            setCurrentCG(currentCGRes.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedUserId) {
            alert('Veuillez sélectionner un coordinateur');
            return;
        }
        
        if (window.confirm(`Assigner cet utilisateur comme coordinateur général pour la semaine ${weekInfo.weekNumber}/${weekInfo.year} ?`)) {
            try {
                await api.post('/coordinators/assign', {
                    weekNumber: weekInfo.weekNumber,
                    year: weekInfo.year,
                    userId: selectedUserId
                });
                alert('Coordinateur général assigné avec succès !');
                fetchData();
                setSelectedUserId('');
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de l\'assignation');
            }
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Coordinateur Général de la semaine</h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                <p><strong>Semaine :</strong> {weekInfo.weekNumber} / {weekInfo.year}</p>
                <p><strong>Coordinateur actuel :</strong> {currentCG ? currentCG.full_name : 'Aucun assigné'}</p>
            </div>
            
            <div className="form-group">
                <label>Nouveau coordinateur général</label>
                <select 
                    className="form-control" 
                    value={selectedUserId} 
                    onChange={(e) => setSelectedUserId(e.target.value)}
                >
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.full_name} ({user.pole_name || 'Aucun pôle'})</option>
                    ))}
                </select>
            </div>
            
            <button className="btn btn-primary" onClick={handleAssign}>
                Assigner comme coordinateur général
            </button>
        </div>
    );
};

export default AssignGeneralCoordinator;