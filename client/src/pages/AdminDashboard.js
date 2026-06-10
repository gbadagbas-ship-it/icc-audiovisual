import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AssignGeneralCoordinator from '../components/AssignGeneralCoordinator';
import WeekValidation from '../components/WeekValidation';
import '../styles/global.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [poles, setPoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [showPoleModal, setShowPoleModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedPole, setSelectedPole] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [userFormData, setUserFormData] = useState({ email: '', password: '', fullName: '', role: 'MEMBER', poleId: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'SUPER_ADMIN') {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [polesRes, usersRes] = await Promise.all([
                api.get('/poles'),
                api.get('/users')
            ]);
            setPoles(polesRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePole = async () => {
        try {
            await api.post('/poles', formData);
            fetchData();
            setShowPoleModal(false);
            setFormData({ name: '', description: '' });
        } catch (error) {
            alert('Erreur lors de la création du pôle');
        }
    };

    const handleDeletePole = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce pôle ?')) {
            try {
                await api.delete(`/poles/${id}`);
                fetchData();
            } catch (error) {
                alert('Erreur lors de la suppression du pôle');
            }
        }
    };

    const handleCreateUser = async () => {
        try {
            await api.post('/users', userFormData);
            fetchData();
            setShowUserModal(false);
            setUserFormData({ email: '', password: '', fullName: '', role: 'MEMBER', poleId: '' });
        } catch (error) {
            alert('Erreur lors de la création de l\'utilisateur');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchData();
            } catch (error) {
                alert('Erreur lors de la suppression de l\'utilisateur');
            }
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="header">
                <div className="header-content">
                    <div className="logo">
                        <div className="logo-icon">
                            {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg> */}
                        </div>
                        <div className="logo-text">
                            <h1>Tableau de bord</h1>
                            <p>Gestion des pôles et responsables</p>
                        </div>
                    </div>
                    <div className="user-menu">
                        <div className="user-info">
                            <div className="user-name">{user.fullName}</div>
                            <div className="user-role">Super Administrateur</div>
                        </div>
                        <button onClick={() => navigate('/dashboard')} className="btn" style={{ marginRight: '10px', background: '#6b7280', color: 'white' }}>
                            Voir programmation
                        </button>
                        <button onClick={() => navigate('/reports')} className="btn" style={{ marginRight: '10px', background: '#2563eb', color: 'white' }}>
                            Voir rapports
                        </button>
                        <button onClick={logout} className="btn btn-danger">
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: '30px 20px' }}>
                {/* Section Pôles */}
                <div className="card" style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px' }}>Gestion des pôles</h2>
                        <button className="btn btn-primary" onClick={() => setShowPoleModal(true)}>
                            + Ajouter un pôle
                        </button>
                    </div>
                    
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Description</th>
                                    <th>Nombre de membres</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {poles.map(pole => (
                                    <tr key={pole.id}>
                                        <td><strong>{pole.name}</strong></td>
                                        <td>{pole.description || '-'}</td>
                                        <td>{pole.user_count || 0}</td>
                                        <td>
                                            <button 
                                                className="btn btn-danger" 
                                                onClick={() => handleDeletePole(pole.id)}
                                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section Utilisateurs */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px' }}>Gestion des responsables et membres</h2>
                        <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
                            + Ajouter un utilisateur
                        </button>
                    </div>
                    
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>Rôle</th>
                                    <th>Pôle</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(userItem => (
                                    <tr key={userItem.id}>
                                        <td>{userItem.full_name}</td>
                                        <td>{userItem.email}</td>
                                        <td>
                                            <span className={`badge badge-${userItem.role.toLowerCase().replace('_', '-')}`}>
                                                {userItem.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                                                 userItem.role === 'POLE_MANAGER' ? 'Responsable pôle' : 
                                                 'Membre'}
                                            </span>
                                        </td>
                                        <td>{userItem.pole_name || '-'}</td>
                                        <td>
                                            <button 
                                                className="btn btn-danger" 
                                                onClick={() => handleDeleteUser(userItem.id)}
                                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

                <div className="card" style={{ marginTop: '30px' }}>
                    <AssignGeneralCoordinator />
                </div>

                <div className="card" style={{ marginTop: '30px' }}>
                    <WeekValidation />
                </div>

            {/* Modal Pôle */}
            {showPoleModal && (
                <div className="modal-overlay" onClick={() => setShowPoleModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Ajouter un pôle</h3>
                            <button onClick={() => setShowPoleModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nom du pôle</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={() => setShowPoleModal(false)}>Annuler</button>
                            <button className="btn btn-primary" onClick={handleCreatePole}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Utilisateur */}
            {showUserModal && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Ajouter un utilisateur</h3>
                            <button onClick={() => setShowUserModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nom complet</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={userFormData.fullName}
                                    onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={userFormData.email}
                                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={userFormData.password}
                                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Rôle</label>
                                <select
                                    className="form-control"
                                    value={userFormData.role}
                                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                                >
                                    <option value="MEMBER">Membre</option>
                                    <option value="POLE_MANAGER">Responsable pôle</option>
                                    <option value="SUPER_ADMIN">Super Administrateur</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Pôle</label>
                                <select
                                    className="form-control"
                                    value={userFormData.poleId}
                                    onChange={(e) => setUserFormData({ ...userFormData, poleId: e.target.value })}
                                >
                                    <option value="">Aucun</option>
                                    {poles.map(pole => (
                                        <option key={pole.id} value={pole.id}>{pole.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={() => setShowUserModal(false)}>Annuler</button>
                            <button className="btn btn-primary" onClick={handleCreateUser}>Créer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;