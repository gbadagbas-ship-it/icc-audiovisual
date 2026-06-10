import React, { useState } from 'react';
import '../styles/global.css';

const ActivityReportForm = ({ activityId, onSubmit, onCancel }) => {
    const [form, setForm] = useState({ content: '', attendance: '', technical_issues: '', suggestions: '' });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.content.trim()) {
            alert('Le contenu du rapport est requis');
            return;
        }
        onSubmit({ activity_id: activityId, ...form });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Contenu *</label>
                <textarea name="content" value={form.content} onChange={handleChange} className="form-control" rows={4} required />
            </div>
            <div className="form-group">
                <label>Présence</label>
                <input name="attendance" value={form.attendance} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
                <label>Problèmes techniques</label>
                <input name="technical_issues" value={form.technical_issues} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
                <label>Suggestions</label>
                <input name="suggestions" value={form.suggestions} onChange={handleChange} className="form-control" />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn" onClick={onCancel}>Annuler</button>
                <button type="submit" className="btn btn-primary">Soumettre</button>
            </div>
        </form>
    );
};

export default ActivityReportForm;
