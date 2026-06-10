import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ScheduleTable from '../components/ScheduleTable';
import ActivityForm from '../components/ActivityForm';
import GeneralCoordinatorReport from '../components/GeneralCoordinatorReport';
import ActivityReportForm from '../components/ActivityReportForm';
import ActivityReportsList from '../components/ActivityReportsList';
import '../styles/global.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [poles, setPoles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');
    const [isGeneralCoordinator, setIsGeneralCoordinator] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedActivityForReports, setSelectedActivityForReports] = useState(null);
    const [reportListKey, setReportListKey] = useState(0);
    const [weekInfo, setWeekInfo] = useState({});
    const [generalCoordinator, setGeneralCoordinator] = useState(null);



    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchData();
        checkGeneralCoordinator();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [activitiesRes, polesRes] = await Promise.all([
                api.get('/activities'),
                api.get('/poles')
            ]);
            setActivities(activitiesRes.data);
            setPoles(polesRes.data);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkGeneralCoordinator = async () => {
        try {
            const response = await api.get('/coordinators/current');
            const currentCG = response.data;
            setGeneralCoordinator(currentCG || null);

            const today = new Date();
            const weekNumber = getWeekNumber(today);
            const year = today.getFullYear();
            setWeekInfo({ weekNumber, year });

            if (currentCG && currentCG.id === user.id) {
                setIsGeneralCoordinator(true);
                setShowReport(true);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = Math.floor((date - firstDayOfYear) / 86400000);
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const handleCreateActivity = async (activityData) => {
        try {
            await api.post('/activities', activityData);
            await fetchData();
            setShowModal(false);
        } catch (error) {
            console.error('Erreur lors de la création:', error.response?.data || error.message || error, error.response);
            console.error('Détail serveur:', error.response?.data?.error);
            alert(error.response?.data?.message || error.message || 'Erreur lors de la création de l\'activité');
        }
    };

    const handleUpdateActivity = async (id, activityData) => {
        try {
            await api.put(`/activities/${id}`, activityData);
            await fetchData();
            setShowModal(false);
            setSelectedActivity(null);
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error.response?.data || error.message || error);
            alert(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'activité');
        }
    };

    const handleDeleteActivity = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
            try {
                await api.delete(`/activities/${id}`);
                await fetchData();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error.response?.data || error.message || error);
                alert(error.response?.data?.message || 'Erreur lors de la suppression de l\'activité');
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

    const canManageActivities = user.role === 'POLE_MANAGER' || user.role === 'SUPER_ADMIN';

    return (
        <div>
            <div className="header">
                <div className="header-content">
                    <div className="logo">
                        <div className="logo-icon">
                            {/* <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg> */}
                        </div>
                        <div className="logo-text">
                            <h1>Dept Audiovisuel</h1>
                            <p>Programmation Hebdo</p>
                        </div>
                    </div>
                    <div className="user-menu">
                        <div className="user-info">
                            <div className="user-name">{user.fullName}</div>
                            <div className="user-role">
                                {user.role === 'SUPER_ADMIN' ? 'Super Administrateur' : 
                                 user.role === 'POLE_MANAGER' ? `Responsable ${user.poleName || ''}` : 
                                 'Membre'}
                            </div>
                        </div>
                        <button onClick={logout} className="btn btn-danger" style={{ padding: '8px 16px' }}>
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: '30px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', color: 'white' }}>Programmation Hebdomadaire</h2>
                    {canManageActivities && (
                        <button 
                            className="btn btn-primary"
                            onClick={() => {
                                setSelectedActivity(null);
                                setShowModal(true);
                            }}
                        >
                            + Nouvelle activité
                        </button>
                    )}
                </div>

                <ScheduleTable 
                    activities={activities} 
                    poles={poles}
                    onEdit={canManageActivities && !isGeneralCoordinator ? (activity) => {
                        setSelectedActivity(activity);
                        setShowModal(true);
                    } : null}
                    onDelete={canManageActivities && !isGeneralCoordinator ? handleDeleteActivity : null}
                    onReport={isGeneralCoordinator ? (activity) => {
                        setSelectedActivityForReports(activity);
                        setShowReportModal(true);
                        setReportListKey(k => k + 1);
                    } : null}
                />
                <br/>

                {generalCoordinator && (
                    <div className="card mt-4 p-3 bg-light border">
                        <p className="mb-0" style={{ fontWeight: '600' }}>
                            Coordinateur général de la programmation de la semaine {weekInfo.weekNumber}/{weekInfo.year} : <strong style={{color:"red"}}>{generalCoordinator.full_name}</strong>
                        </p>
                        <p className="mb-0" style={{ fontSize: '0.95rem', color: '#4b5563' }}>
                            Il est responsable de la supervision générale du déroulement du service de la semaine, de la coordination entre les pôles et de la rédaction de rapport de service à soumetre à chaque fin de service.
                        </p>
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay" onClick={() => {
                        setShowModal(false);
                        setSelectedActivity(null);
                    }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{selectedActivity ? 'Modifier l\'activité' : 'Nouvelle activité'}</h3>
                                <button 
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedActivity(null);
                                    }}
                                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <ActivityForm
                                    activity={selectedActivity}
                                    poles={poles}
                                    onSubmit={(data) => {
                                        if (selectedActivity) {
                                            handleUpdateActivity(selectedActivity.id, data);
                                        } else {
                                            handleCreateActivity(data);
                                        }
                                    }}
                                    onCancel={() => {
                                        setShowModal(false);
                                        setSelectedActivity(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
                {showReportModal && selectedActivityForReports && (
                    <div className="modal-overlay" onClick={() => { setShowReportModal(false); setSelectedActivityForReports(null); }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                            <div className="modal-header">
                                <h3>Rapports — {selectedActivityForReports.name}</h3>
                                <button onClick={() => { setShowReportModal(false); setSelectedActivityForReports(null); }} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                            </div>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <h4>Rapports existants</h4>
                                        <ActivityReportsList key={`${selectedActivityForReports.id}-${reportListKey}`} activityId={selectedActivityForReports.id} />
                                    </div>
                                    <div>
                                        <h4>Soumettre un rapport</h4>
                                        <ActivityReportForm
                                            activityId={selectedActivityForReports.id}
                                            onCancel={() => { setShowReportModal(false); setSelectedActivityForReports(null); }}
                                            onSubmit={async (data) => {
                                                try {
                                                    await api.post('/activity-reports', data);
                                                    setReportListKey(k => k + 1);
                                                    alert('Rapport soumis avec succès');
                                                } catch (err) {
                                                    console.error('Erreur création rapport', err.response?.data || err.message || err);
                                                    alert(err.response?.data?.message || 'Erreur lors de la soumission du rapport');
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            

                {isGeneralCoordinator && (
                    <button style={{height:"auto",whidth:"auto", padding:"10px", borderRadius:"12px",border:"none", marginLeft:"20px",marginTop:"-40px",backgroundColor:"red",color:"white",fontSize:"16px", cursor:"pointer"}}
                        onClick={() => setActiveTab('report')}
                        className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
                    >
                      <h3>Rapport CG</h3>  
                    </button>

                )}
                    <br/>
                    <br/>
                    {/* <br/> */}

    
                {activeTab === 'report' && isGeneralCoordinator && (
        <GeneralCoordinatorReport 
            weekNumber={weekInfo.weekNumber} 
            year={weekInfo.year}
            onSubmitted={() => {
                alert('Rapport soumis avec succès !');
            }}
    />
)}










        </div>
        
    );
};

export default Dashboard;




