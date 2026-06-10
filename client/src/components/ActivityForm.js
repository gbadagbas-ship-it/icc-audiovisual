import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/global.css';

const ActivityForm = ({ activity, poles, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        poleId: poles[0]?.id || '',
        coordinatorId: '',
        memberIds: []
    });
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activity) {
            setFormData({
                name: activity.name,
                date: activity.date,
                startTime: activity.start_time,
                endTime: activity.end_time,
                location: activity.location || '',
                poleId: activity.pole_id,
                coordinatorId: activity.coordinator_id || '',
                memberIds: activity.members?.map(m => m.id) || []
            });
        }
    }, [activity]);

    useEffect(() => {
        if (!activity && poles.length > 0 && !formData.poleId) {
            setFormData(prev => ({
                ...prev,
                poleId: poles[0].id
            }));
        }
    }, [activity, poles, formData.poleId]);

    useEffect(() => {
        if (formData.poleId) {
            fetchMembers();
        }
    }, [formData.poleId]);

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/users/pole/${formData.poleId}`);
            const poleMembers = response.data.filter(user => user.role !== 'SUPER_ADMIN');
            setMembers(poleMembers);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.memberIds.length < 2) {
            alert('Vous devez programmer au moins 2 membres');
            return;
        }

        const submitData = {
            ...formData,
            poleId: Number(formData.poleId),
            coordinatorId: formData.coordinatorId ? Number(formData.coordinatorId) : null,
            memberIds: formData.memberIds.map(id => Number(id))
        };

        onSubmit(submitData);
    };

    const handleMemberToggle = (userId) => {
        setFormData(prev => ({
            ...prev,
            memberIds: prev.memberIds.includes(userId)
                ? prev.memberIds.filter(id => id !== userId)
                : [...prev.memberIds, userId]
        }));
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Nom de l'activité *</label>
                <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div className="form-group">
                <label>Date *</label>
                <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                    <label>Heure début *</label>
                    <input
                        type="time"
                        className="form-control"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Heure fin *</label>
                    <input
                        type="time"
                        className="form-control"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Lieu</label>
                <input
                    type="text"
                    className="form-control"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
            </div>

            <div className="form-group">
                <label>Pôle *</label>
                <select
                    className="form-control"
                    value={formData.poleId}
                    onChange={(e) => setFormData({ ...formData, poleId: e.target.value, memberIds: [] })}
                    required
                >
                    {poles.map(pole => (
                        <option key={pole.id} value={pole.id}>{pole.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Coordinateur du pôle</label>
                <select
                    className="form-control"
                    value={formData.coordinatorId}
                    onChange={(e) => setFormData({ ...formData, coordinatorId: e.target.value })}
                >
                    <option value="">Sélectionner un coordinateur</option>
                    {members.map(member => (
                        <option key={member.id} value={member.id}>{member.full_name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Membres programmés (minimum 2) *</label>
                <div style={{ 
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px', 
                    padding: '12px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {members.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                            Aucun membre dans ce pôle
                        </div>
                    ) : (
                        members.map(member => (
                            <label key={member.id} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px',
                                padding: '8px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'background 0.2s'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.memberIds.includes(member.id)}
                                    onChange={() => handleMemberToggle(member.id)}
                                    style={{ width: '16px', height: '16px' }}
                                />
                                <span>{member.full_name}</span>
                            </label>
                        ))
                    )}
                </div>
                {formData.memberIds.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                        {formData.memberIds.length} membre(s) sélectionné(s)
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn" onClick={onCancel}>
                    Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                    {activity ? 'Modifier' : 'Créer'}
                </button>
            </div>
        </form>
    );
};

export default ActivityForm;