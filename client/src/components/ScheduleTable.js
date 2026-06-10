import React from 'react';
import '../styles/global.css';

const ScheduleTable = ({ activities, poles, onEdit, onDelete, onReport }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    };

    const getPoleAssignments = (activity, poleId) => {
        if (activity.pole_id === poleId) {
            return (
                <div>
                    <div style={{ marginBottom: '8px' }}>
                        {activity.members && activity.members.map(member => (
                            <div key={member.id} style={{ fontSize: '13px', marginBottom: '4px' }}>
                                {member.full_name}
                            </div>
                        ))}
                    </div>
                    {activity.coordinator_name && (
                        <div style={{ 
                            fontSize: '11px', 
                            color: '#667eea', 
                            fontWeight: 'bold',
                            marginTop: '4px',
                            paddingTop: '4px',
                            borderTop: '1px solid #e5e7eb'
                        }}>
                            Coord: {activity.coordinator_name}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Grouper les activités par date
    const groupedActivities = activities.reduce((acc, activity) => {
        const dateKey = activity.date;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(activity);
        return acc;
    }, {});

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th style={{ minWidth: '180px' }}>Date</th>
                        <th style={{ minWidth: '100px' }}>Horaire</th>
                        <th style={{ minWidth: '200px' }}>Activité</th>
                        <th style={{ minWidth: '120px' }}>Lieu</th>
                        {poles.map(pole => (
                            <th key={pole.id} style={{ minWidth: '180px' }}>{pole.name}</th>
                        ))}
                        {(onEdit || onDelete || onReport) && <th style={{ minWidth: '120px' }}>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
                        <React.Fragment key={dateKey}>
                            {dayActivities.map((activity, index) => (
                                <tr key={activity.id}>
                                    {index === 0 && (
                                        <td rowSpan={dayActivities.length} style={{ 
                                            backgroundColor: '#f9fafb',
                                            verticalAlign: 'top',
                                            fontWeight: 'bold'
                                        }}>
                                            {formatDate(activity.date)}
                                        </td>
                                    )}
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {activity.start_time} - {activity.end_time}
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        {activity.name}
                                    </td>
                                    <td>{activity.location || '-'}</td>
                                    {poles.map(pole => (
                                        <td key={pole.id}>
                                            {getPoleAssignments(activity, pole.id)}
                                        </td>
                                    ))}
                                    {(onEdit || onDelete || onReport) && (
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {onEdit && (
                                                    <button 
                                                        className="btn" 
                                                        onClick={() => onEdit(activity)}
                                                        style={{ 
                                                            padding: '4px 8px', 
                                                            fontSize: '12px',
                                                            background: '#3b82f6',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        Modifier
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button 
                                                        className="btn btn-danger" 
                                                        onClick={() => onDelete(activity.id)}
                                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                                {onReport && (
                                                    <button
                                                        className="btn btn-report"
                                                        onClick={() => onReport(activity)}
                                                        style={{ padding: '8px 14px', fontSize: '13px', color: 'white' }}
                                                    >
                                                     Rapport
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            {activities.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                    Aucune activité programmée cette semaine
                </div>
            )}
        </div>
    );
};

export default ScheduleTable;