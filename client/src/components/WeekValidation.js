import React, { useState, useEffect } from 'react';
import api from '../services/api';

const WeekValidation = ({ onValidated }) => {
    const [poles, setPoles] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(null);

    useEffect(() => {
        getCurrentWeek();
    }, []);

    useEffect(() => {
        if (currentWeek) {
            fetchStatuses();
            fetchPoles();
        }
    }, [currentWeek]);

    const getCurrentWeek = () => {
        const today = new Date();
        const weekNumber = getWeekNumber(today);
        const year = today.getFullYear();
        setCurrentWeek({ weekNumber, year });
    };

    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const fetchPoles = async () => {
        try {
            const response = await api.get('/poles');
            setPoles(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const fetchStatuses = async () => {
        try {
            const response = await api.get(`/validation/weeks-status?weekNumber=${currentWeek.weekNumber}&year=${currentWeek.year}`);
            setStatuses(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleValidatePole = async (poleId) => {
        if (!currentWeek) return;

        if (window.confirm(`Valider la programmation de la semaine ${currentWeek.weekNumber}/${currentWeek.year} pour ce pôle ?`)) {
            try {
                await api.post('/validation/validate-week', {
                    weekNumber: currentWeek.weekNumber,
                    year: currentWeek.year,
                    poleId
                });
                alert('Programmation validée avec succès !');
                fetchStatuses();
                if (onValidated) onValidated();
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de la validation');
            }
        }
    };

    const getPoleStatus = (poleId) => {
        const status = statuses.find(s => Number(s.pole_id) === Number(poleId));
        return status ? status.status : 'pending';
    };

    const getPoleValidatedAt = (poleId) => {
        const status = statuses.find(s => Number(s.pole_id) === Number(poleId));
        return status?.validated_at || null;
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Validation de la programmation par pôle</h3>

            {currentWeek && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                    <p><strong>Semaine actuelle :</strong> {currentWeek.weekNumber} / {currentWeek.year}</p>
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <h4>État de validation par pôle</h4>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Pôle</th>
                                <th>Statut</th>
                                <th>Date de validation</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {poles.map(pole => {
                                const status = getPoleStatus(pole.id);
                                return (
                                    <tr key={pole.id}>
                                        <td>{pole.name}</td>
                                        <td>
                                            {status === 'validated' ? 
                                                <span style={{ color: '#10b981' }}> Validée</span> : 
                                                <span style={{ color: '#f59e0b' }}> En attente</span>
                                            }
                                        </td>
                                        <td>{getPoleValidatedAt(pole.id) ? new Date(getPoleValidatedAt(pole.id)).toLocaleDateString() : '-'}</td>
                                        <td>
                                            {status !== 'validated' ? (
                                                <button className="btn btn-primary" onClick={() => handleValidatePole(pole.id)}>
                                                    Valider ce pôle
                                                </button>
                                            ) : (
                                                <span style={{ color: '#6b7280' }}>Déjà validé</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <h4>Historique des validations</h4>
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Semaine</th>
                            <th>Année</th>
                            <th>Pôle</th>
                            <th>Statut</th>
                            <th>Date de validation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statuses.map(status => (
                            <tr key={`${status.week_number}-${status.year}-${status.pole_id}`}>
                                <td>{status.week_number}</td>
                                <td>{status.year}</td>
                                <td>{poles.find(p => Number(p.id) === Number(status.pole_id))?.name || status.pole_id}</td>
                                <td>
                                    {status.status === 'validated' ? 
                                        <span style={{ color: '#10b981' }}> Validée</span> : 
                                        <span style={{ color: '#f59e0b' }}> En attente</span>
                                    }
                                </td>
                                <td>{status.validated_at ? new Date(status.validated_at).toLocaleDateString() : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WeekValidation;