import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/global.css';

const Home = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [activities, setActivities] = useState([]);
    const [poles, setPoles] = useState([]);
    const [generalCoordinator, setGeneralCoordinator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weekInfo, setWeekInfo] = useState({});

    useEffect(() => {
        if (user) {
            fetchPublicSchedule();
        } else {
            setLoading(false);
        }
    }, [user]);

    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const fetchPublicSchedule = async () => {
        try {
            const today = new Date();
            const weekNumber = getWeekNumber(today);
            const year = today.getFullYear();
            
            setWeekInfo({ weekNumber, year });
            
            // Récupérer uniquement les activités validées (public=true)
            const [activitiesRes, polesRes, coordinatorRes] = await Promise.all([
                api.get(`/activities?weekNumber=${weekNumber}&year=${year}&public=true`),
                api.get('/poles'),
                api.get('/coordinators/current')
            ]);
            
            setActivities(activitiesRes.data);
            setPoles(polesRes.data);
            setGeneralCoordinator(coordinatorRes.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const getPoleAssignments = (activity, poleId) => {
        if (activity.pole_id === poleId) {
            return (
                <div>
                    {activity.members && activity.members.map(member => (
                        <div key={member.id} style={{ fontSize: '13px', marginBottom: '4px' }}>
                            {member.full_name}
                        </div>
                    ))}
                    {activity.coordinator_name && (
                        <div style={{ fontSize: '11px', color: '#667eea', fontWeight: 'bold', marginTop: '4px' }}>
                            Coord: {activity.coordinator_name}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const groupedActivities = activities.reduce((acc, activity) => {
        const dateKey = activity.date;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(activity);
        return acc;
    }, {});

    if (authLoading || loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return (
            // <div>
            //     <div className="header">
            //         <div className="header-content">
            //             <div className="logo">
            //                 <div className="logo-icon">
            //                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            //                         <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            //                     </svg>
            //                 </div>
            //                 <div className="logo-text">
            //                     <h1>ICC Audiovisuel</h1>
            //                     <p>Accès réservé</p>
            //                 </div>
            //             </div>
            //             <button onClick={() => navigate('/login')} className="btn btn-primary">
            //                 Se connecter
            //             </button>
            //         </div>
            //     </div>

            //     <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            //         <div style={{height:"auto",width:"auto",backgroundColor:"silver"}} className="container">
            //             <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Entrez vos identifiants</h1>
            //             <p style={{ fontSize: '18px', opacity: 0.9 }}>
            //                 Connectez-vous pour accéder à la programmation de la semaine.
            //             </p>
            //         </div>
            //     </div>
            // </div>


            <div>
            <div className="header">
                <div className="header-content">
                    <div className="logo">
                        <div className="logo-icon">
                            {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg> */}
                              

                        </div>
                        <div className="logo-text">
                            <h1>Dept Audiovisuel</h1>
                            <p>Programmation officielle</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/login')} className="btn btn-primary">
                        Connexion
                    </button>
                </div>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #667EEA38 0%, #764BA23B 100%)',
                color: 'white',
                padding: '60px 20px',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Programmation Hebdomadaire</h1>
                    <p style={{ fontSize: '18px', opacity: 0.9 }}>Semaine {weekInfo.weekNumber} - {weekInfo.year}</p>
                </div>
            </div>

            <div className="container" style={{ padding: '40px 20px' }}>
                {activities.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                        <h3 style={{color:"red" }}>Connectez-vous avec vos identifiants pour avoir accès à la programmation</h3>
                        <p>Veuillez vous référer à vos responsables si vous n'en n'avez pas</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Horaire</th>
                                    <th>Activité</th>
                                    <th>Lieu</th>
                                    {poles.map(pole => (
                                        <th key={pole.id}>{pole.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
                                    <React.Fragment key={dateKey}>
                                        {dayActivities.map((activity, index) => (
                                            <tr key={activity.id}>
                                                {index === 0 && (
                                                    <td rowSpan={dayActivities.length} style={{ backgroundColor: '#f9fafb', verticalAlign: 'top', fontWeight: 'bold' }}>
                                                        {formatDate(activity.date)}
                                                    </td>
                                                )}
                                                <td>{activity.start_time} - {activity.end_time}</td>
                                                <td style={{ fontWeight: 'bold' }}>{activity.name}</td>
                                                <td>{activity.location || '-'}</td>
                                                {poles.map(pole => (
                                                    <td key={pole.id}>{getPoleAssignments(activity, pole.id)}</td>
                                                ))}
                                             </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                         </table>
                    </div>
                )}
                {generalCoordinator && (
                    <div className="card mt-4 p-3 bg-light border">
                        <p className="mb-0" style={{ fontWeight: '600' }}>
                            Coordinateur général de la programmation de la semaine {weekInfo.weekNumber}/{weekInfo.year} : <strong>{generalCoordinator.full_name}</strong>
                        </p>
                        <p className="mb-0" style={{ fontSize: '0.95rem', color: '#4b5563' }}>
                            Responsable de la supervision générale et de la validation de la programmation.
                        </p>
                    </div>
                )}
            </div>
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
                                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg> */}
                        </div>
                        <div className="logo-text">
                            <h1>Dept Audiovisuel</h1>
                            <p>Programmation officielle</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/login')} className="btn btn-primary">
                        Espace membre
                    </button>
                </div>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #667EEA34 0%, #764BA241 100%)',
                color: 'white',
                padding: '60px 20px',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Programmation Hebdomadaire</h1>
                    <p style={{ fontSize: '18px', opacity: 0.9 }}>Semaine {weekInfo.weekNumber} - {weekInfo.year}</p>
                </div>
            </div>

            <div className="container" style={{ padding: '40px 20px' }}>
                {activities.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                        <h3>Aucune programmation disponible cette semaine</h3>
                        <p>La programmation sera bientôt publiée</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Horaire</th>
                                    <th>Activité</th>
                                    <th>Lieu</th>
                                    {poles.map(pole => (
                                        <th key={pole.id}>{pole.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
                                    <React.Fragment key={dateKey}>
                                        {dayActivities.map((activity, index) => (
                                            <tr key={activity.id}>
                                                {index === 0 && (
                                                    <td rowSpan={dayActivities.length} style={{ backgroundColor: '#f9fafb', verticalAlign: 'top', fontWeight: 'bold' }}>
                                                        {formatDate(activity.date)}
                                                    </td>
                                                )}
                                                <td>{activity.start_time} - {activity.end_time}</td>
                                                <td style={{ fontWeight: 'bold' }}>{activity.name}</td>
                                                <td>{activity.location || '-'}</td>
                                                {poles.map(pole => (
                                                    <td key={pole.id}>{getPoleAssignments(activity, pole.id)}</td>
                                                ))}
                                             </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                         </table>
                    </div>
                )}
                {generalCoordinator && (
                    <div className="card mt-4 p-3 bg-light border">
                        <p className="mb-0" style={{ fontWeight: '600' }}>
                            Coordinateur général de la programmation de la semaine {weekInfo.weekNumber}/{weekInfo.year} : <strong>{generalCoordinator.full_name}</strong>
                        </p>
                        <p className="mb-0" style={{ fontSize: '0.95rem', color: '#4b5563' }}>
                            Responsable de la supervision générale et de la validation de la programmation.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;