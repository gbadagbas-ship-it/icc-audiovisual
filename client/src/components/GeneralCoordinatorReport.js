import React, { useState, useEffect } from 'react';
import api from '../services/api';

const GeneralCoordinatorReport = ({ weekNumber, year, onSubmitted }) => {
    const [report, setReport] = useState({
        whatWorked: '',
        whatDidntWork: '',
        observations: '',
        attendance: '',
        technicalIssues: '',
        suggestions: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        fetchExistingReport();
    }, [weekNumber, year]);

    const fetchExistingReport = async () => {
        try {
            const response = await api.get(`/reports/${weekNumber}/${year}`);
            if (response.data) {
                setReport({
                    whatWorked: response.data.what_worked || '',
                    whatDidntWork: response.data.what_didnt_work || '',
                    observations: response.data.observations || '',
                    attendance: response.data.attendance || '',
                    technicalIssues: response.data.technical_issues || '',
                    suggestions: response.data.suggestions || ''
                });
                setSubmitted(true);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await api.post('/reports/submit', {
                weekNumber,
                year,
                ...report
            });
            alert('Rapport soumis avec succès !');
            setSubmitted(true);
            if (onSubmitted) onSubmitted();
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la soumission du rapport');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '30px', backgroundColor:'#FFFFFF60' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h3>Rapport soumis</h3>
                <p>Merci pour votre retour !</p>
                <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
                    Modifier mon rapport
                </button>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Rapport du Coordinateur Général</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                Semaine {weekNumber} - {year}
            </p>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>CE QUI A BIEN FONCTIONNE:</label>
                    <textarea
                        className="form-control"
                        rows="3"
                        value={report.whatWorked}
                        onChange={(e) => setReport({ ...report, whatWorked: e.target.value })}
                        placeholder="Décrivez ce qui s'est bien passé selon vous..."
                    />
                </div>

                <div className="form-group">
                    <label>CE QUI N'A PAS BIEN FONCTIONNE:</label>
                    <textarea
                        className="form-control"
                        rows="3"
                        value={report.whatDidntWork}
                        onChange={(e) => setReport({ ...report, whatDidntWork: e.target.value })}
                        placeholder="Points à améliorer..."
                    />
                </div>

                <div className="form-group">
                    <label>APPRECIATION GENERALES:</label>
                    <textarea
                        className="form-control"
                        rows="3"
                        value={report.observations}
                        onChange={(e) => setReport({ ...report, observations: e.target.value })}
                        placeholder="Observations, suggestions, incidents..."
                    />
                </div>

                <div className="form-group">
                    <label>PRESENCES ET RETARDS:</label>
                    <textarea
                        className="form-control"
                        rows="2"
                        value={report.attendance}
                        onChange={(e) => setReport({ ...report, attendance: e.target.value })}
                        placeholder="Mentionnez les membres présents, absents, en retards..."
                    />
                </div>

                <div className="form-group">
                    <label>PROBLEMES TECHNIQUES:</label>
                    <textarea
                        className="form-control"
                        rows="2"
                        value={report.technicalIssues}
                        onChange={(e) => setReport({ ...report, technicalIssues: e.target.value })}
                        placeholder="Problèmes rencontrés avec le matériel..."
                    />
                </div>

                <div className="form-group">
                    <label>SUGGESTION POUR AMELIORATION:</label>
                    <textarea
                        className="form-control"
                        rows="2"
                        value={report.suggestions}
                        onChange={(e) => setReport({ ...report, suggestions: e.target.value })}
                        placeholder="Idées pour améliorer le service..."
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Envoi...' : 'Soumettre le rapport'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GeneralCoordinatorReport;