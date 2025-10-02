import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthService from './authService';

import { ReportsPage } from './Pages/ReportsPage';
import { ProjectsPage } from './Pages/ProjectsPage';
import { MapPage } from './Pages/MapPage';
import { ProjectDetailsPage } from './Pages/ProjectDetailsPage';
import { MainLayout } from './Components/MainLayout';
import { LoginForm } from './Components/LoginForm/LoginForm';
import { RegistrationForm } from './Components/RegistrationForm/RegistrationForm';
import { ManagerDHB } from './Components/Dashboards/ManagerDHB';
import { ForemanDHB } from './Components/Dashboards/ForemanDHB';
import { InspectorDHB } from './Components/Dashboards/InspectorDHB/InspectorDHB';

const Dashboard = () => {
    const userRole = AuthService.getUserRole();

    switch (userRole) {
        case 'client':
            return <ManagerDHB />;
        case 'foreman':
            return <ForemanDHB />;
        case 'inspector':
            return <InspectorDHB />;
        default:
            AuthService.logout();
            return <Navigate to="/login" />;
    }
};

const PrivateRoutes = () => {
    const isAuth = AuthService.isAuthenticated();

    return isAuth ? <MainLayout><Outlet /></MainLayout> : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegistrationForm />} />
                
                <Route element={<PrivateRoutes />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;