


import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import './styles/global.css';
import ReportsDashboard from './pages/ReportsDashboard';


const PrivateRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }
    
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
};

function AppRoutes() {
    const { user } = useAuth();
    
    return (
        <Routes>
            {/* Page d'accueil publique */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
                <PrivateRoute>
                    <Dashboard />
                </PrivateRoute>
            } />
            <Route path="/adminjoiebonneur82" element={
                <PrivateRoute requiredRole="SUPER_ADMIN">
                    <AdminDashboard />
                </PrivateRoute>
            } />
            <Route path="/reports" element={
                <PrivateRoute requiredRole="SUPER_ADMIN">
                    <ReportsDashboard />
                </PrivateRoute>
            } />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}


export default App;