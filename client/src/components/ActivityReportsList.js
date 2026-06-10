import React, { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/global.css';

const ActivityReportsList = ({ activityId }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            const res = await api.get(`/activity-reports/activity/${activityId}`);
            setReports(res.data);
        } catch (err) {
            console.error('Erreur fetch reports', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activityId) fetchReports();
    }, [activityId]);

    if (loading) return <div>Chargement des rapports...</div>;

    if (!reports || reports.length === 0) return <div>Aucun rapport pour cette activité.</div>;

    return (
        <div>
            {reports.map(r => (
                <div key={r.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                    <div style={{ fontSize: '0.9rem', color: '#374151' }}>
                        <strong>{r.author_name}</strong> — {new Date(r.created_at).toLocaleString()}
                    </div>
                    <div style={{ marginTop: '6px' }}>{r.content}</div>
                    {r.attendance && <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#6b7280' }}>Présence: {r.attendance}</div>}
                    {r.technical_issues && <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#6b7280' }}>Problèmes techniques: {r.technical_issues}</div>}
                </div>
            ))}
        </div>
    );
};

export default ActivityReportsList;
