import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/global.css';

const ReportsDashboard = () => {
    const [cgReports, setCgReports] = useState([]);
    const [activityReports, setActivityReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportType, setReportType] = useState('cg'); // 'cg' or 'activity'
    const [reportToDelete, setReportToDelete] = useState(null); // Pour la confirmation de suppression

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const [cgRes, activityRes] = await Promise.all([
                api.get('/reports/all'),
                api.get('/activity-reports/all')
            ]);
            setCgReports(cgRes.data);
            setActivityReports(activityRes.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCgReport = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.')) {
            return;
        }
        try {
            await api.delete(`/reports/${id}`);
            setCgReports(prev => prev.filter(r => r.id !== id));
            setReportToDelete(null);
            alert('Rapport supprimé avec succès');
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression du rapport');
        }
    };

    const handleDeleteActivityReport = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport d\'activité ? Cette action est irréversible.')) {
            return;
        }
        try {
            await api.delete(`/activity-reports/${id}`);
            setActivityReports(prev => prev.filter(r => r.id !== id));
            setReportToDelete(null);
            alert('Rapport supprimé avec succès');
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression du rapport');
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // Grouper les rapports CG par semaine
    const groupedCgReports = cgReports.reduce((group, report) => {
        const key = `${report.year}-${report.week_number}`;
        if (!group[key]) group[key] = [];
        group[key].push(report);
        return group;
    }, {});

    const weekKeys = Object.keys(groupedCgReports).sort((a, b) => {
        const [yearA, weekA] = a.split('-').map(Number);
        const [yearB, weekB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearB - yearA;
        return weekB - weekA;
    });

    return (
        <div className="container" style={{ padding: '30px 20px' }}>
            <h2 style={{ color: 'white', marginBottom: '24px' }}> Rapports du service audiovisuel</h2>

            {/* Onglets pour basculer entre les types de rapports */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                    className={`btn ${reportType === 'cg' ? 'btn-primary' : ''}`}
                    style={{ backgroundColor: reportType === 'cg' ? '#2563eb' : '#374151', color: 'white', padding: '10px 20px' }}
                    onClick={() => setReportType('cg')}
                >
                     Rapports général de la semaine ({cgReports.length})
                </button>
                <button
                    className={`btn ${reportType === 'activity' ? 'btn-primary' : ''}`}
                    style={{ backgroundColor: reportType === 'activity' ? '#2563eb' : '#374151', color: 'white', padding: '10px 20px' }}
                    onClick={() => setReportType('activity')}
                >
                     Rapports d'activité ({activityReports.length})
                </button>
            </div>

            {/* === RAPPORTS DE COORDINATEUR GÉNÉRAL === */}
            {reportType === 'cg' && (
                <>
                    <h3 style={{ color: 'white', marginBottom: '16px' }}>Rapports des Coordinateurs Généraux</h3>
                    {weekKeys.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '30px', backgroundColor: '#1F2937EC' }}>
                            <p style={{ color: '#9ca3af' }}>Aucun rapport de coordinateur général disponible.</p>
                        </div>
                    ) : (
                        weekKeys.map((weekKey) => {
                            const [year, weekNumber] = weekKey.split('-');
                            const weekReports = groupedCgReports[weekKey];
                            return (
                                <div key={weekKey} className="card" style={{ marginBottom: '20px', backgroundColor: '#1f2937' }}>
                                    <div style={{ padding: '20px' }}>
                                        <h3 style={{ margin: 0, marginBottom: '12px', color: '#f9fafb' }}>Semaine {weekNumber} / {year}</h3>
                                        <div style={{ display: 'grid', gap: '16px' }}>
                                            {weekReports.map(report => (
                                                <div key={report.id} style={{ padding: '18px', backgroundColor: '#111827', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                                        <div>
                                                            <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Service</p>
                                                            <p style={{ margin: 0, fontWeight: '600', color: '#f9fafb' }}>{report.coordinator_service || 'Non défini'}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Coordinateur</p>
                                                            <p style={{ margin: 0, fontWeight: '600', color: '#f9fafb' }}>{report.coordinator_name}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Soumis</p>
                                                            <p style={{ margin: 0, fontWeight: '600', color: '#f9fafb' }}>{new Date(report.submitted_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                className="btn btn-primary"
                                                                onClick={() => setSelectedReport({ ...report, type: 'cg' })}
                                                                style={{ padding: '8px 14px', fontSize: '13px' }}
                                                            >
                                                                Voir
                                                            </button>
                                                            <button
                                                                className="btn btn-danger"
                                                                onClick={() => handleDeleteCgReport(report.id)}
                                                                style={{ padding: '8px 14px', fontSize: '13px' }}
                                                            >
                                                                supprimer
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </>
            )}

            {/* === RAPPORTS D'ACTIVITÉ === */}
            {reportType === 'activity' && (
                <>
                    <h3 style={{ color: 'white', marginBottom: '16px' }}> Rapports d'activité </h3>
                    {activityReports.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '30px', backgroundColor: '#1f2937' }}>
                            <p style={{ color: '#9ca3af' }}>Aucun rapport d'activité disponible.</p>
                        </div>
                    ) : (
                        <div className="card" style={{ backgroundColor: '#1f2937' }}>
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {activityReports.map(report => (
                                        <div key={report.id} style={{ padding: '18px', backgroundColor: '#111827', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                                <div>
                                                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Activité</p>
                                                    <p style={{ margin: 0, fontWeight: '600', color: '#f9fafb' }}>{report.activity_name}</p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Date</p>
                                                    <p style={{ margin: 0, fontWeight: '600', color: '#f9fafb' }}>{new Date(report.activity_date).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Auteur</p>
                                                    <p style={{ margin: 0, fontWeight: '600', color: '#f9fafb' }}>{report.author_name}</p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Soumis</p>
                                                    <p style={{ margin: 0, fontWeight: '600', color: '#f9fafb' }}>{new Date(report.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => setSelectedReport({ ...report, type: 'activity' })}
                                                        style={{ padding: '8px 14px', fontSize: '13px' }}
                                                    >
                                                        Voir
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => handleDeleteActivityReport(report.id)}
                                                        style={{ padding: '8px 14px', fontSize: '13px' }}
                                                    >
                                                        supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de détail */}
            {selectedReport && (
                <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {selectedReport.type === 'cg'
                                    ? `Rapport CG - Semaine ${selectedReport.week_number}/${selectedReport.year}`
                                    : `Rapport d'activité - ${selectedReport.activity_name}`}
                            </h3>
                            <button style={{ height: "20px", width: "40px", backgroundColor: "grey", color: "red", borderRadius: "5px", border: "none" }} onClick={() => setSelectedReport(null)}>X</button>
                        </div>
                        <div className="modal-body">
                            {selectedReport.type === 'cg' ? (
                                <>
                                    <p><strong>Coordinateur :</strong> {selectedReport.coordinator_name}</p>
                                    <p><strong>Service :</strong> {selectedReport.coordinator_service || 'Non défini'}</p>
                                    <p><strong>Email :</strong> {selectedReport.coordinator_email}</p>
                                    <p><strong>Soumis le :</strong> {new Date(selectedReport.submitted_at).toLocaleString()}</p>

                                    <hr />
                                    <br />

                                    <h4>CE QUI A BIEN FONCTIONNÉ:</h4>
                                    <p style={{ backgroundColor: "green", color: "white", padding: "3px" }}>{selectedReport.what_worked || '-'}</p>
                                    <br />

                                    <h4>CE QUI N'A PAS BIEN FONCTIONNÉ:</h4>
                                    <p style={{ backgroundColor: "red", padding: "3px", color: "white" }}>{selectedReport.what_didnt_work || '-'}</p>
                                    <br />

                                    <h4>APPRÉCIATION DU SERVICE:</h4>
                                    <p>{selectedReport.observations || '-'}</p>
                                    <br />

                                    <h4>ABSENCES / PRÉSENCES:</h4>
                                    <p>{selectedReport.attendance || '-'}</p>
                                    <br />

                                    <h4>PROBLÈMES TECHNIQUES:</h4>
                                    <p style={{ backgroundColor: "red", padding: "3px", color: "white" }}>{selectedReport.technical_issues || '-'}</p>
                                    <br />

                                    <h4>SUGGESTIONS:</h4>
                                    <p>{selectedReport.suggestions || '-'}</p>
                                </>
                            ) : (
                                <>
                                    <p><strong>Activité :</strong> {selectedReport.activity_name}</p>
                                    <p><strong>Date de l'activité :</strong> {new Date(selectedReport.activity_date).toLocaleDateString()}</p>
                                    <p><strong>Auteur :</strong> {selectedReport.author_name}</p>
                                    <p><strong>Soumis le :</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>

                                    <hr />
                                    <br />

                                    <h4>RAPPORT:</h4>
                                    <p style={{ backgroundColor: "#1f2937", color: "white", padding: "10px", borderRadius: "8px" }}>{selectedReport.content || '-'}</p>
                                    <br />

                                    <h4>ABSENCES / PRÉSENCES:</h4>
                                    <p>{selectedReport.attendance || '-'}</p>
                                    <br />

                                    <h4>PROBLÈMES TECHNIQUES:</h4>
                                    <p style={{ backgroundColor: "red", padding: "3px", color: "white" }}>{selectedReport.technical_issues || '-'}</p>
                                    <br />

                                    <h4>SUGGESTIONS:</h4>
                                    <p>{selectedReport.suggestions || '-'}</p>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={() => setSelectedReport(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsDashboard;